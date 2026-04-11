const mongoose = require('mongoose');

// Utility cost data model.

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
        utilityType: {
            type: String,
            required: true,
            enum: ['electricity', 'gas', 'water', 'trash'],
            default: 'electricity',
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        notes: {
            type: String,
            trim: true,
        },
        document: {
            originalName: {
                type: String,
                trim: true,
            },
            mimeType: {
                type: String,
                trim: true,
            },
            size: {
                type: Number,
                min: 0,
            },
            path: {
                type: String,
                trim: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

costSchema.index({ user: 1, month: 1, year: 1, utilityType: 1 }, { unique: true });

module.exports = mongoose.model('UtilityCost', costSchema);
