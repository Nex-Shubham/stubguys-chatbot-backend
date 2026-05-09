import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './src/routes/chat.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;


// Register Routes
app.use('/api', chatRoutes);

// Root Route
app.get('/', (req, res) => {
    res.send('AI Chatbot is running')
})

// Health Check
app.get('/health', (req, res) => res.send('AI Chatbot is Healthy 🚀'));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Keep process alive in this environment
setInterval(() => { }, 1000000);
