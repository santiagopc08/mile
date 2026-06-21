import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
        if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { taskText, category, field } = body;

    if (!taskText) {
      return NextResponse.json({ error: 'Falta texto de tarea' }, { status: 400 });
    }

    const lowerText = taskText.toLowerCase();
    let suggestions: string[] = [];

    if (field === 'actions') {
        if (lowerText.includes('comprar') || lowerText.includes('buy') || lowerText.includes('pagar')) {
            suggestions = [
                'Verificar presupuesto o fondos disponibles',
                'Comparar opciones o proveedores',
                `Realizar transacción para: ${taskText}`,
                'Guardar recibo o comprobante'
            ];
        } else if (lowerText.includes('leer') || lowerText.includes('estudiar') || lowerText.includes('aprender')) {
            suggestions = [
                'Reunir material de estudio',
                'Configurar ambiente sin distracciones',
                `Completar lectura/estudio de: ${taskText}`,
                'Tomar notas o resumir puntos clave'
            ];
        } else if (lowerText.includes('código') || lowerText.includes('bug') || lowerText.includes('fix') || lowerText.includes('dev')) {
            suggestions = [
                'Reproducir el problema o analizar requerimientos',
                'Escribir pruebas unitarias iniciales',
                `Implementar solución para: ${taskText}`,
                'Solicitar Code Review'
            ];
        } else if (lowerText.includes('correo') || lowerText.includes('email') || lowerText.includes('llamar') || lowerText.includes('contactar')) {
            suggestions = [
                'Definir objetivo de la comunicación',
                `Redactar borrador de: ${taskText}`,
                'Revisar tono y ortografía',
                'Enviar y programar recordatorio de seguimiento'
            ];
        } else {
            suggestions = [
                `Analizar el alcance de: ${taskText}`,
                'Dividir en subtareas más pequeñas',
                `Ejecutar la fase principal de: ${taskText}`,
                'Validar calidad del resultado final'
            ];
        }
    } else if (field === 'validations') {
        suggestions = [
            `El objetivo principal de "${taskText}" se cumplió al 100%`,
            `No hay errores ni dependencias bloqueadas tras terminar "${taskText}"`,
            `Se documentó o reportó el avance de "${taskText}"`
        ];
    }

    // Optional delay to simulate network/AI processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI Suggest Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
