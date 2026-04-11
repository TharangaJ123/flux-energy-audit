const geminiService = require('../src/services/geminiService');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
    try {
        console.log('Testing getAITariffPlan...');
        const plan = await geminiService.getAITariffPlan({ provider: 'CEB', month: 4, year: 2026 });
        console.log('Plan fetched successfully:', JSON.stringify(plan, null, 2));
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

test();
