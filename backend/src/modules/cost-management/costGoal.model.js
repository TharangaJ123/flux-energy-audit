const mongoose = require('mongoose');

// Cost goal data model.

const costGoalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['monthly', 'yearly'],
        },
        year: {
            type: Number,
            required: true,
            min: 1900,
        },
        month: {
            type: Number,
            min: 1,
            max: 12,
        },
        goalAmount: {
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

costGoalSchema.index({ user: 1, type: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('CostGoal', costGoalSchema);
