import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

/**
 * Documentation Page
 * Provides a comprehensive guide to the FluxEnergy platform, including overview,
 * core modules, security details, and API specifications.
 */
const Documentation = () => {
    const [activeSection, setActiveSection] = useState('overview');

    // Handle scroll to update active section in navigation
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['overview', 'core-modules', 'security', 'api-specs'];
            const current = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Section is considered active if it's near the top of the viewport
                    return rect.top >= 0 && rect.top <= 300;
                }
                return false;
            });
            if (current) setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Smooth scroll to a specific section
    const scrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(id);
        }
    };

    // Navigation item component for the sticky sidebar
    const NavItem = ({ id, label }) => (
        <button
            onClick={() => scrollTo(id)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                activeSection === id 
                ? 'bg-teal-50 text-teal-700 font-bold shadow-sm border border-teal-100' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            }`}
        >
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeSection === id ? 'bg-teal-600 scale-125' : 'bg-gray-300'}`} />
            {label}
        </button>
    );

    return (
        <Layout>
            <div className="bg-[#fcfdfe] min-h-screen">
                {/* Hero / Header Section */}
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-teal-600 font-bold mb-4 uppercase tracking-widest">
                                    <span className="w-8 h-[2px] bg-teal-600"></span>
                                    Knowledge Base
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                                    System <span className="text-gradient">Documentation</span>
                                </h1>
                                <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
                                    Everything you need to know about the FluxEnergy platform, from basic setup to advanced API integrations.
                                </p>
                            </div>
                            <div className="relative group max-w-md w-full">
                                <input 
                                    type="text" 
                                    placeholder="Search documentation..." 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all shadow-sm group-hover:shadow-md"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sticky Sidebar */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Navigation</p>
                                <NavItem id="overview" label="Overview" />
                                <NavItem id="core-modules" label="Core Modules" />
                                <NavItem id="security" label="Security & Setup" />
                                <NavItem id="api-specs" label="API Specifications" />
                                
                                <div className="mt-12 p-6 bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl text-white shadow-xl">
                                    <h4 className="font-bold mb-2">Pro Tip</h4>
                                    <p className="text-xs opacity-90 leading-relaxed">
                                        Use our mobile app to track your energy consumption in real-time.
                                    </p>
                                    <button className="mt-4 text-xs font-bold bg-white text-teal-700 px-4 py-2 rounded-xl hover:bg-teal-50 transition-colors">
                                        Download App
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content Area */}
                        <main className="flex-grow max-w-4xl space-y-20 animate-fade-in">
                            {/* Overview Section */}
                            <section id="overview" className="scroll-mt-24 animate-slide-up">
                                <div className="card-premium !p-10 lg:!p-16 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                        <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-4">
                                        <span className="w-2 h-8 bg-teal-600 rounded-full"></span>
                                        Overview
                                    </h2>
                                    <p className="text-xl text-gray-600 leading-relaxed mb-10">
                                        FluxEnergy provides a suite of advanced tools for managing household energy consumption, predicting costs, and optimizing for sustainability. We bridge the gap between complex utility data and actionable household insights.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-dim rounded-2xl border border-gray-50">
                                            <h4 className="font-bold text-teal-700 mb-2">Our Mission</h4>
                                            <p className="text-sm text-gray-500">To empower Sri Lankan households with data-driven energy independence.</p>
                                        </div>
                                        <div className="p-6 bg-dim rounded-2xl border border-gray-50">
                                            <h4 className="font-bold text-teal-700 mb-2">Data Precision</h4>
                                            <p className="text-sm text-gray-500">Real-time weather integration ensures 98.4% accuracy in predictive auditing.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Core Modules Section */}
                            <section id="core-modules" className="scroll-mt-24">
                                <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-4">
                                    <span className="w-2 h-8 bg-teal-600 rounded-full"></span>
                                    Core Modules
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        {
                                            title: "Cost Management",
                                            desc: "Estimate monthly bills, track invoices, and set financial goals based on energy behavior.",
                                            icon: (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-13a9 9 0 110 18 9 9 0 010-18z" />
                                                </svg>
                                            ),
                                            color: "bg-emerald-50 text-emerald-600"
                                        },
                                        {
                                            title: "Energy Auditor",
                                            desc: "AI-driven insights on utility usage compared with localized weather patterns and dynamic tariffs.",
                                            icon: (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            ),
                                            color: "bg-blue-50 text-blue-600"
                                        },
                                        {
                                            title: "Smart Appliances",
                                            desc: "Build an inventory of your major devices to pinpoint the exact source of your power consumption.",
                                            icon: (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            ),
                                            color: "bg-amber-50 text-amber-600"
                                        },
                                        {
                                            title: "Carbon Tracking",
                                            desc: "Track your CO2 equivalent emissions and aim to reduce your household's ecological footprint.",
                                            icon: (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ),
                                            color: "bg-teal-50 text-teal-600"
                                        }
                                    ].map((module, i) => (
                                        <div key={i} className="card-premium flex flex-col items-start gap-4 hover:-translate-y-2 group transition-all duration-500">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${module.color} group-hover:scale-110 transition-transform duration-500`}>
                                                {module.icon}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                                            <p className="text-gray-500 text-sm leading-relaxed">{module.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Security Section */}
                            <section id="security" className="scroll-mt-24">
                                <div className="bg-gray-900 rounded-[3rem] p-10 lg:p-16 text-white relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent"></div>
                                    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4 relative z-10">
                                        <span className="w-1.5 h-8 bg-teal-400 rounded-full"></span>
                                        Security & Setup
                                    </h2>
                                    <p className="text-lg text-teal-50/80 leading-relaxed mb-12 relative z-10">
                                        Our platform secures your data via high-grade encrypted protocols. Authentication is managed via JWT (JSON Web Tokens) to ensure that your energy profiles remain private and tamper-proof.
                                    </p>
                                    
                                    <div className="space-y-6 relative z-10">
                                        {[
                                            "Two-factor authentication support for administrative accounts.",
                                            "End-to-end encryption for all API data payloads.",
                                            "Strict PII (Personally Identifiable Information) protection compliant with regional privacy laws."
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                </div>
                                                <span className="text-gray-300 group-hover:text-white transition-colors">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* API Specs Section */}
                            <section id="api-specs" className="scroll-mt-24">
                                <div className="border border-gray-100 rounded-3xl p-10 bg-white">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-6 italic">API Specifications</h2>
                                    <p className="text-gray-600 mb-8">
                                        For developers looking to integrate FluxEnergy data into their own applications, we offer a robust RESTful API.
                                    </p>
                                    
                                    <div className="bg-dim p-8 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-8 group">
                                        <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform duration-500">
                                            <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-xl mb-2">Technical Support</h4>
                                            <p className="text-gray-500">Please consult our full REST payload documentation within your onboarding package or contact technical support for developer keys.</p>
                                            <button className="mt-6 font-bold text-teal-600 hover:text-teal-700 flex items-center gap-2 transition-colors">
                                                Email Support
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 7h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <footer className="pt-10 border-t border-gray-100 text-sm text-gray-400 flex justify-between items-center">
                                <p>Last updated: April 2026</p>
                                <div className="flex gap-4">
                                    <button className="hover:text-teal-600">Print page</button>
                                    <button className="hover:text-teal-600">Share</button>
                                </div>
                            </footer>
                        </main>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Documentation;
