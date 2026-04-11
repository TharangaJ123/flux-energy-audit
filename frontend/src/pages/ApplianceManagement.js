// Appliance management workspace for CRUD operations, summaries, and energy audit actions.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { applianceApi } from '../services/api';
import Layout from '../components/Layout';

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
  const [cityInput, setCityInput] = useState('Colombo');

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.city) {
          setCity(data.city);
          setCityInput(data.city);
        }
      } catch (err) {
        console.error('Location detection failed:', err);
      }
    };
    detectLocation();
  }, []);

  const [applianceForm, setApplianceForm] = useState({
    name: '',
    powerConsumption: '',
    usageHours: '',
    category: 'General',
  });

  const categories = ['General', 'Kitchen', 'Cooling', 'Entertainment', 'Cleaning', 'Office', 'Other'];

  const fetchData = useCallback(async (targetCity = city) => {
    setLoading(true);
    setError('');
    try {
      const [applianceRes, statsRes, auditRes] = await Promise.all([
        applianceApi.getAppliances(),
        applianceApi.getApplianceStats(),
        applianceApi.getEnergyAudit(targetCity)
      ]);
      setAppliances(applianceRes.data.data || []);
      setStats(statsRes.data.data || null);
      setAuditData(auditRes.data.data || null);
    } catch (err) {
      setError('Failed to fetch pulse data: ' + (err.response?.data?.message || err.message));
      if (err.response?.status === 401) navigate('/user-management');
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
        setError('Please fill in all required pulse parameters');
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
      setError(err.response?.data?.message || 'Failed to sync appliance pulse');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this appliance pulse record?')) {
      try {
        await applianceApi.deleteAppliance(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete appliance pulse');
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

  const tabs = [
    { id: 'list', label: 'My Devices' },
    { id: 'audit', label: 'Audit Dashboard' },
    { id: 'stats', label: 'Consumption Stats' }
  ];

  return (
    <Layout>
      <div className="section-padding bg-white min-h-[800px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Device <span className="text-gradient">Pulse Center</span></h1>
              <p className="text-gray-500 font-medium italic">Manage household appliances and analyze real-time usage parameters.</p>
            </div>
            {activeTab === 'list' && (
              <button
                onClick={() => { setShowForm(!showForm); if (!showForm) setEditingId(null); }}
                className="btn-primary"
              >
                {showForm ? 'Cancel Pulse' : '+ Add New Device'}
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-4 mb-16 border-b border-gray-100 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-8 py-4 rounded-t-[2.5rem] text-xs font-bold uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-teal-50 text-teal-700 shadow-inner' : 'text-gray-400 hover:text-gray-900'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-12 p-6 bg-red-50 text-red-600 rounded-[2rem] font-bold text-sm italic border-l-4 border-red-500 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="p-2 hover:bg-red-100 rounded-full">✕</button>
            </div>
          )}

          {/* Stats Tab Content */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-700">
              <div className="card-premium h-fit">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10">Load Distribution by Category</h4>
                <div className="space-y-8">
                  {Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
                    <div key={cat} className="group">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-sm font-bold text-gray-800 group-hover:text-teal-600 transition-colors uppercase tracking-tight">{cat}</span>
                        <span className="text-xs font-bold text-gray-400 italic">{count} {count === 1 ? 'Device' : 'Devices'}</span>
                      </div>
                      <div className="w-full bg-gray-50 h-3 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                        <div 
                          className="h-full rounded-2xl transition-all duration-1000 ease-out" 
                          style={{ 
                            width: `${(count / stats.totalAppliances) * 100}%`,
                            background: 'var(--primary-gradient)'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-premium bg-gradient-to-br from-gray-900 to-teal-900 text-white border-none flex flex-col justify-center items-center text-center p-16 overflow-hidden relative group">
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
                 
                 <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-10 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 transition-transform group-hover:rotate-12">
                    <svg className="w-12 h-12 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <h4 className="text-3xl font-bold mb-6 italic relative z-10 text-white">Pulse Optimization</h4>
                 <p className="text-teal-100/70 italic max-w-sm leading-relaxed mb-10 relative z-10">
                   Analyze your consumption patterns in the <span className="text-teal-400 font-bold">Audit Dashboard</span> to see how individual devices impact your national grid pulse contribution.
                 </p>
                 <button onClick={() => setActiveTab('audit')} className="px-10 py-4 bg-white text-teal-900 font-bold rounded-full hover:scale-105 transition-all shadow-xl relative z-10 uppercase text-[10px] tracking-widest">
                   Analyze Audit
                 </button>
              </div>
            </div>
          )}

          {/* Audit Tab Content */}
          {activeTab === 'audit' && auditData && (
            <div className="space-y-12 animate-in slide-in-from-bottom-5 duration-500">
              <div className="card-premium p-12 lg:p-16 border-none bg-dim">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
                  <h3 className="text-3xl font-bold italic">Pulse Consumption Audit</h3>
                  <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Switch City..."
                      className="px-6 py-3 bg-gray-50 border-0 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-teal-100"
                    />
                    <button 
                      onClick={() => {
                        setCity(cityInput);
                        fetchData(cityInput);
                      }} 
                      className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-md hover:bg-teal-700"
                    >
                      Sync
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-1 p-10 bg-white rounded-[3rem] shadow-premium flex flex-col justify-between min-h-[300px]">
                    <h4 className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-8">Daily Activity Pulse</h4>
                    <div>
                      <p className="text-6xl font-bold text-teal-600 tracking-tighter mb-2">{auditData.dailyTotalKWh.toFixed(2)}</p>
                      <p className="text-xs font-bold text-gray-300 uppercase">kWh per day</p>
                    </div>
                    <div className="pt-8 border-t border-gray-50 mt-8">
                        <p className="text-2xl font-bold text-primary-text mb-1 italic underline decoration-teal-500 decoration-4">{auditData.monthlyTotalKWh.toFixed(1)}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Estimated Baseline</p>
                    </div>
                  </div>

                  <div className="lg:col-span-2 p-10 bg-white rounded-[3rem] shadow-premium border border-teal-50 relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-8">
                       <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-[10px] font-bold uppercase tracking-widest animate-pulse">AI Optimization Insight</span>
                    </div>
                    <h4 className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-10">Climate Pulse Intel</h4>
                    {auditData.weatherInsights.error ? (
                      <p className="text-red-400 font-bold italic">{auditData.weatherInsights.error}</p>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex items-center gap-6">
                          <span className="text-6xl font-bold text-gray-900 leading-none tracking-tighter">{auditData.weatherInsights.temp}°C</span>
                          <div className="h-12 w-px bg-gray-100"></div>
                          <span className="text-lg font-bold text-gray-500 italic">
                            {auditData.weatherInsights.description} in {auditData.weatherInsights.city}
                          </span>
                        </div>
                        <div className="p-8 bg-teal-50/30 rounded-[2rem] border-l-8 border-teal-500 relative">
                           <svg className="absolute -top-4 -left-4 w-10 h-10 text-teal-200" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                           <p className="text-xl text-teal-900 leading-relaxed font-bold italic relative z-10">
                            "{auditData.weatherInsights.insight}"
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-16 bg-white rounded-[3rem] p-12 shadow-premium border border-gray-50">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 px-4">
                    <div>
                      <h4 className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.3em] mb-4">Device Contribution Weightage</h4>
                      <p className="text-2xl font-bold italic text-gray-900">Which loads define your <span className="text-gradient">Daily Pulse?</span></p>
                    </div>
                    <div className="px-6 py-3 bg-teal-50 text-teal-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-teal-100/50">
                      Top Heavy Consumers
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {auditData.appliances.sort((a, b) => b.percentage - a.percentage).slice(0, 6).map((app, i) => (
                      <div key={app.id || i} className="relative p-10 bg-dim rounded-[3rem] group border border-transparent hover:border-teal-100 transition-all duration-500 hover:shadow-xl">
                        <span className="absolute top-6 right-8 text-5xl font-bold text-teal-600/5 group-hover:text-teal-600/10 transition-colors pointer-events-none">0{i+1}</span>
                        <h5 className="font-bold text-gray-900 mb-6 truncate pr-16 italic border-b border-gray-100 pb-4">{app.name}</h5>
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <p className="text-4xl font-bold text-teal-600 tracking-tighter">{app.percentage.toFixed(1)}<span className="text-sm opacity-50">%</span></p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 italic">{app.dailyKWh.toFixed(2)} kWh</p>
                          </div>
                          <div className="w-full bg-white h-2 rounded-full overflow-hidden shadow-inner border border-gray-50">
                             <div 
                              className="h-full rounded-full transition-all duration-1000 delay-300" 
                              style={{ 
                                width: `${app.percentage}%`,
                                background: 'var(--primary-gradient)'
                              }}
                             ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List Tab Content */}
          {activeTab === 'list' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              {showForm && (
                <div className="bg-dim p-12 lg:p-20 rounded-[4rem] border border-gray-100 shadow-inner animate-in slide-in-from-top-10 duration-500">
                  <h4 className="text-3xl font-bold text-gray-900 mb-12 italic underline decoration-teal-600 decoration-4">{editingId ? 'Edit Pulse Record' : 'Record New Device Pulse'}</h4>
                  <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Device Designation</label>
                      <input
                        type="text"
                        placeholder="e.g. Inverter AC Unit"
                        className="w-full px-8 py-5 bg-white border border-gray-100 rounded-3xl text-xl font-bold focus:ring-4 focus:ring-teal-50 outline-none"
                        value={applianceForm.name}
                        onChange={(e) => setApplianceForm({ ...applianceForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Load Category</label>
                      <select
                        className="w-full px-8 py-5 bg-white border border-gray-100 rounded-3xl text-xl font-bold focus:ring-4 focus:ring-teal-50 outline-none appearance-none cursor-pointer"
                        value={applianceForm.category}
                        onChange={(e) => setApplianceForm({ ...applianceForm, category: e.target.value })}
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Rated Consumpt. (W)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        className="w-full px-8 py-5 bg-white border border-gray-100 rounded-3xl text-xl font-bold focus:ring-4 focus:ring-teal-50 outline-none"
                        value={applianceForm.powerConsumption}
                        onChange={(e) => setApplianceForm({ ...applianceForm, powerConsumption: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Habitual Pulse (Hrs/Day)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 8.5"
                        className="w-full px-8 py-5 bg-white border border-gray-100 rounded-3xl text-xl font-bold focus:ring-4 focus:ring-teal-50 outline-none"
                        value={applianceForm.usageHours}
                        onChange={(e) => setApplianceForm({ ...applianceForm, usageHours: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-6 mt-10">
                      <button type="button" onClick={() => setShowForm(false)} className="px-10 py-5 text-gray-400 font-bold border border-gray-100 rounded-full hover:text-gray-900 transition-colors uppercase text-xs tracking-widest">Close</button>
                      <button type="submit" className="btn-primary">
                        {editingId ? 'Sync Pulse Update' : 'Record Pulse'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-32">
                  <div className="w-16 h-16 border-4 border-teal-50 border-t-teal-600 rounded-full animate-spin"></div>
                </div>
              ) : appliances.length === 0 ? (
                <div className="bg-dim p-24 rounded-[4rem] text-center shadow-inner border border-gray-50 opacity-60">
                   <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-10">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                  <h4 className="text-3xl font-bold text-gray-900 mb-6">No Pulse Registered</h4>
                  <p className="text-gray-500 font-medium italic">Start mapping your device pulse to reveal household energy patterns.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {appliances.map((app) => (
                    <div key={app._id} className="card-premium group relative">
                      <div className="flex justify-between items-start mb-10">
                        <span className="px-5 py-2 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                          {app.category}
                        </span>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(app)} aria-label="Edit appliance" className="p-3 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-2xl transition-all shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(app._id)} aria-label="Delete appliance" className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      <h5 className="text-2xl font-bold text-gray-900 mb-8 italic tracking-tight truncate border-b border-gray-100 pb-4">{app.name}</h5>
                      <div className="space-y-6 mb-12">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Load Pulse</span>
                          <span className="text-xl font-bold text-gray-800">{app.powerConsumption} <span className="text-xs opacity-50 font-normal">W</span></span>
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daily Habit</span>
                          <span className="text-xl font-bold text-gray-800">{app.usageHours} <span className="text-xs opacity-50 font-normal">Hrs</span></span>
                        </div>
                      </div>
                      <div className="p-8 bg-dim rounded-3xl flex justify-between items-center">
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-[0.2em] mb-1">Daily Pulse</p>
                          <p className="text-2xl font-bold text-teal-600">{(app.powerConsumption * app.usageHours / 1000).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-[0.2em] mb-1">Monthly Peak</p>
                          <p className="text-2xl font-bold text-primary-text italic underline decoration-teal-600 decoration-2">{(app.powerConsumption * app.usageHours * 30 / 1000).toFixed(1)}</p>
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
    </Layout>
  );
};

export default ApplianceManagement;
