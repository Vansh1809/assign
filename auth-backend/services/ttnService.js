const axios = require("axios");

const createGateway = async (gatewayData) => {

  const apiBaseUrl = (process.env.TTN_API_BASE_URL || '').replace(/\/$/, '');
  const host = (process.env.TTN_HOST || '').replace(/\/$/, '');
  const userId = process.env.TTN_USER_ID; // TTN owner user id/collaborator.
  const organizationId = process.env.TTN_ORGANIZATION_ID;
  const ownerType = (process.env.TTN_OWNER_TYPE || (organizationId ? 'organization' : 'user')).toLowerCase();

  console.log("TTN API BASE URL:", apiBaseUrl);
  console.log("TTN HOST:", host);
  console.log("TTN OWNER TYPE:", ownerType);
  console.log("TTN USER:", userId);
  console.log("TTN ORGANIZATION:", organizationId);
  console.log("TTN_HOST =", process.env.TTN_HOST);
  console.log("TTN_USER_ID =", process.env.TTN_USER_ID);
  console.log("TTN_ORGANIZATION_ID =", process.env.TTN_ORGANIZATION_ID);

  if (!process.env.TTN_API_KEY) {
    throw new Error("TTN_API_KEY is required to create a gateway");
  }

  if (!apiBaseUrl && !host) {
    throw new Error("TTN_API_BASE_URL or TTN_HOST is required to create a gateway");
  }

  if (ownerType !== 'user' && ownerType !== 'organization') {
    throw new Error("TTN_OWNER_TYPE must be either 'user' or 'organization'");
  }

  if (ownerType === 'user' && !userId) {
    throw new Error("TTN_USER_ID is required to create a gateway");
  }

  if (ownerType === 'organization' && !organizationId) {
    throw new Error("TTN_ORGANIZATION_ID is required when TTN_OWNER_TYPE=organization");
  }

  // TTN GatewayRegistry create uses:
  //   POST {host}/api/v3/users/{collaborator.user_ids.user_id}/gateways
  //   POST {host}/api/v3/organizations/{collaborator.organization_ids.organization_id}/gateways
  // Prefer TTN_API_BASE_URL when present, e.g. https://eu1.cloud.thethings.network/api/v3.
  const base = apiBaseUrl
    ? apiBaseUrl.replace(/\/api\/v3\/?$/i, '')
    : (/^https?:\/\//i.test(host) ? host : `https://${host}`).replace(/\/api\/v3\/?$/i, '');
  const ownerSegment = ownerType === 'organization'
    ? `organizations/${encodeURIComponent(organizationId)}`
    : `users/${encodeURIComponent(userId)}`;
  const url = `${base}/api/v3/${ownerSegment}/gateways`;
  console.log("URL:", url);




  try {
    const response = await axios.post(
      url,
      gatewayData,
      {
        headers: {
          Authorization: `Bearer ${process.env.TTN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

    return response.data;
  } catch (error) {
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);
    throw error;
  }
};

module.exports = {
  createGateway
};
