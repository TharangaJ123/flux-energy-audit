// Navigation bar that reflects login state from local storage and current route.
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setIsLoggedIn(true);
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                setUser(null);
            }
        } else {
            setIsLoggedIn(false);
            setUser(null);
        }
    }, [location]); // Re-check on every navigation

    return (
        <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 h-20 flex items-center shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--primary-gradient)' }}>
                            <span className="text-white font-bold text-2xl italic">F</span>
                        </div>
                        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--primary-gradient)' }}>
                            FluxEnergy
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center space-x-10">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/appliance-management" className="nav-link">Appliances</Link>
                        <Link to="/cost-management" className="nav-link">Costs</Link>
                        <Link to="/energy-audit" className="nav-link">Audit</Link>
                        <Link to="/solar-estimator" className="nav-link">Solar</Link>
                        <Link to="/carbon-tracker" className="nav-link">Carbon</Link>
                    </div>

                    <div className="flex items-center gap-6">
                        {!isLoggedIn ? (
                            <>
                                <Link to="/login" className="text-gray-600 font-semibold hover:text-teal-600 transition-all">
                                    Login
                                </Link>
                                <Link to="/register" className="btn-primary" style={{ padding: '10px 30px', fontSize: '14px' }}>
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            <Link to="/user-management" className="flex items-center gap-3 group">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 leading-none mb-1">{user?.name || 'User'}</p>
                                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest opacity-70">Active Pulse</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
