const express = require("express");
const router = express.Router();

const gatewayController =
require("../controllers/gatewayController");

router.post(
  "/register",
  gatewayController.registerGateway
);

module.exports = router;