const express = require('express');
const router = express.Router();
const applianceController = require('./appliancemanagement.controller');
const { protect, authorize } = require('../../middleware/auth');

// Middleware: All routes below require login and appropriate roles
router.use(protect);
router.use(authorize('user', 'admin'));

/**
 * @swagger
 * tags:
 *   name: Appliance Management
 *   description: Manage household appliances and energy consumption data
 */

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
 *           description: Category of the appliance (e.g., Kitchen, Cooling)
 *         dailyEnergyConsumption:
 *           type: number
 *           description: Calculated daily energy in kWh (virtual field)
 *         monthlyEnergyConsumption:
 *           type: number
 *           description: Calculated monthly energy in kWh (virtual field)
 */

/**
 * @swagger
 * /api/appliances:
 *   post:
 *     summary: Add a new appliance
 *     tags: [Appliance Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - powerConsumption
 *               - usageHours
 *             properties:
 *               name:
 *                 type: string
 *               powerConsumption:
 *                 type: number
 *               usageHours:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appliance created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', applianceController.createAppliance);

/**
 * @swagger
 * /api/appliances:
 *   get:
 *     summary: Get all appliances for the logged-in user
 *     tags: [Appliance Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appliances
 *       500:
 *         description: Server error
 */
router.get('/', applianceController.getAllAppliances);

/**
 * @swagger
 * /api/appliances/audit:
 *   get:
 *     summary: Get energy consumption audit report
 *     tags: [Appliance Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Energy audit report with daily and monthly consumption totals
 *       500:
 *         description: Server error
 */
router.get('/audit', applianceController.getEnergyAudit);

/**
 * @swagger
 * /api/appliances/stats:
 *   get:
 *     summary: Get statistical summary of appliances
 *     tags: [Appliance Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistical summary of all appliances
 *       500:
 *         description: Server error
 */
router.get('/stats', applianceController.getApplianceStats);

/**
 * @swagger
 * /api/appliances/{id}:
 *   get:
 *     summary: Get a specific appliance by ID
 *     tags: [Appliance Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Appliance ID
 *     responses:
 *       200:
 *         description: Appliance details
 *       404:
 *         description: Appliance not found
 *       500:
 *         description: Server error
 */
router.get('/:id', applianceController.getAppliance);

/**
 * @swagger
 * /api/appliances/{id}:
 *   put:
 *     summary: Update an appliance
 *     tags: [Appliance Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Appliance ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               powerConsumption:
 *                 type: number
 *               usageHours:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appliance updated successfully
 *       404:
 *         description: Appliance not found
 *       500:
 *         description: Server error
 */
router.put('/:id', applianceController.updateAppliance);

/**
 * @swagger
 * /api/appliances/{id}:
 *   delete:
 *     summary: Delete an appliance
 *     tags: [Appliance Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Appliance ID
 *     responses:
 *       200:
 *         description: Appliance deleted successfully
 *       404:
 *         description: Appliance not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', applianceController.deleteAppliance);

module.exports = router;
