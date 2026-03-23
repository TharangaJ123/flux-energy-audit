import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';
import Layout from '../components/Layout';

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
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setUpdateForm({
          ...parsedUser,
          password: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
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

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      setSuccess('Registration successful! You are now logged in.');
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
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
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      setSuccess('Login successful!');
      setLoginForm({ email: '', password: '' });
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
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
      setUser(response.data.user || response.data);
      setSuccess('Profile updated successfully!');
      setUpdateForm({
        ...(response.data.user || response.data),
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
    if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      setLoading(true);
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
    <Layout>
      <div className="max-w-2xl mx-auto py-8 px-4 font-sans">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">My Flux Account</h1>
          <p className="text-gray-500 text-lg">Manage your personal energy profile and security.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-8 shadow-sm flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium text-lg">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-6 py-4 rounded-2xl mb-8 shadow-sm flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="font-medium text-lg">{success}</span>
          </div>
        )}

        {!user ? (
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 transition-all duration-500">
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-5 font-bold text-xl transition-all ${activeTab === 'login'
                    ? 'bg-white text-blue-600 border-b-4 border-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-5 font-bold text-xl transition-all ${activeTab === 'register'
                    ? 'bg-white text-blue-600 border-b-4 border-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Join Flux
              </button>
            </div>

            <div className="p-10">
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="alex@energy.com"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Password</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none mt-4"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Full Name</label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="name@email.com"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Password</label>
                      <input
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Confirm</label>
                      <input
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:bg-gray-300 mt-4"
                  >
                    {loading ? 'Creating Account...' : 'Get Started'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
              <div className="flex items-center gap-8 mb-10 bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl shadow-blue-200">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">{user.name}</h2>
                  <p className="text-gray-500 text-lg font-medium">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest rounded-full">{user.role || 'user'}</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase tracking-widest rounded-full">Active</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-white text-red-600 border-2 border-red-50 px-8 py-3 rounded-2xl hover:bg-red-600 hover:text-white hover:border-red-600 font-bold text-lg transition-all active:scale-95 shadow-sm"
                >
                  Logout
                </button>
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                Account Settings
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Full Name</label>
                    <input
                      type="text"
                      value={updateForm.name}
                      onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Email (Read Only)</label>
                    <input
                      type="email"
                      value={updateForm.email}
                      readOnly
                      className="w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl outline-none text-lg font-medium text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <h4 className="font-black text-xl text-gray-900 mb-6">Security Update</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">New Password</label>
                      <input
                        type="password"
                        value={updateForm.newPassword}
                        onChange={(e) => setUpdateForm({ ...updateForm, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={updateForm.confirmNewPassword}
                        onChange={(e) => setUpdateForm({ ...updateForm, confirmNewPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 transition-all outline-none text-lg font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-xl hover:bg-black shadow-2xl transition-all active:scale-95 disabled:bg-gray-300"
                >
                  {loading ? 'Processing...' : 'Sync Profile Changes'}
                </button>
              </form>
            </div>

            <div className="bg-red-50 p-10 rounded-[2.5rem] border-2 border-red-100 shadow-sm">
              <h3 className="text-2xl font-black text-red-600 mb-3 flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Serious Zone
              </h3>
              <p className="text-red-500 mb-8 text-lg font-medium leading-relaxed">Account deletion involves purging all your energy data, inventory, and audit history. This cannot be reversed.</p>
              <button
                onClick={handleDeleteProfile}
                className="bg-red-600 text-white border-none px-10 py-4 rounded-2xl hover:bg-red-700 font-black text-lg transition-all active:scale-95 shadow-xl shadow-red-200"
              >
                Terminate Account & Clean Data
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;
