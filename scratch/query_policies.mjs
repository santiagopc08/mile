import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing.');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Checking if we can query pg_policies...");
    const { data, error } = await supabase.from('pg_policies').select('*');
    console.log("pg_policies error:", error);
    console.log("pg_policies data:", data);
}

test();
