import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghazqlmvlptcysiruqig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYXpxbG12bHB0Y3lzaXJ1cWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwMzEzMCwiZXhwIjoyMDg4NDc5MTMwfQ.liRZse6t5jnz34Yn6PQUrquJDRNqin6CpZe8Ij3LXuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🌱 Seeding Supabase...');

    // Clear existing data (order matters due to FK constraints)
    await supabase.from('audio_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('audio_track').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('commitments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('victories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('daily_tracking').delete().neq('date', '1970-01-01');

    // Seed Events
    const { error: e1 } = await supabase.from('events').insert([
        { title: 'Quererte', date: '2025-02-12', description: 'te quiero' },
        { title: 'El fin de semana en la cabaña', date: '2024-04-25', description: 'Desconectarnos para conectar. Caminar por el bosque nos ayudó a recordar quiénes éramos cuando no estábamos a la defensiva.' },
        { title: 'Acuerdo de Transparencia', date: '2024-06-15', description: 'El día que establecimos las reglas de este refugio. Sin secretos, sin mentiras blancas, solo, dolorosa, hermosa verdad mutua.' },
    ]);
    if (e1) console.error('Events error:', e1.message); else console.log('✅ Events seeded');

    // Seed Notes
    const { error: e2 } = await supabase.from('notes').insert([
        { text: 'tqm' },
        { text: 'Hoy es un buen día para volver a empezar.' },
        { text: 'La honestidad construye puentes donde antes había muros.' },
        { text: 'Cada pequeño esfuerzo cuenta en nuestra reconstrucción.' },
        { text: 'Gracias por estar aquí, trabajando en nosotros.' },
        { text: 'La transparencia es el mayor acto de valentía.' },
    ]);
    if (e2) console.error('Notes error:', e2.message); else console.log('✅ Notes seeded');

    // Seed Commitments
    const { error: e3 } = await supabase.from('commitments').insert([
        { text: 'Hablar con sinceridad, aunque sea difícil', is_active: true },
        { text: 'Escuchar activamente antes de responder', is_active: true },
        { text: 'Reconocer mis errores diarios sin justificaciones', is_active: true },
    ]);
    if (e3) console.error('Commitments error:', e3.message); else console.log('✅ Commitments seeded');

    // Seed Victories
    const { error: e4 } = await supabase.from('victories').insert([
        { text: 'Pude expresar cómo me sentía sin alterarme.' },
    ]);
    if (e4) console.error('Victories error:', e4.message); else console.log('✅ Victories seeded');

    // Seed Audio Track
    const { data: track, error: e5 } = await supabase.from('audio_track').insert({
        title: 'Fix You',
        artist: 'Coldplay',
        spotify_url: 'https://open.spotify.com/track/5QpaGzWp0hwB5faV8dkbAz?si=hODFgJ9QS3uvX1-0MM9OhQ'
    }).select('id').single();
    if (e5) { console.error('Audio track error:', e5.message); return; }
    else console.log('✅ Audio track seeded');

    // Seed Audio Comments
    const { error: e6 } = await supabase.from('audio_comments').insert([
        { track_id: track.id, author: 'Tú', text: 'Esta canción me recuerda cuando decidimos empezar de nuevo aquel domingo.' },
        { track_id: track.id, author: 'Yo', text: 'Sí, la letra habla de reconstruir sobre las ruinas. Es muy nuestro.' },
    ]);
    if (e6) console.error('Comments error:', e6.message); else console.log('✅ Audio comments seeded');

    // Update App Settings with today's date as connection date
    const { error: e7 } = await supabase.from('app_settings').update({
        connection_date: new Date().toISOString(),
        last_update: new Date().toISOString()
    }).eq('id', 1);
    if (e7) console.error('App settings error:', e7.message); else console.log('✅ App settings updated');

    console.log('\n🎉 Seed complete!');
}

seed();
