// Unit tests for the user controller's validation and error mapping behavior.
jest.mock('../src/services/userManagement.service', () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteUserProfile: jest.fn(),
}));

const userController = require('../src/controllers/userManagement.controller');
const userService = require('../src/services/userManagement.service');

const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('userManagement.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('register returns 201 for a valid payload', async () => {
        const req = {
            body: { name: 'Alice', email: 'alice@example.com', password: 'secret123' },
        };
        const res = createRes();

        userService.registerUser.mockResolvedValue({ id: 'u1', email: 'alice@example.com' });

        await userController.register(req, res);

        expect(userService.registerUser).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: 'u1', email: 'alice@example.com' });
    });

    test('login returns 401 when credentials are invalid', async () => {
        const req = {
            body: { email: 'alice@example.com', password: 'wrongpass' },
        };
        const res = createRes();

        userService.loginUser.mockRejectedValue(new Error('Invalid email or password'));

        await userController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    test('updateProfile returns 400 for invalid body', async () => {
        const req = {
            user: { _id: 'user-1' },
            body: { email: 'bad-email' },
        };
        const res = createRes();

        await userController.updateProfile(req, res);

        expect(userService.updateUserProfile).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
