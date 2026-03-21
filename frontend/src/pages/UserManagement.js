import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';

const UserManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // Update profile form state
  const [updateForm, setUpdateForm] = useState({
    name: '',
    email: '',
    password: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setActiveTab('profile');
      setUpdateForm(JSON.parse(userData));
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await userApi.register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });

      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      setSuccess('Registration successful! You are now logged in.');
      setActiveTab('profile');
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginForm.email || !loginForm.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await userApi.login(loginForm);

      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      setSuccess('Login successful!');
      setActiveTab('profile');
      setLoginForm({
        email: '',
        password: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (updateForm.newPassword && updateForm.newPassword !== updateForm.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (updateForm.newPassword && updateForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: updateForm.name,
        email: updateForm.email,
      };

      if (updateForm.newPassword) {
        updateData.password = updateForm.newPassword;
      }

      const response = await userApi.updateProfile(updateData);

      // Update token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      setSuccess('Profile updated successfully!');
      setUpdateForm({
        ...response.data,
        password: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setActiveTab('login');
      setSuccess('Logged out successfully!');
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm('Are you absolutely sure? This action cannot be undone. Your account and all associated data will be permanently deleted.')) {
      setLoading(true);
      setError('');
      try {
        await userApi.deleteProfile();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setSuccess('Account deleted successfully');
        setActiveTab('login');
      } catch (err) {
        setError(err.response?.data?.message || 'Delete failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-indigo-100 mt-1">Manage your account and profile</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto mt-8 px-4 pb-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {!user ? (
          <>
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('login')}
                className={`pb-3 px-4 font-semibold transition-colors ${
                  activeTab === 'login'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`pb-3 px-4 font-semibold transition-colors ${
                  activeTab === 'register'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Login to Your Account</h2>
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">Password</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
                <p className="text-center text-gray-600 mt-4">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setActiveTab('register')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Account</h2>
                <form onSubmit={handleRegister}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">Password</label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">Must be at least 6 characters</p>
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      placeholder="••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Creating account...' : 'Register'}
                  </button>
                </form>
                <p className="text-center text-gray-600 mt-4">
                  Already have an account?{' '}
                  <button
                    onClick={() => setActiveTab('login')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Login here
                  </button>
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Profile Tab */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
                <button
                  onClick={handleLogout}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Logout
                </button>
              </div>

              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Logged in as</p>
                    <p className="text-lg font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-sm text-gray-600">Role: <span className="font-semibold text-gray-800">{user.role}</span></p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">Update Profile</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                  <input
                    type="text"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={updateForm.email}
                    onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={updateForm.newPassword}
                    onChange={(e) => setUpdateForm({ ...updateForm, newPassword: e.target.value })}
                    placeholder="••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {updateForm.newPassword && (
                    <p className="text-sm text-gray-500 mt-1">Must be at least 6 characters</p>
                  )}
                </div>
                {updateForm.newPassword && (
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={updateForm.confirmNewPassword}
                      onChange={(e) => setUpdateForm({ ...updateForm, confirmNewPassword: e.target.value })}
                      placeholder="••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 mb-4"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>

              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-red-600">Danger Zone</h3>
                <button
                  onClick={handleDeleteProfile}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Warning: Deleting your account will permanently remove all your data and cannot be undone.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
