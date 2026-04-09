// Navbar tests covering the two main states: anonymous and authenticated users.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows login actions when no user is stored', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  test('shows profile shortcut when user is logged in', () => {
    localStorage.setItem('token', 'token-1');
    localStorage.setItem('user', JSON.stringify({ name: 'Alice' }));

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Active Pulse')).toBeInTheDocument();
  });
});
