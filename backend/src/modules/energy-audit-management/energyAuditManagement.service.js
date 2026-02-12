const EnergyAudit = require('./energyAuditManagement.model');
const geminiService = require('../../services/geminiService');
const { runInTransaction } = require('../../util/transaction');

exports.createAudit = async (userId, data) => {
    return await runInTransaction(async (session) => {
        // 1. Prepare data for AI analysis
        const aiInput = {
            month: data.month,
            totalUnits: data.totalUnits,
            householdSize: data.householdSize, // Ensure this is passed or defaulted
            appliances: data.appliances,
            previousMonthUnits: data.previousMonthUnits,
        };

        // 2. Get AI Insights
        const aiResult = await geminiService.generateAuditAnalysis(aiInput);

        // 3. Create Audit Record
        const newAudit = await EnergyAudit.create({
            user: userId,
            ...data,
            aiSummary: aiResult.ai_summary,
            aiRecommendations: aiResult.ai_recommendations,
            efficiencyScore: aiResult.efficiency_score,
            badges: aiResult.badges,
        });

        await newAudit.save({ session });
        return newAudit;
    });
};

exports.getAudits = async (userId) => {
    return await EnergyAudit.find({ user: userId }).sort({ month: -1 });
};

exports.getAuditById = async (auditId, userId) => {
    const audit = await EnergyAudit.findOne({ _id: auditId, user: userId });
    if (!audit) throw new Error('Audit not found');
    return audit;
};

exports.updateAudit = async (auditId, userId, updateData) => {
    return await runInTransaction(async (session) => {
        let audit = await EnergyAudit.findOne({ _id: auditId, user: userId }).session(session);
        if (!audit) throw new Error('Audit not found');

        // Verify if critical fields changed to re-trigger AI
        const needsReAnalysis =
            updateData.totalUnits !== undefined ||
            updateData.appliances !== undefined;

        Object.assign(audit, updateData);

        if (needsReAnalysis) {
            const aiInput = {
                month: audit.month,
                totalUnits: audit.totalUnits,
                householdSize: updateData.householdSize || 4, // simplistic default if missing from update
                appliances: audit.appliances,
                previousMonthUnits: 0, // In update flow, might need to fetch prev month dynamically if strictly required
            };

            try {
                const aiResult = await geminiService.generateAuditAnalysis(aiInput);
                audit.aiSummary = aiResult.ai_summary;
                audit.aiRecommendations = aiResult.ai_recommendations;
                audit.efficiencyScore = aiResult.efficiency_score;
                audit.badges = aiResult.badges;
            } catch (e) {
                console.error("AI Analysis failed during update, preserving old data or setting error flag", e);
                // Optionally handle partial failure
            }
        }

        await audit.save({ session });
        return audit;
    });
};

exports.deleteAudit = async (auditId, userId) => {
    return await runInTransaction(async (session) => {
        const audit = await EnergyAudit.findOneAndDelete({ _id: auditId, user: userId }).session(session);
        if (!audit) throw new Error('Audit not found');
        return audit;
    });
};

exports.simulateChange = async (auditId, userId, changes) => {
    const audit = await EnergyAudit.findOne({ _id: auditId, user: userId });
    if (!audit) throw new Error('Audit not found');

    const simulationResult = await geminiService.generateSimulation(
        {
            totalUnits: audit.totalUnits,
            appliances: audit.appliances,
        },
        changes
    );

    return simulationResult;
};

exports.chatWithAudit = async (auditId, userId, message, history) => {
    const audit = await EnergyAudit.findOne({ _id: auditId, user: userId });
    if (!audit) throw new Error('Audit not found');

    const context = {
        totalUnits: audit.totalUnits,
        month: audit.month,
        appliances: audit.appliances,
        aiSummary: audit.aiSummary,
        recommendations: audit.aiRecommendations
    };

    const response = await geminiService.generateChatResponse(history, message, context);
    return response;
};
