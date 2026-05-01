const express = require('express');
const auth = require('../middleware/auth');
const companyAccess = require('../middleware/companyAccess');
const companyController = require('../controllers/companyController');

const router = express.Router();

router.use(auth);

router.get('/', companyController.list);
router.post('/', companyController.create);
router.post('/:id/members', companyAccess, companyController.addMember);

module.exports = router;
