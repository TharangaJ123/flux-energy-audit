/**
 * @file solarEstimator.controller.js
 * @description Controller for solar potential estimation specific to the Sri Lankan context.
 * Performs static panel capacity calculations and, when GPS coordinates are supplied,
 * fetches real-time generation data from the NREL PVWatts v8 API.
 *
 * Key assumptions (Sri Lanka domestic market):
 * - Panel size: ~24.5 sq ft (≈ 550W, 2.2m × 1.1m footprint)
 * - Capacity factor: 1 kWp generates ~120 kWh/month on average
 * - Installation cost: ~240,000 LKR per kWp (standard on-grid system)
 * - Savings per unit: ~60 LKR (averaged across domestic tariff tiers)
 */

const axios = require('axios');

/**
 * @description Calculate the solar generation potential for a given rooftop.
 * Returns technical specifications, financial projections, and environmental metrics.
 * When `lat`/`lon` are provided the NREL PVWatts API is called for real irradiance
 * data; without them a conservative Sri Lankan average (120 kWh/kWp/month) is used.
 * @async
 * @param {Object} req - Express request with `body.rooftopArea` (sq ft), optional `body.lat`, `body.lon`.
 * @param {Object} res - Express response object.
 */
const calculateSolarPotential = async (req, res) => {
    try {
        const { rooftopArea, lat, lon } = req.body;

        if (!rooftopArea || rooftopArea <= 0) {
            return res.status(400).json({ message: 'Valid rooftop area is required' });
        }

        // 1. Panel Efficiency Calculations (Static based on area)
        const panelSizeSqFt = 24.5;
        const panelCapacityKW = 0.550;
        const numberOfPanels = Math.floor(rooftopArea / panelSizeSqFt);
        const systemCapacityKWp = parseFloat((numberOfPanels * panelCapacityKW).toFixed(2));

        let unitsPerMonth = Math.round(systemCapacityKWp * 120); // Default SL Base
        let unitsPerYear = unitsPerMonth * 12;
        let isRealTimeData = false;
        let monthlyBreakdown = null;
        let extraMetrics = null;

        // 2. NREL PVWatts API Integration (If Lat/Lon provided)
        if (lat && lon && systemCapacityKWp > 0) {
            try {
                const API_KEY = process.env.NREL_API_KEY || 'DEMO_KEY';
                const url = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${API_KEY}&lat=${lat}&lon=${lon}&system_capacity=${systemCapacityKWp}&azimuth=180&tilt=15&array_type=1&module_type=1&losses=14`;
                
                const nrelResponse = await axios.get(url);
                if (nrelResponse.data && nrelResponse.data.outputs) {
                    const acMonthly = nrelResponse.data.outputs.ac_monthly;
                    unitsPerYear = Math.round(nrelResponse.data.outputs.ac_annual);
                    unitsPerMonth = Math.round(unitsPerYear / 12);
                    monthlyBreakdown = acMonthly.map(val => Math.round(val));
                    isRealTimeData = true;

                    // Enhanced metrics extraction with monthly fallbacks
                    const outputs = nrelResponse.data.outputs;
                    
                    // Reverse Geocoding to get Location Name
                    let locationName = 'Identified Region';
                    try {
                        const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, {
                            headers: { 'User-Agent': 'FluxEnergyAudit/1.0' }
                        });
                        if (geoResponse.data && geoResponse.data.address) {
                            locationName = geoResponse.data.address.city || 
                                           geoResponse.data.address.town || 
                                           geoResponse.data.address.suburb || 
                                           geoResponse.data.address.village || 
                                           'Sri Lanka';
                        }
                    } catch (geoErr) {
                        console.error('Reverse Geocoding failed:', geoErr.message);
                    }

                    // Fallback for annual solar radiation (Average of monthly if annual is missing)
                    let avgSolrad = outputs.solrad_annual;
                    if (!avgSolrad && outputs.solrad_monthly) {
                        const sum = outputs.solrad_monthly.reduce((a, b) => a + b, 0);
                        avgSolrad = sum / 12;
                    }

                    extraMetrics = {
                        capacityFactor: outputs.capacity_factor ? outputs.capacity_factor.toFixed(1) : (unitsPerYear / (systemCapacityKWp * 8760) * 100).toFixed(1),
                        annualSolarRadiation: avgSolrad ? avgSolrad.toFixed(2) : '4.80',
                        monthlySolarRadiation: outputs.solrad_monthly ? outputs.solrad_monthly.map(v => v.toFixed(2)) : null,
                        locationName: locationName,
                        stationInfo: {
                            city: nrelResponse.data.station_info?.city || 'Sri Lanka Regional',
                            distance: nrelResponse.data.station_info?.distance ? (nrelResponse.data.station_info.distance / 1000).toFixed(1) : 'Local'
                        }
                    };
                }
            } catch (nrelErr) {
                console.error('NREL API Error, falling back to estimations:', nrelErr.message);
                // Fallback already set above
            }
        }

        // 3. Financial Calculations (In LKR)
        const totalCost = Math.round(systemCapacityKWp * 240000);
        const monthlySavings = Math.round(unitsPerMonth * 60);
        const yearlySavings = monthlySavings * 12;

        const paybackYearsTotal = totalCost / yearlySavings;
        const years = Math.floor(paybackYearsTotal);
        const months = Math.round((paybackYearsTotal - years) * 12);

        const result = {
            input: { rooftopArea, lat, lon },
            technical: {
                numberOfPanels,
                systemCapacityKWp,
                monthlyGenerationUnits: unitsPerMonth,
                yearlyGenerationUnits: unitsPerYear,
                monthlyBreakdown,
                isRealTimeData,
                extraMetrics
            },
            financial: {
                estimatedCostLKR: totalCost,
                monthlySavingsLKR: monthlySavings,
                yearlySavingsLKR: yearlySavings,
                paybackPeriod: { years, months }
            },
            environmental: {
                carbonOffsetTonnesPerYearUnrounded: (unitsPerYear * 0.0005).toFixed(2)
            }
        };

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in solar calculation:', error);
        res.status(500).json({ message: 'Internal server error during solar estimation' });
    }
};

module.exports = {
    calculateSolarPotential
};
