import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import carbonService from '../services/carbonFootprint.service';
import Layout from '../components/Layout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const GAS_TYPES = [
  { id: 'natural', label: 'Natural Gas' },
  { id: 'lpg', label: 'LPG' }
];

const TRANSPORT_TYPES = [
  { id: 'petrolCar', label: 'Petrol Car' },
  { id: 'dieselCar', label: 'Diesel Car' },
  { id: 'bus', label: 'Bus' },
  { id: 'airplane', label: 'Airplane' }
];

const CarbonTracker = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('records');

  const [form, setForm] = useState({
    month: String(new Date().getMonth() + 1),
    year: new Date().getFullYear(),
    electricity: '',
    gasSelections: [],
    gasAmounts: {},
    transportSelections: [],
    transportDistances: {},
    waste: ''
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await carbonService.getRecords();
      setRecords(data);
    } catch (err) {
      setError('Failed to fetch records: ' + (err.response?.data?.message || err.message));
      if (err.response?.status === 401) {
        navigate('/user-management');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleGasSelection = (id) => {
    setForm((prev) => {
      const selections = prev.gasSelections.includes(id)
        ? prev.gasSelections.filter((s) => s !== id)
        : [...prev.gasSelections, id];
      return { ...prev, gasSelections: selections };
    });
  };

  const handleTransportSelection = (id) => {
    setForm((prev) => {
      const selections = prev.transportSelections.includes(id)
        ? prev.transportSelections.filter((s) => s !== id)
        : [...prev.transportSelections, id];
      return { ...prev, transportSelections: selections };
    });
  };

  const handleSubmit = async () => {
    setError('');
    try {
      // Basic validation
      if (!form.electricity && form.electricity !== 0) {
        setError('Please enter electricity consumption.');
        return;
      }
      await carbonService.createRecord(form);
      setForm({
        month: String(new Date().getMonth() + 1),
        year: new Date().getFullYear(),
        electricity: '',
        gasSelections: [],
        gasAmounts: {},
        transportSelections: [],
        transportDistances: {},
        waste: ''
      });
      setShowForm(false);
      await fetchRecords();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this footprint record?')) {
      try {
        await carbonService.deleteRecord(id);
        await fetchRecords();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  const getDynamicTips = (record) => {
    const tips = [];

    // Electricity
    if (record.electricity > 150) {
      tips.push("Your electricity usage is quite high. Try switching to LED bulbs, using energy-efficient appliances, or minimizing AC usage.");
    }

    // Waste
    if (record.waste > 20) {
      tips.push("Waste generation is above average. Implement a composting system for organic waste and actively recycle plastics and paper.");
    }

    // Gas
    let gasHigh = false;
    if (record.gasData && record.gasData.amounts) {
      const amounts = record.gasData.amounts;
      if (amounts.natural > 30 || amounts.lpg > 15) gasHigh = true;
    }
    if (gasHigh) {
      tips.push("Gas consumption is significant. Ensure your cooking and heating appliances are well-maintained to improve efficiency and reduce gas usage.");
    }

    // Transport
    let carDistance = 0;
    if (record.transportData && record.transportData.distances) {
      const dist = record.transportData.distances;
      carDistance = (parseFloat(dist.petrolCar) || 0) + (parseFloat(dist.dieselCar) || 0);
    }
    if (carDistance > 100) {
      tips.push("Personal vehicle usage is high. Consider carpooling, combining errands, or using public transportation to lower your carbon footprint.");
    }

    // Fallback if none trigger but status is High
    if (tips.length === 0) {
      tips.push("Consider a comprehensive energy audit to identify hidden areas of high emissions.");
      tips.push("Small changes in daily routines can collectively reduce your footprint over time.");
    }

    return tips;
  };

  const MonthSelect = ({ value, onChange }) => (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-teal-50/50 border border-teal-100 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-teal-900"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <option key={i + 1} value={String(i + 1)}>
          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
        </option>
      ))}
    </select>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Low': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'Moderate': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'High': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const EMISSION_FACTORS = {
    electricity: 0.85,
    naturalGas: 2.03,
    lpg: 1.51,
    petrolCar: 0.192,
    dieselCar: 0.171,
    bus: 0.105,
    airplane: 0.254,
    waste: 0.21
  };

  const chartData = [...records].reverse().map(r => {
    // Calculate breakdown for the graph
    const elecCO2 = (parseFloat(r.electricity) || 0) * EMISSION_FACTORS.electricity;

    let gasCO2 = 0;
    if (r.gasData && r.gasData.amounts) {
      if (r.gasData.amounts.natural) gasCO2 += (parseFloat(r.gasData.amounts.natural) || 0) * EMISSION_FACTORS.naturalGas;
      if (r.gasData.amounts.lpg) gasCO2 += (parseFloat(r.gasData.amounts.lpg) || 0) * EMISSION_FACTORS.lpg;
    }

    let transCO2 = 0;
    if (r.transportData && r.transportData.distances) {
      const d = r.transportData.distances;
      if (d.petrolCar) transCO2 += (parseFloat(d.petrolCar) || 0) * EMISSION_FACTORS.petrolCar;
      if (d.dieselCar) transCO2 += (parseFloat(d.dieselCar) || 0) * EMISSION_FACTORS.dieselCar;
      if (d.bus) transCO2 += (parseFloat(d.bus) || 0) * EMISSION_FACTORS.bus;
      if (d.airplane) transCO2 += (parseFloat(d.airplane) || 0) * EMISSION_FACTORS.airplane;
    }

    const wasteCO2 = (parseFloat(r.waste) || 0) * EMISSION_FACTORS.waste;

    return {
      name: `${new Date(2024, r.month - 1).toLocaleString('default', { month: 'short' })} ${r.year.toString().slice(-2)}`,
      co2: parseFloat((r.co2Emission || 0).toFixed(1)),
      Electricity: parseFloat(elecCO2.toFixed(1)),
      Gas: parseFloat(gasCO2.toFixed(1)),
      Transport: parseFloat(transCO2.toFixed(1)),
      Waste: parseFloat(wasteCO2.toFixed(1))
    };
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 mb-2">
              Carbon Footprint Tracker
            </h1>
            <p className="text-gray-500 text-lg font-light">
              Measure, monitor, and reduce your environmental impact.
            </p>
          </div>
          <div className="flex bg-white shadow-sm border border-gray-100 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'records' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Records
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Trend Graph
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'breakdown' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Breakdown Graph
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-8 shadow-sm flex items-center gap-3 animate-in fade-in">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Historical Footprints</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all active:scale-95 flex items-center gap-2"
            >
              {showForm ? '✕ Cancel' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Calculate Footprint</>}
            </button>
          </div>

          {showForm && (
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <h3 className="text-2xl font-extrabold mb-8 text-gray-800 relative z-10">New Footprint Record</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-teal-800 mb-2 ml-1">Month</label>
                      <MonthSelect
                        value={form.month}
                        onChange={(e) => setForm({ ...form, month: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-teal-800 mb-2 ml-1">Year</label>
                      <input
                        type="number"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-teal-50/50 border border-teal-100 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-teal-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-teal-800 mb-2 ml-1">Electricity (kWh)</label>
                    <input
                      type="number"
                      value={form.electricity}
                      onChange={(e) => setForm({ ...form, electricity: e.target.value })}
                      placeholder="0"
                      className="w-full px-5 py-4 bg-white border border-teal-100 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-xl shadow-sm"
                    />
                  </div>

                  <div className="bg-teal-50/30 p-5 rounded-2xl border border-teal-100">
                    <label className="block text-sm font-bold text-teal-800 mb-3">Gas Usage</label>
                    <div className="flex gap-3 mb-4 flex-wrap">
                      {GAS_TYPES.map(gas => (
                        <button
                          key={gas.id}
                          onClick={() => handleGasSelection(gas.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${form.gasSelections.includes(gas.id)
                              ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                              : 'bg-white border-teal-200 text-teal-700 hover:bg-teal-50'
                            }`}
                        >
                          {gas.label}
                        </button>
                      ))}
                    </div>
                    {form.gasSelections.map(id => (
                      <div key={id} className="mb-3 animate-in fade-in">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{GAS_TYPES.find(g => g.id === id)?.label} Amount</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={form.gasAmounts[id] || ''}
                            onChange={(e) => setForm({ ...form, gasAmounts: { ...form.gasAmounts, [id]: e.target.value } })}
                            className="w-full px-4 py-2 bg-white border border-teal-100 rounded-xl outline-none focus:border-teal-400 font-medium"
                            placeholder="Amount"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">{id === 'natural' ? 'm³' : 'L'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-teal-50/30 p-5 rounded-2xl border border-teal-100">
                    <label className="block text-sm font-bold text-teal-800 mb-3">Transportation</label>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {TRANSPORT_TYPES.map(trans => (
                        <button
                          key={trans.id}
                          onClick={() => handleTransportSelection(trans.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${form.transportSelections.includes(trans.id)
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                              : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                        >
                          {trans.label}
                        </button>
                      ))}
                    </div>
                    {form.transportSelections.map(id => (
                      <div key={id} className="mb-3 animate-in fade-in">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{TRANSPORT_TYPES.find(t => t.id === id)?.label} Distance</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={form.transportDistances[id] || ''}
                            onChange={(e) => setForm({ ...form, transportDistances: { ...form.transportDistances, [id]: e.target.value } })}
                            className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl outline-none focus:border-emerald-400 font-medium"
                            placeholder="Distance"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">km</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-teal-800 mb-2 ml-1">Waste (kg)</label>
                    <input
                      type="number"
                      value={form.waste}
                      onChange={(e) => setForm({ ...form, waste: e.target.value })}
                      placeholder="0"
                      className="w-full px-5 py-4 bg-white border border-teal-100 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-bold text-xl shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4 relative z-10 pt-6 border-t border-teal-100/50">
                <button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-10 py-4 rounded-xl font-extrabold hover:from-teal-700 hover:to-emerald-700 transition-all shadow-xl shadow-teal-200/50 active:scale-95 text-lg w-full md:w-auto"
                >
                  Analyze & Save
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : activeTab === 'records' ? (
            records.length === 0 ? (
              <div className="bg-white/50 backdrop-blur-sm p-16 rounded-[2rem] border-2 border-dashed border-teal-100 text-center">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-500 shadow-inner">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Carbon Data</h3>
                <p className="text-gray-500">Calculate your first carbon footprint to start your green journey.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.map((record) => (
                  <div key={record._id} className="group bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-teal-100/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="px-4 py-1.5 bg-gray-900 text-white text-xs font-black rounded-xl uppercase tracking-wider shadow-sm">
                        {new Date(2024, record.month - 1).toLocaleString('default', { month: 'short' })} {record.year}
                      </div>
                      <button onClick={() => handleDelete(record._id)} className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    <div className="relative z-10 mb-6">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Emissions</p>
                      <p className="text-5xl font-black text-gray-900 flex items-baseline gap-2">
                        {record.co2Emission?.toFixed(1) || '0.0'}
                        <span className="text-lg font-bold text-gray-400">kg CO₂</span>
                      </p>
                    </div>

                    <div className="relative z-10 border-t border-gray-100 pt-4 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500 font-medium">Rating:</div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(record.status)}`}>
                          {record.status}
                        </div>
                      </div>

                      {record.status === 'High' && (
                        <div className="mt-2 bg-amber-50 rounded-xl p-4 border border-amber-100">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="font-bold text-amber-800 text-sm">Actionable Tips</span>
                          </div>
                          <ul className="list-disc pl-5 text-xs text-amber-700 space-y-1 font-medium">
                            {getDynamicTips(record).map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'analytics' ? (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in duration-300">
              <h3 className="text-2xl font-extrabold mb-8 text-gray-800">Emissions Trend</h3>
              {records.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No data available to construct the tracking graph.</p>
                </div>
              ) : (
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}kg`} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <Tooltip
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#0f766e', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="co2" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorCo2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in duration-300">
              <h3 className="text-2xl font-extrabold mb-8 text-gray-800">Emissions Breakdown</h3>
              {records.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No data available for breakdown graph.</p>
                </div>
              ) : (
                <div className="h-96 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}kg`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="Electricity" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Gas" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Transport" stackId="a" fill="#10b981" />
                      <Bar dataKey="Waste" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CarbonTracker;
