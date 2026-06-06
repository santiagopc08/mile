import { test, expect } from '@playwright/test';
import { POST } from '../../src/app/api/ai-suggest/route';

test.describe('AI Suggest API', () => {

  const createMockRequest = (body: any) => {
    return new Request('http://localhost:3000/api/ai-suggest', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  test('should return 400 if taskText is missing', async () => {
    const req = createMockRequest({ field: 'actions' });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Falta texto de tarea' });
  });

  test('should return suggestions for "comprar" keyword', async () => {
    const req = createMockRequest({ taskText: 'comprar leche', field: 'actions' });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.suggestions).toEqual([
      'Verificar presupuesto o fondos disponibles',
      'Comparar opciones o proveedores',
      'Realizar transacción para: comprar leche',
      'Guardar recibo o comprobante'
    ]);
  });

  test('should return suggestions for "estudiar" keyword', async () => {
    const req = createMockRequest({ taskText: 'estudiar matemáticas', field: 'actions' });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.suggestions).toEqual([
      'Reunir material de estudio',
      'Configurar ambiente sin distracciones',
      'Completar lectura/estudio de: estudiar matemáticas',
      'Tomar notas o resumir puntos clave'
    ]);
  });

  test('should return suggestions for "bug" keyword', async () => {
    const req = createMockRequest({ taskText: 'fix bug in login', field: 'actions' });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.suggestions).toEqual([
      'Reproducir el problema o analizar requerimientos',
      'Escribir pruebas unitarias iniciales',
      'Implementar solución para: fix bug in login',
      'Solicitar Code Review'
    ]);
  });

  test('should return suggestions for "email" keyword', async () => {
    const req = createMockRequest({ taskText: 'enviar email a cliente', field: 'actions' });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.suggestions).toEqual([
      'Definir objetivo de la comunicación',
      'Redactar borrador de: enviar email a cliente',
      'Revisar tono y ortografía',
      'Enviar y programar recordatorio de seguimiento'
    ]);
  });

  test('should return fallback suggestions if no keyword matches', async () => {
    const req = createMockRequest({ taskText: 'limpiar la casa', field: 'actions' });
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

    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Internal Server Error' });
  });

});
