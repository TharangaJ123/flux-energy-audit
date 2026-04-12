/**
 * @file costManagement.model.js
 * @description Mongoose schema for monthly utility cost records.
 * A compound unique index on (user, month, year, utilityType) prevents
 * duplicate entries for the same billing period.
 */
const mongoose = require('mongoose');

// Utility cost data model.

const costSchema = new mongoose.Schema(
    {
        /** Reference to the owning user document. */
    user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        /** Calendar month (1–12). */
    month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        /** Calendar year (e.g., 2024). */
    year: {
            type: Number,
            required: true,
            min: 1900,
        },
        /** Type of utility bill being tracked. Defaults to `'electricity'`. */
    utilityType: {
            type: String,
            required: true,
            enum: ['electricity', 'gas', 'water', 'trash'],
            default: 'electricity',
        },
        /** Bill amount in LKR (Sri Lankan Rupees). Must be non-negative. */
    amount: {
            type: Number,
            required: true,
            min: 0,
        },
        /** Optional user note for the billing period. */
    notes: {
            type: String,
            trim: true,
        },
        /** Metadata for an optionally attached bill document (PDF, image, etc.). */
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

/**
 * Compound unique index to prevent duplicate bill entries for the same
 * user + utility + billing period combination.
 */
costSchema.index({ user: 1, month: 1, year: 1, utilityType: 1 }, { unique: true });

module.exports = mongoose.model('UtilityCost', costSchema);
