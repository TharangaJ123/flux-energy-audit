const mongoose = require('mongoose');

/**
 * Mongoose schema for Carbon Footprint records.
 * Stores monthly data on electricity, gas, transport, and waste to calculate CO2 emissions.
 */
const carbonFootprintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    month: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    // New detailed fields from frontend
    electricity: {
        type: Number,
        default: 0,
    },
    gasData: {
        selections: [String],
        amounts: Map,
    },
    transportData: {
        selections: [String],
        distances: Map,
    },
    waste: {
        type: Number,
        default: 0,
    },
    // Results
    co2Emission: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Low', 'Moderate', 'High'],
        default: 'Low',
    },
}, {
    timestamps: true,
});

const CarbonFootprint = mongoose.model('CarbonFootprint', carbonFootprintSchema);

module.exports = CarbonFootprint;
