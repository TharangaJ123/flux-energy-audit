const userService = require('./userManagement.service');
const { registerUser, loginUser, updateUser } = require('./userManagement.validation');

const register = async (req, res) => {
    try {
        const { error } = registerUser.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const user = await userService.registerUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'User already exists') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { error } = loginUser.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password } = req.body;
        const user = await userService.loginUser(email, password);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === 'Invalid email or password') {
            return res.status(401).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await userService.getUserProfile(req.user);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { error } = updateUser.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const user = await userService.updateUserProfile(req.user, req.body);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const result = await userService.deleteUserProfile(req.user._id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    deleteProfile
};
