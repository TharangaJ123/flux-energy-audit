import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { costApi } from '../services/api';
import Layout from '../components/Layout';

const CostManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('costs');
  const [costs, setCosts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Cost form state
  const [costForm, setCostForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    electricityCost: '',
    notes: '',
    document: null,
  });

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    type: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    goalAmount: '',
    notes: '',
  });

  // Estimation form state
  const [estimationForm, setEstimationForm] = useState({
    units: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    provider: 'CEB',
    peakUnits: '0',
    offPeakUnits: '0',
  });

  const [estimation, setEstimation] = useState(null);
  const [estimationLoading, setEstimationLoading] = useState(false);

  const getDocumentUrl = (documentPath) => {
    if (!documentPath) {
      return '';
    }
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const serverBaseUrl = apiUrl.replace(/\/api\/?$/, '');
    return `${serverBaseUrl}${documentPath}`;
  };

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await costApi.getCosts();
      setCosts(response.data);
    } catch (err) {
      setError('Failed to fetch costs: ' + (err.response?.data?.message || err.message));
      if (err.response?.status === 401) {
        navigate('/user-management');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await costApi.getGoals();
      setGoals(response.data);
    } catch (err) {
      setError('Failed to fetch goals: ' + (err.response?.data?.message || err.message));
      if (err.response?.status === 401) {
        navigate('/user-management');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'costs') {
      fetchCosts();
    } else if (activeTab === 'goals') {
      fetchGoals();
    }
  }, [activeTab, fetchCosts, fetchGoals]);

  const handleAddCost = async () => {
    setError('');
    try {
      if (!costForm.electricityCost) {
        setError('Please enter electricity cost');
        return;
      }

      if (editingId) {
        const updatePayload = {
          month: costForm.month,
          year: costForm.year,
          electricityCost: costForm.electricityCost,
          notes: costForm.notes,
        };
        await costApi.updateCost(editingId, updatePayload);
      } else {
        const formData = new FormData();
        formData.append('month', String(costForm.month));
        formData.append('year', String(costForm.year));
        formData.append('electricityCost', String(costForm.electricityCost));
        formData.append('notes', costForm.notes || '');
        if (costForm.document) {
          formData.append('document', costForm.document);
        }
        await costApi.createCost(formData);
      }

      setCostForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        electricityCost: '',
        notes: '',
        document: null,
      });
      setEditingId(null);
      setShowForm(false);
      await fetchCosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cost');
    }
  };

  const handleDeleteCost = async (id) => {
    if (window.confirm('Are you sure you want to delete this cost?')) {
      try {
        await costApi.deleteCost(id);
        await fetchCosts();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete cost');
      }
    }
  };

  const handleAddGoal = async () => {
    setError('');
    try {
      if (!goalForm.goalAmount) {
        setError('Please enter goal amount');
        return;
      }
      if (editingId) {
        await costApi.updateGoal(editingId, goalForm);
      } else {
        await costApi.createGoal(goalForm);
      }
      setGoalForm({
        type: 'monthly',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        goalAmount: '',
        notes: '',
      });
      setEditingId(null);
      setShowForm(false);
      await fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await costApi.deleteGoal(id);
        await fetchGoals();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete goal');
      }
    }
  };

  const handleEstimate = async () => {
    setEstimationLoading(true);
    setError('');
    try {
      if (!estimationForm.units) {
        setError('Please enter units');
        return;
      }
      const response = await costApi.estimateCost({
        ...estimationForm,
        units: parseFloat(estimationForm.units),
        peakUnits: parseFloat(estimationForm.peakUnits),
        offPeakUnits: parseFloat(estimationForm.offPeakUnits),
      });
      setEstimation(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to estimate cost');
    } finally {
      setEstimationLoading(false);
    }
  };

  const MonthSelect = ({ value, onChange }) => (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
        </option>
      ))}
    </select>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Cost Management</h1>
            <p className="text-gray-500 text-lg">Detailed insight into your electricity spending.</p>
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('costs')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'costs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Costs
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'goals' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Goals
            </button>
            <button
              onClick={() => setActiveTab('estimate')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'estimate' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Estimator
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-8 shadow-sm flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Costs View */}
        {activeTab === 'costs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Historical Costs</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
              >
                {showForm ? '✕ Cancel' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Log Bill</>}
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 animate-in zoom-in-95 duration-300">
                <h3 className="text-xl font-bold mb-6">{editingId ? 'Edit Bill Record' : 'Log New Bill'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Billing Month</label>
                    <MonthSelect
                      value={costForm.month}
                      onChange={(e) => setCostForm({ ...costForm, month: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Year</label>
                    <input
                      type="number"
                      value={costForm.year}
                      onChange={(e) => setCostForm({ ...costForm, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Amount (LKR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                      <input
                        type="number"
                        step="0.01"
                        value={costForm.electricityCost}
                        onChange={(e) => setCostForm({ ...costForm, electricityCost: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Optional Notes</label>
                    <textarea
                      value={costForm.notes}
                      onChange={(e) => setCostForm({ ...costForm, notes: e.target.value })}
                      placeholder="..."
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                  {!editingId && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Optional Bill Document</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => setCostForm({ ...costForm, document: e.target.files?.[0] || null })}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:font-bold file:text-blue-700"
                      />
                      {costForm.document && (
                        <p className="text-xs text-gray-500 mt-2">Selected: {costForm.document.name}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-8 flex gap-4">
                  <button
                    onClick={handleAddCost}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-extrabold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    {editingId ? 'Apply Changes' : 'Save Record'}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : costs.length === 0 ? (
              <div className="bg-white p-16 rounded-[2rem] border-2 border-dashed border-gray-100 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Records Yet</h3>
                <p className="text-gray-500">Log your first electricity bill to start tracking efficiency.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {costs.map((cost) => (
                  <div key={cost._id} className="group bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-lg uppercase">
                        {new Date(2024, cost.month - 1).toLocaleString('default', { month: 'short' })} {cost.year}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setCostForm({ ...cost, document: null }); setEditingId(cost._id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => handleDeleteCost(cost._id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                    <p className="text-4xl font-black text-gray-900 mb-2">
                      <span className="text-lg font-bold text-gray-400 mr-1">Rs.</span>
                      {cost.electricityCost.toLocaleString()}
                    </p>
                    {cost.document?.path && (
                      <a
                        href={getDocumentUrl(cost.document.path)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 mt-2"
                      >
                        View uploaded document
                      </a>
                    )}
                    {cost.notes && <p className="text-gray-500 text-sm line-clamp-2 mt-4">{cost.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Goals View */}
        {activeTab === 'goals' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Saving Goals</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
              >
                {showForm ? '✕ Cancel' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Set Budget</>}
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                <h3 className="text-xl font-bold mb-6">Create Energy Budget</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Budget Period</label>
                    <select
                      value={goalForm.type}
                      onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    >
                      <option value="monthly">Monthly Budget</option>
                      <option value="yearly">Yearly Budget</option>
                    </select>
                  </div>
                  {goalForm.type === 'monthly' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Target Month</label>
                      <MonthSelect
                        value={goalForm.month}
                        onChange={(e) => setGoalForm({ ...goalForm, month: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Year</label>
                    <input
                      type="number"
                      value={goalForm.year}
                      onChange={(e) => setGoalForm({ ...goalForm, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Limit Amount (LKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goalForm.goalAmount}
                      onChange={(e) => setGoalForm({ ...goalForm, goalAmount: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none font-black text-lg"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddGoal}
                  className="mt-8 bg-emerald-600 text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                >
                  Set Budget Limit
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {goals.map((goal) => (
                <div key={goal._id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-emerald-600 font-black uppercase tracking-widest text-xs mb-1">{goal.type}</p>
                      <h3 className="text-3xl font-black text-gray-900">
                        {goal.type === 'monthly' ? `${new Date(2024, goal.month - 1).toLocaleString('default', { month: 'long' })}` : goal.year}
                      </h3>
                    </div>
                    <button onClick={() => handleDeleteGoal(goal._id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 font-bold text-sm uppercase">Budget Limit</p>
                    <p className="text-5xl font-black text-gray-900 italic">Rs. {goal.goalAmount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimator View */}
        {activeTab === 'estimate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
              <h3 className="text-3xl font-black text-gray-900 mb-8">Smart Bill Estimator</h3>

              <div className="space-y-6 mb-10">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Energy Provider</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setEstimationForm({ ...estimationForm, provider: 'CEB' })} className={`py-4 rounded-2xl font-black text-lg transition-all border-2 ${estimationForm.provider === 'CEB' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-transparent text-gray-400'}`}>CEB</button>
                    <button onClick={() => setEstimationForm({ ...estimationForm, provider: 'LECO' })} className={`py-4 rounded-2xl font-black text-lg transition-all border-2 ${estimationForm.provider === 'LECO' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-transparent text-gray-400'}`}>LECO</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Monthly Usage (Units)</label>
                  <input
                    type="number"
                    value={estimationForm.units}
                    onChange={(e) => setEstimationForm({ ...estimationForm, units: e.target.value })}
                    placeholder="Enter kWh usage"
                    className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-black text-2xl placeholder:text-gray-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Month</label>
                    <MonthSelect value={estimationForm.month} onChange={(e) => setEstimationForm({ ...estimationForm, month: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Year</label>
                    <input type="number" value={estimationForm.year} onChange={(e) => setEstimationForm({ ...estimationForm, year: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none font-bold" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleEstimate}
                disabled={estimationLoading}
                className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all active:scale-[0.98] disabled:bg-gray-300"
              >
                {estimationLoading ? 'Simulating...' : 'Generate Estimation'}
              </button>
            </div>

            <div className="space-y-6">
              {!estimation ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 opacity-50">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm"><svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                  <h4 className="text-xl font-bold text-gray-400">Analysis Pending</h4>
                  <p className="text-gray-400 text-sm">Input your consumption data to see the breakdown.</p>
                </div>
              ) : (
                <div className="animate-in slide-in-from-right-10 duration-500 space-y-6">
                  <div className="bg-gradient-to-br from-gray-900 to-blue-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    <p className="text-blue-300 font-black uppercase tracking-widest text-xs mb-4">Estimated Total</p>
                    <h4 className="text-6xl font-black mb-1 leading-none italic">
                      <span className="text-2xl not-italic mr-2">LKR</span>
                      {estimation.estimatedBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                    <div className="mt-8 flex items-center gap-2 text-sm text-blue-200">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      Calculated with current {estimation.provider} tariff slabs.
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-gray-100">
                    <h5 className="text-xl font-black text-gray-900 mb-6">Component Breakdown</h5>
                    <div className="space-y-5">
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-500 font-medium">Energy Charge</span>
                        <span className="font-black">Rs. {estimation.summary.energyCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-500 font-medium">Fixed Service Charge</span>
                        <span className="font-black">Rs. {estimation.summary.fixedCharge.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-gray-100"></div>
                      <div className="flex justify-between items-center text-2xl">
                        <span className="text-gray-900 font-black">Subtotal</span>
                        <span className="font-black">Rs. {estimation.summary.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg text-blue-600 font-bold">
                        <span>SSCL Tax (18%)</span>
                        <span>Rs. {estimation.summary.tax.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CostManagement;
