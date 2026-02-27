const axios = require('axios');

const CLIMATIQ_API_URL = 'https://api.climatiq.io/estimate/v1/batch';
const API_KEY = process.env.CLIMATIQ_API_KEY;

// Mapping of internal types to Climatiq activity IDs and parameters
const ACTIVITY_MAPPING = {
    electricity: {
        activity_id: 'electricity-supply_grid-source_residual_mix',
        type: 'energy',
        unit: 'kWh',
    },
    naturalGas: {
        activity_id: 'natural_gas-fuel_use_stationary',
        type: 'volume',
        unit: 'm3',
    },
    lpg: {
        activity_id: 'lpg-fuel_use_stationary',
        type: 'volume',
        unit: 'l',
    },
    petrolCar: {
        activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na',
        type: 'distance',
        unit: 'km',
    },
    dieselCar: {
        activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_diesel-engine_size_na-vehicle_age_na-vehicle_weight_na',
        type: 'distance',
        unit: 'km',
    },
    bus: {
        activity_id: 'passenger_vehicle-vehicle_type_bus-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
        type: 'distance',
        unit: 'km',
    },
    airplane: {
        activity_id: 'passenger_flight-route_type_na-aircraft_type_na-distance_na-class_na-rf_included',
        type: 'distance',
        unit: 'km',
    },
    waste: {
        activity_id: 'waste_disposal-type_municipal_solid_waste-method_landfill',
        type: 'weight',
        unit: 'kg',
    },
};

//  Calculate CO2 emissions using Climatiq Batch API

const calculateCO2WithClimatiq = async (data) => {
    try {
        if (!API_KEY || API_KEY === 'your_climatiq_api_key_here') {
            console.warn('Climatiq API Key not configured. Falling back to local calculation or default.');
            return null; // Let the caller decide how to fallback
        }

        const requests = [];

        // Electricity
        if (data.electricity) {
            requests.push({
                activity_id: ACTIVITY_MAPPING.electricity.activity_id,
                parameters: {
                    [ACTIVITY_MAPPING.electricity.type]: parseFloat(data.electricity),
                    [ACTIVITY_MAPPING.electricity.type + '_unit']: ACTIVITY_MAPPING.electricity.unit,
                },
            });
        }

        // Gas
        const gasSelections = data.gasSelections || [];
        const gasAmounts = data.gasAmounts || {};
        gasSelections.forEach((type) => {
            const amount = parseFloat(gasAmounts[type]);
            const mappingKey = type === 'natural' ? 'naturalGas' : type === 'lpg' ? 'lpg' : null;
            if (mappingKey && amount) {
                requests.push({
                    activity_id: ACTIVITY_MAPPING[mappingKey].activity_id,
                    parameters: {
                        [ACTIVITY_MAPPING[mappingKey].type]: amount,
                        [ACTIVITY_MAPPING[mappingKey].type + '_unit']: ACTIVITY_MAPPING[mappingKey].unit,
                    },
                });
            }
        });

        // Transport
        const transportSelections = data.transportSelections || [];
        const transportDistances = data.transportDistances || {};
        transportSelections.forEach((type) => {
            const distance = parseFloat(transportDistances[type]);
            const mappingKey = ACTIVITY_MAPPING[type + 'Car'] ? type + 'Car' : ACTIVITY_MAPPING[type] ? type : null;
            if (mappingKey && distance) {
                requests.push({
                    activity_id: ACTIVITY_MAPPING[mappingKey].activity_id,
                    parameters: {
                        [ACTIVITY_MAPPING[mappingKey].type]: distance,
                        [ACTIVITY_MAPPING[mappingKey].type + '_unit']: ACTIVITY_MAPPING[mappingKey].unit,
                    },
                });
            }
        });

        // Waste
        if (data.waste) {
            requests.push({
                activity_id: ACTIVITY_MAPPING.waste.activity_id,
                parameters: {
                    [ACTIVITY_MAPPING.waste.type]: parseFloat(data.waste),
                    [ACTIVITY_MAPPING.waste.type + '_unit']: ACTIVITY_MAPPING.waste.unit,
                },
            });
        }

        if (requests.length === 0) {
            return { co2: 0, status: 'Low' };
        }

        const response = await axios.post(CLIMATIQ_API_URL, requests, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        let totalCO2 = 0;
        response.data.results.forEach((result) => {
            totalCO2 += result.co2e;
        });

        let status = 'Low';
        if (totalCO2 > 150) status = 'High';
        else if (totalCO2 > 80) status = 'Moderate';

        return { co2: totalCO2, status };
    } catch (error) {
        console.error('Climatiq API Error:', error.response?.data || error.message);
        throw new Error('Failed to calculate CO2 emissions via 3rd party API');
    }
};

module.exports = {
    calculateCO2WithClimatiq,
};
