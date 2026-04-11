// User management tests focused on form validation and successful login behavior.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserManagement from '../pages/UserManagement';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('../test-utils/reactRouterDomMock');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });

jest.mock('../services/api', () => ({
  userApi: {
    register: jest.fn(),
    login: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
  },
}));

const { userApi } = require('../services/api');

describe('UserManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.confirm = jest.fn(() => true);
  });

  test('shows a validation error when login fields are empty', async () => {
    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in now/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter both email and password')).toBeInTheDocument();
    });
  });

  test('submits login and navigates home on success', async () => {
    userApi.login.mockResolvedValue({
      data: {
        token: 'token-1',
        user: { name: 'Alice', email: 'alice@example.com' },
      },
    });

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('alex@energy.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in now/i }));

    await waitFor(() => {
      expect(userApi.login).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: 'secret123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('shows password mismatch during registration', async () => {
    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    fireEvent.change(screen.getByPlaceholderText('Alex Hunter'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText('name@email.com'), { target: { value: 'alice@example.com' } });
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: 'secret123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: /^create account$/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });
});
