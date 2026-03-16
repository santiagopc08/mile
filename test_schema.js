const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // try to insert a fake victory
    const { data: vData, error: vErr } = await supabase.from('victories').insert({ text: 'test', author: 'el' }).select();
    console.log("Insert Victory Result:", vErr || "Success: " + JSON.stringify(vData));

    if (!vErr) {
        await supabase.from('victories').delete().eq('text', 'test');
    }

    // try an event
    const { data: eData, error: eErr } = await supabase.from('events').insert({
        title: 'test',
        date: '2023-01-01',
        image_url: 'test'
    }).select();
    console.log("Insert Event Result:", eErr || "Success: " + JSON.stringify(eData));

    if (!eErr) {
        await supabase.from('events').delete().eq('title', 'test');
    }
}
checkSchema();
