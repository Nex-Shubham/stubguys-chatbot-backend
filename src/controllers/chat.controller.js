import RAGService from '../services/rag.service.js';

export const handleChat = async (req, res) => {
    const { message, sessionId, lat, lng } = req.body;
    const currentSessionId = sessionId || "default-session";

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const location = (lat && lng) ? { lat, lng } : null;
       // console.log("📨 Received Chat Request:", { message, sessionId: currentSessionId, location });
        const { stream, chatHistory, allHistories } = await RAGService.getAnswer(message, currentSessionId, location);

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        let fullResponse = "";

        for await (const chunk of stream) {
            fullResponse += chunk;
            res.write(chunk); // Send chunk to client
        }

        // Save history after stream finishes
        const newMessages = [
            ...chatHistory,
            { role: "human", content: message },
            { role: "ai", content: fullResponse }
        ];
        allHistories[currentSessionId] = newMessages.slice(-10);
        RAGService.saveLocalHistory(allHistories);

        res.end(); // Close connection
    } catch (error) {
        console.error("Controller Error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({
                error: "Something went wrong with the AI service",
                details: error.message
            });
        } else {
            res.end();
        }
    }
};
