const express = require('express');
const router = express.Router();
const carbonController = require('./carbonFootprintTracker.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);

router.route('/')
    .get(carbonController.getRecords)
    .post(carbonController.createRecord);

router.route('/:id')
    .get(carbonController.getRecord)
    .put(carbonController.updateRecord)
    .delete(carbonController.deleteRecord);

module.exports = router;
