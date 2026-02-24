const mongoose = require('mongoose');

// Define the schema for appliances
const applianceSchema = new mongoose.Schema(
    {
        // Reference to the user who owns this appliance
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Name of the device
        name: {
            type: String,
            required: true,
            trim: true,
        },
        // Power consumption in Watts
        powerConsumption: {
            type: Number,
            required: true,
        },
        // Average daily usage in hours
        usageHours: {
            type: Number,
            required: true,
        },
        // Device category (e.g., Kitchen, Cooling)
        category: {
            type: String,
            trim: true,
            default: 'General',
        },
    },
    {
        // Automatically add createdAt and updatedAt fields
        timestamps: true,
        // Include virtuals when converting document to JSON/Object
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Calculate daily energy consumption in kWh
applianceSchema.virtual('dailyEnergyConsumption').get(function () {
    return (this.powerConsumption * this.usageHours) / 1000;
});

// Calculate monthly energy consumption in kWh (30 days)
applianceSchema.virtual('monthlyEnergyConsumption').get(function () {
    return (this.powerConsumption * this.usageHours * 30) / 1000;
});

// Export the model
module.exports = mongoose.model('Appliance', applianceSchema);

