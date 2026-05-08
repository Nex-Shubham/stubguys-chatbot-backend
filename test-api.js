async function testChat() {
    console.log("Testing Chatbot API...");
    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Are there any upcoming events in the database?" })
        });
        
        const data = await response.json();
        console.log("\n--- API Response ---");
        console.log(JSON.stringify(data, null, 2));
        console.log("--------------------\n");
        
        if (data.response) {
            console.log("✅ Success! Chatbot is working.");
        } else {
            console.log("❌ Error: Response was empty or invalid.");
        }
    } catch (error) {
        console.error("❌ Failed to connect to server. Is 'npm run dev' running?", error.message);
    }
}

testChat();
