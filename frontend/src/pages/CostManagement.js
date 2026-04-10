// Cost management dashboard for bills, goals, estimation, and AI spending insights.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { costApi } from '../services/api';
import Layout from '../components/Layout';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const CURRENT_YEAR = new Date().getFullYear();
const MAX_ALLOWED_YEAR = CURRENT_YEAR + 1;
const MAX_ALLOWED_COST = 1000000;
const MAX_FUTURE_MONTHS_FOR_BILLING = 1;

const CostManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [costs, setCosts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState('');
  const [costEditingId, setCostEditingId] = useState(null);
  const [goalEditingId, setGoalEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Cost form state
  const [costForm, setCostForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    utilityType: 'electricity',
    amount: '',
    notes: '',
    document: null,
  });

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    type: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    utilityType: 'electricity',
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
  const [costFieldErrors, setCostFieldErrors] = useState({});
  const [downloadingDocumentId, setDownloadingDocumentId] = useState(null);

  const parseOptionalNumber = (value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    // Form inputs arrive as strings; normalize once so validation and submit handlers share the same rules.
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatMoney = (amount) => Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isBeyondAllowedBillingWindow = ({ month, year }) => {
    const parsedMonth = Number(month);
    const parsedYear = Number(year);

    if (!Number.isInteger(parsedMonth) || !Number.isInteger(parsedYear)) {
      return false;
    }

    const billingDate = new Date(parsedYear, parsedMonth - 1, 1);
    const now = new Date();
    const maxAllowedDate = new Date(now.getFullYear(), now.getMonth() + MAX_FUTURE_MONTHS_FOR_BILLING, 1);
    return billingDate > maxAllowedDate;
  };

  const validateCostField = (name, formValue = costForm) => {
    const month = parseOptionalNumber(formValue.month);
    const year = parseOptionalNumber(formValue.year);
    const amount = parseOptionalNumber(formValue.amount);

    if (name === 'month') {
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return 'Billing month must be between 1 and 12';
      }
      if (year !== null && isBeyondAllowedBillingWindow({ month, year })) {
        return 'Billing month cannot be more than 1 month in the future';
      }
      return '';
    }

    if (name === 'year') {
      if (!Number.isInteger(year) || year < 1900 || year > MAX_ALLOWED_YEAR) {
        return `Year must be between 1900 and ${MAX_ALLOWED_YEAR}`;
      }
      if (month !== null && isBeyondAllowedBillingWindow({ month, year })) {
        return 'Billing month cannot be more than 1 month in the future';
      }
      return '';
    }

    if (name === 'amount') {
      if (amount === null) {
        return `Please enter ${formValue.utilityType} cost`;
      }
      if (amount < 0) {
        return 'Cost must be 0 or higher';
      }
      if (amount > MAX_ALLOWED_COST) {
        return `Cost cannot exceed ${MAX_ALLOWED_COST.toLocaleString()}`;
      }
      return '';
    }

    return '';
  };

  const validateCostForm = (formValue = costForm) => {
    const validationErrors = {
      month: validateCostField('month', formValue),
      year: validateCostField('year', formValue),
      amount: validateCostField('amount', formValue),
    };

    const filteredErrors = Object.fromEntries(
      Object.entries(validationErrors).filter(([, message]) => Boolean(message))
    );

    setCostFieldErrors(filteredErrors);
    return {
      isValid: Object.keys(filteredErrors).length === 0,
      errors: filteredErrors,
    };
  };

  const handleCostFieldBlur = (fieldName) => {
    const errorMessage = validateCostField(fieldName, costForm);
    setCostFieldErrors((prev) => {
      if (!errorMessage) {
        const { [fieldName]: removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [fieldName]: errorMessage,
      };
    });
  };

  const handleDownloadDocument = async (costId, fallbackFileName = 'bill-document') => {
    setDownloadingDocumentId(costId);
    setError('');
    try {
      const response = await costApi.downloadCostDocument(costId);
      // Use an object URL so the protected download endpoint can still trigger a browser save dialog.
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fallbackFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download bill document');
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [costsResponse, goalsResponse] = await Promise.all([
        costApi.getCosts(),
        costApi.getGoals(),
      ]);
      setCosts(costsResponse.data);
      setGoals(goalsResponse.data);
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
      const [goalsResponse, costsResponse] = await Promise.all([
        costApi.getGoals(),
        costApi.getCosts(),
      ]);
      setGoals(goalsResponse.data);
      setCosts(costsResponse.data);
    } catch (err) {
      setError('Failed to fetch goals: ' + (err.response?.data?.message || err.message));
      if (err.response?.status === 401) {
        navigate('/user-management');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchAIInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await costApi.getAIInsights();
      setAiInsights(response.data);
    } catch (err) {
      console.error('AI Insights fetch failed:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    // Each tab has distinct data dependencies; fetch lazily to avoid reloading everything on every navigation.
    if (activeTab === 'costs') {
      fetchCosts();
    } else if (activeTab === 'goals') {
      fetchGoals();
    } else if (activeTab === 'dashboard' && !aiInsights && costs.length > 0) {
      fetchAIInsights();
    }
  }, [activeTab, fetchCosts, fetchGoals, aiInsights, costs.length]);

  const handleAddCost = async () => {
    setError('');
    try {
      const validationResult = validateCostForm(costForm);
      if (!validationResult.isValid) {
        // Surface the first blocking message prominently while still keeping per-field errors in state.
        const firstMessage = Object.values(validationResult.errors)[0] || 'Please fix highlighted fields';
        setError(firstMessage);
        return;
      }

      const month = parseOptionalNumber(costForm.month);
      const year = parseOptionalNumber(costForm.year);
      const amount = parseOptionalNumber(costForm.amount);
      const utilityType = costForm.utilityType;

      const payloadData = {
        month: String(month),
        year: String(year),
        amount: String(amount),
        utilityType,
        notes: costForm.notes || '',
      };

      if (costEditingId) {
        if (costForm.document) {
          const updateFormData = new FormData();
          Object.entries(payloadData).forEach(([key, val]) => updateFormData.append(key, val));
          updateFormData.append('document', costForm.document);
          await costApi.updateCost(costEditingId, updateFormData);
        } else {
          await costApi.updateCost(costEditingId, payloadData);
        }
      } else {
        if (costForm.document) {
          const formData = new FormData();
          Object.entries(payloadData).forEach(([key, val]) => formData.append(key, val));
          formData.append('document', costForm.document);
          await costApi.createCost(formData);
        } else {
          await costApi.createCost(payloadData);
        }
      }

      setCostForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        utilityType: 'electricity',
        amount: '',
        notes: '',
        document: null,
      });
      setCostEditingId(null);
      setCostFieldErrors({});
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
      const goalAmount = parseOptionalNumber(goalForm.goalAmount);

      if (goalAmount === null || goalAmount < 0) {
        setError('Please enter a valid goal amount');
        return;
      }

      if (goalForm.year < 1900 || goalForm.year > MAX_ALLOWED_YEAR) {
        setError(`Year must be between 1900 and ${MAX_ALLOWED_YEAR}`);
        return;
      }

      if (goalAmount > 1000000) {
        setError('Goal amount is too large. Please check and try again.');
        return;
      }

      const payload = {
        ...goalForm,
        goalAmount,
      };

      if (goalEditingId) {
        await costApi.updateGoal(goalEditingId, payload);
      } else {
        await costApi.createGoal(payload);
      }
      setGoalForm({
        type: 'monthly',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        utilityType: 'electricity',
        goalAmount: '',
        notes: '',
      });
      setGoalEditingId(null);
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
      const units = parseOptionalNumber(estimationForm.units);
      const peakUnits = parseOptionalNumber(estimationForm.peakUnits);
      const offPeakUnits = parseOptionalNumber(estimationForm.offPeakUnits);

      if (units === null || units < 0) {
        setError('Please enter valid usage units');
        return;
      }

      if (peakUnits === null || peakUnits < 0 || offPeakUnits === null || offPeakUnits < 0) {
        setError('Peak and off-peak units must be valid non-negative numbers');
        return;
      }

      if (peakUnits + offPeakUnits > units) {
        setError('Peak and off-peak units cannot exceed total units');
        return;
      }

      const response = await costApi.estimateCost({
        ...estimationForm,
        units,
        peakUnits,
        offPeakUnits,
      });
      setEstimation(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to estimate cost');
    } finally {
      setEstimationLoading(false);
    }
  };

  const MonthSelect = ({ value, onChange, onBlur }) => (
    <select
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
        </option>
      ))}
    </select>
  );

  const UtilitySelect = ({ value, onChange, onBlur }) => (
    <select
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium capitalize"
    >
      <option value="electricity">Electricity</option>
      <option value="gas">Natural Gas</option>
      <option value="water">Water</option>
      <option value="trash">Trash/Recycling</option>
    </select>
  );

  const getGoalBillSummary = (goal) => {
    if (goal.type === 'monthly') {
      const monthlyCost = costs.find((cost) => cost.year === goal.year && cost.month === goal.month && cost.utilityType === goal.utilityType);
      return {
        hasBillData: Boolean(monthlyCost),
        billAmount: monthlyCost ? Number(monthlyCost.amount || monthlyCost.electricityCost || 0) : 0,
      };
    }

    const yearlyCosts = costs.filter((cost) => cost.year === goal.year && cost.utilityType === goal.utilityType);
    return {
      hasBillData: yearlyCosts.length > 0,
      billAmount: yearlyCosts.reduce((sum, cost) => sum + Number(cost.amount || cost.electricityCost || 0), 0),
    };
  };

  const getMonthlyBillAmount = (month, year, type = 'electricity') => {
    const monthlyCost = costs.find((cost) => cost.year === year && cost.month === month && cost.utilityType === type);
    return monthlyCost ? Number(monthlyCost.amount || monthlyCost.electricityCost || 0) : null;
  };

  const monthlyFormBillAmount =
    goalForm.type === 'monthly' ? getMonthlyBillAmount(goalForm.month, goalForm.year, goalForm.utilityType) : null;
  const monthlyFormGoalExceeds =
    goalForm.type === 'monthly' &&
    monthlyFormBillAmount !== null &&
    Number(goalForm.goalAmount || 0) > monthlyFormBillAmount;

  const getMonthlyGoalForCost = (cost) => {
    return goals.find(
      (goal) =>
        goal.type === 'monthly' &&
        Number(goal.year) === Number(cost.year) &&
        Number(goal.month) === Number(cost.month) &&
        goal.utilityType === cost.utilityType
    );
  };

  const getYearlyGoalForYear = (year, type = 'electricity') => goals.find(
    (goal) => goal.type === 'yearly' && Number(goal.year) === Number(year) && goal.utilityType === type
  );

  const getApplicableGoalForCost = (cost) => {
    const monthlyGoal = getMonthlyGoalForCost(cost);
    if (monthlyGoal) {
      return {
        goal: monthlyGoal,
        source: 'monthly',
      };
    }

    const yearlyGoal = getYearlyGoalForYear(cost.year, cost.utilityType);
    if (yearlyGoal) {
      return {
        goal: yearlyGoal,
        source: 'yearly',
      };
    }

    return {
      goal: null,
      source: null,
    };
  };

  // --- Core Calculations ---
  const sortedCosts = [...costs].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });

  const totalSpent = sortedCosts.reduce((sum, cost) => sum + Number(cost.amount || cost.electricityCost || 0), 0);
  const avgMonthlySpend = sortedCosts.length ? totalSpent / sortedCosts.length : 0;

  const getSlashedTotal = (type) => sortedCosts.filter(c => c.utilityType === type || (!c.utilityType && type === 'electricity')).reduce((sum, cost) => sum + Number(cost.amount || cost.electricityCost || 0), 0);
  const electricityTotal = getSlashedTotal('electricity');
  const gasTotal = getSlashedTotal('gas');
  const waterTotal = getSlashedTotal('water');
  const trashTotal = getSlashedTotal('trash');

  const movingAverage3Months = sortedCosts.length
    ? sortedCosts.slice(0, 3).reduce((sum, cost) => sum + Number(cost.amount || cost.electricityCost || 0), 0) / Math.min(3, sortedCosts.length)
    : 0;

  const highestCost = sortedCosts.reduce((max, cost) => {
    const value = Number(cost.amount || cost.electricityCost || 0);
    const maxValue = max ? Number(max.amount || max.electricityCost || 0) : 0;
    if (!max || value > maxValue) {
      return cost;
    }
    return max;
  }, null);

  const latestCost = sortedCosts[0] || null;
  const previousCost = sortedCosts[1] || null;
  const momChange = latestCost && previousCost
    ? ((Number(latestCost.amount || latestCost.electricityCost || 0) - Number(previousCost.amount || previousCost.electricityCost || 0)) / Number(previousCost.amount || previousCost.electricityCost || 1)) * 100
    : null;

  const peakCostIds = new Set(
    [...sortedCosts]
      .sort((a, b) => Number(b.amount || b.electricityCost || 0) - Number(a.amount || a.electricityCost || 0))
      .slice(0, 3)
      .map((cost) => cost._id)
  );

  // --- Visual Analytics Data Preparation ---
  const pieData = [
    { name: 'Electricity', value: electricityTotal, color: '#3b82f6' },
    { name: 'Natural Gas', value: gasTotal, color: '#f59e0b' },
    { name: 'Water', value: waterTotal, color: '#06b6d4' },
    { name: 'Trash', value: trashTotal, color: '#a855f7' }
  ].filter(d => d.value > 0);

  const getMonthlyTrendData = () => {
    // Group costs by month/year
    const monthlyGroups = {};
    const last6Months = [];
    
    // Generate labels for last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = `${new Date(y, m - 1).toLocaleString('default', { month: 'short' })} ${y}`;
      const key = `${y}-${m}`;
      monthlyGroups[key] = { name: label, electricity: 0, gas: 0, water: 0, trash: 0 };
      last6Months.push(key);
    }

    sortedCosts.forEach(cost => {
      const key = `${cost.year}-${cost.month}`;
      if (monthlyGroups[key]) {
        const type = cost.utilityType || 'electricity';
        const amount = Number(cost.amount || cost.electricityCost || 0);
        monthlyGroups[key][type] = (monthlyGroups[key][type] || 0) + amount;
      }
    });

    return last6Months.map(key => monthlyGroups[key]);
  };

  const barData = getMonthlyTrendData();

  const startGoalEdit = (goal) => {
    setGoalForm({
      type: goal.type,
      utilityType: goal.utilityType || 'electricity',
      month: goal.month || (new Date().getMonth() + 1),
      year: goal.year,
      goalAmount: Number(goal.goalAmount || 0),
      notes: goal.notes || '',
    });
    setGoalEditingId(goal._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAdjustGoalForCost = (cost) => {
    const existingMonthlyGoal = getMonthlyGoalForCost(cost);

    setGoalForm({
      type: 'monthly',
      utilityType: cost.utilityType || 'electricity',
      month: Number(cost.month),
      year: Number(cost.year),
      goalAmount: existingMonthlyGoal ? Number(existingMonthlyGoal.goalAmount || 0) : Number(cost.amount || cost.electricityCost || 0),
      notes: existingMonthlyGoal?.notes || '',
    });

    setGoalEditingId(existingMonthlyGoal?._id || null);
    setActiveTab('goals');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnitsChange = (rawValue) => {
    setEstimationForm((prev) => {
      const nextUnitsRaw = rawValue;
      const nextUnits = parseOptionalNumber(nextUnitsRaw);
      if (nextUnits === null || nextUnits < 0) {
        return {
          ...prev,
          units: nextUnitsRaw,
        };
      }

      let peak = parseOptionalNumber(prev.peakUnits) || 0;
      let offPeak = parseOptionalNumber(prev.offPeakUnits) || 0;

      if (peak > nextUnits) {
        peak = nextUnits;
      }
      if (offPeak > nextUnits) {
        offPeak = nextUnits;
      }
      if (peak + offPeak > nextUnits) {
        offPeak = Math.max(nextUnits - peak, 0);
      }

      return {
        ...prev,
        units: nextUnitsRaw,
        peakUnits: String(peak),
        offPeakUnits: String(offPeak),
      };
    });
  };

  const handlePeakUnitsChange = (rawValue) => {
    setEstimationForm((prev) => {
      const units = Math.max(parseOptionalNumber(prev.units) || 0, 0);
      let peak = Math.max(parseOptionalNumber(rawValue) || 0, 0);
      peak = Math.min(peak, units);

      let offPeak = Math.max(parseOptionalNumber(prev.offPeakUnits) || 0, 0);
      if (peak + offPeak > units) {
        offPeak = Math.max(units - peak, 0);
      }

      return {
        ...prev,
        peakUnits: String(peak),
        offPeakUnits: String(offPeak),
      };
    });
  };

  const handleOffPeakUnitsChange = (rawValue) => {
    setEstimationForm((prev) => {
      const units = Math.max(parseOptionalNumber(prev.units) || 0, 0);
      let offPeak = Math.max(parseOptionalNumber(rawValue) || 0, 0);
      offPeak = Math.min(offPeak, units);

      let peak = Math.max(parseOptionalNumber(prev.peakUnits) || 0, 0);
      if (peak + offPeak > units) {
        peak = Math.max(units - offPeak, 0);
      }

      return {
        ...prev,
        peakUnits: String(peak),
        offPeakUnits: String(offPeak),
      };
    });
  };

  const estimationUnits = Math.max(parseOptionalNumber(estimationForm.units) || 0, 0);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const hasCurrentMonthBill = costs.some(
    (cost) => Number(cost.month) === currentMonth && Number(cost.year) === currentYear
  );

  const openLogCurrentMonth = () => {
    setActiveTab('costs');
    setCostEditingId(null);
    setCostFieldErrors({});
    setCostForm({
      month: currentMonth,
      year: currentYear,
      utilityType: 'electricity',
      amount: '',
      notes: '',
      document: null,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportCostsCsv = () => {
    if (!sortedCosts.length) {
      setError('No cost records available to export');
      return;
    }

    const headers = ['Month', 'Year', 'UtilityType', 'AmountLKR', 'Notes'];
    const rows = sortedCosts.map((cost) => [
      Number(cost.month),
      Number(cost.year),
      cost.utilityType || 'electricity',
      Number(cost.amount || cost.electricityCost || 0).toFixed(2),
      (cost.notes || '').replace(/\n/g, ' ').replace(/,/g, ';'),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cost-summary-${currentYear}-${String(currentMonth).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportSummaryPdf = () => {
    if (!sortedCosts.length) {
      setError('No cost records available to export');
      return;
    }

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });
    const rows = sortedCosts.slice(0, 12).map((cost) => {
      const label = `${new Date(2024, Number(cost.month) - 1).toLocaleString('default', { month: 'short' })} ${cost.year}`;
      return `<tr><td style="padding:8px;border:1px solid #ddd;">${label}</td><td style="padding:8px;border:1px solid #ddd;">${cost.utilityType || 'electricity'}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatMoney(cost.amount || cost.electricityCost)}</td><td style="padding:8px;border:1px solid #ddd;">${(cost.notes || '-').replace(/</g, '&lt;')}</td></tr>`;
    }).join('');

    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      setError('Unable to open print window. Please allow pop-ups and try again.');
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Cost Summary</title>
          <style>
            body { font-family: Segoe UI, Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 8px; }
            p { margin: 4px 0; color: #4b5563; }
            .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
            .card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .08em; }
            .card .value { margin-top: 6px; font-size: 20px; font-weight: 700; }
            table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            th { text-align: left; padding: 8px; border: 1px solid #ddd; background: #f8fafc; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Electricity Cost Summary</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Current Month Status: ${hasCurrentMonthBill ? `Logged for ${monthName} ${currentYear}` : `Not logged for ${monthName} ${currentYear}`}</p>
          <div class="cards">
            <div class="card"><div class="label">Total Spent</div><div class="value">Rs. ${formatMoney(totalSpent)}</div></div>
            <div class="card"><div class="label">Monthly Average</div><div class="value">Rs. ${formatMoney(avgMonthlySpend)}</div></div>
            <div class="card"><div class="label">3-Month Moving Avg</div><div class="value">Rs. ${formatMoney(movingAverage3Months)}</div></div>
          </div>
          <h2>Latest Records</h2>
          <table>
            <thead>
               <tr>
                 <th>Period</th>
                 <th>Category</th>
                 <th style="text-align:right;">Amount (LKR)</th>
                 <th>Notes</th>
               </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Cost Management</h1>
            <p className="text-gray-500 text-lg">Detailed insight into your household utility spending.</p>
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dashboard
            </button>
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

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {!loading && !hasCurrentMonthBill && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide">Recurring Reminder</p>
                  <p className="text-sm font-semibold">You have not logged a bill for this month yet.</p>
                </div>
                <button
                  onClick={openLogCurrentMonth}
                  className="px-4 py-2 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-black"
                >
                  Log This Month Bill
                </button>
              </div>
            )}

            {/* AI Spending Advisor Card */}
            {(!loading && costs.length > 0) && (
              <div className="relative group overflow-hidden rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 shadow-2xl shadow-blue-200 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Decorative background elements */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
                
                <div className="relative flex flex-col lg:flex-row items-center gap-8">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-inner border border-white/30 shrink-0">
                    <svg className={`w-12 h-12 text-white ${insightsLoading ? 'animate-spin' : 'animate-pulse'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 text-center lg:text-left">
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">AI Insights Beta</span>
                      </div>
                      <h2 className="text-3xl font-black text-white leading-tight">AI Spending Advisor</h2>
                    </div>

                    {insightsLoading ? (
                      <div className="space-y-4">
                        <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-white/10 rounded-full w-1/2 animate-pulse"></div>
                      </div>
                    ) : aiInsights ? (
                      <div className="space-y-6">
                        <p className="text-blue-50 text-lg font-medium leading-relaxed max-w-2xl">
                          {aiInsights.summary}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiInsights.recommendations?.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 bg-black/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all">
                              <div className="mt-1 w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-200"></div>
                              </div>
                              <span className="text-white text-sm font-bold leading-snug">{rec}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                           <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                             aiInsights.status === 'excellent' ? 'bg-emerald-500 text-white' :
                             aiInsights.status === 'warning' ? 'bg-amber-500 text-white' :
                             aiInsights.status === 'critical' ? 'bg-rose-500 text-white' :
                             'bg-blue-800 text-blue-100'
                           }`}>
                             Status: {aiInsights.status}
                           </div>
                           <button 
                             onClick={fetchAIInsights}
                             className="text-white/80 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-colors"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                             Refine Analysis
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/10 p-6 rounded-2xl border border-white/10">
                        <p className="text-white/80 font-bold mb-4">Click to generate your personalized utility analysis.</p>
                        <button onClick={fetchAIInsights} className="px-6 py-2 bg-white text-blue-700 font-black rounded-xl hover:bg-blue-50 transition-all shadow-lg active:scale-95">Generate Now</button>
                      </div>
                    )}
                  </div>
                  
                  {aiInsights && (
                    <div className="hidden xl:flex flex-col items-center justify-center bg-white/10 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/20 min-w-[180px]">
                      <p className="text-[10px] font-black text-white/60 uppercase mb-2">Priority Focus</p>
                      <div className="text-2xl font-black text-white text-center">{aiInsights.highlight_category}</div>
                      <div className="mt-4 w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full w-3/4"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {costs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Total Spent</p>
                  <p className="text-2xl font-black text-gray-900 mt-2">Rs. {formatMoney(totalSpent)}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Monthly Average</p>
                  <p className="text-2xl font-black text-gray-900 mt-2">Rs. {formatMoney(avgMonthlySpend)}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Highest Bill</p>
                  <p className="text-2xl font-black text-gray-900 mt-2">Rs. {formatMoney(highestCost?.amount || highestCost?.electricityCost || 0)}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-black">MoM Change</p>
                  <p className={`text-2xl font-black mt-2 ${momChange === null ? 'text-gray-500' : momChange >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {momChange === null ? 'N/A' : `${momChange >= 0 ? '+' : ''}${momChange.toFixed(1)}%`}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-black">3-Month Moving Avg</p>
                  <p className="text-2xl font-black text-gray-900 mt-2">Rs. {formatMoney(movingAverage3Months)}</p>
                </div>
              </div>
            )}

            {/* Utility Breakdown Stats */}
            {!loading && sortedCosts.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                <div className="bg-blue-50/50 p-4 rounded-2xl border-2 border-blue-100/50 hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <p className="text-[10px] uppercase font-black text-blue-600 tracking-wider">Electricity</p>
                  </div>
                  <p className="text-xl font-black text-gray-900">Rs. {formatMoney(electricityTotal)}</p>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-2xl border-2 border-amber-100/50 hover:border-amber-200 transition-all group">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                    <p className="text-[10px] uppercase font-black text-amber-600 tracking-wider">Natural Gas</p>
                  </div>
                  <p className="text-xl font-black text-gray-900">Rs. {formatMoney(gasTotal)}</p>
                </div>
                <div className="bg-cyan-50/50 p-4 rounded-2xl border-2 border-cyan-100/50 hover:border-cyan-200 transition-all group">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                    <p className="text-[10px] uppercase font-black text-cyan-600 tracking-wider">Water</p>
                  </div>
                  <p className="text-xl font-black text-gray-900">Rs. {formatMoney(waterTotal)}</p>
                </div>
                <div className="bg-purple-50/50 p-4 rounded-2xl border-2 border-purple-100/50 hover:border-purple-200 transition-all group">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                    <p className="text-[10px] uppercase font-black text-purple-600 tracking-wider">Trash/Recycling</p>
                  </div>
                  <p className="text-xl font-black text-gray-900">Rs. {formatMoney(trashTotal)}</p>
                </div>
              </div>
            )}

            {/* Visual Analytics Section */}
            {!loading && sortedCosts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in fade-in duration-700">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Spending Distribution</h3>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-6">Current Portfolio Breakdown</p>
                  
                  <div className="h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={1500}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value) => [`Rs. ${formatMoney(value)}`, 'Spent']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Total</p>
                      <p className="text-2xl font-black text-gray-900 leading-none">
                        {formatMoney(totalSpent)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {pieData.map(item => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Spending Trends</h3>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-6">Last 6 Months Category Analysis</p>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fontWeight: 700 }}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fontWeight: 700 }}
                          tickFormatter={(val) => `Rs.${val > 1000 ? (val/1000) + 'k' : val}`}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          cursor={{ fill: '#f8fafc', radius: 10 }}
                        />
                        <Bar dataKey="electricity" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="gas" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="water" stackId="a" fill="#06b6d4" />
                        <Bar dataKey="trash" stackId="a" fill="#a855f7" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Costs View */}
        {activeTab === 'costs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Historical Costs</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportCostsCsv}
                  className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Export CSV
                </button>
                <button
                  onClick={exportSummaryPdf}
                  className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  PDF Summary
                </button>
                <button
                  onClick={() => {
                    if (showForm) {
                      setCostEditingId(null);
                      setCostForm({
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        utilityType: 'electricity',
                        amount: '',
                        notes: '',
                        document: null,
                      });
                      setCostFieldErrors({});
                    }
                    setShowForm(!showForm);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                >
                  {showForm ? '✕ Cancel' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Log Bill</>}
                </button>
              </div>
            </div>

            {showForm && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 animate-in zoom-in-95 duration-300">
                <h3 className="text-xl font-bold mb-6">{costEditingId ? 'Edit Bill Record' : 'Log New Bill'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Utility Category</label>
                    <UtilitySelect
                      value={costForm.utilityType}
                      onChange={(e) => setCostForm({ ...costForm, utilityType: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Billing Month</label>
                    <MonthSelect
                      value={costForm.month}
                      onChange={(e) => {
                        setCostForm({ ...costForm, month: parseInt(e.target.value, 10) });
                        setCostFieldErrors((prev) => {
                          const { month: removed, ...rest } = prev;
                          return rest;
                        });
                      }}
                      onBlur={() => handleCostFieldBlur('month')}
                    />
                    {costFieldErrors.month && (
                      <p className="text-xs text-red-600 mt-2 ml-1">{costFieldErrors.month}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Year</label>
                    <input
                      type="number"
                      value={costForm.year}
                      onChange={(e) => {
                        setCostForm({ ...costForm, year: e.target.value });
                        setCostFieldErrors((prev) => {
                          const { year: removed, ...rest } = prev;
                          return rest;
                        });
                      }}
                      onBlur={() => handleCostFieldBlur('year')}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                    {costFieldErrors.year && (
                      <p className="text-xs text-red-600 mt-2 ml-1">{costFieldErrors.year}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Amount (LKR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                      <input
                        type="number"
                        step="0.01"
                        value={costForm.amount}
                        onChange={(e) => {
                          setCostForm({ ...costForm, amount: e.target.value });
                          setCostFieldErrors((prev) => {
                            const { amount: removed, ...rest } = prev;
                            return rest;
                          });
                        }}
                        onBlur={() => handleCostFieldBlur('amount')}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                      />
                    </div>
                    {costFieldErrors.amount && (
                      <p className="text-xs text-red-600 mt-2 ml-1">{costFieldErrors.amount}</p>
                    )}
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
                  {!costEditingId && (
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
                  {costEditingId && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Replace Bill Document (Optional)</label>
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
                    {costEditingId ? 'Apply Changes' : 'Save Record'}
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
                <p className="text-gray-500">Log your first utility bill to start tracking efficiency.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {costs.map((cost) => {
                  const applicableGoal = getApplicableGoalForCost(cost);
                  const costAmount = Number(cost.amount || cost.electricityCost || 0);
                  const monthlyGoalExceedsCost =
                    Boolean(applicableGoal.goal) && Number(applicableGoal.goal.goalAmount || 0) > costAmount;
                  const isPeakMonth = peakCostIds.has(cost._id);

                  return (
                  <div key={cost._id} className="group bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-lg uppercase">
                            {new Date(2024, cost.month - 1).toLocaleString('default', { month: 'short' })} {cost.year}
                          </div>
                          {isPeakMonth && (
                            <span className="px-2 py-1 text-[10px] font-black rounded-md bg-rose-100 text-rose-700 uppercase">Peak Log</span>
                          )}
                        </div>
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black rounded-lg uppercase w-fit">
                          {cost.utilityType || 'electricity'}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setCostForm({ ...cost, document: null }); setCostEditingId(cost._id); setCostFieldErrors({}); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => handleDeleteCost(cost._id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                    <p className="text-4xl font-black text-gray-900 mb-2">
                      <span className="text-lg font-bold text-gray-400 mr-1">Rs.</span>
                      {formatMoney(cost.amount || cost.electricityCost)}
                    </p>
                    {monthlyGoalExceedsCost && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 3c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                        </svg>
                        <span>
                          Warning: {applicableGoal.source === 'yearly' ? 'Yearly fallback goal' : 'Monthly goal'} exceeds this bill amount.
                        </span>
                        <button
                          onClick={() => startAdjustGoalForCost(cost)}
                          className="ml-auto px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-black text-xs"
                        >
                          Adjust Goal
                        </button>
                      </div>
                    )}
                    {applicableGoal.source === 'yearly' && (
                      <p className="text-xs text-emerald-600 font-semibold mt-2">Using yearly goal as fallback (monthly goal has priority when available).</p>
                    )}
                    {cost.document?.path && (
                      <button
                        onClick={() => handleDownloadDocument(cost._id, cost.document.originalName || `bill-${cost.month}-${cost.year}`)}
                        aria-label="Download bill document"
                        title="Download bill document"
                        className="mt-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:from-blue-100 hover:to-cyan-100"
                      >
                        <svg
                          className={`w-5 h-5 ${downloadingDocumentId === cost._id ? 'animate-pulse' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h5l5 5v9a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )})}
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
                onClick={() => {
                  if (showForm) {
                    setGoalEditingId(null);
                    setGoalForm({
                      type: 'monthly',
                      month: new Date().getMonth() + 1,
                      year: new Date().getFullYear(),
                      utilityType: 'electricity',
                      goalAmount: '',
                      notes: '',
                    });
                  }
                  setShowForm(!showForm);
                }}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
              >
                {showForm ? '✕ Cancel' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Set Budget</>}
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                <h3 className="text-xl font-bold mb-6">{goalEditingId ? 'Edit Energy Budget' : 'Create Energy Budget'}</h3>
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
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Utility Category</label>
                    <UtilitySelect
                      value={goalForm.utilityType}
                      onChange={(e) => setGoalForm({ ...goalForm, utilityType: e.target.value })}
                    />
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
                      onChange={(e) => setGoalForm({ ...goalForm, goalAmount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none font-black text-lg"
                    />
                    {monthlyFormGoalExceeds && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 3c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                        </svg>
                        Warning: Monthly goal exceeds the bill amount for this month.
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Notes</label>
                    <textarea
                      value={goalForm.notes}
                      onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                      placeholder="Optional budget note"
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddGoal}
                  className="mt-8 bg-emerald-600 text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                >
                  {goalEditingId ? 'Update Budget Limit' : 'Set Budget Limit'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {goals.map((goal) => {
                const { hasBillData, billAmount } = getGoalBillSummary(goal);
                const goalAmount = Number(goal.goalAmount || 0);
                const monthlyGoalExceedsBill =
                  goal.type === 'monthly' && hasBillData && goalAmount > billAmount;

                return (
                <div key={goal._id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-emerald-600 font-black uppercase tracking-widest text-xs mb-1">
                        {goal.utilityType || 'electricity'} • {goal.type}
                      </p>
                      <h3 className="text-3xl font-black text-gray-900">
                        {goal.type === 'monthly' ? `${new Date(2024, goal.month - 1).toLocaleString('default', { month: 'long' })}` : goal.year}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startGoalEdit(goal)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={() => handleDeleteGoal(goal._id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 font-bold text-sm uppercase">Budget Limit</p>
                    <p className="text-5xl font-black text-gray-900 italic">Rs. {formatMoney(goal.goalAmount)}</p>
                    {hasBillData && (
                      <p className="text-sm font-semibold text-gray-600 pt-1">
                        Related Bill Amount: Rs. {formatMoney(billAmount)}
                      </p>
                    )}
                    {monthlyGoalExceedsBill && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 3c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                        </svg>
                        Warning: Monthly goal exceeds the bill amount.
                        <button
                          onClick={() => startGoalEdit(goal)}
                          className="ml-auto px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-black text-xs"
                        >
                          Adjust Goal
                        </button>
                      </div>
                    )}
                    {goal.type === 'yearly' && (
                      <p className="text-xs text-emerald-600 font-semibold pt-1">Priority rule: monthly goals override this yearly goal for matching months.</p>
                    )}
                    {goalAmount > 0 && hasBillData && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                          <span>Goal Progress</span>
                          <span>{Math.min((billAmount / goalAmount) * 100, 999).toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full ${billAmount > goalAmount ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((billAmount / goalAmount) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Actual: Rs. {formatMoney(billAmount)} / Target: Rs. {formatMoney(goalAmount)}</p>
                      </div>
                    )}
                    {goal.notes && <p className="text-gray-500 text-sm pt-2">{goal.notes}</p>}
                  </div>
                </div>
              )})}
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
                    onChange={(e) => handleUnitsChange(e.target.value)}
                    placeholder="Enter kWh usage"
                    className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-black text-2xl placeholder:text-gray-200"
                  />
                </div>

                <div className="space-y-4 rounded-2xl bg-gray-50 p-5 border border-gray-100">
                  <div>
                    <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                      <span>Peak Units</span>
                      <span>{Math.max(parseOptionalNumber(estimationForm.peakUnits) || 0, 0).toFixed(0)} kWh</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={estimationUnits}
                      step="1"
                      value={Math.max(parseOptionalNumber(estimationForm.peakUnits) || 0, 0)}
                      onChange={(e) => handlePeakUnitsChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                      <span>Off-Peak Units</span>
                      <span>{Math.max(parseOptionalNumber(estimationForm.offPeakUnits) || 0, 0).toFixed(0)} kWh</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={estimationUnits}
                      step="1"
                      value={Math.max(parseOptionalNumber(estimationForm.offPeakUnits) || 0, 0)}
                      onChange={(e) => handleOffPeakUnitsChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">
                    TOU allocation: {(Math.max(parseOptionalNumber(estimationForm.peakUnits) || 0, 0) + Math.max(parseOptionalNumber(estimationForm.offPeakUnits) || 0, 0)).toFixed(0)} / {estimationUnits.toFixed(0)} units
                  </p>
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
                    <div className="mt-2 text-xs text-blue-100 font-semibold">
                      Estimation confidence: {estimation.tariffVersion?.confidence || 'unknown'} | Source: {estimation.source}
                      {estimation.tariffVersion?.effectiveFrom ? ` | Effective from: ${estimation.tariffVersion.effectiveFrom}` : ''}
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
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-500 font-medium">Peak TOU Charge</span>
                        <span className="font-black">Rs. {estimation.summary.peakCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-500 font-medium">Off-Peak TOU Charge</span>
                        <span className="font-black">Rs. {estimation.summary.offPeakCharge.toFixed(2)}</span>
                      </div>
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
