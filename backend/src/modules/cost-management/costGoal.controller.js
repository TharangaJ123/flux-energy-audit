const costGoalService = require('./costGoal.service');
const { createGoal, updateGoal } = require('./costGoal.validation');

// Simple controller handlers for cost goals.

// Create a new cost goal for the authenticated user.
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

// List all cost goals for the authenticated user.
const list = async (req, res) => {
    try {
        const goals = await costGoalService.getGoals(req.user._id);
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get one cost goal by id.
const getById = async (req, res) => {
    try {
        const goal = await costGoalService.getGoalById(req.user._id, req.params.id);
        res.status(200).json(goal);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Update an existing cost goal.
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

// Delete a cost goal.
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
