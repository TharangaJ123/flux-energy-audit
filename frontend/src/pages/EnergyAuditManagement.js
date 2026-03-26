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
    const chatEndRef = useRef(null);

    const [form, setForm] = useState({
        month: new Date().toLocaleString('default', { month: 'long' }),
        totalUnits: '',
        householdSize: 1,
        selectedAppliances: []
    });

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
                    usageHours: appliance.usageHours
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
            const response = await energyAuditApi.createAudit({
                month: form.month,
                totalUnits: parseFloat(form.totalUnits),
                householdSize: parseInt(form.householdSize),
                appliances: form.selectedAppliances.map(({ applianceId, usageHours }) => ({ applianceId, usageHours }))
            });
            setAudits([response.data, ...audits]);
            setActiveAudit(response.data);
            setShowForm(false);
            setForm({ month: new Date().toLocaleString('default', { month: 'long' }), totalUnits: '', householdSize: 1, selectedAppliances: [] });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create energy audit');
        }
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

                        {audits.length === 0 ? (
                            <p className="text-gray-400 text-sm font-medium italic">No audits performed yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {audits.map(audit => (
                                    <div
                                        key={audit._id}
                                        onClick={() => { setActiveAudit(audit); setChatMessages([]); setSimulationResult(null); }}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${activeAudit?._id === audit._id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-white hover:shadow-md'}`}
                                    >
                                        <p className="font-black text-xs text-blue-800 uppercase tracking-tighter mb-1">{audit.month} {new Date(audit.createdAt).getFullYear()}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-black text-gray-900">{audit.totalUnits} <span className="text-xs font-bold text-gray-400">units</span></span>
                                            <span className={`px-2 py-1 text-[8px] font-black rounded-lg uppercase ${audit.analysis?.summary?.efficiencyScore > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                Score: {audit.analysis?.summary?.efficiencyScore || 'N/A'}
                                            </span>
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
                            <h2 className="text-3xl font-black text-gray-900 mb-8 italic">Start New Energy Audit</h2>
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
                                        <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-xl appearance-none">
                                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m} value={m}>{m}</option>)}
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
                                    Generate AI Analysis
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
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Efficiency Status</p>
                                    <div className="flex items-end gap-3 mb-2">
                                        <h3 className={`text-6xl font-black ${activeAudit.analysis?.summary?.efficiencyScore > 70 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {activeAudit.analysis?.summary?.efficiencyScore}%
                                        </h3>
                                        <p className="text-gray-400 font-bold mb-2">Score</p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-600 italic">"{activeAudit.analysis?.summary?.efficiencyVerdict}"</p>
                                </div>

                                <div className="lg:col-span-2 bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase mb-6 tracking-widest">AI Observations</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {activeAudit.analysis?.insights?.slice(0, 4).map((insight, idx) => (
                                            <div key={idx} className="flex gap-3 text-sm">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                <p className="text-gray-300 font-medium leading-relaxed">{insight}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Impact Simulation & AI Chat */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                {/* Chat Interface */}
                                <div className="lg:col-span-3 bg-white rounded-[3rem] shadow-xl border border-gray-100 flex flex-col overflow-hidden h-[600px]">
                                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>
                                            <h3 className="text-xl font-black text-gray-900">Energy Assistant</h3>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Context: Active Audit
                                        </span>
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

                                {/* Simulation Panel */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
                                        <h3 className="text-xl font-black text-gray-900 italic mb-6">Impact Simulator</h3>
                                        <div className="space-y-6">
                                            {activeAudit.appliances?.slice(0, 3).map(item => (
                                                <div key={item.applianceId} className="space-y-3">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.applianceId?.name || 'Device'}</span>
                                                        <span className="text-xs font-bold text-blue-600">{item.usageHours}h Usage</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="range" min="0" max="24" step="0.5" defaultValue={item.usageHours}
                                                            onMouseUp={(e) => runSimulation(item.applianceId?._id, 'usageHours', e.target.value)}
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
                                                    <h4 className="text-3xl font-black italic">{simulationResult.savings?.unitsSaved?.toFixed(2)} <span className="text-sm not-italic opacity-60">Units Saved</span></h4>
                                                    <p className="text-xs font-bold text-emerald-100">Projected savings with recommended patterns.</p>
                                                </div>
                                                <div className="pt-4 border-t border-white/10">
                                                    <p className="text-sm font-bold leading-relaxed italic">AI Verdict: "{simulationResult.advice}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default EnergyAuditManagement;
