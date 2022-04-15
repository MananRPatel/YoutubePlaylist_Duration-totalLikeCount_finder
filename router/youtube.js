const express = require('express');
const router = express.Router();
const youtube = require('../controller/youtube');


router.get('/api/:id',youtube);

module.exports = router;