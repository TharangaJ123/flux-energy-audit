// Shared page shell that keeps navigation and footer consistent across sections.
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-white selection:bg-teal-100 selection:text-teal-900 flex flex-col">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>

            <footer className="bg-dim border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 text-left">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-3xl font-bold bg-clip-text text-transparent mb-6" style={{ backgroundImage: 'var(--primary-gradient)' }}>
                                FluxEnergy
                            </h3>
                            <p className="text-secondary-text max-w-sm mb-8 leading-relaxed">
                                Redefining domestic energy management with cutting-edge analytics and seamless Sri Lankan tariff integration. Empowering a sustainable future, one household at a time.
                            </p>
                            <div className="flex gap-4">
                                <span className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-gray-100">
                                    <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" /></svg>
                                </span>
                                <span className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-gray-100">
                                    <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 7h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" /></svg>
                                </span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-primary-text mb-6">Solutions</h4>
                            <ul className="space-y-4 text-secondary-text">
                                <li><Link to="/cost-management" className="hover:text-cyan-700 transition-colors">Cost Management</Link></li>
                                <li><Link to="/energy-audit" className="hover:text-cyan-700 transition-colors">Energy Auditor</Link></li>
                                <li><Link to="/carbon-tracker" className="hover:text-cyan-700 transition-colors">Carbon Metrics</Link></li>
                                <li><Link to="/appliance-management" className="hover:text-cyan-700 transition-colors">Smart Appliances</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-primary-text mb-6">Explore</h4>
                            <ul className="space-y-4 text-secondary-text">
                                <li><Link to="/user-management" className="hover:text-cyan-700 transition-colors">My Profile</Link></li>
                                <li><Link to="/login" className="hover:text-cyan-700 transition-colors">Portal Login</Link></li>
                                <li><Link to="/register" className="hover:text-cyan-700 transition-colors">Sign Up Now</Link></li>
                                <li><Link to="#!" className="hover:text-cyan-700 transition-colors">Documentation</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 gap-4">
                        <p>© {new Date().getFullYear()} FluxEnergy Platforms. Sri Lanka. Developed for domestic efficiency.</p>
                        <div className="flex gap-8">
                            <Link to="#!" className="hover:text-teal-600">Privacy Policy</Link>
                            <Link to="#!" className="hover:text-teal-600">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
