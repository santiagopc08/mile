import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing.');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');

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
