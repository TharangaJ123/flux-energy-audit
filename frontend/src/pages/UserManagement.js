// Authentication and profile page covering registration, login, and account maintenance.
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
            localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
            setUser(response.data.user || response.data);
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
            localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
            setUser(response.data.user || response.data);
            setSuccess('Login successful!');
            setLoginForm({ email: '', password: '' });
            navigate('/');
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
            navigate('/');
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
            <div className="section-padding bg-white min-h-[900px]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Your <span className="text-gradient">Flux Profile</span></h1>
                        <p className="text-gray-500 font-medium italic">Advanced security and account orchestration for your energy pulse.</p>
                    </div>

                    {/* Alerts */}
                    {(error || success) && (
                        <div className={`mb-12 p-6 rounded-[2rem] border-l-4 font-bold text-sm italic flex justify-between items-center animate-in slide-in-from-top-3 ${error ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-teal-50 border-teal-500 text-teal-600'}`}>
                            <span>{error || success}</span>
                            <button onClick={() => { setError(''); setSuccess(''); }} className="p-2 hover:bg-black/5 rounded-full transition-colors">✕</button>
                        </div>
                    )}

                    {!user ? (
                        <div className="bg-white rounded-[4rem] shadow-premium border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-700">
                            <div className="flex border-b border-gray-100 bg-dim/50">
                                <button
                                    onClick={() => setActiveTab('login')}
                                    className={`flex-1 py-10 font-bold text-lg uppercase tracking-widest transition-all ${activeTab === 'login' ? 'bg-white text-teal-600' : 'text-gray-400 hover:text-gray-900'}`}
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => setActiveTab('register')}
                                    className={`flex-1 py-10 font-bold text-lg uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-white text-teal-600' : 'text-gray-400 hover:text-gray-900'}`}
                                >
                                    Register
                                </button>
                            </div>

                            <div className="p-12 lg:p-20">
                                {activeTab === 'login' ? (
                                    <form onSubmit={handleLogin} className="space-y-12">
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Email Identity</label>
                                            <input
                                                type="email"
                                                value={loginForm.email}
                                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                                placeholder="alex@energy.com"
                                                className="w-full px-8 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-xl font-bold focus:ring-4 focus:ring-teal-50 focus:bg-white outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Secure Cipher</label>
                                            <input
                                                type="password"
                                                value={loginForm.password}
                                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full px-8 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-xl font-bold focus:ring-4 focus:ring-teal-50 focus:bg-white outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <button type="submit" disabled={loading} className="btn-primary w-full py-6 text-xl shadow-teal-50">
                                            {loading ? 'Authenticating...' : 'Sign In Now'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleRegister} className="space-y-12">
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Legal Name</label>
                                            <input
                                                type="text"
                                                value={registerForm.name}
                                                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                                placeholder="Alex Hunter"
                                                className="w-full px-8 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-xl font-bold focus:ring-4 focus:ring-teal-50 focus:bg-white outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Email Pulse</label>
                                            <input
                                                type="email"
                                                value={registerForm.email}
                                                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                                placeholder="name@email.com"
                                                className="w-full px-8 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-xl font-bold focus:ring-4 focus:ring-teal-50 focus:bg-white outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Password</label>
                                                <input
                                                    type="password"
                                                    value={registerForm.password}
                                                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                                    placeholder="••••••••"
                                                    className="w-full px-8 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-xl font-bold focus:ring-4 focus:ring-teal-50 focus:bg-white outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Confirm</label>
                                                <input
                                                    type="password"
                                                    value={registerForm.confirmPassword}
                                                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                                    placeholder="••••••••"
                                                    className="w-full px-8 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-xl font-bold focus:ring-4 focus:ring-teal-50 focus:bg-white outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={loading} className="btn-primary w-full py-6 text-xl shadow-teal-50">
                                            {loading ? 'Activating Pulse...' : 'Create Account'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-16 animate-in fade-in duration-700">
                            {/* Profile Information Block */}
                            <div className="bg-white p-12 lg:p-16 rounded-[4rem] shadow-premium border border-gray-100 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-teal-50/40 transition-colors"></div>
                                
                                <div className="flex flex-col md:flex-row items-center gap-12 mb-16 relative z-10">
                                    <div className="w-40 h-40 bg-white border-2 border-teal-100 rounded-[3rem] shadow-2xl flex items-center justify-center text-7xl font-bold text-teal-600 transition-transform group-hover:scale-105 duration-500">
                                        {user.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="text-center md:text-left flex-grow">
                                        <h2 className="text-4xl font-bold text-gray-900 mb-2 leading-tight">{user.name}</h2>
                                        <p className="text-xl text-gray-400 font-medium mb-6 italic">{user.email}</p>
                                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                            <span className="px-5 py-2 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-teal-100/50">Flux Pulse Certified</span>
                                            <span className="px-5 py-2 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-gray-100/50 italic underline decoration-teal-600 decoration-2">Premium Member</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleLogout} 
                                        className="bg-white text-rose-500 border border-gray-100 px-8 py-3 rounded-full hover:bg-rose-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-lg"
                                    >
                                        Disconnect
                                    </button>
                                </div>

                                <div className="pt-16 border-t border-gray-50">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-12 italic underline decoration-teal-600 decoration-4">Orchestrate Settings</h3>
                                    <form onSubmit={handleUpdateProfile} className="space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Name Definition</label>
                                                <input
                                                    type="text"
                                                    value={updateForm.name}
                                                    onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                                                    className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-lg font-bold focus:ring-4 focus:ring-teal-50 focus:bg-white outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Immutable Email</label>
                                                <input
                                                    type="email"
                                                    value={updateForm.email}
                                                    readOnly
                                                    className="w-full px-8 py-5 bg-gray-100 border-0 rounded-3xl text-lg font-bold text-gray-400 cursor-not-allowed italic"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-dim p-12 rounded-[3.5rem] border border-gray-50">
                                            <h4 className="font-bold text-lg text-gray-900 mb-10 flex items-center gap-3">
                                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                Cipher Update
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-4">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">New Password</label>
                                                    <input
                                                        type="password"
                                                        value={updateForm.newPassword}
                                                        onChange={(e) => setUpdateForm({ ...updateForm, newPassword: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full px-8 py-5 bg-white border border-gray-100 rounded-3xl text-lg font-bold focus:ring-4 focus:ring-teal-50 outline-none transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Confirm New</label>
                                                    <input
                                                        type="password"
                                                        value={updateForm.confirmNewPassword}
                                                        onChange={(e) => setUpdateForm({ ...updateForm, confirmNewPassword: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full px-8 py-5 bg-white border border-gray-100 rounded-3xl text-lg font-bold focus:ring-4 focus:ring-teal-50 outline-none transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" disabled={loading} className="btn-primary w-full py-6 text-xl">
                                            {loading ? 'Processing Sync...' : 'Sync Identity Changes'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Serious Zone */}
                            <div className="bg-rose-50/50 p-12 lg:p-16 rounded-[4rem] border-2 border-rose-100/50 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-rose-500 rounded-2xl text-white">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-rose-600">Critical Termination</h3>
                                </div>
                                <p className="text-rose-500 text-lg font-bold italic mb-12 leading-relaxed max-w-2xl px-2 underline decoration-rose-200">Deactivating your account will permanently purge all pulse records, device inventories, and AI historical analysis. This orchestration is irreversible.</p>
                                <button
                                    onClick={handleDeleteProfile}
                                    className="px-12 py-5 bg-rose-500 text-white rounded-[2rem] hover:bg-rose-600 transition-all font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-200 active:scale-95"
                                >
                                    Purge My Data Forever
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default UserManagement;
