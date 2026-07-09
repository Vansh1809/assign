import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import AdminLayout from '../Components/AdminLayout';
import { AdminPageLayout, Button, Card } from '../Components/ui';

import { useAuth } from '../AuthContext';

import './GatewayRegistration.css';

const API_BASE_RAW = process.env.REACT_APP_API_BASE_URL;

// Smart base URL: avoid double `/api`.
// - if env already ends with `/api`, use it
// - otherwise append `/api`
const API_BASE = (() => {
  const fallback = 'http://localhost:5000/api';
  const raw = (API_BASE_RAW && String(API_BASE_RAW).trim()) || fallback;
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.toLowerCase().endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

function GatewayRegistration() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [gatewayId, setGatewayId] = useState('');
  const [name, setName] = useState('');
  const [frequencyPlan, setFrequencyPlan] = useState('EU_863_870');
  const [gatewayEui, setGatewayEui] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const roleName = user?.role?.name || user?.role || '';
  const homeRoute = roleName.toLowerCase() === 'admin' ? '/dashboard' : '/user-dashboard';

  const goToDevices = (gatewayOverride = {}) => {
    navigate('/devices', {
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
    setMessage('');

    try {
      const payload = {
        gateway_id: gatewayId,
        eui: gatewayEui,
        name,
        description,
        frequency_plan_ids: frequencyPlan ? [frequencyPlan] : [],
        status_public: true,
        location_public: true,
      };

      await axios.post(`${API_BASE}/gateway/register`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      setMessage('Gateway registered successfully.');
      goToDevices();
    } catch (error) {
      const data = error.response?.data;

      if (data?.code === 'gateway_eui_taken') {
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

      setMessage(`Gateway registration failed: ${errorMsg}`);
    }
  };

return (
  <AdminLayout
    title="Register Gateway"
    subtitle="Create a gateway entry, then continue into badge and device setup."
    action={
      <Button
        variant="secondary"
        size="md"
        onClick={() => goToDevices()}
      >
        Add Badges / Devices
      </Button>
    }
  >
    <AdminPageLayout>
      <div className="register-gateway-page">

        {message && (
          <div className="gateway-notice">
            {message}
          </div>
        )}

        <div className="ad-grid-cols-2">

          {/* Left Card */}

          <Card className="ad-page-section-card">

            <div className="ad-card-header">
              <h2>Gateway Details</h2>
            </div>

            <div className="ad-card-body">

              <div className="gateway-form-grid">

                <label>
                  Gateway ID
                  <input
                    type="text"
                    value={gatewayId}
                    placeholder="gateway-001"
                    onChange={(e) => setGatewayId(e.target.value)}
                  />
                </label>

                <label>
                  Frequency Plan
                  <select
                    value={frequencyPlan}
                    onChange={(e) =>
                      setFrequencyPlan(e.target.value)
                    }
                  >
                    <option value="EU_863_870">EU_863_870</option>
                    <option value="IN_865_867">IN_865_867</option>
                    <option value="US_902_928">US_902_928</option>
                    <option value="AS_923_924">AS_923_924</option>
                  </select>
                </label>

                <label>
                  Gateway EUI
                  <input
                    type="text"
                    value={gatewayEui}
                    placeholder="16 hex characters"
                    onChange={(e) =>
                      setGatewayEui(e.target.value)
                    }
                  />
                </label>

                <label>
                  Gateway Name
                  <input
                    type="text"
                    value={name}
                    placeholder="Main Office Gateway"
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                  />
                </label>

                <label className="gateway-wide-field">
                  Description
                  <input
                    type="text"
                    value={description}
                    placeholder="Optional Notes"
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                  />
                </label>

                <div className="gateway-actions">

                  <Button onClick={registerGateway}>
                    Register Gateway
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => goToDevices()}
                  >
                    Add Badges / Devices
                  </Button>

                </div>

              </div>

            </div>

          </Card>

          {/* Right Card */}

          <Card className="ad-page-section-card">

            <div className="ad-card-header">
              <h2>Setup Checklist</h2>
            </div>

            <div className="ad-card-body">

              <div className="user-workflow">

                <div>
                  <strong>1</strong>
                  <span>Enter Gateway ID</span>
                </div>

                <div>
                  <strong>2</strong>
                  <span>Enter Gateway EUI</span>
                </div>

                <div>
                  <strong>3</strong>
                  <span>Select Frequency Plan</span>
                </div>

                <div>
                  <strong>4</strong>
                  <span>Register Gateway</span>
                </div>

                <div>
                  <strong>5</strong>
                  <span>Add Devices</span>
                </div>

              </div>

            </div>

          </Card>

        </div>

      </div>
    </AdminPageLayout>
  </AdminLayout>
);
}

export default GatewayRegistration;

