const ElectricityCost = require('./costManagement.model');
const { runInTransaction } = require('../../util/transaction');
const tariffApiService = require('../../services/tariffApiService');

// Electricity cost business logic.

const tariffPlans = {
    CEB: {
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
    LECO: {
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
};

const roundAmount = (value) => Number(value.toFixed(2));

const shouldUseExternalTariff = () => process.env.USE_TARIFF_API === 'true' || !!process.env.TARIFF_API_URL;

const getTariffPlan = async ({ provider, month, year }) => {
    const localPlan = tariffPlans[provider];
    if (!localPlan) {
        throw new Error('Unsupported provider');
    }

    if (!shouldUseExternalTariff()) {
        return { plan: localPlan, source: 'local' };
    }

    try {
        const externalPlan = await tariffApiService.fetchTariffPlan({ provider, month, year });
        return { plan: externalPlan, source: 'external' };
    } catch (error) {
        return { plan: localPlan, source: 'local_fallback' };
    }
};

// Estimate electricity bill from tariff slabs and TOU rates.
const estimateCostByTariff = async ({ units, month, year, provider, peakUnits = 0, offPeakUnits = 0 }) => {
    const { plan, source } = await getTariffPlan({ provider, month, year });

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
            label: 'peak',
            units: roundAmount(peakUnits),
            ratePerUnit: plan.peakRate,
            amount: roundAmount(peakCharge),
        },
        {
            type: 'tou',
            label: 'offPeak',
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

// Create a new electricity cost entry with duplicate-period protection.
const createCost = async (userId, costData) => {
    return await runInTransaction(async (session) => {
        const { month, year } = costData;

        const existing = await ElectricityCost.findOne({ user: userId, month, year }).session(session);
        if (existing) {
            throw new Error('Cost for this month already exists');
        }

        const cost = new ElectricityCost({
            user: userId,
            month,
            year,
            electricityCost: costData.electricityCost,
            notes: costData.notes,
        });

        await cost.save({ session });
        return cost;
    });
};

// Retrieve all electricity costs for a user.
const getCosts = async (userId) => {
    return await ElectricityCost.find({ user: userId }).sort({ year: -1, month: -1 });
};

// Retrieve a single electricity cost by id.
const getCostById = async (userId, costId) => {
    const cost = await ElectricityCost.findOne({ _id: costId, user: userId });
    if (!cost) {
        throw new Error('Cost not found');
    }
    return cost;
};

// Update a cost entry while preventing month-year duplicates.
const updateCost = async (userId, costId, updateData) => {
    return await runInTransaction(async (session) => {
        const cost = await ElectricityCost.findOne({ _id: costId, user: userId }).session(session);

        if (!cost) {
            throw new Error('Cost not found');
        }

        const newMonth = updateData.month ?? cost.month;
        const newYear = updateData.year ?? cost.year;

        if (newMonth !== cost.month || newYear !== cost.year) {
            const existing = await ElectricityCost.findOne({
                user: userId,
                month: newMonth,
                year: newYear,
                _id: { $ne: costId },
            }).session(session);

            if (existing) {
                throw new Error('Cost for this month already exists');
            }
        }

        if (updateData.month !== undefined) cost.month = updateData.month;
        if (updateData.year !== undefined) cost.year = updateData.year;
        if (updateData.electricityCost !== undefined) cost.electricityCost = updateData.electricityCost;
        if (updateData.notes !== undefined) cost.notes = updateData.notes;

        const updated = await cost.save({ session });
        return updated;
    });
};

// Delete one electricity cost entry by id.
const deleteCost = async (userId, costId) => {
    return await runInTransaction(async (session) => {
        const cost = await ElectricityCost.findOne({ _id: costId, user: userId }).session(session);

        if (!cost) {
            throw new Error('Cost not found');
        }

        await cost.deleteOne({ session });
        return { message: 'Cost removed' };
    });
};

module.exports = {
    createCost,
    getCosts,
    getCostById,
    updateCost,
    deleteCost,
    estimateCostByTariff,
};
