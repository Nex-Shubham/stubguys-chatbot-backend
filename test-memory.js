async function testMemory() {
    const sessionId = "user-" + Math.random().toString(36).substring(7);
    console.log(`Testing Chat Memory with Session ID: ${sessionId}\n`);

    try {
        // Step 1: Tell the AI my name
        console.log("Step 1: Telling AI my name...");
        const res1 = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: "Hi, my name is Rahul. Remember that.",
                sessionId: sessionId 
            })
        });
        const data1 = await res1.json();
        console.log("AI Response:", data1.response);

        console.log("\n-----------------------------------\n");

        // Step 2: Ask the AI what my name is
        console.log("Step 2: Asking AI what my name is...");
        const res2 = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: "What is my name?",
                sessionId: sessionId 
            })
        });
        const data2 = await res2.json();
        console.log("AI Response:", data2.response);

        if (data2.response.includes("Rahul")) {
            console.log("\n✅ Success! AI remembered your name.");
        } else {
            console.log("\n❌ Memory test failed.");
        }

    } catch (error) {
        console.error("Test Error:", error.message);
    }
}

testMemory();
