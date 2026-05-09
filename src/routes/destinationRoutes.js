const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

router.get('/', destinationController.getAll);
router.post('/', destinationController.create);
router.put('/:id', destinationController.update);
router.delete('/:id', destinationController.delete);

module.exports = router;
