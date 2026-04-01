import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { energyAuditApi, applianceApi } from '../services/api';
import Layout from '../components/Layout';

const EnergyAuditManagement = () => {
    const navigate = useNavigate();
    const [audits, setAudits] = useState([]);
    const [appliances, setAppliances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeAudit, setActiveAudit] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('summary');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState(null);

    // AI Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    const [form, setForm] = useState({
        month: new Date().toISOString().slice(0, 7),
        totalUnits: '',
        householdSize: 1,
        peakUsage: 'Day',
        selectedAppliances: []
    });

    const [isEditing, setIsEditing] = useState(null);

    const formatMonth = (monthStr) => {
        if (!monthStr) return '';
        const [year, month] = monthStr.split('-');
        return new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    };

    const fetchAudits = useCallback(async () => {
        setLoading(true);
        try {
            const response = await energyAuditApi.getAudits();
            setAudits(response.data);
            if (response.data.length > 0 && !activeAudit) {
                setActiveAudit(response.data[0]);
            }
        } catch (err) {
            setError('Failed to fetch audits');
            if (err.response?.status === 401) navigate('/user-management');
        } finally {
            setLoading(false);
        }
    }, [navigate, activeAudit]);

    const fetchAppliances = useCallback(async () => {
        try {
            const response = await applianceApi.getAppliances();
            setAppliances(response.data.data || []);
        } catch (err) {
            console.error('Appliance fetch error:', err);
            setAppliances([]);
        }
    }, []);

    useEffect(() => {
        fetchAudits();
        fetchAppliances();
    }, [fetchAudits, fetchAppliances]);

    useEffect(() => {
        if (activeTab === 'assistant') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    const handleApplianceToggle = (appliance) => {
        const isSelected = form.selectedAppliances.find(a => a.applianceId === appliance._id);
        if (isSelected) {
            setForm({
                ...form,
                selectedAppliances: form.selectedAppliances.filter(a => a.applianceId !== appliance._id)
            });
        } else {
            setForm({
                ...form,
                selectedAppliances: [...form.selectedAppliances, {
                    applianceId: appliance._id,
                    name: appliance.name,
                    usageHours: appliance.usageHours || 1
                }]
            });
        }
    };

    const handleCreateAudit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (!form.totalUnits || form.selectedAppliances.length === 0) {
                setError('Please provide usage units and select appliances');
                return;
            }

            const auditData = {
                month: form.month,
                totalUnits: parseFloat(form.totalUnits),
                householdSize: parseInt(form.householdSize),
                peakUsage: form.peakUsage,
                appliances: form.selectedAppliances.map(({ applianceId, usageHours }) => ({ applianceId, usageHours }))
            };

            if (isEditing) {
                const response = await energyAuditApi.updateAudit(isEditing, auditData);
                setAudits(audits.map(a => a._id === isEditing ? response.data : a));
                setActiveAudit(response.data);
                setIsEditing(null);
            } else {
                const response = await energyAuditApi.createAudit(auditData);
                setAudits([response.data, ...audits]);
                setActiveAudit(response.data);
            }
            setShowForm(false);
            setForm({ month: new Date().toISOString().slice(0, 7), totalUnits: '', householdSize: 1, peakUsage: 'Day', selectedAppliances: [] });
            setActiveTab('summary');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process energy audit');
        }
    };

    const handleDeleteAudit = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this audit?')) return;
        try {
            await energyAuditApi.deleteAudit(id);
            setAudits(audits.filter(a => a._id !== id));
            if (activeAudit?._id === id) setActiveAudit(null);
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const startEditing = () => {
        if (!activeAudit) return;
        setIsEditing(activeAudit._id);
        setForm({
            month: activeAudit.month,
            totalUnits: activeAudit.totalUnits,
            householdSize: activeAudit.householdSize,
            peakUsage: activeAudit.peakUsage,
            selectedAppliances: activeAudit.appliances.map(a => ({
                applianceId: a.applianceId?._id || a.applianceId,
                name: a.applianceId?.name || '',
                usageHours: a.usageHours
            }))
        });
        setShowForm(true);
    };

    const handleChat = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || !activeAudit) return;

        const userMsg = { role: 'user', content: userInput };
        setChatMessages(prev => [...prev, userMsg]);
        setUserInput('');
        setChatLoading(true);

        try {
            const response = await energyAuditApi.chatWithAudit(activeAudit._id, {
                message: userInput,
                history: chatMessages.slice(-4)
            });
            setChatMessages(prev => [...prev, { role: 'model', content: response.data.response }]);
        } catch (err) {
            console.error('AI chat error:', err);
        } finally {
            setChatLoading(false);
        }
    };

    const runSimulation = async (applianceId, parameter, value) => {
        if (!activeAudit) return;
        setIsSimulating(true);
        try {
            const response = await energyAuditApi.simulateChange(activeAudit._id, {
                changes: [{ applianceId, parameter, value: parseFloat(value) }]
            });
            setSimulationResult(response.data);
        } catch (err) {
            console.error('Simulation error:', err);
        } finally {
            setIsSimulating(false);
        }
    };

    const tabs = [
        { id: 'summary', label: 'Summary', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg> },
        { id: 'strategy', label: 'Strategy', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
        { id: 'projection', label: 'Impact', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4" /></svg> },
        { id: 'assistant', label: 'Chat Pulse', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
    ];

    return (
        <Layout>
            <div className="section-padding max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12 min-h-[700px]">
                    {/* Simplified Sidebar */}
                    <aside className="w-full lg:w-72 space-y-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-lg font-bold text-gray-900">History</h2>
                                <button
                                    onClick={() => { setShowForm(true); setIsEditing(null); }}
                                    className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-teal-100"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
                                </button>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse"></div>)}
                                </div>
                            ) : audits.length === 0 ? (
                                <div className="text-center py-10 opacity-30 italic text-xs">No records</div>
                            ) : (
                                <div className="space-y-3">
                                    {audits.map(audit => (
                                        <div
                                            key={audit._id}
                                            onClick={() => { setActiveAudit(audit); setShowForm(false); setActiveTab('summary'); }}
                                            className={`p-4 rounded-2xl cursor-pointer transition-all border group ${activeAudit?._id === audit._id ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-100'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider font-asap">{formatMonth(audit.month)} {new Date(audit.createdAt).getFullYear()}</span>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setActiveAudit(audit); startEditing(); }} 
                                                        className="text-gray-300 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteAudit(audit._id, e)} 
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    >
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1-1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">{audit.totalUnits} <span className="text-xs font-normal text-gray-400 font-asap">kWh</span></p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-grow">
                        {showForm ? (
                            <div className="bg-white p-10 lg:p-20 rounded-[3.5rem] shadow-premium border border-gray-100 animate-in zoom-in-95 duration-500">
                                <div className="flex justify-between items-center mb-16">
                                    <h2 className="text-4xl font-bold text-gray-900">{isEditing ? 'Pulse Correction' : 'Pulse Discovery'}</h2>
                                    <button onClick={() => setShowForm(false)} className="px-5 py-2 text-xs font-bold text-gray-400 hover:text-gray-900 border border-gray-100 rounded-full transition-colors uppercase tracking-widest">Close</button>
                                </div>

                                <form onSubmit={handleCreateAudit} className="space-y-16">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 font-asap">Units Used (kWh)</label>
                                            <input type="number" step="0.1" value={form.totalUnits} onChange={e => setForm({ ...form, totalUnits: e.target.value })} className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-2xl font-bold focus:bg-white focus:ring-4 focus:ring-teal-50 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 font-asap">People</label>
                                            <input type="number" value={form.householdSize} onChange={e => setForm({ ...form, householdSize: e.target.value })} className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-2xl font-bold focus:bg-white focus:ring-4 focus:ring-teal-50 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 font-asap">Month</label>
                                            <input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-xl font-bold focus:bg-white focus:ring-4 focus:ring-teal-50 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 font-asap">Peak Usage</label>
                                            <select value={form.peakUsage} onChange={e => setForm({ ...form, peakUsage: e.target.value })} className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-xl font-bold focus:bg-white focus:ring-4 focus:ring-teal-50 outline-none transition-all appearance-none cursor-pointer">
                                                <option value="Day">Day Focus (6am-6pm)</option>
                                                <option value="Night">Peak Focus (6pm-12am)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 font-asap">Active Appliances</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {appliances.map(app => (
                                                <div
                                                    key={app._id}
                                                    onClick={() => handleApplianceToggle(app)}
                                                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${form.selectedAppliances.find(a => a.applianceId === app._id) ? 'bg-teal-600 border-teal-600 shadow-lg text-white' : 'bg-gray-50 border-transparent hover:border-teal-100'}`}
                                                >
                                                    <p className="font-bold text-sm mb-1 truncate">{app.name}</p>
                                                    <p className={`text-[10px] uppercase font-bold tracking-widest font-asap ${form.selectedAppliances.find(a => a.applianceId === app._id) ? 'text-teal-100' : 'text-gray-400'}`}>{app.powerConsumption}W</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary w-full py-6 text-xl shadow-teal-50 uppercase tracking-widest">
                                        {isEditing ? 'Confirm Update' : 'Start Audit'}
                                    </button>
                                </form>
                            </div>
                        ) : !activeAudit ? (
                            <div className="h-full bg-white rounded-[3.5rem] border border-gray-100 flex flex-col items-center justify-center p-24 text-center shadow-premium">
                                <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-8">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <h2 className="text-3xl font-bold mb-4 text-gray-900 leading-tight">Begin Discovery</h2>
                                <p className="text-gray-500 mb-12 max-w-sm italic mx-auto">Analyze your consumption patterns and reveal hidden energy patterns.</p>
                                <button onClick={() => setShowForm(true)} className="btn-primary">Analyze now</button>
                            </div>
                        ) : (
                            <div className="space-y-12 animate-in fade-in duration-500">
                                {/* Tab Interface */}
                                <div className="flex flex-wrap gap-4 border-b border-gray-100 pb-2">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2.5 px-6 py-4 rounded-t-3xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-teal-50 text-teal-700 shadow-inner' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900 border-transparent'}`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="min-h-[500px]">
                                    {activeTab === 'summary' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in zoom-in-95 duration-500">
                                            <div className="card-premium relative group border-none bg-gray-50 hover:bg-white">
                                                <button onClick={startEditing} className="absolute top-8 right-8 p-3 text-gray-300 hover:text-teal-600 hover:bg-teal-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 font-asap">Quality of consumption</p>
                                                <div className="flex items-end gap-3 mb-10">
                                                    <h3 className={`text-8xl font-bold leading-none ${activeAudit.efficiencyScore > 70 ? 'text-teal-600' : 'text-rose-500'}`}>
                                                        {activeAudit.efficiencyScore}%
                                                    </h3>
                                                    <p className="text-gray-300 font-bold mb-4 uppercase tracking-widest text-[10px] underline decoration-teal-600 decoration-2 font-asap">Score</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeAudit.badges?.map((badge, idx) => (
                                                        <span key={idx} className="px-4 py-2 bg-white text-teal-700 text-[9px] font-bold rounded-xl border border-teal-100 shadow-sm uppercase tracking-widest font-asap">🏆 {badge}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-12 flex flex-col justify-center">
                                                <h4 className="text-3xl font-bold text-gray-900 mb-8 italic">"{activeAudit.aiSummary}"</h4>
                                                <p className="text-lg text-gray-500 font-medium leading-relaxed italic">Flux Pulse AI has analyzed your monthly behavior and current household capacity.</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'strategy' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-5 duration-500">
                                            <div className="space-y-8">
                                                <h4 className="text-xl font-bold text-gray-900 mb-6 font-asap uppercase tracking-widest">Active Pulse Strategy</h4>
                                                <div className="space-y-6">
                                                    {activeAudit.aiRecommendations?.map((rec, idx) => (
                                                        <div key={idx} className="flex gap-6 p-10 bg-white border border-gray-100 rounded-[3rem] shadow-premium group hover:border-teal-200 transition-all">
                                                            <div className="w-10 h-10 bg-teal-50 text-teal-600 font-bold rounded-full flex-shrink-0 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                                {idx + 1}
                                                            </div>
                                                            <p className="text-lg font-bold text-gray-900 leading-relaxed italic">"{rec}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-dim p-12 rounded-[3.5rem] flex flex-col justify-between border border-gray-100 shadow-inner">
                                                <div className="space-y-12">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-asap">Impact Zone</p>
                                                        <p className="text-2xl font-bold text-gray-900">{activeAudit.peakUsage} Focus Area</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-asap">Household Weight</p>
                                                        <p className="text-2xl font-bold text-gray-900 lg:text-3xl decoration-teal-600 underline decoration-4">{activeAudit.householdSize} Member Household</p>
                                                    </div>
                                                </div>
                                                <div className="mt-12 py-10 border-t border-gray-200">
                                                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-4 font-asap">Flux AI Verdict</p>
                                                    <p className="text-2xl font-bold text-teal-900 italic leading-relaxed">Grade: {activeAudit.efficiencyScore > 80 ? 'Premium Efficiency' : 'Optimization Potential Active'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'projection' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in slide-in-from-right-5 duration-500">
                                            <div className="bg-white p-12 rounded-[3.5rem] shadow-premium border border-gray-100 lg:col-span-1 space-y-12">
                                                <h4 className="text-xl font-bold text-gray-900 italic mb-8">Habit Discovery</h4>
                                                <div className="space-y-10">
                                                    {activeAudit.appliances?.slice(0, 4).map(item => (
                                                        <div key={item.applianceId?._id || item.applianceId}>
                                                            <div className="flex justify-between items-center mb-3 px-1">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-asap">{item.applianceId?.name || 'Device'}</span>
                                                                <span className="text-[10px] font-bold text-teal-600 font-asap italic uppercase">{item.usageHours}h habitual</span>
                                                            </div>
                                                            <input
                                                                type="range" min="0" max="24" step="0.5" defaultValue={item.usageHours}
                                                                onMouseUp={(e) => runSimulation(item.applianceId?._id || item.applianceId, 'usageHours', e.target.value)}
                                                                className="w-full h-1 bg-gray-100 rounded-full accent-teal-600 cursor-pointer"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[9px] uppercase font-bold text-gray-400 text-center tracking-widest italic pt-10">Adjust future usage to see Flux pulse projections.</p>
                                            </div>

                                            <div className="lg:col-span-2 bg-gradient-to-br from-teal-500 to-cyan-900 rounded-[4rem] p-24 text-center text-white relative shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                                                <div className="relative z-10">
                                                    {isSimulating ? (
                                                        <div className="flex flex-col items-center gap-10">
                                                            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                            <p className="font-bold uppercase tracking-[0.3em] text-xs">AI projecting...</p>
                                                        </div>
                                                    ) : simulationResult ? (
                                                        <div className="space-y-16 animate-in zoom-in-95 duration-500">
                                                            <div>
                                                                <p className="text-[12px] font-bold uppercase tracking-[0.5em] mb-10 opacity-70">Monthly Savings Potential</p>
                                                                <h3 className="text-[8rem] font-bold leading-none tracking-tighter">
                                                                    {simulationResult.estimated_savings_units?.toFixed(1)}
                                                                    <span className="text-xl ml-4 opacity-50 uppercase tracking-widest">Units</span>
                                                                </h3>
                                                            </div>
                                                            <div className="flex flex-col items-center max-w-xl">
                                                                <p className="text-2xl font-bold leading-relaxed italic opacity-95 underline decoration-teal-400 decoration-2">"{simulationResult.explanation}"</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-8">
                                                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-10">
                                                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                                            </div>
                                                            <h3 className="text-4xl font-bold italic mb-6">Simulation Active</h3>
                                                            <p className="text-teal-100 text-lg opacity-80 max-w-sm mx-auto leading-relaxed">Pulse any device slider to reveal your habitual energy potential.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'assistant' && (
                                        <div className="bg-white rounded-[4rem] shadow-premium border border-gray-100 flex flex-col h-[700px] animate-in fade-in duration-700 overflow-hidden">
                                            <div className="p-10 border-b border-gray-50 flex items-center gap-6">
                                                <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold italic shadow-lg">P</div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">Flux Assistant</h3>
                                                    <p className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">Habit pulse analyzer</p>
                                                </div>
                                            </div>

                                            <div className="flex-grow p-12 overflow-y-auto space-y-10 custom-scrollbar bg-dim/30">
                                                {chatMessages.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-24">
                                                        <p className="text-3xl font-bold italic mb-6 text-gray-400">"What are my peak slab impacts?"</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Inquire about CEB/LECO slab optimizations and high-load appliance timing.</p>
                                                    </div>
                                                )}
                                                {chatMessages.map((msg, idx) => (
                                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[75%] px-10 py-6 rounded-[2.5rem] text-lg font-bold leading-relaxed italic ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none shadow-xl' : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none shadow-sm'}`}>
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                ))}
                                                {chatLoading && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-white px-8 py-5 rounded-[2rem] rounded-bl-none flex gap-2 border border-gray-100">
                                                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={chatEndRef} />
                                            </div>

                                            <form onSubmit={handleChat} className="p-10 bg-white border-t border-gray-50 flex gap-6">
                                                <input
                                                    value={userInput}
                                                    onChange={e => setUserInput(e.target.value)}
                                                    placeholder="Pulse inquire..."
                                                    className="grow bg-gray-50 border-0 rounded-3xl px-10 py-6 font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-teal-50 outline-none transition-all shadow-inner"
                                                />
                                                <button type="submit" disabled={chatLoading} className="w-24 bg-teal-600 text-white rounded-[2.5rem] flex items-center justify-center hover:bg-teal-700 transition-all shadow-xl active:scale-95 disabled:grayscale">
                                                    <svg className="w-8 h-8 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg>
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </Layout>
    );
};

export default EnergyAuditManagement;
