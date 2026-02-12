const mongoose = require('mongoose');

const applianceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    power: { type: Number, required: true }, // in Watts
    hours: { type: Number, required: true }, // Daily usage
});

const energyAuditSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    month: {
        type: String, // Format: "YYYY-MM"
        required: true,
    },
    totalUnits: {
        type: Number,
        required: true,
    },
    peakUsage: {
        type: String,
        enum: ['Day', 'Night'],
        required: true,
    },
    appliances: [applianceSchema],
    aiSummary: {
        type: String,
    },
    aiRecommendations: [String],
    efficiencyScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    badges: [String],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamp: true
});

module.exports = mongoose.model('EnergyAudit', energyAuditSchema);
