import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskText, category, field } = body;

    if (!taskText) {
      return NextResponse.json({ error: 'Falta texto de tarea' }, { status: 400 });
    }

    // Mock AI Suggestions base
    let suggestions: string[] = [];

    if (field === 'actions') {
        if (category === 'work') {
            suggestions = [
                'Revisar requerimientos iniciales',
                'Crear rama de desarrollo',
                'Escribir pruebas unitarias',
                'Implementar lógica principal',
                'Solicitar code review'
            ];
        } else if (category === 'personal') {
            suggestions = [
                'Investigar opciones disponibles',
                'Definir presupuesto',
                'Comparar alternativas',
                'Tomar decisión final'
            ];
        } else {
            suggestions = [
                'Preparar materiales necesarios',
                'Limpiar área de trabajo',
                'Ejecutar tarea principal',
                'Verificar resultado'
            ];
        }
    } else if (field === 'validations') {
        if (category === 'work') {
            suggestions = [
                'Código compila sin errores',
                'Tests pasan al 100%',
                'Diseño cumple con figma',
                'Desplegado en staging'
            ];
        } else if (category === 'personal') {
            suggestions = [
                'Decisión comunicada',
                'Registro actualizado',
                'Confirmación recibida'
            ];
        } else {
            suggestions = [
                'Todo en su lugar',
                'Sin daños o defectos',
                'Funciona como esperado'
            ];
        }
    }

    // Optional delay to simulate network/AI processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI Suggest Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
