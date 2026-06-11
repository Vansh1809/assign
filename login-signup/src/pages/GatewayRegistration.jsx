import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function GatewayRegistration() {
  const navigate = useNavigate();
  const [gatewayId, setGatewayId] = useState("");
  const [name, setName] = useState("");
  const [frequencyPlan, setFrequencyPlan] = useState("EU_863_870");

  // Backend requires EUI (hex string) -> maps to `eui`
  const [gatewayEui, setGatewayEui] = useState("");
  const [description, setDescription] = useState("");

  // gateway_server_address + antennas are handled by the backend (defaults/env).


  const goToDevices = (gatewayOverride = {}) => {
    navigate("/devices", {
      state: {
        gateway: {
          gatewayId,
          name,
          frequencyPlan,
          gatewayEui,
          ...gatewayOverride,
        },
      },
    });
  };

  const registerGateway = async () => {
    try {
      const payload = {
        gateway_id: gatewayId,
        eui: gatewayEui,
        name,
        description,
        frequency_plan_ids: frequencyPlan ? [frequencyPlan] : [],


        // optional booleans
        status_public: true,
        location_public: true,

      };

      const response = await axios.post(
        "http://localhost:5001/api/gateway/register",
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      alert("Gateway Registered Successfully");
      console.log(response.data);
      goToDevices();
    } catch (error) {
      console.error(error);
      const data = error.response?.data;

      if (data?.code === "gateway_eui_taken") {
        const shouldContinue = window.confirm(
          `${data.message}\n\nContinue adding badges/devices for "${data.existingGatewayId}"?`
        );

        if (shouldContinue) {
          goToDevices({
            gatewayId: data.existingGatewayId || gatewayId,
            gatewayEui: data.gatewayEui || gatewayEui,
            name: data.existingGatewayId || name,
            alreadyRegistered: true,
          });
        }

        return;
      }

      const errorMsg =
        data?.details?.[0]?.message ||
        data?.error?.message ||
        data?.message ||
        error.message;
      alert(`Gateway Registration Failed: ${errorMsg}`);
    }
  };

  return (
    <div>
      <h2>Register Gateway</h2>

      <input
        type="text"
        placeholder="Gateway ID"
        value={gatewayId}
        onChange={(e) => setGatewayId(e.target.value)}
      />

      <br /><br />

      <label>
        Frequency Plan:
        <select
          value={frequencyPlan}
          onChange={(e) => setFrequencyPlan(e.target.value)}
          style={{ marginLeft: '8px' }}
        >
          <option value="EU_863_870">EU_863_870</option>
          <option value="IN_865_867">IN_865_867</option>
          <option value="US_902_928">US_902_928</option>
          <option value="AS_923_924">AS_923_924</option>
        </select>
      </label>

      <br /><br />

      <input
        type="text"
        placeholder="Gateway EUI (hex string required)"
        value={gatewayEui}
        onChange={(e) => setGatewayEui(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Gateway Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br /><br />

      <button onClick={registerGateway}>Register Gateway</button>

      <button
        type="button"
        onClick={() => goToDevices()}
        style={{ marginLeft: "12px" }}
      >
        Add Badges / Devices
      </button>

    </div>
  );
}

export default GatewayRegistration;
