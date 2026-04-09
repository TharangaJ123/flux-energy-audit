const UtilityCost = require('../models/costManagement.model');
const CostGoal = require('../models/costGoal.model');
const { runInTransaction } = require('../util/transaction');
const tariffApiService = require('./tariffApiService');
const geminiService = require('./geminiService');

// Utility cost business logic.

const tariffPlans = {
    CEB: [
        {
            effectiveFrom: '2024-01-01',
            plan: {
                slabs: [
                    { from: 1, to: 30, ratePerUnit: 8 },
                    { from: 31, to: 60, ratePerUnit: 12 },
                    { from: 61, to: 90, ratePerUnit: 20 },
                    { from: 91, to: Infinity, ratePerUnit: 30 },
                ],
                fixedCharge: 400,
                peakRate: 36,
                offPeakRate: 24,
                taxRate: 0.18,
            },
        },
        {
            effectiveFrom: '2025-01-01',
            plan: {
                slabs: [
                    { from: 1, to: 30, ratePerUnit: 8.5 },
                    { from: 31, to: 60, ratePerUnit: 12.5 },
                    { from: 61, to: 90, ratePerUnit: 20.5 },
                    { from: 91, to: Infinity, ratePerUnit: 30.5 },
                ],
                fixedCharge: 420,
                peakRate: 37,
                offPeakRate: 25,
                taxRate: 0.18,
            },
        },
    ],
    LECO: [
        {
            effectiveFrom: '2024-01-01',
            plan: {
                slabs: [
                    { from: 1, to: 30, ratePerUnit: 9 },
                    { from: 31, to: 60, ratePerUnit: 13 },
                    { from: 61, to: 90, ratePerUnit: 21 },
                    { from: 91, to: Infinity, ratePerUnit: 31 },
                ],
                fixedCharge: 450,
                peakRate: 37,
                offPeakRate: 25,
                taxRate: 0.18,
            },
        },
        {
            effectiveFrom: '2025-01-01',
            plan: {
                slabs: [
                    { from: 1, to: 30, ratePerUnit: 9.5 },
                    { from: 31, to: 60, ratePerUnit: 13.5 },
                    { from: 61, to: 90, ratePerUnit: 21.5 },
                    { from: 91, to: Infinity, ratePerUnit: 31.5 },
                ],
                fixedCharge: 470,
                peakRate: 38,
                offPeakRate: 26,
                taxRate: 0.18,
            },
        },
    ],
};

const roundAmount = (value) => Number(value.toFixed(2));
const MAX_FUTURE_MONTHS_FOR_BILLING = 1;

const getMonthKey = (cost) => `${cost.year}-${String(cost.month).padStart(2, '0')}`;

