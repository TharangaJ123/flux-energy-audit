const Appliance = require('./appliancemanagement.model');
const { runInTransaction } = require('../../util/transaction');
const weatherService = require('../../services/weatherService');

// Save a new appliance to the database within a transaction
const addAppliance = async (applianceData, userId) => {
    return await runInTransaction(async (session) => {
        const appliance = new Appliance({
            ...applianceData,
            user: userId,
        });
        return await appliance.save({ session });
    });
};

// Retrieve all appliances belonging to a specific user
const getAppliancesByUser = async (userId) => {
    return await Appliance.find({ user: userId }).sort({ createdAt: -1 });
};

// Find a single appliance by ID and UserID (for ownership check)
const getApplianceById = async (applianceId, userId) => {
    return await Appliance.findOne({ _id: applianceId, user: userId });
};

// Update appliance details within a transaction
const updateAppliance = async (applianceId, userId, updateData) => {
    return await runInTransaction(async (session) => {
        return await Appliance.findOneAndUpdate(
            { _id: applianceId, user: userId },
            { $set: updateData },
            { new: true, runValidators: true, session }
        );
    });
};

// Permanently remove an appliance record
const deleteAppliance = async (applianceId, userId) => {
    return await runInTransaction(async (session) => {
        return await Appliance.findOneAndDelete(
            { _id: applianceId, user: userId },
            { session }
        );
    });
};

// Calculate total consumption and merge with external weather insights
const getTotalEnergyConsumption = async (userId, city) => {
    const appliances = await Appliance.find({ user: userId });

    const dailyTotal = appliances.reduce((sum, app) => sum + app.dailyEnergyConsumption, 0);
    const monthlyTotal = appliances.reduce((sum, app) => sum + app.monthlyEnergyConsumption, 0);

    // Fetch dynamic insights from weather service
    const weatherData = await weatherService.getCurrentWeather(city);

    return {
        dailyTotalKWh: dailyTotal,
        monthlyTotalKWh: monthlyTotal,
        applianceCount: appliances.length,
        weatherInsights: weatherData,
        appliances: appliances.map(app => ({
            id: app._id,
            name: app.name,
            dailyKWh: app.dailyEnergyConsumption,
            percentage: dailyTotal > 0 ? (app.dailyEnergyConsumption / dailyTotal) * 100 : 0
        }))
    };
};

// Generate high-level stats (Total power, highest consumer, category counts)
const getApplianceStats = async (userId) => {
    const appliances = await Appliance.find({ user: userId });

    if (appliances.length === 0) {
        return {
            totalAppliances: 0,
            totalPowerWatts: 0,
            highestConsumer: null,
            categoryBreakdown: {}
        };
    }

    const totalPower = appliances.reduce((sum, app) => sum + app.powerConsumption, 0);

    // Sort to find the most expensive device to run
    const sortedByConsumption = [...appliances].sort((a, b) =>
        b.monthlyEnergyConsumption - a.monthlyEnergyConsumption
    );

    const highestConsumer = {
        name: sortedByConsumption[0].name,
        monthlyKWh: sortedByConsumption[0].monthlyEnergyConsumption,
        category: sortedByConsumption[0].category
    };

    // Calculate how many devices are in each category
    const categoryBreakdown = appliances.reduce((acc, app) => {
        const cat = app.category || 'General';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    return {
        totalAppliances: appliances.length,
        totalPowerWatts: totalPower,
        highestConsumer,
        categoryBreakdown
    };
};

module.exports = {
    addAppliance,
    getAppliancesByUser,
    getApplianceById,
    updateAppliance,
    deleteAppliance,
    getTotalEnergyConsumption,
    getApplianceStats
};



