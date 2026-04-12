/**
 * CarbonTracker Component
 * Dashboard for monitoring environmental impact. Allows users to log monthly
 * consumption data (electricity, gas, transport) and view emission trends and insights.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import carbonService from '../services/carbonFootprint.service';
import Layout from '../components/Layout';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

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

  // Unified state for carbon records and UI controls
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('records');
  const [editingRecord, setEditingRecord] = useState(null);

  // Form state for recording monthly footprints
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    month: String(new Date().getMonth() + 1),
    year: new Date().getFullYear(),
    electricity: '',
    gasSelections: [],
    gasAmounts: {},
    transportSelections: [],
    transportDistances: {},
    waste: ''
  });

  // Fetch carbon footprint history from the backend
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
    if (editingRecord) {
      await handleUpdate();
    } else {
      setError('');
      try {
        // Basic validation
        if (!form.electricity && form.electricity !== 0) {
          setError('Please enter electricity consumption.');
          return;
        }

        // Prepare payload to ensure numbers are safely parsed
        // Destructure 'date' out to avoid sending UI-only fields to backend
        const { date, ...formData } = form;
        const payload = {
          ...formData,
          electricity: parseFloat(form.electricity) || 0,
          waste: parseFloat(form.waste) || 0,
          month: String(form.month),
          year: parseInt(form.year, 10),
          gasAmounts: Object.fromEntries(
            Object.entries(form.gasAmounts).map(([k, v]) => [k, parseFloat(v) || 0])
          ),
          transportDistances: Object.fromEntries(
            Object.entries(form.transportDistances).map(([k, v]) => [k, parseFloat(v) || 0])
          )
        };

        await carbonService.createRecord(payload);
        setForm({
          date: new Date().toISOString().split('T')[0],
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

  const handleEdit = (record) => {
    setEditingRecord(record);
    setForm({
      date: new Date(record.year, record.month - 1).toISOString().split('T')[0],
      month: String(record.month),
      year: record.year,
      electricity: String(record.electricity || ''),
      gasSelections: record.gasData?.selections || [],
      gasAmounts: record.gasData?.amounts || {},
      transportSelections: record.transportData?.selections || [],
      transportDistances: record.transportData?.distances || {},
      waste: String(record.waste || '')
    });
    setShowForm(true);
  };

  const handleUpdate = async () => {
    setError('');
    try {
      if (!form.electricity && form.electricity !== 0) {
        setError('Please enter electricity consumption.');
        return;
      }

      const { date, ...formData } = form;
      const payload = {
        ...formData,
        electricity: parseFloat(form.electricity) || 0,
        waste: parseFloat(form.waste) || 0,
        month: String(form.month),
        year: parseInt(form.year, 10),
        gasAmounts: Object.fromEntries(
          Object.entries(form.gasAmounts).map(([k, v]) => [k, parseFloat(v) || 0])
        ),
        transportDistances: Object.fromEntries(
          Object.entries(form.transportDistances).map(([k, v]) => [k, parseFloat(v) || 0])
        )
      };

      await carbonService.updateRecord(editingRecord._id, payload);
      setEditingRecord(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
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
      setError(err.response?.data?.message || 'Failed to update record');
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setForm({
      date: new Date().toISOString().split('T')[0],
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
  };

  const getDynamicTips = (record) => {
    const tips = [];

    if (record.status === 'High') {
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
        tips.push("Gas consumption is significant. Ensure your cooking and heating appliances are well-maintained.");
      }

      // Transport
      let carDistance = 0;
      if (record.transportData && record.transportData.distances) {
        const dist = record.transportData.distances;
        carDistance = (parseFloat(dist.petrolCar) || 0) + (parseFloat(dist.dieselCar) || 0);
      }
      if (carDistance > 100) {
        tips.push("Personal vehicle usage is high. Consider carpooling or using public transportation.");
      }

      if (tips.length === 0) {
        tips.push("Consider a comprehensive energy audit to identify hidden areas of high emissions.");
      }
    } else if (record.status === 'Moderate') {
      tips.push("You're doing well! Try to reduce energy use during peak hours to reach 'Low' status.");
      tips.push("Ensure all idle electronics are unplugged to eliminate phantom power consumption.");
      tips.push("Small changes like using a kettle only for the amount needed can help.");
    } else {
      tips.push("Excellent work! You're a green champion. Keep maintaining these sustainable habits.");
      tips.push("Great job! Keep using natural light during the day to maintain your low energy usage.");
      tips.push("Consider sharing your energy-saving tips with neighbors to build a greener community.");
    }

    return tips;
  };

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

  const chartData = Object.values(records.reduce((acc, r) => {
    // Grouping by year and month for the trend/bar charts
    const key = `${r.year}-${r.month}`;
    if (!acc[key]) {
      acc[key] = {
        name: `${new Date(2024, r.month - 1).toLocaleString('default', { month: 'short' })} ${r.year.toString().slice(-2)}`,
        co2: 0,
        Electricity: 0,
        Gas: 0,
        Transport: 0,
        Waste: 0,
        count: 0,
        sortKey: r.year * 100 + parseInt(r.month)
      };
    }

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

    // Calculate CO2 emissions from waste
    const wasteCO2 = (parseFloat(r.waste) || 0) * EMISSION_FACTORS.waste;

    // Accumulate CO2 values for each category
    acc[key].co2 += parseFloat((r.co2Emission || 0).toFixed(1));
    acc[key].Electricity += parseFloat(elecCO2.toFixed(1));
    acc[key].Gas += parseFloat(gasCO2.toFixed(1));
    acc[key].Transport += parseFloat(transCO2.toFixed(1));
    acc[key].Waste += parseFloat(wasteCO2.toFixed(1));
    acc[key].count += 1;

    return acc;
  }, {})).sort((a, b) => a.sortKey - b.sortKey).map(({ sortKey, ...rest }) => ({
    ...rest,
    co2: parseFloat(rest.co2.toFixed(1)),
    Electricity: parseFloat(rest.Electricity.toFixed(1)),
    Gas: parseFloat(rest.Gas.toFixed(1)),
    Transport: parseFloat(rest.Transport.toFixed(1)),
    Waste: parseFloat(rest.Waste.toFixed(1))
  }));

  // Create individual record data for detailed breakdown chart
  const individualChartData = records.map((r, index) => {
    // Calculate electricity CO2 emissions for this record
    const elecCO2 = (parseFloat(r.electricity) || 0) * EMISSION_FACTORS.electricity;
    
    // Calculate gas CO2 emissions from natural gas and LPG
    let gasCO2 = 0;
    if (r.gasData && r.gasData.amounts) {
      if (r.gasData.amounts.natural) gasCO2 += (parseFloat(r.gasData.amounts.natural) || 0) * EMISSION_FACTORS.naturalGas;
      if (r.gasData.amounts.lpg) gasCO2 += (parseFloat(r.gasData.amounts.lpg) || 0) * EMISSION_FACTORS.lpg;
    }
    
    // Calculate transport CO2 emissions from different vehicle types
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
      name: `#${records.length - index} (${new Date(2024, r.month - 1).toLocaleString('default', { month: 'short' })})`,
      Electricity: parseFloat(elecCO2.toFixed(1)),
      Gas: parseFloat(gasCO2.toFixed(1)),
      Transport: parseFloat(transCO2.toFixed(1)),
      Waste: parseFloat(wasteCO2.toFixed(1)),
      total: parseFloat((r.co2Emission || 0).toFixed(1))
    };
  }).reverse();

  const rawMax = Math.max(...individualChartData.map(d => d.total || 0), 0);
  const maxTotal = Math.ceil((rawMax > 0 ? rawMax : 100) / 10) * 10 + 10;

  const totalEmissions = records.reduce((acc, r) => {
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

    acc.Electricity += elecCO2;
    acc.Gas += gasCO2;
    acc.Transport += transCO2;
    acc.Waste += wasteCO2;
    return acc;
  }, { Electricity: 0, Gas: 0, Transport: 0, Waste: 0 });

  const pieData = [
    { name: 'Electricity', value: parseFloat(totalEmissions.Electricity.toFixed(1)), color: '#3b82f6' },
    { name: 'Gas', value: parseFloat(totalEmissions.Gas.toFixed(1)), color: '#f59e0b' },
    { name: 'Transport', value: parseFloat(totalEmissions.Transport.toFixed(1)), color: '#10b981' },
    { name: 'Waste', value: parseFloat(totalEmissions.Waste.toFixed(1)), color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Carbon Footprint Tracker
            </h1>
            <p className="text-gray-500 text-lg font-light">
              Measure, monitor, and reduce your environmental impact.
            </p>
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'records' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Records
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Trend Graph
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'breakdown' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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

        {activeTab === 'records' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Historical Carbon Footprints</h2>
              <button
                onClick={() => {
                  if (editingRecord) {
                    handleCancelEdit();
                  } else {
                    setShowForm(!showForm);
                  }
                }}
                className={`${editingRecord ? 'px-10 py-4 text-gray-400 font-bold border border-gray-100 rounded-full hover:text-gray-900 transition-colors uppercase text-xs tracking-widest' : 'btn-primary flex items-center gap-2'}`}
              >
                {editingRecord ? '✕ Cancel Edit' : (showForm ? '✕ Cancel' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Calculate Footprint</>)}
              </button>
            </div>

            {showForm && (
              <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <h3 className="text-2xl font-extrabold mb-8 text-gray-800 relative z-10">{editingRecord ? 'Edit Footprint Record' : 'New Footprint Record'}</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-blue-600 mb-2 ml-1">Reporting Period (Date)</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => {
                          const d = new Date(e.target.value);
                          setForm({
                            ...form,
                            date: e.target.value,
                            month: String(d.getMonth() + 1),
                            year: d.getFullYear()
                          });
                        }}
                        className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-black"
                      />
                      <div className="flex gap-4 mt-2 ml-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected: {new Date(form.year, form.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-blue-600 mb-2 ml-1">Electricity (kWh)</label>
                      <input
                        type="number"
                        value={form.electricity}
                        onChange={(e) => setForm({ ...form, electricity: e.target.value })}
                        placeholder="0"
                        className="w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl text-black shadow-sm"
                      />
                    </div>

                    <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                      <label className="block text-sm font-bold text-blue-600 mb-3">Gas Usage</label>
                      <div className="flex gap-3 mb-4 flex-wrap">
                        {GAS_TYPES.map(gas => (
                          <button
                            key={gas.id}
                            onClick={() => handleGasSelection(gas.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${form.gasSelections.includes(gas.id)
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
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
                              className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none focus:border-blue-400 font-medium text-black"
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
                    <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                      <label className="block text-sm font-bold text-blue-600 mb-3">Transportation</label>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {TRANSPORT_TYPES.map(trans => (
                          <button
                            key={trans.id}
                            onClick={() => handleTransportSelection(trans.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${form.transportSelections.includes(trans.id)
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
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
                              className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none focus:border-blue-400 font-medium text-black"
                              placeholder="Distance"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">km</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-blue-600 mb-2 ml-1">Waste (kg)</label>
                      <input
                        type="number"
                        value={form.waste}
                        onChange={(e) => setForm({ ...form, waste: e.target.value })}
                        placeholder="0"
                        className="w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl text-black shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4 relative z-10 pt-6 border-t border-blue-100/50">
                  <button
                    onClick={handleSubmit}
                    className="btn-primary text-lg w-full md:w-auto"
                  >
                    {editingRecord ? 'Update Record' : 'Analyze & Save'}
                  </button>
                  {editingRecord && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-10 py-4 text-gray-400 font-bold border border-gray-100 rounded-full hover:text-gray-900 transition-colors uppercase text-xs tracking-widest text-lg w-full md:w-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : records.length === 0 ? (
              <div className="bg-white/50 backdrop-blur-sm p-16 rounded-[2rem] border-2 border-dashed border-blue-100 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-inner">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Carbon Data</h3>
                <p className="text-gray-500">Calculate your first carbon footprint to start your green journey.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.slice().sort((a, b) => (b.year * 100 + parseInt(b.month)) - (a.year * 100 + parseInt(a.month))).map((record) => (
                  <div key={record._id} className="group bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="px-4 py-1.5 bg-gray-900 text-white text-xs font-black rounded-xl uppercase tracking-wider shadow-sm">
                        {new Date(2024, record.month - 1).toLocaleString('default', { month: 'short' })} {record.year}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(record)} className="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(record._id)} className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
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

                      <div className={`mt-2 rounded-xl p-4 border ${record.status === 'High' ? 'bg-amber-50 border-amber-100' : record.status === 'Moderate' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className={`w-5 h-5 ${record.status === 'High' ? 'text-amber-500' : record.status === 'Moderate' ? 'text-blue-500' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className={`font-bold text-sm ${record.status === 'High' ? 'text-amber-600' : record.status === 'Moderate' ? 'text-blue-600' : 'text-emerald-600'}`}>Actionable Tips</span>
                        </div>
                        <ul className={`list-disc pl-5 text-xs space-y-1 font-medium ${record.status === 'High' ? 'text-amber-700' : record.status === 'Moderate' ? 'text-blue-700' : 'text-emerald-700'}`}>
                          {getDynamicTips(record).map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-teal-500 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Impact</p>
                    <h4 className="text-3xl font-black">
                      {records.reduce((acc, r) => acc + (r.co2Emission || 0), 0).toFixed(1)}
                      <span className="text-sm ml-1 opacity-70">kg</span>
                    </h4>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Monthly Average</p>
                    <h4 className="text-3xl font-black text-gray-900">
                      {(records.reduce((acc, r) => acc + (r.co2Emission || 0), 0) / (records.length || 1)).toFixed(1)}
                      <span className="text-sm ml-1 text-gray-400">kg</span>
                    </h4>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Latest Status</p>
                    <h4 className={`text-3xl font-black ${records[0]?.status === 'High' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {records[0]?.status || 'N/A'}
                    </h4>
                  </div>
                </div>

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
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}kg`} />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <Tooltip
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: '#1d4ed8', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="co2" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCo2)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Breakdown Tab */}
        {activeTab === 'breakdown' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : records.length === 0 ? (
              <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500 text-lg">No data available for detailed breakdown.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart - Overall Distribution */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center">
                    <h3 className="text-2xl font-extrabold mb-2 text-gray-800 self-start">Emissions Distribution</h3>
                    <p className="text-gray-400 text-sm mb-8 self-start font-medium">Global impact across all categories</p>
                    <div className="h-72 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value) => [`${value} kg CO₂`, 'Emissions']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-tighter">Total</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">
                          {records.reduce((acc, r) => acc + (r.co2Emission || 0), 0).toFixed(0)}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400">kg</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                      {pieData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{item.name}</p>
                            <p className="text-sm font-black text-gray-800 leading-none">{item.value} <span className="text-[10px] opacity-50">kg</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100 h-full flex flex-col justify-center">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <h4 className="text-3xl font-black mb-2">Impact Analysis</h4>
                      <p className="text-blue-100 mb-8 font-medium">You have recorded <span className="font-black text-white">{records.length} footprints</span> so far. Your primary emission source is <span className="font-black text-white">{pieData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}</span>.</p>

                      <div className="space-y-4">
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 flex justify-between items-center transition-transform hover:scale-[1.02]">
                          <span className="text-sm font-bold">Latest Footprint</span>
                          <span className="text-xl font-black">{records[0]?.co2Emission?.toFixed(1) || 0} kg</span>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 flex justify-between items-center transition-transform hover:scale-[1.02]">
                          <span className="text-sm font-bold">Monthly Average</span>
                          <span className="text-xl font-black">{(records.reduce((acc, r) => acc + (r.co2Emission || 0), 0) / records.length).toFixed(1)} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Record Bar Chart */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-gray-800">Individual Records breakdown</h3>
                      <p className="text-gray-400 text-sm font-medium">Viewing each recorded footprint independently</p>
                    </div>
                    <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">
                      {records.length} Records Found
                    </div>
                  </div>

                  {/* Fixed Legend */}
                  <div className="flex flex-wrap justify-center gap-6 mb-6 pb-4 border-b border-gray-50">
                    {[
                      { name: 'Electricity', color: '#3b82f6' },
                      { name: 'Gas', color: '#f59e0b' },
                      { name: 'Transport', color: '#10b981' },
                      { name: 'Waste', color: '#8b5cf6' }
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="relative border border-gray-100 rounded-[2rem] p-4 bg-gray-50/30">
                    {/* Fixed Y-Axis (Custom HTML Labels) - Guaranteed Visibility */}
                    <div className="absolute left-0 top-[20px] bottom-[45px] w-[80px] z-10 flex flex-col justify-between items-end pr-4 pointer-events-none text-[#64748b] font-medium text-[11px] bg-white">
                      <span>{maxTotal}kg</span>
                      <span>{Math.round(maxTotal * 0.75)}kg</span>
                      <span>{Math.round(maxTotal * 0.5)}kg</span>
                      <span>{Math.round(maxTotal * 0.25)}kg</span>
                      <span>0kg</span>
                    </div>

                    {/* Scrollable Data Area */}
                    <div className="overflow-x-auto pb-4 custom-scrollbar pl-[80px]">
                      <div style={{ width: `${Math.max(individualChartData.length * 120, 800)}px`, height: '400px' }}>
                        <BarChart
                          width={Math.max(individualChartData.length * 120, 800)}
                          height={400}
                          data={individualChartData}
                          margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis hide domain={[0, maxTotal]} />
                          <Tooltip
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '1.5rem', zIndex: 100 }}
                            cursor={{ fill: '#f1f5f9', radius: 10 }}
                          />
                          <Bar dataKey="Electricity" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={60} />
                          <Bar dataKey="Gas" stackId="a" fill="#f59e0b" barSize={60} />
                          <Bar dataKey="Transport" stackId="a" fill="#10b981" barSize={60} />
                          <Bar dataKey="Waste" stackId="a" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={60} />
                        </BarChart>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CarbonTracker;
