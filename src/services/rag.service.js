import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { chatModel } from '../config/gemini.config.js';
import prisma from '../config/prisma.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '../../chat_history.json');

// --- Optimization Caches ---
let cachedDbContext = "";
let lastDbCacheTime = 0;
const DB_CACHE_DURATION = 5 * 60 * 1000;
let memoryHistoryCache = null;

class RAGService {
    // 📡 Live Database Context (SQL Queries)
    static async fetchDatabaseContext() {
        const now = Date.now();
        if (cachedDbContext && (now - lastDbCacheTime < DB_CACHE_DURATION)) return cachedDbContext;

        try {
            const [events, faqs] = await Promise.all([
                prisma.event.findMany({ take: 3, where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' } }),
                prisma.fAQ.findMany({ take: 2, orderBy: { createdAt: 'desc' } })
            ]);

            let dbContext = "\n--- Live Database Info ---\n";
            events.forEach(e => dbContext += `- Event: ${e.title} (${e.date || 'TBA'})\n`);
            faqs.forEach(f => dbContext += `- Q: ${f.question} | A: ${f.answer}\n`);

            cachedDbContext = dbContext;
            lastDbCacheTime = now;
            return dbContext;
        } catch (error) {
            return cachedDbContext || "";
        }
    }

    // 📍 User location logic (Using Prisma)
    static async fetchNearbyEvents(lat, lng, radiusKm = 2000) {
        const logFile = path.join(__dirname, '../../server.log');
        const writeLog = (msg) => {
            const time = new Date().toLocaleTimeString();
            fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
            console.log(msg);
        };

        if (!lat || !lng) {
            writeLog("⚠️ No coordinates received from frontend.");
            return "";
        }

        try {
            writeLog(`📍 USER LOCATION: Lat ${lat}, Lng ${lng} (Search Radius: ${radiusKm}km)`);

            const events = await prisma.event.findMany({
                where: { status: 'PUBLISHED', Location: { isNot: null } },
                include: { Location: true }
            });

            writeLog(`🔍 Checking ${events.length} published events...`);

            const nearby = events.filter(e => {
                const eventLat = e.Location?.latitude;
                const eventLng = e.Location?.longitude;

                if (eventLat === null || eventLat === undefined || eventLng === null || eventLng === undefined) return false;

                const distance = this.calculateDistance(lat, lng, eventLat, eventLng);
                writeLog(`   - "${e.title}" is ${distance.toFixed(1)}km away`);

                return distance <= radiusKm;
            }).slice(0, 3);

            if (nearby.length === 0) {
                writeLog("❌ No events found within the radius.");
                return "\nNote: No events found near your current location.\n";
            }

            let ctx = "\n--- Events Near Your Location ---\n";
            nearby.forEach(e => {
                const d = this.calculateDistance(lat, lng, e.Location.latitude, e.Location.longitude);
                ctx += `- ${e.title} at ${e.Location.formattedAddress} (${d.toFixed(1)} km away)\n`;
                writeLog(`      ✅ MATCH FOUND: ${e.title}`);
            });
            return ctx;
        } catch (e) {
            writeLog(`❌ Error: ${e.message}`);
            return "";
        }
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    static loadLocalHistory() {
        if (memoryHistoryCache) return memoryHistoryCache;
        try {
            if (fs.existsSync(HISTORY_FILE)) {
                memoryHistoryCache = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
                return memoryHistoryCache;
            }
        } catch (e) { }
        return {};
    }

    static saveLocalHistory(history) {
        memoryHistoryCache = history;
        try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2)); } catch (e) { }
    }

    static async getAnswer(question, sessionId = "default", location = null) {
        const allHistories = this.loadLocalHistory();
        let chatHistory = allHistories[sessionId] || [];

        // Context from DB and Location
        const [dbContext, nearbyContext] = await Promise.all([
            this.fetchDatabaseContext(),
            location ? this.fetchNearbyEvents(location.lat, location.lng) : Promise.resolve("")
        ]);

        // Get Location Name for AI (Optional but helpful)
        let locationName = "Unknown";
        if (location) {
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`, {
                    headers: { 'User-Agent': 'NexgemBot/1.0' }
                });
                const geoData = await geoRes.json();
                locationName = geoData.display_name || `${location.lat}, ${location.lng}`;
            } catch (e) { }
        }

        const prompt = PromptTemplate.fromTemplate(`
            You are StubGuys Assistant, a helpful AI expert for events and ticketing.
            
            USER INFO:
            - Current Location Name: {location_name}
            - Nearby Events: {nearby_context}
            
            CITY REFERENCE (Coordinates):
            - Delhi: 28.61, 77.20
            - Noida: 28.53, 77.39
            - Mumbai: 19.07, 72.87
            - Dehradun: 30.31, 78.03
            
            DATABASE KNOWLEDGE:
            {db_context}
            
            CHAT HISTORY:
            {chat_history}
            
            USER QUESTION: {question}
            
            INSTRUCTIONS:
            - If the user asks about distance to a city listed above, use their coordinates to estimate distance.
            - Answer professionally as a StubGuys representative.
            - Answer in the user's language (Hindi/English mix).
            
            BOOKING INSTRUCTIONS:
            - If the user wants to book a ticket:
                1. Identify the event from DATABASE KNOWLEDGE or Nearby Events.
                2. If the event is not clear, ask the user which event they want to book.
                3. Ask for the number of tickets (Quantity).
                4. Ask for their Full Name and Email Address.
                5. Once you have all details (Event, Qty, Name, Email), summarize them and ask for final confirmation to proceed.
            
            GENERAL INSTRUCTIONS:
            - If not booking, answer normally based on context.
            - Answer in the user's language (Hindi/English mix).
            
            Your Response:
        `);

        const chain = RunnableSequence.from([
            {
                location_name: () => locationName,
                db_context: () => dbContext,
                nearby_context: () => nearbyContext,
                chat_history: () => chatHistory.map(m => `${m.role}: ${m.content}`).join('\n'),
                question: new RunnablePassthrough(),
            },
            prompt,
            chatModel,
            new StringOutputParser(),
        ]);

        const logFile = path.join(__dirname, '../../server.log');
        const writeLog = (msg) => {
            const time = new Date().toLocaleTimeString();
            fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
        };

        writeLog(`🤖 AI Prompt ready with ${nearbyContext.length} chars of nearby context.`);

        const stream = await chain.stream(question);
        return { stream, chatHistory, allHistories };
    }
}

export default RAGService;
