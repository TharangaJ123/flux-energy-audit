const Appliance = require('./appliancemanagement.model');
const { runInTransaction } = require('../../util/transaction');

/**
 * Add a new appliance
 */
const addAppliance = async (applianceData, userId) => {
    return await runInTransaction(async (session) => {
        const appliance = new Appliance({
            ...applianceData,
            user: userId,
        });
        return await appliance.save({ session });
    });
};

/**
 * Get all appliances for a user
 */
const getAppliancesByUser = async (userId) => {
    return await Appliance.find({ user: userId }).sort({ createdAt: -1 });
};

/**
 * Get a single appliance by ID
 */
const getApplianceById = async (applianceId, userId) => {
    return await Appliance.findOne({ _id: applianceId, user: userId });
};

/**
 * Update an appliance
 */
const updateAppliance = async (applianceId, userId, updateData) => {
    return await runInTransaction(async (session) => {
        return await Appliance.findOneAndUpdate(
            { _id: applianceId, user: userId },
            { $set: updateData },
            { new: true, runValidators: true, session }
        );
    });
};

/**
 * Delete an appliance
 */
const deleteAppliance = async (applianceId, userId) => {
    return await runInTransaction(async (session) => {
        return await Appliance.findOneAndDelete(
            { _id: applianceId, user: userId },
            { session }
        );
    });
};

/**
 * Get total energy consumption for a user
 */
const getTotalEnergyConsumption = async (userId) => {
    const appliances = await Appliance.find({ user: userId });

    const dailyTotal = appliances.reduce((sum, app) => sum + app.dailyEnergyConsumption, 0);
    const monthlyTotal = appliances.reduce((sum, app) => sum + app.monthlyEnergyConsumption, 0);

    return {
        dailyTotalKWh: dailyTotal,
        monthlyTotalKWh: monthlyTotal,
        applianceCount: appliances.length,
        appliances: appliances.map(app => ({
            id: app._id,
            name: app.name,
            dailyKWh: app.dailyEnergyConsumption,
            percentage: dailyTotal > 0 ? (app.dailyEnergyConsumption / dailyTotal) * 100 : 0
        }))
    };
};

module.exports = {
    addAppliance,
    getAppliancesByUser,
    getApplianceById,
    updateAppliance,
    deleteAppliance,
    getTotalEnergyConsumption
};

