/**
 * Gemini Service - Handles AI interactions using Google Gemini API
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper function to call Gemini with a retry mechanism if the service is busy
const callGemini = async (prompt, retries = 2) => {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Advanced cleaning for any AI artifacts
        text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();

        // Find the first { and last } to isolate the JSON object if there's any stray text
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            return JSON.parse(text.substring(start, end + 1));
        }
        return JSON.parse(text);
    } catch (error) {
        if (retries > 0 && error.status === 503) {
            console.log(`AI busy, retrying... (${retries} left)`);
            await new Promise(res => setTimeout(res, 2000)); // Wait 2s before retry
            return callGemini(prompt, retries - 1);
        }
        throw error;
    }
};

// Generates an AI analysis summary and recommendations for an energy audit
exports.generateAuditAnalysis = async (data) => {
    const prompt = `
    You are an energy audit assistant.
    Analyze the following household electricity data:
    - Month: ${data.month}
    - Total Units: ${data.totalUnits}
    - Household Size: ${data.householdSize}
    - Appliances: ${JSON.stringify(data.appliances)}
    - Previous Month Units: ${data.previousMonthUnits || 'N/A'}

    Please provide a response in valid JSON format ONLY with the following fields:
    - ai_summary: A concise summary of energy usage behavior (max 2 sentences).
    - ai_recommendations: An array of 3 specific, actionable recommendations to reduce consumption.
    - efficiency_score: A number between 0 and 100 representing energy efficiency.
    - badges: An array of strings (e.g., "Efficient Home", "High Consumer").
    
    Do not include markdown formatting or side commentary.
  `;

    try {
        return await callGemini(prompt);
    } catch (error) {
        console.error("Error generating audit analysis:", error);
        // Return a mock object if AI is completely unavailable so the app doesn't crash
        return {
            ai_summary: "Unable to generate AI analysis at this time.",
            ai_recommendations: ["Manually check heavy appliances.", "Monitor peak hour usage.", "Consider switching to LED bulbs."],
            efficiency_score: 50,
            badges: ["AI Offline"]
        };
    }
};

// Simulates the impact of energy usage changes based on user input
exports.generateSimulation = async (baseData, changes) => {
    const prompt = `
      You are an energy simulator.
      Current Situation:
      - Total Units: ${baseData.totalUnits}
      - Appliances: ${JSON.stringify(baseData.appliances)}
  
      Simulate the following changes (parameter can be 'usageHours', 'powerConsumption', or 'count'):
      ${JSON.stringify(changes)}
  
      Calculate the impact and provide a JSON response with:
      - estimated_units: New total units after changes.
      - estimated_savings_units: Units saved.
      - estimated_savings_cost: Estimated cost savings (assume approx rate, or just use unit count * 30 as a rough estimate).
      - explanation: A simple explanation of why these savings occur.
      - co2_reduction: Estimated kg of CO2 saved (0.82 kg per unit).

      Do not include markdown formatting like \`\`\`json. Just the raw JSON object.
    `;

    try {
        return await callGemini(prompt);
    } catch (error) {
        console.error("Error generating simulation:", error);
        return {
            estimated_units: baseData.totalUnits * 0.9,
            estimated_savings_units: baseData.totalUnits * 0.1,
            estimated_savings_cost: baseData.totalUnits * 3,
            explanation: "Simple estimate: Reducing usage generally yields 10-15% savings.",
            co2_reduction: baseData.totalUnits * 0.08
        };
    }
};

// Generates a helpful response to user queries within an energy audit context
exports.generateChatResponse = async (history, message, context) => {
    const prompt = `
    Context:
    ${JSON.stringify(context)}

    User Query: ${message}

    Answer the user's question based on the context of their energy audit. Keep it helpful and concise.
    If the service is over capacity, apologize briefly but offer one clear piece of general energy saving advice.
  `;

    try {
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
        });
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating chat response:", error);
        return "I'm having trouble connecting to my AI core right now due to high demand. General tip: Switch off standby lights to save up to 5% on your bill!";
    }
};
