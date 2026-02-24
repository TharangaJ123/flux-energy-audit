const express = require('express');
const router = express.Router();
const energyAuditController = require('./energyAuditManagement.controller');
const auth = require('../../middleware/auth'); // Assuming auth middleware exists

// Apply auth middleware to all routes
router.use(auth.protect);

/**
 * @swagger
 * tags:
 *   name: Energy Audits
 *   description: Energy audit management and AI analysis
 */

/**
 * @swagger
 * /api/energy-audits:
 *   post:
 *     summary: Create a new energy audit
 *     tags: [Energy Audits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - totalUnits
 *               - householdSize
 *               - appliances
 *             properties:
 *               month:
 *                 type: string
 *               totalUnits:
 *                 type: number
 *               householdSize:
 *                 type: number
 *               appliances:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     applianceId:
 *                       type: string
 *                     usageHours:
 *                       type: number
 *     responses:
 *       201:
 *         description: Audit created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', energyAuditController.createAudit);

/**
 * @swagger
 * /api/energy-audits:
 *   get:
 *     summary: Get all energy audits for the user
 *     tags: [Energy Audits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of audits
 *       500:
 *         description: Server error
 */
router.get('/', energyAuditController.getAudits);

/**
 * @swagger
 * /api/energy-audits/{id}:
 *   get:
 *     summary: Get audit by ID
 *     tags: [Energy Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Audit ID
 *     responses:
 *       200:
 *         description: Audit details
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.get('/:id', energyAuditController.getAuditById);

/**
 * @swagger
 * /api/energy-audits/{id}:
 *   put:
 *     summary: Update an energy audit
 *     tags: [Energy Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Audit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalUnits:
 *                 type: number
 *               householdSize:
 *                 type: number
 *               appliances:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     applianceId:
 *                       type: string
 *                     usageHours:
 *                       type: number

 *     responses:
 *       200:
 *         description: Audit updated successfully
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.put('/:id', energyAuditController.updateAudit);

/**
 * @swagger
 * /api/energy-audits/{id}:
 *   delete:
 *     summary: Delete an energy audit
 *     tags: [Energy Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Audit ID
 *     responses:
 *       200:
 *         description: Audit deleted successfully
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', energyAuditController.deleteAudit);

// AI Features

/**
 * @swagger
 * /api/energy-audits/{id}/simulate:
 *   post:
 *     summary: Simulate changes to an audit
 *     tags: [Energy Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Audit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - changes
 *             properties:
 *               changes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     parameter:
 *                       type: string
 *                       enum: [usageHours, powerConsumption, count]
 *                     applianceId:
 *                       type: string
 *                     value:
 *                       type: number
 *     responses:
 *       200:
 *         description: Simulation results
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.post('/:id/simulate', energyAuditController.simulateChange);

/**
 * @swagger
 * /api/energy-audits/{id}/chat:
 *   post:
 *     summary: Chat with the audit context
 *     tags: [Energy Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Audit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, model]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chat response
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.post('/:id/chat', energyAuditController.chatWithAudit);

module.exports = router;
