const attachMockUser = (req, _res, next) => {
    req.user = { _id: 'user-1', id: 'user-1', name: 'Test User', email: 'test@example.com' };
    next();
};

module.exports = { attachMockUser };
