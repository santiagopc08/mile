import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghazqlmvlptcysiruqig.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYXpxbG12bHB0Y3lzaXJ1cWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwMzEzMCwiZXhwIjoyMDg4NDc5MTMwfQ.liRZse6t5jnz34Yn6PQUrquJDRNqin6CpZe8Ij3LXuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (error) {
        console.error("Schema missing or error:", error.message);
    } else {
        console.log("Schema exists. App settings:", data);
    }
}
check();
