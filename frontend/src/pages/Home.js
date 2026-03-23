import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Cost Management',
      desc: 'Track bills, set budgets, and estimate costs with CEB/LECO tariffs.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/cost-management',
      color: 'blue'
    },
    {
      title: 'Appliance Inventory',
      desc: 'Catalog your appliances and monitor their individual energy consumption.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      path: '/appliance-management',
      color: 'indigo'
    },
    {
      title: 'Energy Audit',
      desc: 'Schedule and view comprehensive energy audits to find saving opportunities.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/energy-audit',
      color: 'emerald'
    },
    {
      title: 'Carbon Tracker',
      desc: 'Analyze your environmental impact and monitor your carbon footprint progress.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: '/carbon-tracker',
      color: 'teal'
    },
    {
      title: 'User Profile',
      desc: 'Manage your personal settings, energy goals, and account security.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      path: '/user-management',
      color: 'slate'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">
              Master Your Home’s <span className="text-blue-200">Energy Consumption</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 font-light">
              Analyze costs, audit your appliances, and track your carbon footprint with Sri Lanka’s first complete energy management platform.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/cost-management')}
                className="bg-white text-blue-900 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Analyze Bills
              </button>
              <button className="bg-blue-600/30 backdrop-blur-md border border-blue-400/30 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600/50 transition-all active:scale-95 cursor-not-allowed opacity-75">
                Learn More
              </button>
            </div>
          </div>

          {/* Decorative background shape */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 -mr-10 -mb-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Stats/Quick Info (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Power Efficiency</p>
            <h4 className="text-2xl font-bold text-gray-900">Optimal</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Audit Status</p>
            <h4 className="text-2xl font-bold text-gray-900">Up to Date</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Savings Goal</p>
            <h4 className="text-2xl font-bold text-gray-900">85% Met</h4>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <h2 className="text-3xl font-bold text-gray-900 mb-8 ml-1">Energy Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <div
            key={idx}
            onClick={() => navigate(feature.path)}
            className="group cursor-pointer bg-white p-8 rounded-3xl border border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-${feature.color}-50 text-${feature.color}-600 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              {feature.icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              {feature.title}
            </h3>
            <p className="text-gray-500 leading-relaxed mb-6">
              {feature.desc}
            </p>
            <div className="flex items-center text-sm font-bold text-blue-600">
              Open Module
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Why Section */}
      <section className="mt-24 bg-blue-50/50 rounded-3xl p-12 border border-blue-100/50">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Flux Audit?</h2>
          <p className="text-gray-500 text-lg">Detailed analytics and professional auditing for every household.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex gap-4">
            <div className="mt-1 w-6 h-6 text-green-500 shrink-0">
              <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Smart Slabs Integration</h4>
              <p className="text-gray-600">Calculates your bill exactly as CEB and LECO do, with precise slab rates and fixed charges.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1 w-6 h-6 text-green-500 shrink-0">
              <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Inventory Management</h4>
              <p className="text-gray-600">Keep a detailed record of every appliance from refrigerators to tiny LED smart bulbs.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
