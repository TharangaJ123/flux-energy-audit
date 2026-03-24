import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#FDFDFF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            <footer className="border-t border-gray-100 bg-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">Flux Energy</h3>
                            <p className="text-gray-500 max-w-sm">
                                Empowering homeowners with data-driven energy insights for a sustainable and cost-effective future.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Features</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/cost-management" className="hover:text-blue-600">Cost Tracking</Link></li>
                                <li><Link to="/energy-audit" className="hover:text-blue-600">Audit Reports</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Account</h4>
                            <ul className="space-y-2 text-gray-500">
                                <li><Link to="/user-management" className="hover:text-blue-600">Profile</Link></li>
                                <li><Link to="/login" className="hover:text-blue-600">Login</Link></li>
                                <li><Link to="/register" className="hover:text-blue-600">Register</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 mt-12 pt-8 text-center text-gray-400 text-sm">
                        © {new Date().getFullYear()} Flux Energy Audit. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
