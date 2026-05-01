const express = require('express');
const auth = require('../middleware/auth');
const companyAccess = require('../middleware/companyAccess');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router({ mergeParams: true });

router.use(auth, companyAccess);

router.get('/', dashboardController.getDashboard);

module.exports = router;
