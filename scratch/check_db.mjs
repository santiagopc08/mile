import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log("Checking Supabase connection and tables...");
  
  // Try querying push_subscriptions
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('count')
    .limit(1);

  if (error) {
    console.error("❌ Error querying 'push_subscriptions':", error.message);
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log("👉 The 'push_subscriptions' table does not exist yet. You need to run the SQL migration.");
    }
  } else {
    console.log("✅ 'push_subscriptions' table is present and accessible!");
    console.log("Current records status count:", data);
  }
}

checkDatabase();
