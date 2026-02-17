const express = require('express');
const router = express.Router();
const applianceController = require('./appliancemanagement.controller');
const { protect, authorize } = require('../../middleware/auth');

// Middleware: All routes below require login and appropriate roles
router.use(protect);
router.use(authorize('user', 'admin'));

/**
 * @swagger
 * components:
 *   schemas:
 *     Appliance:
 *       type: object
 *       required:
 *         - name
 *         - powerConsumption
 *         - usageHours
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the appliance
 *         name:
 *           type: string
 *           description: Name of the appliance (e.g., Fan, AC)
 *         powerConsumption:
 *           type: number
 *           description: Power consumption in Watts
 *         usageHours:
 *           type: number
 *           description: Usage hours per day
 *         category:
 *           type: string
 *           description: Category of the appliance
 *         dailyEnergyConsumption:
 *           type: number
 *           description: Calculated daily energy in kWh
 *         monthlyEnergyConsumption:
 *           type: number
 *           description: Calculated monthly energy in kWh
 */

/**
 * @swagger
 * /api/appliances:
 *   post:
 *     summary: Add a new appliance
 */
router.post('/', applianceController.createAppliance);

/**
 * @swagger
 * /api/appliances:
 *   get:
 *     summary: Get all appliances for the logged-in user
 */
router.get('/', applianceController.getAllAppliances);

/**
 * @swagger
 * /api/appliances/audit:
 *   get:
 *     summary: Get energy consumption audit report
 */
router.get('/audit', applianceController.getEnergyAudit);

/**
 * @swagger
 * /api/appliances/stats:
 *   get:
 *     summary: Get statistical summary of appliances
 */
router.get('/stats', applianceController.getApplianceStats);

/**
 * @swagger
 * /api/appliances/{id}:
 *   get:
 *     summary: Get a specific appliance
 */
router.get('/:id', applianceController.getAppliance);

/**
 * @swagger
 * /api/appliances/{id}:
 *   put:
 *     summary: Update an appliance
 */
router.put('/:id', applianceController.updateAppliance);

/**
 * @swagger
 * /api/appliances/{id}:
 *   delete:
 *     summary: Delete an appliance
 */
router.delete('/:id', applianceController.deleteAppliance);

module.exports = router;

