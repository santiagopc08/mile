import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing.');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Checking table 'ubicaciones' structure and values...");
    
    // Try to select
    const { data: rows, error: selectError } = await supabase.from('ubicaciones').select('*').limit(3);
    if (selectError) {
        console.error("Select error:", selectError);
    } else {
        console.log("Select success! Samples:", rows);
    }

    // Try to insert using service role key (bypasses RLS)
    const testRow = {
        nombre: "Test RLS check",
        latitud: 6.2442,
        longitud: -75.5812,
        created_by: "el",
        status: "to-visit"
    };
    
    const { data: insertData, error: insertError } = await supabase.from('ubicaciones').insert(testRow).select();
    if (insertError) {
        console.error("Insert error (service role):", insertError);
    } else {
        console.log("Insert success (service role):", insertData);
        // Clean up
        if (insertData && insertData[0]) {
            const { error: deleteError } = await supabase.from('ubicaciones').delete().eq('id', insertData[0].id);
            console.log("Clean up delete error:", deleteError);
        }
    }
}

test();
