const express = require('express');
const auth = require('../middleware/auth');
const companyAccess = require('../middleware/companyAccess');
const transactionController = require('../controllers/transactionController');

const router = express.Router({ mergeParams: true });

router.use(auth, companyAccess);

router.get('/', transactionController.list);
router.post('/', transactionController.create);

module.exports = router;
