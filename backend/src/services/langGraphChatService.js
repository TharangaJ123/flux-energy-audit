/**
 * LangGraph Chat Service - Stateful multi-node AI chatbot for Energy Audit Management
 *
 * Uses LangGraph's StateGraph to build a structured, multi-step AI workflow:
 *   1. Context Analysis Node - Analyzes the audit context and user intent
 *   2. Response Generation Node - Generates an energy-focused response
 *   3. Safety/Guardrail Node - Ensures the response stays on topic
 *
 * This replaces the simple single-prompt Gemini chat with a more robust,
 * stateful graph-based conversation flow.
 */
const { StateGraph, END, START, Annotation } = require('@langchain/langgraph');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const dotenv = require('dotenv');

dotenv.config();

// --- LangGraph State Schema ---
// Defines the shared state that flows through graph nodes
const ChatGraphState = Annotation.Root({
    // The user's current message
    userMessage: Annotation({
        reducer: (_, newVal) => newVal,
        default: () => '',
    }),
    // Audit context data
    auditContext: Annotation({
        reducer: (_, newVal) => newVal,
        default: () => ({}),
    }),
    // Chat history from previous turns
    chatHistory: Annotation({
        reducer: (_, newVal) => newVal,
        default: () => [],
    }),
    // The detected user intent category
    intentCategory: Annotation({
        reducer: (_, newVal) => newVal,
        default: () => 'general',
    }),
    // The generated AI response
    aiResponse: Annotation({
        reducer: (_, newVal) => newVal,
        default: () => '',
    }),
    // Whether the response passed safety checks
    isSafe: Annotation({
        reducer: (_, newVal) => newVal,
        default: () => true,
    }),
});

// --- Initialize LLM ---
const createModel = () => {
    return new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash',
        apiKey: process.env.GEMINI_AUDIT_API_KEY || process.env.GEMINI_API_KEY,
        temperature: 0.7,
        maxRetries: 2,
    });
};

// --- Node 1: Intent Analysis ---
// Classifies the user's message to route the conversation appropriately
const analyzeIntent = async (state) => {
    const model = createModel();

    const intentPrompt = new SystemMessage(
        `You are an intent classifier for an energy audit chatbot.
Classify the user's message into exactly one of these categories:
- "energy_advice": Asking for energy saving tips or efficiency advice
- "bill_analysis": Questions about their electricity bill or usage patterns
- "appliance_query": Questions about specific appliance energy consumption
- "simulation": Wants to know what-if scenarios about changing usage
- "general": General greetings, off-topic, or unclear queries

Respond with ONLY the category name, nothing else.`
    );

    const userMsg = new HumanMessage(state.userMessage);

    try {
        const response = await model.invoke([intentPrompt, userMsg]);
        const intent = response.content.trim().toLowerCase().replace(/[^a-z_]/g, '');

        const validIntents = ['energy_advice', 'bill_analysis', 'appliance_query', 'simulation', 'general'];
        const finalIntent = validIntents.includes(intent) ? intent : 'general';

        return { intentCategory: finalIntent };
    } catch (error) {
        console.error('Intent analysis failed:', error.message);
        return { intentCategory: 'general' };
    }
};

