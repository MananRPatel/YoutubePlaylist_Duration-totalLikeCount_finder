const express = require('express');
const router = express.Router();
const youtube = require('../controller/youtube');
const root = require('../controller/root');

router.get('/api/:id',youtube);
router.get('/api/:id/:api',youtube);
router.get('/',root);

module.exports = router;
