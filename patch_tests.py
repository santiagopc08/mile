import glob
import re

for file in glob.glob('tests/*.spec.ts'):
    with open(file, 'r') as f:
        content = f.read()

    # Check memory: running full E2E Playwright tests locally may experience timeout failures during authentication
    # waiting for 'Acceder' button if local Supabase instance or frontend authentication state is not mocked.
    # The tests try to click a button with text "Acceder", but there is no such button.
    # Instead, we should just press Enter or click button[type="submit"].

    content = content.replace("await page.click('button:has-text(\"Acceder\")');", "await page.locator('button[type=\"submit\"]').click();")

    with open(file, 'w') as f:
        f.write(content)
