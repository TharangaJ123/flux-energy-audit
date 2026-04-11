const CostGoal = require('../models/costGoal.model');
const { runInTransaction } = require('../util/transaction');

// Cost goal business logic.

// Create a new cost goal with duplicate-period-type protection.
const createGoal = async (userId, goalData) => {
    return await runInTransaction(async (session) => {
        const { type, year, month, utilityType = 'electricity' } = goalData;

        const existing = await CostGoal.findOne({ user: userId, type, year, month, utilityType }).session(session);
        if (existing) {
            throw new Error(`Goal for ${utilityType} in this period already exists`);
        }

        const goal = new CostGoal({
            user: userId,
            type,
            utilityType,
            year,
            month,
            goalAmount: goalData.goalAmount,
            notes: goalData.notes,
        });

        await goal.save({ session });
        return goal;
    });
};

// Retrieve all cost goals for a user.
const getGoals = async (userId) => {
    return await CostGoal.find({ user: userId }).sort({ year: -1, month: -1, utilityType: 1, type: 1 });
};

// Retrieve a single cost goal by id.
const getGoalById = async (userId, goalId) => {
    const goal = await CostGoal.findOne({ _id: goalId, user: userId });
    if (!goal) {
        throw new Error('Goal not found');
    }
    return goal;
};

// Update a cost goal while enforcing monthly/yearly goal rules and type uniqueness.
const updateGoal = async (userId, goalId, updateData) => {
    return await runInTransaction(async (session) => {
        const goal = await CostGoal.findOne({ _id: goalId, user: userId }).session(session);

        if (!goal) {
            throw new Error('Goal not found');
        }

        if (updateData.type === 'yearly' && updateData.month !== undefined) {
            throw new Error('Month is not allowed for yearly goals');
        }

        if (updateData.type === 'monthly' && updateData.month === undefined) {
            throw new Error('Month is required for monthly goals');
        }

        if (goal.type === 'yearly' && updateData.type === undefined && updateData.month !== undefined) {
            throw new Error('Month is not allowed for yearly goals');
        }

        const newType = updateData.type ?? goal.type;
        const newYear = updateData.year ?? goal.year;
        const newMonth = updateData.month ?? goal.month;
        const newUtilityType = updateData.utilityType ?? goal.utilityType;

        if (newType === 'monthly' && newMonth === undefined) {
            throw new Error('Month is required for monthly goals');
        }

        if (newType === 'yearly' && newMonth !== undefined) {
            throw new Error('Month is not allowed for yearly goals');
        }

        if (newType !== goal.type || newYear !== goal.year || newMonth !== goal.month || newUtilityType !== goal.utilityType) {
            const existing = await CostGoal.findOne({
                user: userId,
                type: newType,
                year: newYear,
                month: newMonth,
                utilityType: newUtilityType,
                _id: { $ne: goalId },
            }).session(session);

            if (existing) {
                throw new Error(`Goal for ${newUtilityType} in this period already exists`);
            }
        }

        if (updateData.type !== undefined) goal.type = updateData.type;
        if (updateData.utilityType !== undefined) goal.utilityType = updateData.utilityType;
        if (updateData.year !== undefined) goal.year = updateData.year;
        if (updateData.month !== undefined) goal.month = updateData.month;
        if (updateData.goalAmount !== undefined) goal.goalAmount = updateData.goalAmount;
        if (updateData.notes !== undefined) goal.notes = updateData.notes;

        const updated = await goal.save({ session });
        return updated;
    });
};

// Delete one cost goal by id.
const deleteGoal = async (userId, goalId) => {
    return await runInTransaction(async (session) => {
        const goal = await CostGoal.findOne({ _id: goalId, user: userId }).session(session);

        if (!goal) {
            throw new Error('Goal not found');
        }

        await goal.deleteOne({ session });
        return { message: 'Goal removed' };
    });
};

module.exports = {
    createGoal,
    getGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
};
