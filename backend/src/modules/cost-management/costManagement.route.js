const express = require('express');
const router = express.Router();
const costController = require('./costManagement.controller');
const costGoalController = require('./costGoal.controller');
const { protect } = require('../../middleware/auth');

// Routes for electricity costs and cost goals.

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
// Create electricity cost entry.
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
// List electricity cost entries.
router.get('/', protect, costController.list);

/**
 * @swagger
 * /api/costs/estimate:
 *   post:
 *     summary: Estimate electricity bill using tariff slabs and TOU rates
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
 *               - units
 *               - month
 *               - provider
 *             properties:
 *               units:
 *                 type: number
 *                 example: 120
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 2
 *               year:
 *                 type: integer
 *                 example: 2026
 *               provider:
 *                 type: string
 *                 enum: [CEB, LECO]
 *               peakUnits:
 *                 type: number
 *                 example: 20
 *               offPeakUnits:
 *                 type: number
 *                 example: 40
 *     responses:
 *       200:
 *         description: Bill estimation with summary, breakdown and source (external/local)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 month:
 *                   type: integer
 *                   example: 2
 *                 year:
 *                   type: integer
 *                   example: 2026
 *                 provider:
 *                   type: string
 *                   enum: [CEB, LECO]
 *                 source:
 *                   type: string
 *                   enum: [external, local, local_fallback]
 *                 units:
 *                   type: number
 *                   example: 120
 *                 estimatedBill:
 *                   type: number
 *                   example: 4932.4
 *                 summary:
 *                   type: object
 *                   properties:
 *                     energyCharge:
 *                       type: number
 *                     peakCharge:
 *                       type: number
 *                     offPeakCharge:
 *                       type: number
 *                     fixedCharge:
 *                       type: number
 *                     tax:
 *                       type: number
 *                     subTotal:
 *                       type: number
 *                 breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: slab
 *                       label:
 *                         type: string
 *                         example: 1-30
 *                       units:
 *                         type: number
 *                         example: 30
 *                       ratePerUnit:
 *                         type: number
 *                         example: 8
 *                       amount:
 *                         type: number
 *                         example: 240
 *             example:
 *               month: 2
 *               year: 2026
 *               provider: CEB
 *               source: local
 *               units: 120
 *               estimatedBill: 4932.4
 *               summary:
 *                 energyCharge: 2100
 *                 peakCharge: 720
 *                 offPeakCharge: 960
 *                 fixedCharge: 400
 *                 tax: 752.4
 *                 subTotal: 4180
 *               breakdown:
 *                 - type: slab
 *                   label: 1-30
 *                   units: 30
 *                   ratePerUnit: 8
 *                   amount: 240
 *                 - type: tou
 *                   label: peak
 *                   units: 20
 *                   ratePerUnit: 36
 *                   amount: 720
 *                 - type: fixed
 *                   label: fixedCharge
 *                   amount: 400
 *       400:
 *         description: Validation error or invalid units/provider
 *       401:
 *         description: Not authorized
 */
// Estimate tariff-based electricity bill.
router.post('/estimate', protect, costController.estimate);

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
/**
 * @swagger
 * /api/costs/goals:
 *   post:
 *     summary: Create a cost goal (monthly or yearly)
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
 *               - type
 *               - year
 *               - goalAmount
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               year:
 *                 type: integer
 *                 example: 2026
 *               month:
 *                 type: integer
 *                 example: 1
 *               goalAmount:
 *                 type: number
 *                 example: 150.0
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Goal created successfully
 *       400:
 *         description: Validation error or duplicate goal
 *       401:
 *         description: Not authorized
 */
// Create cost goal entry.
router.post('/goals', protect, costGoalController.create);

/**
 * @swagger
 * /api/costs/goals:
 *   get:
 *     summary: List cost goals for current user
 *     tags: [Costs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of goals
 *       401:
 *         description: Not authorized
 */
// List cost goal entries.
router.get('/goals', protect, costGoalController.list);

/**
 * @swagger
 * /api/costs/goals/{id}:
 *   get:
 *     summary: Get a goal by id
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
 *         description: Goal details
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Goal not found
 */
// Get one cost goal by id.
router.get('/goals/:id', protect, costGoalController.getById);

/**
 * @swagger
 * /api/costs/goals/{id}:
 *   put:
 *     summary: Update a goal by id
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
 *               type:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               goalAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Goal updated
 *       400:
 *         description: Validation error or duplicate goal
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Goal not found
 */
// Update a cost goal by id.
router.put('/goals/:id', protect, costGoalController.update);

/**
 * @swagger
 * /api/costs/goals/{id}:
 *   delete:
 *     summary: Delete a goal by id
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
 *         description: Goal removed
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Goal not found
 */
// Delete a cost goal by id.
router.delete('/goals/:id', protect, costGoalController.remove);

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
// Get one electricity cost by id.
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
// Update electricity cost by id.
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
// Delete electricity cost by id.
router.delete('/:id', protect, costController.remove);

module.exports = router;
