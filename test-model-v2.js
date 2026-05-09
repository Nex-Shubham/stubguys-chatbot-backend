import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';
dotenv.config();

async function testModels() {
    const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
    for (const modelName of models) {
        console.log(`\nTesting: ${modelName}`);
        try {
            const chat = new ChatGoogleGenerativeAI({
                model: modelName,
                apiKey: process.env.GEMINI_API_KEY,
            });
            const res = await chat.invoke("hi");
            console.log(`✅ ${modelName} works!`);
            process.exit(0);
        } catch (e) {
            console.log(`❌ ${modelName} failed: ${e.message}`);
        }
    }
}

testModels();
