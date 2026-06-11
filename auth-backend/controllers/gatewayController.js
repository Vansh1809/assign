const { createGateway } = require('../services/ttnService');

// TTN v3 gateway registry (HTTP)
// POST /api/gateway/register
// Body must include full TTN gateway fields + collaborator info
exports.registerGateway = async (req, res) => {
  try {
    const {
      // gateway fields
      gateway_id,
      eui,
      name,
      description,
      frequency_plan_ids,
      gateway_server_address,
      antennas,
      status_public,
      location_public,


    } = req.body;

    // Basic validation (TTN requires gateway ids + frequency plans)

    if (!gateway_id || typeof gateway_id !== 'string') {
      return res.status(400).json({ success: false, message: 'gateway_id is required' });
    }
    if (!eui || typeof eui !== 'string') {
      return res.status(400).json({ success: false, message: 'eui is required (hex string)' });
    }

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    if (!Array.isArray(frequency_plan_ids) || frequency_plan_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'frequency_plan_ids must be a non-empty array' });
    }

    // gateway_server_address + antennas are optional from client.
    // If omitted, we will use backend defaults (or omit gateway_server_address if env not set).

    const antennasNormalized = Array.isArray(antennas) && antennas.length > 0
      ? antennas
      : [
          {
            gateway_id,
            antenna_id: 1
          }
        ];


    const gatewayServerAddressNormalized =
      typeof gateway_server_address === 'string' && gateway_server_address.trim()
        ? gateway_server_address.trim()
        : process.env.TTN_GATEWAY_SERVER_ADDRESS;

    const gatewayPayload = {
      ids: {
        gateway_id,
        // TTN v3 expects EUI as bytes. In HTTP JSON, the API commonly accepts a hex string.
        // If your TTN endpoint expects different encoding, TTN will return INVALID_ARGUMENT.
        eui
      },
      name,
      description: description || '',
      frequency_plan_ids,
      ...(gatewayServerAddressNormalized
        ? { gateway_server_address: gatewayServerAddressNormalized }
        : {}),
      antennas: antennasNormalized,
      status_public: status_public !== undefined ? !!status_public : true,
      location_public: location_public !== undefined ? !!location_public : true
    };



    const createRequest = {
      gateway: gatewayPayload
    };

    const response = await createGateway(createRequest);

    return res.status(201).json({
      success: true,
      message: 'Gateway registered successfully',
      ttn: response
    });
  } catch (error) {
    // Pass TTN details back for debugging
    const ttnError = error?.response?.data;
    console.error("TTN Error Details:", JSON.stringify(ttnError || error.message, null, 2));
    const gatewayEuiTakenDetail = ttnError?.details?.find((detail) =>
      detail?.name === 'gateway_eui_taken'
    );
    const gatewayEuiTaken =
      ttnError?.message?.includes('gateway_eui_taken') || !!gatewayEuiTakenDetail;

    if (gatewayEuiTaken) {
      const attributes = gatewayEuiTakenDetail?.attributes || {};

      return res.status(409).json({
        success: false,
        code: 'gateway_eui_taken',
        message: `This Gateway EUI is already registered as "${attributes.gateway_id || 'another gateway'}". Use that existing gateway or enter a different hardware EUI.`,
        existingGatewayId: attributes.gateway_id || null,
        gatewayEui: attributes.gateway_eui || eui,
        administrativeContact: attributes.administrative_contact || null,
        error: ttnError
      });
    }

    const missingRights =
      ttnError?.message?.includes('pkg/auth/rights') ||
      ttnError?.details?.some((detail) =>
        detail?.["@type"]?.includes('errors.thethings.network/pkg/auth/rights') ||
        detail?.name === 'no_user_rights'
      );
    const ownerType = (process.env.TTN_OWNER_TYPE || (process.env.TTN_ORGANIZATION_ID ? 'organization' : 'user')).toLowerCase();
    const ownerId = ownerType === 'organization'
      ? process.env.TTN_ORGANIZATION_ID
      : process.env.TTN_USER_ID;
    const requiredRight = ownerType === 'organization'
      ? 'Create gateways under the organization / RIGHT_ORGANIZATION_GATEWAYS_CREATE'
      : 'Create gateways under the user / RIGHT_USER_GATEWAYS_CREATE';

    return res.status(error?.response?.status || 500).json({
      success: false,
      message: missingRights
        ? `TTN API key is missing permission: ${requiredRight} for ${ownerType} "${ownerId}"`
        : 'Gateway registration failed',
      error: ttnError || error?.message
    });
  }
};
