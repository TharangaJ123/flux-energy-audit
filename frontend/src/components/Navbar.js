import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">F</span>
                        </div>
                        <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            Flux Energy
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Home</Link>
                        <Link to="/cost-management" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Costs</Link>
                        <Link to="/appliance-management" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Appliances</Link>
                        <Link to="/energy-audit" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Audit</Link>
                        <Link to="/carbon-tracker" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Carbon</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-all">
                            Login
                        </Link>
                        <Link to="/register" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
