/**
 * Gemini Service - Handles AI interactions using Google Gemini API
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper function to call Gemini with a retry mechanism if the service is busy
const callGemini = async (prompt, retries = 3) => {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log("Raw Gemini Response:", text); // Debugging

        text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');

        if (start !== -1 && end !== -1) {
            const jsonPart = text.substring(start, end + 1);
            return JSON.parse(jsonPart);
        }
        return JSON.parse(text);
    } catch (error) {
        // 429 (Rate Limit) හෝ 503 (Busy) නම් විතරක් Retry කරන්න
        if (retries > 0 && (error.status === 429 || error.status === 503)) {
            const waitTime = error.status === 429 ? 5000 : 2000; // 429 නම් තත්පර 5ක් ඉන්න
            console.log(`AI limited or busy (Status: ${error.status}), retrying in ${waitTime / 1000}s... (${retries} left)`);
            await new Promise(res => setTimeout(res, waitTime));
            return callGemini(prompt, retries - 1);
        }
        throw error;
    }
};

// Generates an AI analysis summary and recommendations for an energy audit
exports.generateAuditAnalysis = async (data) => {
    const prompt = `
    Analyze household electricity data:
    - Month: ${data.month}
    - Total Units: ${data.totalUnits}
    - Household Size: ${data.householdSize}
    - Appliances: ${JSON.stringify(data.appliances)}
    - Previous Month Units: ${data.previousMonthUnits || 'N/A'}

    Response in JSON only: ai_summary, ai_recommendations (array of 3), efficiency_score (0-100), badges (array).
  `;

    try {
        return await callGemini(prompt);
    } catch (error) {
        console.error("Gemini API Error, using Smart Fallback:", error.message);

        // --- SMART FALLBACK LOGIC FOR DEMO ---
        const unitsPerPerson = data.totalUnits / (data.householdSize || 1);
        let summary = "";
        let score = 70;
        let recommendations = [];
        let badges = [];

        if (unitsPerPerson > 100) {
            summary = `Your consumption of ${data.totalUnits} units for ${data.householdSize} people is quite high. We detected heavy appliance usage patterns.`;
            score = 35;
            recommendations = ["Consider using high-wattage appliances during off-peak hours.", "Switch to energy-efficient LED lighting across all rooms.", "Monitor your ${data.appliances[0]?.name || 'heavy devices'} usage closely."];
            badges = ["High Consumer", "Optimization Needed"];
        } else if (unitsPerPerson > 50) {
            summary = `Your energy pulse is stable, but there is room for optimization. Your usage of ${data.totalUnits} units is standard for this household size.`;
            score = 65;
            recommendations = ["Unplug standby devices to save up to 10% on your bill.", "Optimize refrigerator temperature settings for better efficiency.", "Consider a solar-assist for your daytime lighting."];
            badges = ["Standard Usage", "Steady Pulse"];
        } else {
            summary = `Excellent! Your household of ${data.householdSize} is performing at peak efficiency with only ${data.totalUnits} units.`;
            score = 92;
            recommendations = ["Share your saving tips with the community!", "Maintain current high-efficiency habits.", "Investigate small vampire power leaks for perfection."];
            badges = ["Eco Warrior", "Efficiency Star"];
        }

        return {
            ai_summary: summary,
            ai_recommendations: recommendations,
            efficiency_score: score,
            badges: badges
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

/**
 * Fetches/Estimates electricity tariff plan using AI based on provider and date.
 * This replaces hard-coded rates with dynamic AI-generated data.
 */
exports.getAITariffPlan = async ({ provider, month, year }) => {
    const prompt = `
    You are an electricity tariff expert focusing on Sri Lankan utility providers (CEB and LECO).
    Generate the official electricity tariff structure for the provider "${provider}" for the billing period ${month}/${year}.
    
    The response MUST be a valid JSON object only, with the following schema:
    {
      "slabs": [
        { "from": number, "to": number | null, "ratePerUnit": number }
      ],
      "fixedCharge": number,
      "peakRate": number,
      "offPeakRate": number,
      "taxRate": number,
      "effectiveFrom": "YYYY-MM-DD"
    }

    Notes for the slabs:
    - The "to" field should be null for the final slab (representing Infinity).
    - Ensure rates and fixed charges reflect the most accurate data available for the given period.
    - If you are unsure, provide the most widely accepted standard rates for that year.
    
    Do not include markdown or explanations. Return ONLY the raw JSON.
  `;

    try {
        const data = await callGemini(prompt);
        // Basic structure validation
        if (!data.slabs || !Array.isArray(data.slabs) || typeof data.fixedCharge !== 'number') {
            throw new Error('Invalid AI tariff structure');
        }
        return data;
    } catch (error) {
        console.error("Error fetching AI tariff plan:", error);
        throw error;
    }
};

/**
 * Generates AI spending insights based on historical costs and goals
 */
exports.generateCostInsights = async ({ costs, goals }) => {
    const prompt = `
    You are a personal financial utility advisor.
    Analyze the following utility spending data and budget goals for a household:
    
    Historical Costs (Last few entries):
    ${JSON.stringify(costs.slice(0, 12))}
    
    Active Budget Goals:
    ${JSON.stringify(goals)}

    Please provide a response in valid JSON format ONLY with the following fields:
    - summary: A conversational but professional summary of recent spending efficiency (max 3 sentences).
    - recommendations: An array of 3-4 specific, data-driven recommendations (e.g., "Your water bill increased by 20% last month, check for leaks").
    - status: One of ["excellent", "on-track", "warning", "critical"] based on goal compliance.
    - highlight_category: The utility category that needs most attention (e.g., "Electricity").

    Do not include markdown or explanations. Return ONLY the raw JSON.
  `;

    try {
        return await callGemini(prompt);
    } catch (error) {
        console.error("Error generating cost insights:", error);
        throw error;
    }
};

