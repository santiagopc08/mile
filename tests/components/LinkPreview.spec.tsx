import { test, expect } from '@playwright/test';

test.describe('LinkPreview Component', () => {

    test.beforeEach(async ({ page }) => {
        // Clear local storage before each test
        await page.goto('http://localhost:3000/test-components/link-preview');
        await page.evaluate(() => localStorage.clear());
    });

    test('should display loading state initially', async ({ page }) => {
        // Delay the API response to ensure loading state is visible
        await page.route('/api/link-preview*', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    title: 'Test Title',
                    url: 'https://example.com'
                })
            });
        });

        await page.goto('/test-components/link-preview?url=https://example.com');

        // Check for loading spinner icon (lucide-react Loader2)
        const loader = page.locator('.animate-spin');
        await expect(loader).toBeVisible();
    });

    test('should display error state for invalid URL scheme', async ({ page }) => {
        // Should not even hit the API, but let's mock just in case
        await page.route('/api/link-preview*', async (route) => {
            await route.fulfill({ status: 200, body: '{}' });
        });

        await page.goto('/test-components/link-preview?url=invalid-url');

        // Look for the "Abrir Link" fallback text via locator
        const link = page.locator('text="Abrir Link"');
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', 'invalid-url');
    });

    test('should display error state on API failure', async ({ page }) => {
        await page.route('/api/link-preview*', async (route) => {
            await route.fulfill({ status: 500, body: 'Internal Server Error' });
        });

        await page.goto('/test-components/link-preview?url=https://example.com');

        const link = page.locator('text="Abrir Link"');
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', 'https://example.com');
    });

    test('should display success state for default variant', async ({ page }) => {
        await page.route('/api/link-preview*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    title: 'Awesome Site',
                    description: 'This is an awesome site.',
                    siteName: 'Awesome',
                    url: 'https://awesome.com',
                    image: 'https://awesome.com/image.png'
                })
            });
        });

        await page.goto('/test-components/link-preview?url=https://awesome.com');

        await expect(page.locator('text="Awesome Site"')).toBeVisible();
        await expect(page.locator('text="This is an awesome site."')).toBeVisible();
        // Look for Awesome instead of AWESOME, text locators can be case sensitive, wait, Next.js or React might uppercase it via CSS.
        // The component does: <span className="uppercase">{data.siteName || domain}</span>
        // Which means the actual DOM text is "Awesome" but CSS makes it "AWESOME".
        // Playwright text locator is case insensitive but here we check for exact.
        // Let's use getByText
        await expect(page.getByText('Awesome', { exact: true })).toBeVisible();
        const img = page.locator('img[alt="Awesome Site"]');
        await expect(img).toBeVisible();
        await expect(img).toHaveAttribute('src', 'https://awesome.com/image.png');
    });

    test('should display success state for square variant without image', async ({ page }) => {
        await page.route('/api/link-preview*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    title: 'Square Site No Image',
                    url: 'https://square.com'
                })
            });
        });

        await page.goto('/test-components/link-preview?url=https://square.com&variant=square');

        await expect(page.locator('text="Square Site No Image"')).toBeVisible();
        await expect(page.getByText('SQUARE.COM')).toBeVisible(); // uppercase domain is derived domain.toUpperCase()
        // Should show the ImageIcon fallback
        await expect(page.locator('.lucide-image')).toBeVisible();
    });


    test('should display error state on network failure (catch block)', async ({ page }) => {
        await page.route('/api/link-preview*', async (route) => {
            await route.abort('failed');
        });

        await page.goto('/test-components/link-preview?url=https://example.com');

        const link = page.locator('text="Abrir Link"');
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', 'https://example.com');
    });

    test('should display error state on JSON parse failure (catch block)', async ({ page }) => {
        await page.route('/api/link-preview*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: 'this-is-invalid-json'
            });
        });

        await page.goto('/test-components/link-preview?url=https://example.com');

        const link = page.locator('text="Abrir Link"');
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', 'https://example.com');
    });

    test('should cache successful responses in localStorage', async ({ page }) => {
        let apiCallCount = 0;
        await page.route('/api/link-preview*', async (route) => {
            apiCallCount++;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    title: 'Cached Site',
                    url: 'https://cached.com'
                })
            });
        });

        // First visit
        await page.goto('/test-components/link-preview?url=https://cached.com');
        await expect(page.locator('text="Cached Site"')).toBeVisible();
        expect(apiCallCount).toBe(1);

        // Verify it was cached in localStorage
        const cachedItem = await page.evaluate(() => localStorage.getItem('link-preview:https://cached.com'));
        expect(cachedItem).toBeTruthy();
        expect(JSON.parse(cachedItem as string).data.title).toBe('Cached Site');

        // Reload the page
        await page.reload();
        await expect(page.locator('text="Cached Site"')).toBeVisible();

        // Call count should still be 1, as it served from cache
        expect(apiCallCount).toBe(1);
    });
});
