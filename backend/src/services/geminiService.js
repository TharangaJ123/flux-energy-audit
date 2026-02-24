const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.generateAuditAnalysis = async (data) => {
    const prompt = `
    You are an energy audit assistant.
    Analyze the following household electricity data:
    - Month: ${data.month}
    - Total Units: ${data.totalUnits}
    - Household Size: ${data.householdSize}
    - Appliances: ${JSON.stringify(data.appliances)}
    - Previous Month Units: ${data.previousMonthUnits || 'N/A'}

    Please provide a response in valid JSON format with the following fields:
    - ai_summary: A concise summary of energy usage behavior (max 2 sentences).
    - ai_recommendations: An array of 3 specific, actionable recommendations to reduce consumption.
    - efficiency_score: A number between 0 and 100 representing energy efficiency.
    - badges: An array of strings (e.g., "Efficient Home", "High Consumer").
    
    Do not include markdown formatting like \`\`\`json. Just the raw JSON object.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        // Clean up potential markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating audit analysis:", error);
        throw new Error("Failed to generate AI analysis");
    }
};

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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating simulation:", error);
        throw new Error("Failed to generate simulation results");
    }
};

exports.generateChatResponse = async (history, message, context) => {
    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        })),
    });

    const prompt = `
    Context:
    ${JSON.stringify(context)}

    User Query: ${message}

    Answer the user's question based on the context of their energy audit. Keep it helpful and concise.
  `;

    try {
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating chat response:", error);
        throw new Error("Failed to generate chat response");
    }
};
