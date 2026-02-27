/**
 * @swagger
 * tags:
 *   name: Carbon Footprint
 *   description: Carbon footprint tracking and calculation
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CarbonFootprint:
 *       type: object
 *       required:
 *         - month
 *         - year
 *         - co2Emission
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the record
 *         user:
 *           type: string
 *           description: The user ID associated with this record
 *         month:
 *           type: string
 *           description: The month of the record
 *         year:
 *           type: number
 *           description: The year of the record
 *         electricity:
 *           type: number
 *           description: Electricity consumption in kWh
 *         gasData:
 *           type: object
 *           properties:
 *             selections:
 *               type: array
 *               items:
 *                 type: string
 *             amounts:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *         transportData:
 *           type: object
 *           properties:
 *             selections:
 *               type: array
 *               items:
 *                 type: string
 *             distances:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *         waste:
 *           type: number
 *           description: Waste produced in kg
 *         co2Emission:
 *           type: number
 *           description: Calculated CO2 emission in kg
 *         status:
 *           type: string
 *           enum: [Low, Moderate, High]
 *           description: Emission status based on calculation
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const express = require('express');
const router = express.Router();
const carbonController = require('./carbonFootprintTracker.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);

/**
 * @swagger
 * /api/carbon:
 *   get:
 *     summary: Get all carbon footprint records for the authenticated user
 *     tags: [Carbon Footprint]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of carbon footprint records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CarbonFootprint'
 *       401:
 *         description: Not authorized
 */
router.route('/')
    .get(carbonController.getRecords)
    /**
     * @swagger
     * /api/carbon:
     *   post:
     *     summary: Create a new carbon footprint record
     *     tags: [Carbon Footprint]
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
     *             properties:
     *               month:
     *                 type: string
     *               year:
     *                 type: number
     *               electricity:
     *                 type: number
     *               gasData:
     *                 type: object
     *               transportData:
     *                 type: object
     *               waste:
     *                 type: number
     *     responses:
     *       201:
     *         description: Record created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CarbonFootprint'
     *       400:
     *         description: Invalid input
     *       401:
     *         description: Not authorized
     */
    .post(carbonController.createRecord);

/**
 * @swagger
 * /api/carbon/{id}:
 *   get:
 *     summary: Get a specific carbon footprint record by ID
 *     tags: [Carbon Footprint]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The record ID
 *     responses:
 *       200:
 *         description: Carbon footprint record details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarbonFootprint'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Record not found
 */
router.route('/:id')
    .get(carbonController.getRecord)
    /**
     * @swagger
     * /api/carbon/{id}:
     *   put:
     *     summary: Update a specific carbon footprint record by ID
     *     tags: [Carbon Footprint]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The record ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CarbonFootprint'
     *     responses:
     *       200:
     *         description: Record updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CarbonFootprint'
     *       401:
     *         description: Not authorized
     *       404:
     *         description: Record not found
     */
    .put(carbonController.updateRecord)
    /**
     * @swagger
     * /api/carbon/{id}:
     *   delete:
     *     summary: Delete a specific carbon footprint record by ID
     *     tags: [Carbon Footprint]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The record ID
     *     responses:
     *       200:
     *         description: Record deleted successfully
     *       401:
     *         description: Not authorized
     *       404:
     *         description: Record not found
     */
    .delete(carbonController.deleteRecord);

module.exports = router;
