import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUbicaciones() {
    try {
        console.log("Fetching all rows from 'ubicaciones'...");
        const { data: rows, error } = await supabase.from('ubicaciones').select('*');
        if (error) {
            console.error("Error fetching ubicaciones:", error);
        } else {
            console.log("Total rows:", rows?.length);
            rows?.forEach(r => {
                console.log(JSON.stringify(r));
            });
        }
    } catch (e) {
        console.error("Failure:", e);
    }
}

listUbicaciones();
