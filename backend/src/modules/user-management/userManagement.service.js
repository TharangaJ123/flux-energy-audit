const User = require('./userManagement.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { runInTransaction } = require('../../util/transaction');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
};

const registerUser = async (userData) => {
    return await runInTransaction(async (session) => {
        const { name, email, password } = userData;

        const userExists = await User.findOne({ email }).session(session);

        if (userExists) {
            throw new Error('User already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        await user.save({ session });

        if (user) {
            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            };
        } else {
            throw new Error('Invalid user data');
        }
    });
};

const loginUser = async (email, password) => {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        };
    } else {
        throw new Error('Invalid email or password');
    }
};

const getUserProfile = async (user) => {
    if (user) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    } else {
        throw new Error('User not found');
    }
};

const updateUserProfile = async (user, updateData) => {
    return await runInTransaction(async (session) => {
        const foundUser = await User.findById(user._id).session(session);

        if (foundUser) {
            foundUser.name = updateData.name || foundUser.name;
            foundUser.email = updateData.email || foundUser.email;

            if (updateData.password) {
                const salt = await bcrypt.genSalt(10);
                foundUser.password = await bcrypt.hash(updateData.password, salt);
            }

            const updatedUser = await foundUser.save({ session });

            return {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                token: generateToken(updatedUser._id),
            };
        } else {
            throw new Error('User not found');
        }
    });
};

const deleteUserProfile = async (userId) => {
    return await runInTransaction(async (session) => {
        const user = await User.findById(userId).session(session);

        if (user) {
            await user.deleteOne({ session });
            return { message: 'User removed' };
        } else {
            throw new Error('User not found');
        }
    });
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
};
