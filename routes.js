const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', async (req, res, next) => {
  try {
    const ans = await controller.aa();
    return res.status(200).json(ans);
  } catch (err) {
    return res.status(500).json({ error: 'error' })
  }
});

module.exports = router;
