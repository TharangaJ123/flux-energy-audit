import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import carbonService from '../services/carbonFootprint.service';

const Home = () => {
    const navigate = useNavigate();
    const [latestCarbon, setLatestCarbon] = useState(null);
    const [monthlyAvg, setMonthlyAvg] = useState(null);
    const [monthlyAvgStatus, setMonthlyAvgStatus] = useState(null);

    useEffect(() => {
        const fetchLatestCarbon = async () => {
            try {
                const records = await carbonService.getRecords();
                if (records && records.length > 0) {
                    setLatestCarbon(records[0]);
                    const sum = records.reduce((acc, r) => acc + (Number(r.co2Emission) || 0), 0);
                    const avg = sum / records.length;
                    setMonthlyAvg(avg);

                    let status = 'Low';
                    if (avg > 150) status = 'High';
                    else if (avg > 80) status = 'Moderate';
                    setMonthlyAvgStatus(status);
                }
            } catch (err) {
                console.error('Error fetching carbon data:', err);
            }
        };
        fetchLatestCarbon();
    }, []);

    const features = [
        {
            title: 'Cost Management',
            desc: 'Track bills, set budgets, and estimate costs with CEB/LECO tariffs.',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            path: '/cost-management'
        },
        {
            title: 'Energy Audit',
            desc: 'Schedule and view comprehensive energy audits to find saving opportunities.',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            path: '/energy-audit'
        },
        {
            title: 'Carbon Footprint',
            desc: 'Measure, monitor, and reduce your environmental impact to support sustainability.',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
            ),
            path: '/carbon-tracker'
        },
        {
            title: 'User Profile',
            desc: 'Manage your personal settings, energy goals, and account security.',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            path: '/user-management'
        }
    ];

    return (
        <Layout>
            <div className="relative overflow-hidden bg-white">
                {/* Minimal Background Subtle Blobs */}
                <div className="absolute top-[-5%] right-[0%] w-[400px] h-[400px] bg-teal-50/40 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute top-[20%] left-[0%] w-[350px] h-[350px] bg-cyan-50/40 rounded-full blur-[80px] pointer-events-none"></div>

                {/* Hero Section */}
                <section className="section-padding relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="max-w-2xl">
                                <span className="inline-block px-5 py-2 mb-8 text-xs font-bold uppercase tracking-widest rounded-full bg-teal-50 text-teal-700 border border-teal-100/50">
                                    Trusted by 5,000+ Households
                                </span>
                                <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight text-gray-900">
                                    Master Your <span className="text-gradient">Energy Pulse</span> with Flux.
                                </h1>
                                <p className="text-lg text-gray-500 mb-12 leading-relaxed max-w-lg">
                                    The ultimate platform for Sri Lankan energy consumers to track bills, perform audits, and reduce carbon emissions.
                                </p>
                                <div className="flex flex-wrap gap-5">
                                    <button onClick={() => navigate('/cost-management')} className="btn-primary">
                                        Analyze bills
                                    </button>
                                    <button onClick={() => navigate('/energy-audit')} className="px-10 py-4 font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition-all">
                                        View Modules
                                    </button>
                                </div>
                            </div>
                            <div className="relative order-first lg:order-last">
                                <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl relative z-20 border border-gray-50">
                                    <img 
                                        src="https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=2670&auto=format&fit=crop" 
                                        alt="Clean Energy Analysis" 
                                        className="rounded-[3rem] w-full object-cover shadow-inner h-[500px]"
                                    />
                                </div>
                                {/* Floating Insight Card */}
                                <div className="absolute -bottom-8 -left-8 bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl z-30 border border-white/50">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center text-white">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weekly Saving</p>
                                            <p className="text-2xl font-bold text-gray-900">+LKR 2,450</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="section-padding bg-dim border-y border-gray-50 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-24 max-w-2xl mx-auto">
                            <h2 className="text-4xl font-bold mb-6 text-gray-900">Seamless <span className="text-teal-600">Energy Control</span></h2>
                            <p className="text-gray-500 text-lg">Integrated tools designed specially for the Sri Lankan energy grid.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate(feature.path)}
                                    className="card-premium cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl mb-10 flex items-center justify-center text-teal-600 bg-teal-50/50">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-10">{feature.desc}</p>
                                    <div className="flex items-center text-xs font-bold text-teal-600 uppercase tracking-widest gap-2 group-hover:gap-3 transition-all">
                                        Open Module
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Status Scoreboard */}
                <section className="section-padding relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-[4rem] p-16 lg:p-24 shadow-premium border border-gray-50 flex flex-col items-center">
                            <h2 className="text-3xl font-bold mb-16 text-gray-900 text-center">Global Sustainability Pulse</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full max-w-5xl">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Device Pulse</p>
                                    <h4 className="text-4xl font-bold text-teal-600">Optimal</h4>
                                </div>
                                <div className="text-center border-x-0 md:border-x border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Status</p>
                                    <h4 className="text-4xl font-bold text-cyan-600">Verified</h4>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Last Month CO₂</p>
                                    {latestCarbon && monthlyAvg !== null ? (
                                        <h4 className={`text-4xl font-bold ${monthlyAvgStatus === 'High' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {Number(monthlyAvg).toFixed(1)} <span className="text-xs uppercase opacity-50">kg</span>
                                        </h4>
                                    ) : (
                                        <h4 className="text-4xl font-bold text-gray-300">N/A</h4>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="pb-32 px-4 relative z-10">
                    <div className="max-w-7xl mx-auto rounded-[4rem] overflow-hidden p-20 lg:p-28 text-center text-white relative shadow-2xl" style={{ background: 'var(--primary-gradient)' }}>
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to empower your home?</h2>
                            <p className="text-lg mb-14 opacity-80 max-w-xl mx-auto font-medium">Join the sustainable revolution in Sri Lanka today. Free account. Lifetime insights.</p>
                            <button onClick={() => navigate('/register')} className="px-12 py-5 bg-white text-teal-900 font-bold rounded-full hover:scale-105 transition-all shadow-2xl tracking-widest uppercase text-xs">
                                Create Account
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default Home;
