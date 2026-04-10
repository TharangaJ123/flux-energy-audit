// Test helper that injects a predictable authenticated user into mocked protected routes.
const attachMockUser = (req, _res, next) => {
    req.user = { _id: 'user-1', id: 'user-1', name: 'Test User', email: 'test@example.com' };
    next();
};

module.exports = { attachMockUser };
