const axios = require('axios');

const normalizeSlabs = (slabs = []) => {
    if (!Array.isArray(slabs)) {
        return [];
    }

    return slabs
        .map((slab) => ({
            from: Number(slab.from),
            to: slab.to === null || slab.to === undefined ? Infinity : Number(slab.to),
            ratePerUnit: Number(slab.ratePerUnit),
        }))
        .filter((slab) => Number.isFinite(slab.from) && Number.isFinite(slab.ratePerUnit))
        .sort((a, b) => a.from - b.from);
};

const fetchTariffPlan = async ({ provider, month, year }) => {
    const baseUrl = process.env.TARIFF_API_URL;
    if (!baseUrl) {
        throw new Error('Tariff API not configured');
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/tariffs`;
    const headers = {};

    if (process.env.TARIFF_API_KEY) {
        headers.Authorization = `Bearer ${process.env.TARIFF_API_KEY}`;
    }

    const response = await axios.get(endpoint, {
        headers,
        params: { provider, month, year },
        timeout: 5000,
    });

    const data = response.data || {};
    const normalized = {
        slabs: normalizeSlabs(data.slabs),
        fixedCharge: Number(data.fixedCharge),
        peakRate: Number(data.peakRate || 0),
        offPeakRate: Number(data.offPeakRate || 0),
        taxRate: Number(data.taxRate || 0),
    };

    if (!normalized.slabs.length || Number.isNaN(normalized.fixedCharge) || Number.isNaN(normalized.taxRate)) {
        throw new Error('Invalid tariff data from API');
    }

    return normalized;
};

module.exports = {
    fetchTariffPlan,
};
