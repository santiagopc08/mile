async function test() {
    console.log("Testing POST to /api/store");
    try {
        const res = await fetch('http://localhost:3000/api/store', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                victoriesEl: [{
                    id: Date.now().toString(),
                    text: "Test victory",
                    author: "el"
                }]
            })
        });
        const json = await res.json();
        console.log("Result:", json);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
