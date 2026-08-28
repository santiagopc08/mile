import { test, expect } from '@playwright/test';

const setupMocks = (verifyAuthMock: unknown) => {
    const authPath = require.resolve('../../../../src/lib/auth.ts');
    require.cache[authPath] = {
        id: authPath,
        filename: authPath,
        loaded: true,
        exports: { verifyAuth: verifyAuthMock }
    } as NodeJS.Module;

    const supabasePath = require.resolve('../../../../src/lib/supabase-server.ts');
    require.cache[supabasePath] = {
        id: supabasePath,
        filename: supabasePath,
        loaded: true,
        exports: { createServerClient: () => ({}) }
    } as NodeJS.Module;
};

const cleanupMocks = () => {
    delete require.cache[require.resolve('../../../../src/lib/auth.ts')];
    delete require.cache[require.resolve('../../../../src/lib/supabase-server.ts')];
    delete require.cache[require.resolve('../../../../src/app/api/ai-suggest/route.ts')];
};

test.describe('POST /api/ai-suggest', () => {
    let originalConsoleError: typeof console.error;

    test.beforeEach(() => {
        originalConsoleError = console.error;
    });

    test.afterEach(() => {
        cleanupMocks();
        console.error = originalConsoleError;
    });

    test('should return 400 when taskText is missing', async () => {
        setupMocks(async () => true);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/ai-suggest/route.ts');

        const req = new Request('http://localhost/api/ai-suggest', {
            method: 'POST',
            body: JSON.stringify({ category: 'work', field: 'actions' })
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Falta texto de tarea' });
    });

    test('should return suggestions for field actions', async () => {
        setupMocks(async () => true);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/ai-suggest/route.ts');
        const req = new Request('http://localhost/api/ai-suggest', {
            method: 'POST',
            body: JSON.stringify({ taskText: 'comprar leche', category: 'personal', field: 'actions' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.suggestions).toBeDefined();
        expect(data.suggestions.length).toBeGreaterThan(0);
        expect(data.suggestions[0]).toContain('Verificar presupuesto o fondos disponibles');
    });

    test('should return suggestions for field validations', async () => {
        setupMocks(async () => true);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/ai-suggest/route.ts');
        const req = new Request('http://localhost/api/ai-suggest', {
            method: 'POST',
            body: JSON.stringify({ taskText: 'Fix this bug', category: 'work', field: 'validations' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.suggestions).toBeDefined();
        expect(data.suggestions.length).toBeGreaterThan(0);
        expect(data.suggestions[0]).toContain('El objetivo principal de "Fix this bug" se cumplió al 100%');
    });

    test('should handle unhandled fields with general actions', async () => {
        setupMocks(async () => true);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST } = require('../../../../src/app/api/ai-suggest/route.ts');
        const req = new Request('http://localhost/api/ai-suggest', {
            method: 'POST',
            body: JSON.stringify({ taskText: 'Do some arbitrary stuff', category: 'work', field: 'actions' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.suggestions).toBeDefined();
        expect(data.suggestions.length).toBeGreaterThan(0);
        expect(data.suggestions[0]).toContain('Analizar el alcance de: Do some arbitrary stuff');
    });
});
