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

    // Guided Mode States
    const [isGuided, setIsGuided] = useState(false);
    const [guidedStep, setGuidedStep] = useState(0);
    const [assistantMsg, setAssistantMsg] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);

    let recognitionInstance = null;

    const speak = (text) => {
        if (!window.speechSynthesis) return;

        // STOP LISTENING BEFORE SPEAKING
        if (recognitionInstance) {
            try {
                recognitionInstance.stop();
            } catch (e) { }
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            // RESTART LISTENING AFTER SPEAKING ENDS
            setTimeout(() => {
                if (isGuided && showForm) {
                    listen();
                }
            }, 500);
        };
        window.speechSynthesis.speak(utterance);
    };

    const listen = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Ensure only one instance runs
        if (isListening) return;

        const recognition = new SpeechRecognition();
        recognitionInstance = recognition;

        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            // Auto restart ONLY IF we are on the appliance step AND NOT SPEAKING
            if (isGuided && showForm && guidedStep === guidedSteps.length - 1 && !window.speechSynthesis.speaking) {
                setTimeout(() => {
                    if (!window.speechSynthesis.speaking) listen();
                }, 1000);
            }
        };
        recognition.onerror = (e) => {
            setIsListening(false);
            console.error("Mic Error:", e.error);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log("Voice Transcript:", transcript);
            processVoiceInput(transcript);
        };

        recognition.onnomatch = () => setIsListening(false);

        try {
            recognition.start();
        } catch (e) {
            console.error("Speech Recognition Error:", e);
            setIsListening(false);
        }
    };

    const wordToNumber = (word) => {
        const cleanWord = word.toLowerCase().trim();
        const numbers = {
            'zero': 0, 'one': 1, 'two': 2, 'too': 2, 'to': 2, 'three': 3, 'tree': 3,
            'four': 4, 'for': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'ate': 8,
            'nine': 9, 'ten': 10
        };
        return numbers[cleanWord] !== undefined ? numbers[cleanWord] : null;
    };

    const processVoiceInput = (input) => {
        const currentStepData = guidedSteps[guidedStep];
        const currentField = currentStepData.field;

        console.log("Analyzing Input:", input, "for field:", currentField);

        // 1. Handle Numeric Fields (Units / People)
        if (currentStepData.type === 'number') {
            // Check for digits
            const digitMatch = input.match(/\d+(\.\d+)?/);
            if (digitMatch) {
                setForm(prev => ({ ...prev, [currentField]: digitMatch[0] }));
                moveToNextStep();
                return;
            }
            // Check for number words (one, two...)
            const words = input.split(' ');
            for (let word of words) {
                const num = wordToNumber(word);
                if (num !== null) {
                    setForm(prev => ({ ...prev, [currentField]: num }));
                    moveToNextStep();
                    return;
                }
            }
        }

        // 2. Handle Month (January - December)
        else if (currentStepData.type === 'month') {
            const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
            const foundMonth = months.findIndex(m => input.includes(m));
            if (foundMonth !== -1) {
                const year = new Date().getFullYear();
                const monthStr = `${year}-${String(foundMonth + 1).padStart(2, '0')}`;
                setForm(prev => ({ ...prev, month: monthStr }));
                moveToNextStep();
                return;
            } else if (input.includes("current") || input.includes("this")) {
                setForm(prev => ({ ...prev, month: new Date().toISOString().slice(0, 7) }));
                moveToNextStep();
                return;
            }
        }

        // 3. Handle Peak Usage (Keywords: Day / Night)
        else if (currentField === 'peakUsage') {
            if (input.includes('day') || input.includes('morning')) {
                setForm(prev => ({ ...prev, peakUsage: 'Day' }));
                moveToNextStep();
                return;
            }
            else if (input.includes('night') || input.includes('peak') || input.includes('evening')) {
                setForm(prev => ({ ...prev, peakUsage: 'Night' }));
                moveToNextStep();
                return;
            }
        }

        // 4. Handle Appliances (Keyword Matching - Multi-select with Feedback)
        else if (currentField === 'selectedAppliances') {
            let userInput = input.trim().toLowerCase();

            // 1. Check for completion first (Yes, Finish, Done)
            if (userInput.includes("yes") || userInput.includes("finish") || userInput.includes("done") || userInput.includes("submit")) {
                const finalCount = form.selectedAppliances.length;
                speak(`Understood. Finalizing your report with ${finalCount} appliances. One moment.`);
                setTimeout(() => handleCreateAudit(null), 2000);
                return;
            }

            // 2. Check for "No" (wants more)
            if (userInput.includes("no")) {
                speak("Alright, tell me your other appliances.");
                return;
            }

            // 3. Try to add appliances
            let foundAny = false;
            let lastAddedName = "";
            appliances.forEach(app => {
                const appName = app.name.toLowerCase();
                if (userInput.includes(appName) || appName.includes(userInput)) {
                    handleApplianceToggle(app);
                    lastAddedName = app.name;
                    foundAny = true;
                }
            });

            if (foundAny) {
                speak(`Added ${lastAddedName}. Any other appliances? Or can we finish?`);
            } else {
                speak(`I couldn't find ${userInput}. Any other devices? Or can we finish?`);
            }
        }
    };

    const moveToNextStep = () => {
        setTimeout(() => {
            if (guidedStep < guidedSteps.length - 1) {
                setGuidedStep(prev => prev + 1);
            } else {
                // Last step logic
                speak("Done! I am creating your energy audit now.");
                setTimeout(() => handleCreateAudit(null), 2000);
            }
        }, 800);
    };

    const guidedSteps = [
        {
            title: "Energy Consumption",
            question: "How many units (kWh) did you use this month? You can find this on your electricity bill.",
            field: "totalUnits",
            placeholder: "e.g. 150.5",
            type: "number"
        },
        {
            title: "Household Size",
            question: "How many people are currently living in your house?",
            field: "householdSize",
            placeholder: "e.g. 4",
            type: "number"
        },
        {
            title: "Audit Month",
            question: "Which month are we auditing for?",
            field: "month",
            type: "month"
        },
        {
            title: "Peak Usage",
            question: "When do you use electricity the most? Day time or Night peak?",
            field: "peakUsage",
            type: "select",
            options: ["Day", "Night"]
        },
        {
            title: "Appliances",
            question: "Finally, select the main appliances that were active this month.",
            field: "selectedAppliances",
            type: "appliances"
        }
    ];

    useEffect(() => {
        if (isGuided && showForm) {
            const step = guidedSteps[guidedStep];
            setAssistantMsg(step.question);
            speak(step.question);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guidedStep, isGuided, showForm]);

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
            console.error('Failed to fetch audits');
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
        setForm(prev => {
            const isSelected = prev.selectedAppliances.find(a => a.applianceId === (appliance._id || appliance.applianceId));
            if (isSelected) {
                return {
                    ...prev,
                    selectedAppliances: prev.selectedAppliances.filter(a => a.applianceId !== (appliance._id || appliance.applianceId))
                };
            } else {
                return {
                    ...prev,
                    selectedAppliances: [...prev.selectedAppliances, {
                        applianceId: appliance._id || appliance.applianceId,
                        name: appliance.name,
                        usageHours: appliance.usageHours || 1
                    }]
                };
            }
        });
    };

    const handleCreateAudit = async (e) => {
        if (e) e.preventDefault();
        try {
            if (!form.totalUnits || form.selectedAppliances.length === 0) {
                console.error('Please provide usage units and select appliances');
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
            setIsGuided(false); // Make sure to reset guided mode on finish
            setForm({ month: new Date().toISOString().slice(0, 7), totalUnits: '', householdSize: 1, peakUsage: 'Day', selectedAppliances: [] });
            setActiveTab('summary');
        } catch (err) {
            console.error(err.response?.data?.message || 'Failed to process energy audit');
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
                                            className={`p-5 rounded-2xl cursor-pointer transition-all border group h-32 flex flex-col justify-between ${activeAudit?._id === audit._id ? 'bg-teal-50 border-teal-200 shadow-inner scale-[1.02]' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-100'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider font-asap leading-tight">{formatMonth(audit.month)}<br />{new Date(audit.createdAt).getFullYear()}</span>
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
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                                    <div>
                                        <h2 className="text-4xl font-bold text-gray-900">{isEditing ? 'Pulse Correction' : 'Pulse Discovery'}</h2>
                                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Level: {isGuided ? 'Guided Assistance Active' : 'Manual Discovery'}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        {!isEditing && (
                                            <button
                                                onClick={() => {
                                                    setIsGuided(!isGuided);
                                                    setGuidedStep(0);
                                                }}
                                                className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${isGuided ? 'bg-teal-600 text-white shadow-lg' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                {isGuided ? 'Switch to Manual' : 'Start Guided Assistant'}
                                            </button>
                                        )}
                                        <button onClick={() => { setShowForm(false); setIsGuided(false); }} className="px-6 py-3 text-[10px] font-bold text-gray-400 hover:text-gray-900 border border-gray-100 rounded-2xl transition-colors uppercase tracking-widest">Close</button>
                                    </div>
                                </div>

                                {isGuided ? (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Assistant Interface */}
                                        <div className="flex flex-col items-center text-center space-y-8 py-10">
                                            <div className="relative">
                                                <div
                                                    onClick={() => !isSpeaking && listen()}
                                                    className={`w-24 h-24 bg-teal-600 rounded-3xl flex items-center justify-center text-white shadow-2xl relative z-10 transition-all cursor-pointer hover:scale-105 active:scale-95 ${isSpeaking ? 'scale-110' : ''} ${isListening ? 'bg-rose-500 shadow-rose-200' : ''}`}
                                                >
                                                    {isListening ? (
                                                        <svg className="w-12 h-12 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                                                    ) : (
                                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                    )}
                                                </div>
                                                {(isSpeaking || isListening) && (
                                                    <div className={`absolute inset-0 rounded-3xl animate-ping opacity-25 ${isListening ? 'bg-rose-400' : 'bg-teal-400'}`}></div>
                                                )}
                                                <div className="absolute -bottom-4 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 shadow-sm">
                                                    <p className="text-[8px] font-bold text-teal-700 uppercase tracking-widest">{isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Click to Speak'}</p>
                                                </div>
                                            </div>
                                            <div className="max-w-2xl">
                                                <h3 className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.3em] mb-4">Flux Assistant Step {guidedStep + 1} of 5</h3>
                                                <p className="text-3xl font-bold text-gray-900 italic leading-tight">"{assistantMsg}"</p>
                                            </div>
                                        </div>

                                        <div className="max-w-xl mx-auto p-12 bg-gray-50 rounded-[3rem] border border-gray-100 shadow-inner">
                                            {guidedSteps[guidedStep].type === 'number' && (
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    value={form[guidedSteps[guidedStep].field]}
                                                    onChange={e => setForm({ ...form, [guidedSteps[guidedStep].field]: e.target.value })}
                                                    placeholder={guidedSteps[guidedStep].placeholder}
                                                    className="w-full bg-transparent text-5xl font-bold text-center text-teal-600 outline-none placeholder:text-gray-200"
                                                />
                                            )}
                                            {guidedSteps[guidedStep].type === 'month' && (
                                                <input
                                                    type="month"
                                                    value={form.month}
                                                    onChange={e => setForm({ ...form, month: e.target.value })}
                                                    className="w-full bg-transparent text-4xl font-bold text-center text-teal-600 outline-none"
                                                />
                                            )}
                                            {guidedSteps[guidedStep].type === 'select' && (
                                                <div className="flex gap-4">
                                                    {guidedSteps[guidedStep].options.map(opt => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => setForm({ ...form, peakUsage: opt })}
                                                            className={`flex-1 py-6 rounded-3xl font-bold text-xl transition-all ${form.peakUsage === opt ? 'bg-teal-600 text-white shadow-xl' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {guidedSteps[guidedStep].type === 'appliances' && (
                                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {appliances.map(app => (
                                                        <div
                                                            key={app._id}
                                                            onClick={() => handleApplianceToggle(app)}
                                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${form.selectedAppliances.find(a => a.applianceId === app._id) ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-transparent hover:border-teal-50'}`}
                                                        >
                                                            <p className="font-bold text-xs truncate">{app.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-center gap-6">
                                            {guidedStep > 0 && (
                                                <button onClick={() => setGuidedStep(prev => prev - 1)} className="px-10 py-5 bg-white text-gray-500 font-bold rounded-full hover:bg-gray-50 transition-all border border-gray-100 uppercase text-[10px] tracking-widest">Back</button>
                                            )}
                                            {guidedStep < guidedSteps.length - 1 ? (
                                                <button
                                                    onClick={() => {
                                                        if (guidedStep === 0 && !form.totalUnits) return speak("Please enter your energy consumption first.");
                                                        setGuidedStep(prev => prev + 1);
                                                    }}
                                                    className="px-12 py-5 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 uppercase text-[10px] tracking-widest"
                                                >
                                                    Continue
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleCreateAudit}
                                                    className="px-12 py-5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-full hover:scale-105 transition-all shadow-2xl uppercase text-[10px] tracking-widest animate-pulse"
                                                >
                                                    Finish & Get Insights
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleCreateAudit} className="space-y-16 animate-in fade-in duration-500">
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
                                )}
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
                                                <div className="flex flex-wrap gap-4">
                                                    {activeAudit.badges?.map((badge, idx) => {
                                                        const text = badge.toLowerCase();
                                                        let style = { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-700', iconBg: 'bg-cyan-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };

                                                        if (text.includes('hog') || text.includes('urgent') || text.includes('high') || text.includes('extreme')) {
                                                            style = { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> };
                                                        } else if (text.includes('elite') || text.includes('efficient') || text.includes('star') || text.includes('savings')) {
                                                            style = { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> };
                                                        } else if (text.includes('optimize') || text.includes('potential') || text.includes('check')) {
                                                            style = { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-500', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> };
                                                        }

                                                        return (
                                                            <div key={idx} className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-500 shadow-sm hover:shadow-md ${style.bg} ${style.border} ${style.text}`}>
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 text-white ${style.iconBg}`}>
                                                                    {style.icon}
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{badge}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="p-12 flex flex-col justify-center">
                                                <h4 className="text-3xl font-bold text-gray-900 mb-8 italic">"{activeAudit.aiSummary}"</h4>
                                                <p className="text-lg text-gray-500 font-medium leading-relaxed italic">Flux Pulse AI has analyzed your monthly behavior for a household of {activeAudit.householdSize || 1} people.</p>
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