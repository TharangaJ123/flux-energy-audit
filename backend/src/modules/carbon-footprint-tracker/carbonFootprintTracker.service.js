const CarbonFootprint = require('./carbonFootprintTracker.model');
const { runInTransaction } = require('../../util/transaction');
const { calculateCO2WithClimatiq } = require('./carbonApi.service');


// Updated emission factors based on frontend implementation
const EMISSION_FACTORS = {
    electricity: 0.85,    // kg CO2 per kWh
    naturalGas: 2.03,     // kg CO2 per cubic meter
    lpg: 1.51,            // kg CO2 per liter
    petrolCar: 0.192,     // kg CO2 per km
    dieselCar: 0.171,     // kg CO2 per km
    bus: 0.105,           // kg CO2 per km
    airplane: 0.254,      // kg CO2 per km
    waste: 0.21           // kg CO2 per kg of waste
};


//  Calculate CO2 emissions - Support legacy calculation and Climatiq API
const calculateCO2 = async (data) => {

    try {
        // Use Climatiq 3rd Party API
        const result = await calculateCO2WithClimatiq(data);
        if (result) return result;
    } catch (error) {
        console.warn('Climatiq API failed, falling back to local calculation');
    }

    // New fallback implementation (original logic)
    let total = 0;

    // Electricity
    total += (parseFloat(data.electricity) || 0) * EMISSION_FACTORS.electricity;

    // Gas
    const gasSelections = data.gasSelections || [];
    const gasAmounts = data.gasAmounts || {};
    gasSelections.forEach((type) => {
        const amount = parseFloat(gasAmounts[type]) || 0;
        if (type === 'natural') total += amount * EMISSION_FACTORS.naturalGas;
        else if (type === 'lpg') total += amount * EMISSION_FACTORS.lpg;
    });

    // Transport
    const transportSelections = data.transportSelections || [];
    const transportDistances = data.transportDistances || {};
    transportSelections.forEach((type) => {
        const distance = parseFloat(transportDistances[type]) || 0;
        if (EMISSION_FACTORS[type + 'Car']) {
            total += distance * EMISSION_FACTORS[type + 'Car'];
        } else if (EMISSION_FACTORS[type]) {
            total += distance * EMISSION_FACTORS[type];
        }
    });

    // Waste
    total += (parseFloat(data.waste) || 0) * EMISSION_FACTORS.waste;

    let status = 'Low';
    if (total > 150) status = 'High';
    else if (total > 80) status = 'Moderate';

    return { co2: total, status };
};


const createRecord = async (user, data) => {
    return await runInTransaction(async (session) => {
        const { co2, status } = await calculateCO2(data);


        const record = new CarbonFootprint({
            user: user._id,
            month: data.month,
            year: data.year,
            electricity: data.electricity || 0,
            gasData: {
                selections: data.gasSelections || [],
                amounts: data.gasAmounts || {},
            },
            transportData: {
                selections: data.transportSelections || [],
                distances: data.transportDistances || {},
            },
            waste: data.waste || 0,
            co2Emission: co2,
            status,
        });

        return await record.save({ session });
    });
};

const getRecords = async (user) => {
    return await CarbonFootprint.find({ user: user._id }).sort({ year: -1, month: -1 });
};

const getRecordById = async (id, user) => {
    const record = await CarbonFootprint.findOne({ _id: id, user: user._id });
    if (!record) {
        throw new Error('Record not found');
    }
    return record;
};

const updateRecord = async (id, user, data) => {
    return await runInTransaction(async (session) => {
        const record = await CarbonFootprint.findOne({ _id: id, user: user._id }).session(session);
        if (!record) {
            throw new Error('Record not found');
        }

        // Merge existing data with updates for recalculation
        const mergedData = {
            electricity: data.electricity !== undefined ? data.electricity : record.electricity,
            gasSelections: data.gasSelections || (record.gasData ? record.gasData.selections : []),
            gasAmounts: data.gasAmounts || (record.gasData ? Object.fromEntries(record.gasData.amounts) : {}),
            transportSelections: data.transportSelections || (record.transportData ? record.transportData.selections : []),
            transportDistances: data.transportDistances || (record.transportData ? Object.fromEntries(record.transportData.distances) : {}),
            waste: data.waste !== undefined ? data.waste : record.waste,
        };

        const { co2, status } = await calculateCO2(mergedData);


        record.month = data.month || record.month;
        record.year = data.year || record.year;
        record.electricity = mergedData.electricity;
        record.gasData = {
            selections: mergedData.gasSelections,
            amounts: mergedData.gasAmounts,
        };
        record.transportData = {
            selections: mergedData.transportSelections,
            distances: mergedData.transportDistances,
        };
        record.waste = mergedData.waste;
        record.co2Emission = co2;
        record.status = status;

        return await record.save({ session });
    });
};

const deleteRecord = async (id, user) => {
    return await runInTransaction(async (session) => {
        const record = await CarbonFootprint.findOne({ _id: id, user: user._id }).session(session);
        if (!record) {
            throw new Error('Record not found');
        }
        await record.deleteOne({ session });
        return { message: 'Record removed successfully' };
    });
};

module.exports = {
    createRecord,
    getRecords,
    getRecordById,
    updateRecord,
    deleteRecord,
};
