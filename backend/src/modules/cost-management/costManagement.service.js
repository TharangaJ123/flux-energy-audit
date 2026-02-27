const ElectricityCost = require('./costManagement.model');
const { runInTransaction } = require('../../util/transaction');

// Electricity cost business logic.

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
};
