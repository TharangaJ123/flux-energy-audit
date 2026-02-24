const EnergyAudit = require('./energyAuditManagement.model');
const Appliance = require('../appliance-management/appliancemanagement.model');
const geminiService = require('../../services/geminiService');
const { runInTransaction } = require('../../util/transaction');

exports.createAudit = async (userId, data) => {
    return await runInTransaction(async (session) => {
        // 1. Fetch appliance details for AI analysis
        const populatedAppliances = await Promise.all(
            data.appliances.map(async (app) => {
                const appliance = await Appliance.findById(app.applianceId).session(session);
                if (!appliance) throw new Error(`Appliance not found: ${app.applianceId}`);
                return {
                    name: appliance.name,
                    powerConsumption: appliance.powerConsumption,
                    usageHours: app.usageHours,
                };
            })
        );

        // 2. Prepare data for AI analysis
        const aiInput = {
            month: data.month,
            totalUnits: data.totalUnits,
            householdSize: data.householdSize,
            appliances: populatedAppliances,
            previousMonthUnits: data.previousMonthUnits,
        };

        // 3. Get AI Insights
        const aiResult = await geminiService.generateAuditAnalysis(aiInput);

        // 4. Create Audit Record
        const newAudit = await EnergyAudit.create([{
            user: userId,
            ...data,
            aiSummary: aiResult.ai_summary,
            aiRecommendations: aiResult.ai_recommendations,
            efficiencyScore: aiResult.efficiency_score,
            badges: aiResult.badges,
        }], { session });

        return newAudit[0];
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
            // Fetch appliance details for AI analysis
            const populatedAppliances = await Promise.all(
                audit.appliances.map(async (app) => {
                    const appliance = await Appliance.findById(app.applianceId).session(session);
                    if (!appliance) throw new Error(`Appliance not found: ${app.applianceId}`);
                    return {
                        name: appliance.name,
                        powerConsumption: appliance.powerConsumption,
                        usageHours: app.usageHours,
                    };
                })
            );

            const aiInput = {
                month: audit.month,
                totalUnits: audit.totalUnits,
                householdSize: updateData.householdSize || 4, // simplistic default if missing from update
                appliances: populatedAppliances,
                previousMonthUnits: 0,
            };

            try {
                const aiResult = await geminiService.generateAuditAnalysis(aiInput);
                audit.aiSummary = aiResult.ai_summary;
                audit.aiRecommendations = aiResult.ai_recommendations;
                audit.efficiencyScore = aiResult.efficiency_score;
                audit.badges = aiResult.badges;
            } catch (e) {
                console.error("AI Analysis failed during update, preserving old data or setting error flag", e);
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

    const populatedAppliances = await Promise.all(
        audit.appliances.map(async (app) => {
            const appliance = await Appliance.findById(app.applianceId);
            return {
                name: appliance?.name || 'Unknown',
                powerConsumption: appliance?.powerConsumption || 0,
                usageHours: app.usageHours,
            };
        })
    );

    // Resolve applianceId in 'changes' to name for Gemini analysis
    const mappedChanges = await Promise.all(
        changes.map(async (change) => {
            const appliance = await Appliance.findById(change.applianceId);
            return {
                ...change,
                applianceName: appliance?.name || 'Unknown',
            };
        })
    );

    const simulationResult = await geminiService.generateSimulation(
        {
            totalUnits: audit.totalUnits,
            appliances: populatedAppliances,
        },
        mappedChanges
    );

    return simulationResult;
};

exports.chatWithAudit = async (auditId, userId, message, history) => {
    const audit = await EnergyAudit.findOne({ _id: auditId, user: userId });
    if (!audit) throw new Error('Audit not found');

    const populatedAppliances = await Promise.all(
        audit.appliances.map(async (app) => {
            const appliance = await Appliance.findById(app.applianceId);
            return {
                name: appliance?.name || 'Unknown',
                powerConsumption: appliance?.powerConsumption || 0,
                usageHours: app.usageHours,
            };
        })
    );

    const context = {
        totalUnits: audit.totalUnits,
        month: audit.month,
        appliances: populatedAppliances,
        aiSummary: audit.aiSummary,
        recommendations: audit.aiRecommendations
    };

    const response = await geminiService.generateChatResponse(history, message, context);
    return response;
};