const createLocalCostInsights = ({ costs, goals }) => {
    const latestCosts = costs.slice(0, 6);
    const totalSpend = latestCosts.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
    const avgSpend = latestCosts.length ? totalSpend / latestCosts.length : 0;
    const latestCost = latestCosts[0] || null;

    const spendingByUtility = latestCosts.reduce((acc, cost) => {
        const utilityType = cost.utilityType || 'General';
        acc[utilityType] = (acc[utilityType] || 0) + Number(cost.amount || 0);
        return acc;
    }, {});

    const highlightCategory =
        Object.entries(spendingByUtility).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';

    const costsByMonth = latestCosts.reduce((acc, cost) => {
        const monthKey = getMonthKey(cost);
        acc[monthKey] = (acc[monthKey] || 0) + Number(cost.amount || 0);
        return acc;
    }, {});

    const orderedMonths = Object.entries(costsByMonth).sort((a, b) => b[0].localeCompare(a[0]));
    const currentMonthTotal = orderedMonths[0]?.[1] || 0;
    const previousMonthTotal = orderedMonths[1]?.[1] || 0;

    const matchingGoal = latestCost
        ? goals.find((goal) => !goal.utilityType || goal.utilityType === latestCost.utilityType)
        : null;
    const goalLimit = Number(matchingGoal?.targetAmount || matchingGoal?.amount || 0);

    let status = 'on-track';
    if (goalLimit > 0 && currentMonthTotal > goalLimit) {
        status = currentMonthTotal > goalLimit * 1.15 ? 'critical' : 'warning';
    } else if (goalLimit > 0 && currentMonthTotal <= goalLimit * 0.9) {
        status = 'excellent';
    }

    const trendText =
        previousMonthTotal > 0
            ? currentMonthTotal > previousMonthTotal
                ? `Your latest monthly utility total is up by ${roundAmount(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100)}% compared with the previous month.`
                : `Your latest monthly utility total is down by ${roundAmount(((previousMonthTotal - currentMonthTotal) / previousMonthTotal) * 100)}% compared with the previous month.`
            : 'More monthly history will make the adviser more precise.';

    const summaryParts = [
        `Based on your last ${latestCosts.length} recorded bill${latestCosts.length === 1 ? '' : 's'}, your average spend is ${roundAmount(avgSpend)}.`,
        highlightCategory !== 'General'
            ? `${highlightCategory} is currently the biggest cost category in your recent records.`
            : 'Your recent records are enough to provide a basic spending snapshot.',
        trendText,
    ];

    const recommendations = [];

    if (highlightCategory && highlightCategory !== 'General') {
        recommendations.push(`Review your recent ${highlightCategory.toLowerCase()} bills first, since that category is contributing the largest share of your recorded spend.`);
    }

    if (goalLimit > 0) {
        if (currentMonthTotal > goalLimit) {
            recommendations.push(`Your current recorded monthly total is above your goal of ${roundAmount(goalLimit)}. Reduce discretionary usage or adjust the goal to match actual billing patterns.`);
        } else {
            recommendations.push(`You are within your recorded budget goal of ${roundAmount(goalLimit)}. Keep tracking monthly bills to confirm the trend holds.`);
        }
    } else {
        recommendations.push('Set a monthly spending goal so the adviser can flag over-budget periods earlier.');
    }

    recommendations.push('Track at least three consecutive months for each utility category to improve trend quality and seasonal comparisons.');

    if (latestCost?.notes) {
        recommendations.push('Use bill notes consistently for events like appliance purchases, travel, or leaks so unusual spikes are easier to explain later.');
    } else {
        recommendations.push('Add short notes when a bill spikes so later comparisons have useful context.');
    }

    return {
        summary: summaryParts.join(' '),
        recommendations: recommendations.slice(0, 4),
        status,
        highlight_category: highlightCategory,
    };
};

const isBeyondAllowedBillingWindow = ({ month, year }) => {
    const billingDate = new Date(year, month - 1, 1);
    const now = new Date();
    const maxAllowedDate = new Date(now.getFullYear(), now.getMonth() + MAX_FUTURE_MONTHS_FOR_BILLING, 1);
    return billingDate > maxAllowedDate;
};

const shouldUseExternalTariff = () => process.env.USE_TARIFF_API === 'true' || !!process.env.TARIFF_API_URL;
const shouldUseAiTariff = () => process.env.USE_AI_TARIFF === 'true';

const pickVersionedLocalTariff = ({ provider, month, year }) => {
    const versions = tariffPlans[provider];
    if (!versions || !versions.length) {
        return null;
    }

    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    const targetDate = new Date(targetYear, targetMonth - 1, 1);

    const sorted = [...versions].sort((a, b) => new Date(a.effectiveFrom) - new Date(b.effectiveFrom));
    let selected = sorted[0];

    for (const version of sorted) {
        if (new Date(version.effectiveFrom) <= targetDate) {
            selected = version;
        }
    }

    return selected;
};

