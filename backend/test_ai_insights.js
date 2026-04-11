const mongoose = require('mongoose');
const dotenv = require('dotenv');
const costService = require('./src/services/costManagement.service');

dotenv.config({ path: './.env' });

const test = async () => {
    try {
        console.log('Connecting to MONGO_URI...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const UtilityCost = require('./src/models/costManagement.model');
        const sampleCost = await UtilityCost.findOne();
        
        if (!sampleCost) {
            console.log('No costs found in DB. AI insight will return fallback.');
        } else {
            const userId = sampleCost.user;
            console.log(`Testing AI Insights for user: ${userId}`);

            const insights = await costService.getAIInsights(userId);
            console.log('AI Insights Result (DEBUG):', JSON.stringify(insights, null, 2));
        }

    } catch (error) {
        console.error('Test Failed with intense detail:');
        if (error.response) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Response Status:', error.response.status);
        } else {
            console.error(error);
        }
    } finally {
        await mongoose.connection.close();
    }
};

test();
