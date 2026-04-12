/**
 * @file costGoal.model.js
 * @description Mongoose schema for user-defined electricity cost budget goals.
 * Supports both monthly and yearly targets across all utility types.
 * A compound unique index ensures one goal per user/type/period combination.
 */
const mongoose = require('mongoose');

// Cost goal data model.

const costGoalSchema = new mongoose.Schema(
    {
        /** Reference to the owning user document. */
    user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        /** Goal period type: `'monthly'` targets a specific month; `'yearly'` spans the full year. */
    type: {
            type: String,
            required: true,
            enum: ['monthly', 'yearly'],
        },
        /** The utility type this goal applies to. Defaults to `'electricity'`. */
    utilityType: {
            type: String,
            required: true,
            enum: ['electricity', 'gas', 'water', 'trash'],
            default: 'electricity',
        },
        /** The calendar year the goal applies to. */
    year: {
            type: Number,
            required: true,
            min: 1900,
        },
        /** Calendar month (1–12). Only required when `type === 'monthly'`. */
    month: {
            type: Number,
            min: 1,
            max: 12,
        },
        /** Target spending amount in LKR for the chosen period. */
    goalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        /** Optional note about the goal (e.g., rationale or motivation). */
    notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Compound unique index: one goal per user per utility type per period.
 * Prevents accidental duplicate goal creation for the same context.
 */
costGoalSchema.index({ user: 1, type: 1, year: 1, month: 1, utilityType: 1 }, { unique: true });

module.exports = mongoose.model('CostGoal', costGoalSchema);
