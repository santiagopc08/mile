const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.JWT_SECRET;

if (!token) {
    throw new Error('SUPABASE_ACCESS_TOKEN or JWT_SECRET environment variable is missing.');
}

async function run() {
    const res = await fetch("https://api.supabase.com/v1/projects", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    console.log(await res.text());
}
run();
