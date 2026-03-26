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
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState(null);

    // AI Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
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
            // The API returns { message, results, data: [...] }
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
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

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

    return (
        <Layout>
            <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-100px)]">
                {/* Left Sidebar: Audit History */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900 italic">Audit Log</h2>
                            <button onClick={() => setShowForm(!showForm)} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:rotate-90 transition-all duration-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-center text-gray-400">Loading...</p>
                        ) : audits.length === 0 ? (
                            <p className="text-gray-400 text-sm font-medium italic">No audits performed yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {audits.map(audit => (
                                    <div
                                        key={audit._id}
                                        onClick={() => { setActiveAudit(audit); setChatMessages([]); setSimulationResult(null); }}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${activeAudit?._id === audit._id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-white hover:shadow-md'}`}
                                    >
                                        <p className="font-black text-xs text-blue-800 uppercase tracking-tighter mb-1">{formatMonth(audit.month)} {new Date(audit.createdAt).getFullYear()}</p>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-lg font-black text-gray-900">{audit.totalUnits} <span className="text-xs font-bold text-gray-400">units</span></span>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => handleDeleteAudit(audit._id, e)} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                                <span className={`px-2 py-1 text-[8px] font-black rounded-lg uppercase ${audit.efficiencyScore > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    Score: {audit.efficiencyScore || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <h4 className="text-xl font-black mb-4 italic">Efficiency Power</h4>
                        <p className="text-xs text-blue-200 leading-relaxed font-medium">Flux Energy AI analyzes your habit patterns and suggests optimizations for a sustainable future.</p>
                    </div>
                </div>

                {/* Main Content: Audit Details & AI Chat */}
                <div className="flex-grow space-y-8">
                    {showForm ? (
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-500">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black text-gray-900 italic">{isEditing ? 'Update Energy Audit' : 'Start New Energy Audit'}</h2>
                                <button onClick={() => { setShowForm(false); setIsEditing(null); }} className="text-gray-400 hover:text-gray-900 font-black uppercase text-xs tracking-widest">Cancel</button>
                            </div>
                            {error && <p className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 font-bold">{error}</p>}
                            <form onSubmit={handleCreateAudit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Consumption Unit (kWh)</label>
                                        <input type="number" step="0.1" value={form.totalUnits} onChange={e => setForm({ ...form, totalUnits: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-xl" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Household Size</label>
                                        <input type="number" value={form.householdSize} onChange={e => setForm({ ...form, householdSize: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-xl" placeholder="1" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Billing Month</label>
                                        <input
                                            type="month"
                                            value={form.month}
                                            onChange={e => setForm({ ...form, month: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Peak Usage Period</label>
                                        <select
                                            value={form.peakUsage}
                                            onChange={e => setForm({ ...form, peakUsage: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-xl appearance-none"
                                        >
                                            <option value="Day">Day (6 AM - 6 PM)</option>
                                            <option value="Night">Night (6 PM - 6 AM)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Select Active Appliances</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {appliances.map(app => (
                                            <div
                                                key={app._id}
                                                onClick={() => handleApplianceToggle(app)}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.selectedAppliances.find(a => a.applianceId === app._id) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-white hover:border-blue-200'}`}
                                            >
                                                <p className="font-black text-xs leading-none mb-1">{app.name}</p>
                                                <p className={`text-[10px] font-bold ${form.selectedAppliances.find(a => a.applianceId === app._id) ? 'text-blue-100' : 'text-gray-400'}`}>{app.powerConsumption}W</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-2xl hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all active:scale-[0.98]">
                                    {isEditing ? 'Update Audit with AI' : 'Generate AI Analysis'}
                                </button>
                            </form>
                        </div>
                    ) : !activeAudit ? (
                        <div className="h-full flex flex-col items-center justify-center p-20 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm opacity-50">
                            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8"><svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                            <h2 className="text-2xl font-black text-gray-400">Ready for Analysis</h2>
                            <p className="text-gray-400 font-medium">Run your first audit to get personalized AI insights.</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-700">
                            {/* AI Analysis Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative group">
                                    <button onClick={startEditing} className="absolute top-8 right-8 p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Efficiency Status</p>
                                    <div className="flex items-end gap-3 mb-2">
                                        <h3 className={`text-6xl font-black ${activeAudit.efficiencyScore > 70 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {activeAudit.efficiencyScore}%
                                        </h3>
                                        <p className="text-gray-400 font-bold mb-2">Score</p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-600 italic mb-6">"{activeAudit.aiSummary}"</p>
                                    
                                    {activeAudit.badges && activeAudit.badges.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeAudit.badges.map((badge, bIdx) => (
                                                <div key={bIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 text-blue-700 text-[10px] font-black rounded-xl uppercase tracking-widest border border-blue-100">
                                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                                                    {badge}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-2 bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase mb-6 tracking-widest">AI Observations</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {activeAudit.aiRecommendations?.slice(0, 4).map((recommendation, idx) => (
                                            <div key={idx} className="flex gap-3 text-sm">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                <p className="text-gray-300 font-medium leading-relaxed">{recommendation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Impact Simulation & AI Chat */}
                            {showChat && (
                                <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] border-l border-gray-100 z-50 flex flex-col animate-in slide-in-from-right duration-500">
                                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>
                                            <h3 className="text-xl font-black text-gray-900">Energy Assistant</h3>
                                        </div>
                                        <button onClick={() => setShowChat(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>

                                    <div className="flex-grow p-6 overflow-y-auto space-y-6">
                                        {chatMessages.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-10">
                                                <p className="text-lg font-black text-gray-400 italic mb-2">"How can I reduce my bill further?"</p>
                                                <p className="text-sm text-gray-400 font-medium">Ask Flux AI about this audit's findings.</p>
                                            </div>
                                        )}
                                        {chatMessages.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && <div className="flex justify-start"><div className="bg-gray-100 px-6 py-4 rounded-[2rem] rounded-bl-none flex gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-300"></span></div></div>}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <form onSubmit={handleChat} className="p-6 border-t border-gray-100 flex gap-3">
                                        <input
                                            value={userInput}
                                            onChange={e => setUserInput(e.target.value)}
                                            placeholder="Ask a question..."
                                            className="grow bg-gray-100 border-0 rounded-2xl px-6 py-4 font-bold text-gray-800 focus:ring-4 focus:ring-blue-100 outline-none"
                                        />
                                        <button type="submit" disabled={chatLoading} className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg active:scale-90">
                                            <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Simulation Panel */}
                            <div className="w-full space-y-6">
                                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black text-gray-900 italic">Impact Simulator</h3>
                                        {!showChat && (
                                            <button 
                                                onClick={() => setShowChat(true)}
                                                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                Ask Assistant
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        {activeAudit.appliances?.slice(0, 3).map(item => (
                                            <div key={item.applianceId?._id || item.applianceId}>
                                                <div className="flex justify-between items-center px-1 mb-2">
                                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.applianceId?.name || item.name || 'Device'}</span>
                                                    <span className="text-xs font-bold text-blue-600">{item.usageHours}h Usage</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="range" min="0" max="24" step="0.5" defaultValue={item.usageHours}
                                                        onMouseUp={(e) => runSimulation(item.applianceId?._id || item.applianceId, 'usageHours', e.target.value)}
                                                        className="grow accent-blue-600 h-2 mt-4"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <p className="text-[10px] text-gray-400 text-center font-bold px-4 italic leading-tight">Adjust any slider to see how usage changes affect your efficiency real-time via AI projection.</p>
                                    </div>
                                </div>

                                {simulationResult && (
                                    <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500">
                                        <p className="text-[10px] font-black uppercase mb-4 opacity-70">Simulation Success</p>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-3xl font-black italic">{simulationResult.estimated_savings_units?.toFixed(2)} <span className="text-sm not-italic opacity-60">Units Saved</span></h4>
                                                <p className="text-xs font-bold text-emerald-100">Projected savings with recommended patterns.</p>
                                            </div>
                                            <div className="pt-4 border-t border-white/10">
                                                <p className="text-sm font-bold leading-relaxed italic">AI Verdict: "{simulationResult.explanation}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default EnergyAuditManagement;
