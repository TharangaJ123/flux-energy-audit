const express = require('express');
const router = express.Router();
const applianceController = require('./appliancemanagement.controller');
const { protect, authorize } = require('../../middleware/auth');

// All appliance routes require authentication and specific roles
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
 *     tags: [Appliances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appliance'
 *     responses:
 *       201:
 *         description: Appliance added successfully
 *       400:
 *         description: Validation error
 */
router.post('/', applianceController.createAppliance);

/**
 * @swagger
 * /api/appliances:
 *   get:
 *     summary: Get all appliances for the logged-in user
 *     tags: [Appliances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appliances retrieved successfully
 */
router.get('/', applianceController.getAllAppliances);

/**
 * @swagger
 * /api/appliances/audit:
 *   get:
 *     summary: Get energy consumption audit report
 *     tags: [Appliances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Energy audit report retrieved successfully
 */
router.get('/audit', applianceController.getEnergyAudit);

/**
 * @swagger
 * /api/appliances/stats:
 *   get:
 *     summary: Get statistical summary of appliances
 *     tags: [Appliances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', applianceController.getApplianceStats);

/**
 * @swagger
 * /api/appliances/{id}:
 *   get:
 *     summary: Get a specific appliance
 *     tags: [Appliances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appliance retrieved successfully
 *       404:
 *         description: Appliance not found
 */
router.get('/:id', applianceController.getAppliance);

/**
 * @swagger
 * /api/appliances/{id}:
 *   put:
 *     summary: Update an appliance
 *     tags: [Appliances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appliance'
 *     responses:
 *       200:
 *         description: Appliance updated successfully
 */
router.put('/:id', applianceController.updateAppliance);

/**
 * @swagger
 * /api/appliances/{id}:
 *   delete:
 *     summary: Delete an appliance
 *     tags: [Appliances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appliance deleted successfully
 */
router.delete('/:id', applianceController.deleteAppliance);

module.exports = router;
