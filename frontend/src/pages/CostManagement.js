import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { costApi } from '../services/api';

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

  // Fetch costs and goals
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
        await costApi.updateCost(editingId, costForm);
      } else {
        await costApi.createCost(costForm);
      }
      setCostForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        electricityCost: '',
        notes: '',
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
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cost Management</h1>
            <p className="text-blue-100 mt-1">Track and manage your electricity costs</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mt-8 px-4">
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => {
              setActiveTab('costs');
              setShowForm(false);
              setEditingId(null);
            }}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'costs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Costs
          </button>
          <button
            onClick={() => {
              setActiveTab('goals');
              setShowForm(false);
              setEditingId(null);
            }}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'goals'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cost Goals
          </button>
          <button
            onClick={() => {
              setActiveTab('estimate');
              setShowForm(false);
              setEditingId(null);
            }}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'estimate'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Estimate Bill
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showForm ? '✕ Cancel' : '+ Add Cost'}
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Cost' : 'Add New Cost'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Month</label>
                    <MonthSelect
                      value={costForm.month}
                      onChange={(e) => setCostForm({ ...costForm, month: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Year</label>
                    <input
                      type="number"
                      value={costForm.year}
                      onChange={(e) => setCostForm({ ...costForm, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Electricity Cost (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costForm.electricityCost}
                      onChange={(e) => setCostForm({ ...costForm, electricityCost: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-semibold mb-2">Notes</label>
                    <textarea
                      value={costForm.notes}
                      onChange={(e) => setCostForm({ ...costForm, notes: e.target.value })}
                      placeholder="Add any notes about this cost..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleAddCost}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingId ? 'Update Cost' : 'Add Cost'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setCostForm({
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        electricityCost: '',
                        notes: '',
                      });
                    }}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading costs...</p>
              </div>
            ) : costs.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-600">No costs recorded yet. Add your first cost to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {costs.map((cost) => (
                  <div key={cost._id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {new Date(2024, cost.month - 1).toLocaleString('default', { month: 'long' })} {cost.year}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">Rs. {cost.electricityCost.toFixed(2)}</p>
                        {cost.notes && <p className="text-gray-600 text-sm mt-2">{cost.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCostForm(cost);
                            setEditingId(cost._id);
                            setShowForm(true);
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCost(cost._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showForm ? '✕ Cancel' : '+ Add Goal'}
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Goal' : 'Create New Goal'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Goal Type</label>
                    <select
                      value={goalForm.type}
                      onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  {goalForm.type === 'monthly' && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Month</label>
                      <MonthSelect
                        value={goalForm.month}
                        onChange={(e) => setGoalForm({ ...goalForm, month: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Year</label>
                    <input
                      type="number"
                      value={goalForm.year}
                      onChange={(e) => setGoalForm({ ...goalForm, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Goal Amount (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goalForm.goalAmount}
                      onChange={(e) => setGoalForm({ ...goalForm, goalAmount: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-semibold mb-2">Notes</label>
                    <textarea
                      value={goalForm.notes}
                      onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                      placeholder="Add any notes about this goal..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleAddGoal}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingId ? 'Update Goal' : 'Create Goal'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setGoalForm({
                        type: 'monthly',
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        goalAmount: '',
                        notes: '',
                      });
                    }}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading goals...</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-600">No goals set yet. Create your first goal to track your progress!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {goals.map((goal) => (
                  <div key={goal._id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {goal.type === 'monthly' 
                            ? `${new Date(2024, goal.month - 1).toLocaleString('default', { month: 'long' })} ${goal.year}`
                            : `${goal.year}`
                          } - {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
                        </h3>
                        <p className="text-2xl font-bold text-green-600">Rs. {goal.goalAmount.toFixed(2)}</p>
                        {goal.notes && <p className="text-gray-600 text-sm mt-2">{goal.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setGoalForm(goal);
                            setEditingId(goal._id);
                            setShowForm(true);
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Estimate Tab */}
        {activeTab === 'estimate' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-semibold mb-6">Estimate Your Electricity Bill</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Units Consumed (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={estimationForm.units}
                    onChange={(e) => setEstimationForm({ ...estimationForm, units: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Provider</label>
                  <select
                    value={estimationForm.provider}
                    onChange={(e) => setEstimationForm({ ...estimationForm, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CEB">CEB (Ceylon Electricity Board)</option>
                    <option value="LECO">LECO (Lanka Electricity Company)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Month</label>
                  <MonthSelect
                    value={estimationForm.month}
                    onChange={(e) => setEstimationForm({ ...estimationForm, month: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Year</label>
                  <input
                    type="number"
                    value={estimationForm.year}
                    onChange={(e) => setEstimationForm({ ...estimationForm, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Peak Units (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={estimationForm.peakUnits}
                    onChange={(e) => setEstimationForm({ ...estimationForm, peakUnits: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Off-Peak Units (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={estimationForm.offPeakUnits}
                    onChange={(e) => setEstimationForm({ ...estimationForm, offPeakUnits: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleEstimate}
                disabled={estimationLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {estimationLoading ? 'Calculating...' : 'Estimate Bill'}
              </button>

              {estimation && (
                <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
                  <h4 className="text-2xl font-bold text-blue-600 mb-4">Bill Estimation</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-gray-600 text-sm">Provider</p>
                      <p className="text-xl font-semibold text-gray-800">{estimation.provider}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-gray-600 text-sm">Source</p>
                      <p className="text-xl font-semibold text-gray-800">{estimation.source}</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg mb-4">
                    <p className="text-gray-600 text-sm mb-2">Estimated Monthly Bill</p>
                    <p className="text-4xl font-bold text-green-600">Rs. {estimation.estimatedBill.toFixed(2)}</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg mb-4">
                    <h5 className="font-semibold text-gray-800 mb-4">Cost Breakdown</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Energy Charge:</span>
                        <span className="font-semibold">Rs. {estimation.summary.energyCharge.toFixed(2)}</span>
                      </div>
                      {estimation.summary.peakCharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Peak Charge:</span>
                          <span className="font-semibold">Rs. {estimation.summary.peakCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {estimation.summary.offPeakCharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Off-Peak Charge:</span>
                          <span className="font-semibold">Rs. {estimation.summary.offPeakCharge.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-700">Fixed Charge:</span>
                        <span className="font-semibold">Rs. {estimation.summary.fixedCharge.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-semibold">Rs. {estimation.summary.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Tax (18%):</span>
                        <span className="font-semibold">Rs. {estimation.summary.tax.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {estimation.breakdown && estimation.breakdown.length > 0 && (
                    <div className="bg-white p-6 rounded-lg">
                      <h5 className="font-semibold text-gray-800 mb-4">Detailed Breakdown</h5>
                      <div className="space-y-2 text-sm">
                        {estimation.breakdown.map((item, index) => (
                          <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
                            <span>{item.label} ({item.type})</span>
                            <div className="text-right">
                              {item.units && <div>Units: {item.units.toFixed(2)}</div>}
                              {item.ratePerUnit && <div>Rate: Rs. {item.ratePerUnit.toFixed(2)}</div>}
                              {item.rate && <div>Rate: {(item.rate * 100).toFixed(0)}%</div>}
                              <div className="font-semibold">Rs. {item.amount.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostManagement;