const getTariffPlan = async ({ provider, month, year }) => {
    const localTariffVersion = pickVersionedLocalTariff({ provider, month, year });
    if (!localTariffVersion) {
        throw new Error('Unsupported provider');
    }
    const localPlan = localTariffVersion.plan;
    const localEffectiveFrom = localTariffVersion.effectiveFrom;

    // Check if AI-driven tariff estimation is enabled.
    if (shouldUseAiTariff()) {
        try {
            const aiPlan = await geminiService.getAITariffPlan({ provider, month, year });

            // Normalize slabs: convert null 'to' (from AI) into Infinity for the engine.
            const normalizedSlabs = aiPlan.slabs.map((slab) => ({
                ...slab,
                to: slab.to === null ? Infinity : Number(slab.to),
                from: Number(slab.from),
                ratePerUnit: Number(slab.ratePerUnit),
            }));

            return {
                plan: { ...aiPlan, slabs: normalizedSlabs },
                source: 'ai',
                effectiveFrom: aiPlan.effectiveFrom || null,
            };
        } catch (error) {
            console.error('AI tariff fetch failed, falling back to standard sources:', error.message);
        }
    }

    if (!shouldUseExternalTariff()) {
        return {
            plan: localPlan,
            source: 'local',
            effectiveFrom: localEffectiveFrom,
        };
    }

    try {
        const externalPlan = await tariffApiService.fetchTariffPlan({ provider, month, year });
        return {
            plan: externalPlan,
            source: 'external',
            effectiveFrom: externalPlan.effectiveFrom || null,
        };
    } catch (error) {
        return {
            plan: localPlan,
            source: 'local_fallback',
            effectiveFrom: localEffectiveFrom,
        };
    }
};

// Estimate electricity bill from tariff slabs and TOU rates.
const estimateCostByTariff = async ({ units, month, year, provider, peakUnits = 0, offPeakUnits = 0 }) => {
    const { plan, source, effectiveFrom } = await getTariffPlan({ provider, month, year });

    if (peakUnits + offPeakUnits > units) {
        throw new Error('Peak and off-peak units cannot exceed total units');
    }

    let remainingUnits = units;
    const breakdown = [];
    let energyCharge = 0;

    for (const slab of plan.slabs) {
        if (remainingUnits <= 0) {
            break;
        }

        const slabCapacity = slab.to === Infinity ? Infinity : slab.to - slab.from + 1;
        const slabUnits = slabCapacity === Infinity ? remainingUnits : Math.min(remainingUnits, slabCapacity);
        const slabCharge = slabUnits * slab.ratePerUnit;

        if (slabUnits > 0) {
            breakdown.push({
                type: 'slab',
                label: `${slab.from}-${slab.to === Infinity ? '+' : slab.to}`,
                units: roundAmount(slabUnits),
                ratePerUnit: slab.ratePerUnit,
                amount: roundAmount(slabCharge),
            });
        }

        energyCharge += slabCharge;
        remainingUnits -= slabUnits;
    }

    const peakCharge = peakUnits * plan.peakRate;
    const offPeakCharge = offPeakUnits * plan.offPeakRate;
    const fixedCharge = plan.fixedCharge;
    const subTotal = energyCharge + peakCharge + offPeakCharge + fixedCharge;
    const tax = subTotal * plan.taxRate;
    const estimatedBill = subTotal + tax;

    breakdown.push(
        {
            type: 'tou',
            label: peakUnits > 0 ? 'Peak' : 'N/A',
            units: roundAmount(peakUnits),
            ratePerUnit: plan.peakRate,
            amount: roundAmount(peakCharge),
        },
        {
            type: 'tou',
            label: offPeakUnits > 0 ? 'Off-Peak' : 'N/A',
            units: roundAmount(offPeakUnits),
            ratePerUnit: plan.offPeakRate,
            amount: roundAmount(offPeakCharge),
        },
        {
            type: 'fixed',
            label: 'fixedCharge',
            amount: roundAmount(fixedCharge),
        },
        {
            type: 'tax',
            label: 'tax',
            rate: plan.taxRate,
            amount: roundAmount(tax),
        }
    );

    return {
        month,
        year,
        provider,
        source,
        tariffVersion: {
            effectiveFrom,
            confidence: source === 'external' ? 'high' : source === 'local' ? 'medium' : 'low',
        },
        units: roundAmount(units),
        estimatedBill: roundAmount(estimatedBill),
        summary: {
            energyCharge: roundAmount(energyCharge),
            peakCharge: roundAmount(peakCharge),
            offPeakCharge: roundAmount(offPeakCharge),
            fixedCharge: roundAmount(fixedCharge),
            tax: roundAmount(tax),
            subTotal: roundAmount(subTotal),
        },
        breakdown,
    };
};