// --- Node 2: Response Generation ---
// Generates a context-aware response based on intent and audit data
const generateResponse = async (state) => {
    const model = createModel();
    const { auditContext, userMessage, intentCategory, chatHistory } = state;

    // Build intent-specific system instructions
    const intentInstructions = {
        energy_advice: `Focus on providing personalized, actionable energy saving recommendations based on the user's actual audit data. Reference their specific appliances and usage patterns. Include estimated savings where possible.`,
        bill_analysis: `Analyze the user's electricity consumption data. Break down their usage by appliance, compare with average households, and identify cost drivers. Use the audit numbers to give specific insights.`,
        appliance_query: `Provide detailed information about the energy consumption of the appliances in the user's audit. Compare their usage hours with recommended levels and suggest optimizations.`,
        simulation: `Based on the audit data, simulate potential savings from the suggested changes. Provide estimated unit savings and cost impact. Be specific with numbers from their context.`,
        general: `Be friendly and helpful. If the question relates to energy, answer it using the audit context. If it's completely off-topic, gently redirect to energy-related assistance.`,
    };

    const systemPrompt = new SystemMessage(
        `You are FluxBot, an intelligent energy audit assistant powered by AI.
You help Sri Lankan households understand and optimize their energy consumption.

${intentInstructions[intentCategory] || intentInstructions.general}

User's Audit Context:
- Total Units Consumed: ${auditContext.totalUnits || 'N/A'} kWh
- Billing Month: ${auditContext.month || 'N/A'}
- Appliances: ${JSON.stringify(auditContext.appliances || [])}
- AI Summary: ${auditContext.aiSummary || 'No summary available'}
- Recommendations: ${JSON.stringify(auditContext.recommendations || [])}

Rules:
1. Keep responses concise but informative (max 3-4 paragraphs)
2. Use Sri Lankan Rupees (LKR/Rs.) for cost references
3. Reference the user's actual data when possible
4. Be encouraging about energy savings
5. If unsure, suggest checking with their utility provider (CEB/LECO)`
    );

    // Convert chat history to LangChain message format
    const historyMessages = chatHistory.map((msg) =>
        msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    const messages = [systemPrompt, ...historyMessages, new HumanMessage(userMessage)];

    try {
        const response = await model.invoke(messages);
        return { aiResponse: response.content };
    } catch (error) {
        console.error('Response generation failed:', error.message);

        // Fallback response based on intent
        const fallbacks = {
            energy_advice: "I'm having trouble connecting right now, but here's a quick tip: Switching to LED bulbs can save up to 75% on lighting costs! Try again in a moment for personalized advice.",
            bill_analysis: "I can't analyze your bill right now due to high demand. Quick insight: The average Sri Lankan household uses about 90 units/month. Check back shortly!",
            appliance_query: "I'm temporarily unable to process your request. Quick fact: Air conditioners typically consume 1.5-2 kWh per hour. Try again soon!",
            simulation: "I can't run that simulation right now. General tip: Reducing AC usage by 2 hours daily can save about 90 units/month!",
            general: "I'm experiencing high demand right now. Quick energy tip: Unplug chargers when not in use — they still draw power! Please try again shortly.",
        };

        return { aiResponse: fallbacks[intentCategory] || fallbacks.general };
    }
};

// --- Node 3: Safety Guardrail ---
// Ensures the response is appropriate and on-topic
const checkSafety = async (state) => {
    const { aiResponse, intentCategory } = state;

    // Basic safety checks (no external call needed for these)
    const offTopicKeywords = ['politics', 'religion', 'gambling', 'violence'];
    const responseLC = aiResponse.toLowerCase();
    const hasOffTopic = offTopicKeywords.some((kw) => responseLC.includes(kw));

    if (hasOffTopic) {
        return {
            isSafe: false,
            aiResponse:
                "I'm designed to help with energy-related questions only. Let me know if you have any questions about your energy audit, electricity usage, or saving tips! ⚡",
        };
    }

    // Add intent badge to response for transparency
    const intentBadges = {
        energy_advice: '💡',
        bill_analysis: '📊',
        appliance_query: '🔌',
        simulation: '🔮',
        general: '💬',
    };

    const badge = intentBadges[intentCategory] || '💬';
    return {
        isSafe: true,
        aiResponse: `${badge} ${aiResponse}`,
    };
};

// --- Conditional Edge ---
// Routes to END after safety check (could add retry logic in future)
const afterSafetyCheck = (state) => {
    return END;
};

// --- Build the LangGraph ---
const buildChatGraph = () => {
    const workflow = new StateGraph(ChatGraphState);

    // Add nodes
    workflow.addNode('analyzeIntent', analyzeIntent);
    workflow.addNode('generateResponse', generateResponse);
    workflow.addNode('checkSafety', checkSafety);

    // Define edges (flow)
    workflow.addEdge(START, 'analyzeIntent');
    workflow.addEdge('analyzeIntent', 'generateResponse');
    workflow.addEdge('generateResponse', 'checkSafety');
    workflow.addConditionalEdges('checkSafety', afterSafetyCheck);

    // Compile the graph
    return workflow.compile();
};

// Cache the compiled graph so we don't rebuild it on every request
let compiledGraph = null;

const getGraph = () => {
    if (!compiledGraph) {
        compiledGraph = buildChatGraph();
    }
    return compiledGraph;
};

/**
 * Main entry point: Run the LangGraph chatbot
 * @param {Object} context - The audit context data
 * @param {string} message - The user's input message
 * @param {Array} history - Previous chat messages [{role, content}]
 * @returns {string} The AI response
 */
exports.chat = async (context, message, history = []) => {
    try {
        console.log('Starting LangGraph Chat Workflow...');
        const graph = getGraph();

        console.log('Invoking Graph with message:', message);
        const result = await graph.invoke({
            userMessage: message,
            auditContext: context,
            chatHistory: history,
        });

        console.log('Graph Workflow completed successfully');
        return result.aiResponse;
    } catch (error) {
        console.error('LANGGRAPH FATAL ERROR:', error.message);
        // Fallback to a simpler message so the user isn't stuck with 500
        return "I'm having a temporary system issue connecting to my core AI. General tip: Switch off standby lights to save up to 5% on your bill!";
    }
};
