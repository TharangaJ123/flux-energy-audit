import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
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
                        <Link to="/carbon-tracker" className="nav-link">Carbon</Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-primary-text font-bold hover:text-cyan-600 transition-all">
                            Login
                        </Link>
                        <Link to="/register" className="btn-primary" style={{ padding: '10px 30px', fontSize: '15px' }}>
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
