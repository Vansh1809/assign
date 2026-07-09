const express = require("express");
const router = express.Router();

const { requireAdmin } = require('../middleware/adminGuard');
const gatewayController = require("../controllers/gatewayController");

router.post(
  "/register",
  requireAdmin,
  gatewayController.registerGateway
);

module.exports = router;