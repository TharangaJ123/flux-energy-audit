const mongoose = require('mongoose');

const costSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
            min: 1900,
        },
        electricityCost: {
            type: Number,
            required: true,
            min: 0,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

costSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('ElectricityCost', costSchema);
