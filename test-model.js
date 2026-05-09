import { chatModel } from './src/config/gemini.config.js';

async function testModel() {
    try {
        console.log("Testing model connection...");
        const response = await chatModel.invoke("Hello, are you working?");
        console.log("✅ Success! AI Response:", response.content);
    } catch (error) {
        console.error("❌ Model Error:", error.message);
        console.log("\nTip: Try changing model to 'gemini-1.5-flash' in gemini.config.js if this fails.");
    }
}

testModel();