// Create a new utility cost entry with duplicate-period-type protection.
const createCost = async (userId, costData) => {
    return await runInTransaction(async (session) => {
        const { month, year, utilityType = 'electricity' } = costData;

        if (isBeyondAllowedBillingWindow({ month, year })) {
            throw new Error('Billing month cannot be more than 1 month in the future');
        }

        const existing = await UtilityCost.findOne({ user: userId, month, year, utilityType }).session(session);
        if (existing) {
            throw new Error(`Cost for ${utilityType} in this month already exists`);
        }

        const cost = new UtilityCost({
            user: userId,
            month,
            year,
            utilityType,
            amount: costData.amount,
            notes: costData.notes,
            document: costData.document,
        });

        await cost.save({ session });
        return cost;
    });
};

// Retrieve all utility costs for a user.
const getCosts = async (userId) => {
    return await UtilityCost.find({ user: userId }).sort({ year: -1, month: -1 });
};

// Retrieve a single utility cost by id.
const getCostById = async (userId, costId) => {
    const cost = await UtilityCost.findOne({ _id: costId, user: userId });
    if (!cost) {
        throw new Error('Cost not found');
    }
    return cost;
};

// Update a cost entry while preventing month-year-type duplicates.
const updateCost = async (userId, costId, updateData) => {
    return await runInTransaction(async (session) => {
        const cost = await UtilityCost.findOne({ _id: costId, user: userId }).session(session);

        if (!cost) {
            throw new Error('Cost not found');
        }

        const newMonth = updateData.month ?? cost.month;
        const newYear = updateData.year ?? cost.year;
        const newType = updateData.utilityType ?? cost.utilityType;

        if (isBeyondAllowedBillingWindow({ month: newMonth, year: newYear })) {
            throw new Error('Billing month cannot be more than 1 month in the future');
        }

        if (newMonth !== cost.month || newYear !== cost.year || newType !== cost.utilityType) {
            const existing = await UtilityCost.findOne({
                user: userId,
                month: newMonth,
                year: newYear,
                utilityType: newType,
                _id: { $ne: costId },
            }).session(session);

            if (existing) {
                throw new Error(`Cost for ${newType} in this month already exists`);
            }
        }

        const replacedDocumentPath = updateData.document ? cost.document?.path || null : null;

        if (updateData.month !== undefined) cost.month = updateData.month;
        if (updateData.year !== undefined) cost.year = updateData.year;
        if (updateData.utilityType !== undefined) cost.utilityType = updateData.utilityType;
        if (updateData.amount !== undefined) cost.amount = updateData.amount;
        if (updateData.notes !== undefined) cost.notes = updateData.notes;
        if (updateData.document !== undefined) cost.document = updateData.document;

        const updated = await cost.save({ session });
        return {
            updatedCost: updated,
            replacedDocumentPath,
        };
    });
};

// Delete one utility cost entry by id.
const deleteCost = async (userId, costId) => {
    return await runInTransaction(async (session) => {
        const cost = await UtilityCost.findOne({ _id: costId, user: userId }).session(session);

        if (!cost) {
            throw new Error('Cost not found');
        }

        const documentPath = cost.document?.path || null;

        await cost.deleteOne({ session });
        return {
            message: 'Cost removed',
            documentPath,
        };
    });
};

/**
 * Aggregates user spending and goals to generate AI-driven insights
 */
const getAIInsights = async (userId) => {
    const costs = await UtilityCost.find({ user: userId }).sort({ year: -1, month: -1 }).limit(24);
    const goals = await CostGoal.find({ user: userId });

    if (costs.length === 0) {
        return {
            summary: "I don't have enough spending data to provide personalized insights yet. Start by logging your first utility bill!",
            recommendations: [
                "Log at least 3 months of bills for accurate trend analysis.",
                "Set monthly budget goals to track against your actual spending.",
                "Categorize your bills correctly (Electricity, Water, etc.) for better breakdown."
            ],
            status: "on-track",
            highlight_category: "General"
        };
    }

    try {
        return await geminiService.generateCostInsights({ costs, goals });
    } catch (error) {
        console.error('Falling back to local spending adviser:', error.message);
        return createLocalCostInsights({ costs, goals });
    }
};

module.exports = {
    createCost,
    getCosts,
    getCostById,
    updateCost,
    deleteCost,
    estimateCostByTariff,
    getAIInsights,
};
