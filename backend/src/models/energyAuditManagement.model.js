const mongoose = require('mongoose');

// Schema for storing energy audit results and AI-driven insights
const energyAuditSchema = new mongoose.Schema({
    // User who owns the audit
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The month of the audit in "YYYY-MM" format
    month: {
        type: String,
        required: true,
    },
    // Total electricity units consumed
    totalUnits: {
        type: Number,
        required: true,
    },
    // Primary time of electricity usage
    peakUsage: {
        type: String,
        enum: ['Day', 'Night'],
        required: true,
    },
    // List of appliances and their usage during this audit period
    appliances: [{
        applianceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appliance',
            required: true
        },
        usageHours: { type: Number, required: true }
    }],
    // AI-generated summary of consumption behavior
    aiSummary: {
        type: String,
    },
    // Actionable recommendations provided by AI
    aiRecommendations: [String],
    // Score based on efficiency (0-100)
    efficiencyScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    // Gamification badges awarded based on usage
    badges: [String],
}, {
    // Automatically manage createdAt and updatedAt fields
    timestamps: true
});

module.exports = mongoose.model('EnergyAudit', energyAuditSchema);
