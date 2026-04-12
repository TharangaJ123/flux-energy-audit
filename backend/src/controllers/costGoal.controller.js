/**
 * @file costGoal.controller.js
 * @description Controller for managing per-user electricity cost goals.
 * Supports monthly and yearly budget targets across all supported utility types.
 * Validates incoming requests and delegates persistence to the cost goal service.
 */
const costGoalService = require('../services/costGoal.service');
const { createGoal, updateGoal } = require('../validations/costGoal.validation');

/**
 * @description Create a new cost goal for the authenticated user.
 * Returns 400 for duplicate periods, invalid goal types, or business rule violations.
 * @async
 * @param {Object} req - Express request with `req.user._id` and validated body.
 * @param {Object} res - Express response object.
 */
const create = async (req, res) => {
    try {
        const { error } = createGoal.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const goal = await costGoalService.createGoal(req.user._id, req.body);
        res.status(201).json(goal);
    } catch (error) {
        if (error.message === 'Goal for this period already exists') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Month is not allowed for yearly goals') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Month is required for monthly goals') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

/**
 * @description List all cost goals belonging to the authenticated user.
 * @async
 * @param {Object} req - Express request with `req.user._id`.
 * @param {Object} res - Express response object.
 */
const list = async (req, res) => {
    try {
        const goals = await costGoalService.getGoals(req.user._id);
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @description Get a single cost goal by its ID, scoped to the authenticated user.
 * @async
 * @param {Object} req - Express request with `req.params.id` and `req.user._id`.
 * @param {Object} res - Express response object.
 */
const getById = async (req, res) => {
    try {
        const goal = await costGoalService.getGoalById(req.user._id, req.params.id);
        res.status(200).json(goal);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

/**
 * @description Update an existing cost goal.
 * Returns 400 when a conflicting goal already exists for the target period.
 * @async
 * @param {Object} req - Express request with `req.params.id`, `req.user._id`, and body.
 * @param {Object} res - Express response object.
 */
const update = async (req, res) => {
    try {
        const { error } = updateGoal.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const goal = await costGoalService.updateGoal(req.user._id, req.params.id, req.body);
        res.status(200).json(goal);
    } catch (error) {
        if (error.message === 'Goal for this period already exists') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Goal not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

/**
 * @description Delete a cost goal owned by the authenticated user.
 * @async
 * @param {Object} req - Express request with `req.params.id` and `req.user._id`.
 * @param {Object} res - Express response object.
 */
const remove = async (req, res) => {
    try {
        const result = await costGoalService.deleteGoal(req.user._id, req.params.id);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Goal not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    create,
    list,
    getById,
    update,
    remove,
};
