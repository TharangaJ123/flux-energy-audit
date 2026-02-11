const mongoose = require('mongoose');

const applianceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        powerConsumption: {
            type: Number,
            required: true, // in Watts
        },
        usageHours: {
            type: Number,
            required: true, // hours per day
        },
        category: {
            type: String,
            trim: true,
            default: 'General',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for daily energy consumption in kWh
applianceSchema.virtual('dailyEnergyConsumption').get(function () {
    return (this.powerConsumption * this.usageHours) / 1000;
});

// Virtual for monthly energy consumption in kWh (assuming 30 days)
applianceSchema.virtual('monthlyEnergyConsumption').get(function () {
    return (this.powerConsumption * this.usageHours * 30) / 1000;
});

module.exports = mongoose.model('Appliance', applianceSchema);
