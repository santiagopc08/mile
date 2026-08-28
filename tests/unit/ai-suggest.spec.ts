process.env.NEXT_PUBLIC_MOCK_AUTH = 'true';
import { test, expect } from '@playwright/test';

const setupSupabaseMock = () => {
  const supabasePath = require.resolve('../../src/lib/supabase-server.ts');
  require.cache[supabasePath] = {
    id: supabasePath,
    filename: supabasePath,
    loaded: true,
    exports: { createServerClient: () => ({}) }
  } as unknown;
};

const cleanupSupabaseMock = () => {
  const supabasePath = require.resolve('../../src/lib/supabase-server.ts');
  delete require.cache[supabasePath];
};


test.describe('AI Suggest API', () => {
  test.beforeEach(() => { setupSupabaseMock(); });
  test.afterEach(() => { cleanupSupabaseMock(); });

  const createMockRequest = (body: Record<string, unknown>) => {
    return new Request('http://localhost:3000/api/ai-suggest', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  test('should return 400 if taskText is missing', async () => {
    const req = createMockRequest({ field: 'actions' });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POST } = require('../../src/app/api/ai-suggest/route');
    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Falta texto de tarea' });
  });

  // Buying category
  for (const keyword of ['comprar', 'buy', 'pagar']) {
    test(`should return suggestions for "${keyword}" keyword`, async () => {
      const taskText = `${keyword} leche`;
      const req = createMockRequest({ taskText, field: 'actions' });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { POST } = require('../../src/app/api/ai-suggest/route');
      const response = await POST(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.suggestions).toEqual([
        'Verificar presupuesto o fondos disponibles',
        'Comparar opciones o proveedores',
        `Realizar transacción para: ${taskText}`,
        'Guardar recibo o comprobante'
      ]);
    });
  }

  // Studying category
  for (const keyword of ['leer', 'estudiar', 'aprender']) {
    test(`should return suggestions for "${keyword}" keyword`, async () => {
      const taskText = `${keyword} matemáticas`;
      const req = createMockRequest({ taskText, field: 'actions' });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { POST } = require('../../src/app/api/ai-suggest/route');
      const response = await POST(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.suggestions).toEqual([
        'Reunir material de estudio',
        'Configurar ambiente sin distracciones',
        `Completar lectura/estudio de: ${taskText}`,
        'Tomar notas o resumir puntos clave'
      ]);
    });
  }

  // Coding category
  for (const keyword of ['código', 'bug', 'fix', 'dev']) {
    test(`should return suggestions for "${keyword}" keyword`, async () => {
      const taskText = `fix ${keyword} in login`;
      const req = createMockRequest({ taskText, field: 'actions' });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { POST } = require('../../src/app/api/ai-suggest/route');
      const response = await POST(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.suggestions).toEqual([
        'Reproducir el problema o analizar requerimientos',
        'Escribir pruebas unitarias iniciales',
        `Implementar solución para: ${taskText}`,
        'Solicitar Code Review'
      ]);
    });
  }

  // Contacting category
  for (const keyword of ['correo', 'email', 'llamar', 'contactar']) {
    test(`should return suggestions for "${keyword}" keyword`, async () => {
      const taskText = `enviar ${keyword} a cliente`;
      const req = createMockRequest({ taskText, field: 'actions' });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { POST } = require('../../src/app/api/ai-suggest/route');
      const response = await POST(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.suggestions).toEqual([
        'Definir objetivo de la comunicación',
        `Redactar borrador de: ${taskText}`,
        'Revisar tono y ortografía',
        'Enviar y programar recordatorio de seguimiento'
      ]);
    });
  }


  test('should return fallback suggestions if no keyword matches', async () => {
    const req = createMockRequest({ taskText: 'limpiar la casa', field: 'actions' });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POST } = require('../../src/app/api/ai-suggest/route');
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.suggestions).toEqual([
      'Analizar el alcance de: limpiar la casa',
      'Dividir en subtareas más pequeñas',
      'Ejecutar la fase principal de: limpiar la casa',
      'Validar calidad del resultado final'
    ]);
  });

  test('should return validations suggestions', async () => {
    const req = createMockRequest({ taskText: 'hacer ejercicio', field: 'validations' });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POST } = require('../../src/app/api/ai-suggest/route');
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.suggestions).toEqual([
      'El objetivo principal de "hacer ejercicio" se cumplió al 100%',
      'No hay errores ni dependencias bloqueadas tras terminar "hacer ejercicio"',
      'Se documentó o reportó el avance de "hacer ejercicio"'
    ]);
  });

  test('should return 500 if an internal error occurs', async () => {
    // A request with missing body throws an error when req.json() is called
    const req = new Request('http://localhost:3000/api/ai-suggest', {
        method: 'POST',
        // No body
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POST } = require('../../src/app/api/ai-suggest/route');
    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Internal Server Error' });
  });

});
