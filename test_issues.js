const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIssues() {
    // 1. Check notifications table
    console.log("Checking notifications table...");
    const { error: notifErr } = await supabase.from('notifications').select('id').limit(1);
    if (notifErr) {
        console.log("Error accessing notifications:", notifErr.message);
    } else {
        console.log("Notifications table works fine.");
    }

    // 2. Check events table image_urls
    console.log("\nChecking events image_urls...");
    const { data: events, error: evErr } = await supabase.from('events').select('id, title, image_url').order('created_at', { ascending: false }).limit(5);
    if (evErr) {
        console.log("Error accessing events:", evErr.message);
    } else {
        console.log("Latest events:", events);
    }
}
checkIssues();
