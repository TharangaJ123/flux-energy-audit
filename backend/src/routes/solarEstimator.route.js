/**
 * @file solarEstimator.route.js
 * @description API endpoints for solar potential estimation and ROI calculations.
 */
const express = require('express');
const router = express.Router();
const solarController = require('../controllers/solarEstimator.controller');

/**
 * @route POST /api/solar/estimate
 * @desc Get Solar Potential Estimation
 * @access Public
 */
router.post('/estimate', solarController.calculateSolarPotential);

module.exports = router;
