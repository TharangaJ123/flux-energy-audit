const mongoose = require('mongoose');

/**
 * Executes a function within a Mongoose transaction.
 * @param {function(ClientSession): Promise<any>} callback - The function to execute within the transaction. 
 *                                                           It receives the session as an argument.
 * @returns {Promise<any>} The result of the callback function.
 */
const runInTransaction = async (callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = { runInTransaction };
