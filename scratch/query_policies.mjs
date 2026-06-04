import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ghazqlmvlptcysiruqig.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYXpxbG12bHB0Y3lzaXJ1cWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwMzEzMCwiZXhwIjoyMDg4NDc5MTMwfQ.liRZse6t5jnz34Yn6PQUrquJDRNqin6CpZe8Ij3LXuo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Checking if we can query pg_policies...");
    const { data, error } = await supabase.from('pg_policies').select('*');
    console.log("pg_policies error:", error);
    console.log("pg_policies data:", data);
}

test();
