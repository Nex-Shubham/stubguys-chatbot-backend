import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log("Listing available models...");
        // This is a rough way to check if models work
        const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("test");
                console.log(`✅ Model ${m} is WORKING`);
            } catch (e) {
                console.log(`❌ Model ${m} FAILED:`, e.message);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
