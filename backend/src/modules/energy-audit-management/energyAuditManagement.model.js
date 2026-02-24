const mongoose = require('mongoose');

const energyAuditSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    month: {
        type: String,
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
    appliances: [{
        applianceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appliance',
            required: true
        },
        usageHours: { type: Number, required: true }
    }],
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
}, {
    timestamps: true
});

module.exports = mongoose.model('EnergyAudit', energyAuditSchema);
