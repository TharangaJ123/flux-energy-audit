import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { applianceApi } from '../services/api';

const ApplianceManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'audit', 'stats'
  const [appliances, setAppliances] = useState([]);
  const [stats, setStats] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [city, setCity] = useState('Colombo');

  // Form state
  const [applianceForm, setApplianceForm] = useState({
    name: '',
    powerConsumption: '',
    usageHours: '',
    category: 'General',
  });

  const categories = ['General', 'Kitchen', 'Cooling', 'Entertainment', 'Cleaning', 'Office', 'Other'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [applianceRes, statsRes, auditRes] = await Promise.all([
        applianceApi.getAppliances(),
        applianceApi.getApplianceStats(),
        applianceApi.getEnergyAudit(city)
      ]);
      setAppliances(applianceRes.data.data);
      setStats(statsRes.data.data);
      setAuditData(auditRes.data.data);
    } catch (err) {
      setError('Failed to fetch data: ' + (err.response?.data?.message || err.message));
      if (err.response?.status === 401) {
        navigate('/user-management');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!applianceForm.name || !applianceForm.powerConsumption || !applianceForm.usageHours) {
        setError('Please fill in all required fields');
        return;
      }

      const data = {
        ...applianceForm,
        powerConsumption: parseFloat(applianceForm.powerConsumption),
        usageHours: parseFloat(applianceForm.usageHours)
      };

      if (editingId) {
        await applianceApi.updateAppliance(editingId, data);
      } else {
        await applianceApi.createAppliance(data);
      }

      setApplianceForm({ name: '', powerConsumption: '', usageHours: '', category: 'General' });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save appliance');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appliance?')) {
      try {
        await applianceApi.deleteAppliance(id);
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete appliance');
      }
    }
  };

  const handleEdit = (app) => {
    setApplianceForm({
      name: app.name,
      powerConsumption: app.powerConsumption,
      usageHours: app.usageHours,
      category: app.category || 'General',
    });
    setEditingId(app._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Appliance Management
            </h1>
            <p className="text-blue-100 mt-1">Monitor and optimize your household energy footprint</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-4">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b overflow-x-auto">
          {['list', 'audit', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-6 font-bold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'border-b-4 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Dashboard
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Stats Tab Content */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-blue-500">
              <p className="text-gray-500 font-semibold uppercase text-xs">Total Appliances</p>
              <p className="text-4xl font-black text-gray-800 mt-1">{stats.totalAppliances}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-yellow-500">
              <p className="text-gray-500 font-semibold uppercase text-xs">Total Power Load</p>
              <p className="text-4xl font-black text-gray-800 mt-1">{stats.totalPowerWatts} <span className="text-xl">W</span></p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-purple-500">
              <p className="text-gray-500 font-semibold uppercase text-xs">Highest Consumer</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{stats.highestConsumer?.name || 'N/A'}</p>
              <p className="text-purple-600 font-semibold">{stats.highestConsumer?.monthlyKWh.toFixed(2)} kWh/mo</p>
            </div>
          </div>
        )}

        {/* Audit Tab Content */}
        {activeTab === 'audit' && auditData && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Energy Consumption Audit</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter City"
                    className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Refresh</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Consumption Summary
                  </h4>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-gray-600">Daily Total</p>
                      <p className="text-4xl font-black text-blue-700">{auditData.dailyTotalKWh.toFixed(2)} <span className="text-lg">kWh</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Monthly Est.</p>
                      <p className="text-3xl font-bold text-indigo-700">{auditData.monthlyTotalKWh.toFixed(2)} <span className="text-base">kWh</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-xl">
                  <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                    </svg>
                    Weather-Driven Insights
                  </h4>
                  {auditData.weatherInsights.error ? (
                    <p className="text-red-600">{auditData.weatherInsights.error}</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-indigo-900">{auditData.weatherInsights.temp}°C</span>
                        <span className="text-indigo-600 capitalize font-semibold">{auditData.weatherInsights.description} in {auditData.weatherInsights.city}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed italic border-l-4 border-indigo-300 pl-4">
                        "{auditData.weatherInsights.insight}"
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List Tab Content */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* Form Section */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
              <h3 className="font-bold text-xl text-gray-800">My Appliances</h3>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  if (!showForm) setEditingId(null);
                }}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                  showForm ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showForm ? 'Cancel' : '+ New Appliance'}
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                <h4 className="text-lg font-bold text-gray-800 mb-6">{editingId ? 'Update Appliance' : 'Add New Appliance'}</h4>
                <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Appliance Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Master Bedroom AC"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={applianceForm.name}
                      onChange={(e) => setApplianceForm({ ...applianceForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={applianceForm.category}
                      onChange={(e) => setApplianceForm({ ...applianceForm, category: e.target.value })}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Power Consumption (Watts) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 1500"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={applianceForm.powerConsumption}
                      onChange={(e) => setApplianceForm({ ...applianceForm, powerConsumption: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Daily Usage Hours *</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 8"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={applianceForm.usageHours}
                      onChange={(e) => setApplianceForm({ ...applianceForm, usageHours: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-2 text-gray-600 font-bold"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                      {editingId ? 'Update Appliance' : 'Add Appliance'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
              </div>
            ) : appliances.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-md text-center">
                <div className="mb-4 flex justify-center text-gray-300">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-400">No Appliances Registered</h4>
                <p className="text-gray-500 mt-2">Start adding your household devices to track your energy consumption.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appliances.map((app) => (
                  <div key={app._id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-transparent hover:border-blue-100 group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {app.category}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(app)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(app._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h5 className="text-xl font-bold text-gray-800 mb-2">{app.name}</h5>
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-500 font-semibold">Rated Power</span>
                        <span className="font-bold text-gray-800">{app.powerConsumption} W</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-500 font-semibold">Daily Usage</span>
                        <span className="font-bold text-gray-800">{app.usageHours} hrs/day</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <div className="text-left">
                        <p className="text-xs text-gray-400 uppercase font-bold">Daily kWh</p>
                        <p className="text-lg font-bold text-blue-600">{(app.powerConsumption * app.usageHours / 1000).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold">Monthly kWh</p>
                        <p className="text-lg font-bold text-indigo-600">{(app.powerConsumption * app.usageHours * 30 / 1000).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplianceManagement;
