const express = require('express');
const router = express.Router();
const carbonController = require('./carbonFootprintTracker.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);

/*
  Routes for carbon footprint records.
  Supports getting all records and creating a new record.
 */
router.route('/')
    .get(carbonController.getRecords)
    .post(carbonController.createRecord);

/*
 Routes for a specific carbon footprint record by ID.
 Supports getting, updating, and deleting a record.
 */
router.route('/:id')
    .get(carbonController.getRecord)
    .put(carbonController.updateRecord)
    .delete(carbonController.deleteRecord);

module.exports = router;
