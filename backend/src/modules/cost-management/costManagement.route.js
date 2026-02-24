const express = require('express');
const router = express.Router();
const costController = require('./costManagement.controller');
const { protect } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Costs
 *   description: Electricity cost management API
 */

/**
 * @swagger
 * /api/costs:
 *   post:
 *     summary: Create electricity cost for a month
 *     tags: [Costs]
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
 *               - year
 *               - electricityCost
 *             properties:
 *               month:
 *                 type: integer
 *                 example: 1
 *               year:
 *                 type: integer
 *                 example: 2026
 *               electricityCost:
 *                 type: number
 *                 example: 120.5
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cost created successfully
 *       400:
 *         description: Validation error or duplicate month
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, costController.create);

/**
 * @swagger
 * /api/costs:
 *   get:
 *     summary: List electricity costs for current user
 *     tags: [Costs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of costs
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, costController.list);

/**
 * @swagger
 * /api/costs/{id}:
 *   get:
 *     summary: Get a cost by id
 *     tags: [Costs]
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
 *         description: Cost details
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Cost not found
 */
router.get('/:id', protect, costController.getById);

/**
 * @swagger
 * /api/costs/{id}:
 *   put:
 *     summary: Update a cost by id
 *     tags: [Costs]
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
 *             type: object
 *             properties:
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *               electricityCost:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cost updated
 *       400:
 *         description: Validation error or duplicate month
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Cost not found
 */
router.put('/:id', protect, costController.update);

/**
 * @swagger
 * /api/costs/{id}:
 *   delete:
 *     summary: Delete a cost by id
 *     tags: [Costs]
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
 *         description: Cost removed
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Cost not found
 */
router.delete('/:id', protect, costController.remove);

module.exports = router;
