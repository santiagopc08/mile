const token = "sb_secret_WF3jVnibKzw5q66mbxqgLQ_9v_bGu7Z";

async function run() {
    const res = await fetch("https://api.supabase.com/v1/projects", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    console.log(await res.text());
}
run();
