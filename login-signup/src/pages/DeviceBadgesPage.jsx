import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const deviceOptions = [
  {
    value: "sensecap_t1000a",
    label: "SenseCAP T1000A",
    shortLabel: "T1000A",
    category: "device",
    manufacturer: "SenseCAP",
    deviceIdPlaceholder: "t1000a-001",
    namePlaceholder: "SenseCAP T1000A 001",
  },
  {
    value: "sensecap_t1000b",
    label: "SenseCAP T1000B",
    shortLabel: "T1000B",
    category: "device",
    manufacturer: "SenseCAP",
    deviceIdPlaceholder: "t1000b-001",
    namePlaceholder: "SenseCAP T1000B 001",
  },
  {
    value: "3bb_badge",
    label: "3BB Badge",
    shortLabel: "3BB",
    category: "badge",
    manufacturer: "3BB",
    deviceIdPlaceholder: "3bb-badge-001",
    namePlaceholder: "3BB badge 001",
  },
];

const defaultDeviceType = deviceOptions[0].value;

const emptyDevice = {
  type: defaultDeviceType,
  deviceId: "",
  devEui: "",
  joinEui: "",
  appKey: "",
  name: "",
  description: "",
};

const storageKey = "geoboard-device-drafts";

function normalizeHex(value) {
  return value.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
}

function loadDrafts() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

export default function DeviceBadgesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const gateway = location.state?.gateway || {};

  const [device, setDevice] = useState(emptyDevice);
  const [drafts, setDrafts] = useState(loadDrafts);
  const [message, setMessage] = useState("");

  const gatewayLabel = gateway.gatewayId || "Select a gateway first";
  const roleName = user?.role?.name || user?.role || "";
  const homeRoute = roleName.toLowerCase() === "admin" ? "/dashboard" : "/user-dashboard";
  const selectedDeviceOption =
    deviceOptions.find((option) => option.value === device.type) || deviceOptions[0];

  const payloadPreview = useMemo(
    () => ({
      end_device: {
        ids: {
          device_id: device.deviceId,
          dev_eui: device.devEui,
          join_eui: device.joinEui,
        },
        name: device.name,
        description: device.description,
        attributes: {
          device_type: selectedDeviceOption.category,
          device_model: selectedDeviceOption.label,
          manufacturer: selectedDeviceOption.manufacturer,
          gateway_id: gateway.gatewayId || "",
        },
        root_keys: {
          app_key: {
            key: device.appKey,
          },
        },
      },
    }),
    [device, gateway.gatewayId, selectedDeviceOption]
  );

  const updateDevice = (field, value) => {
    setDevice((current) => ({
      ...current,
      [field]: ["devEui", "joinEui", "appKey"].includes(field)
        ? normalizeHex(value)
        : value,
    }));
  };

  const saveDraft = () => {
    if (!device.deviceId || !device.devEui || !device.joinEui || !device.appKey) {
      setMessage("Device ID, DevEUI, JoinEUI, and AppKey are required.");
      return;
    }

    const nextDraft = {
      ...device,
      id: `${Date.now()}`,
      gatewayId: gateway.gatewayId || "",
      gatewayName: gateway.name || "",
      createdAt: new Date().toISOString(),
    };

    const nextDrafts = [nextDraft, ...drafts];
    setDrafts(nextDrafts);
    localStorage.setItem(storageKey, JSON.stringify(nextDrafts));
    setDevice(emptyDevice);
    setMessage("Draft saved. Add the backend endpoint when you are ready to create it in TTN.");
  };

  const removeDraft = (id) => {
    const nextDrafts = drafts.filter((draft) => draft.id !== id);
    setDrafts(nextDrafts);
    localStorage.setItem(storageKey, JSON.stringify(nextDrafts));
  };

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Gateway next step</p>
          <h1 style={styles.title}>Add Badges / Devices</h1>
          <p style={styles.subTitle}>
            Link end devices to the registered gateway, then save drafts until
            the backend device registry API is connected.
          </p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={() => navigate(homeRoute)}>
            Dashboard
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate("/map-view")}>
            Map View
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate("/register-gateway")}>
            Back to Gateway
          </button>
          <button style={styles.primaryBtn} onClick={saveDraft}>
            Save Device Draft
          </button>
        </div>
      </header>

      <main style={styles.layout}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Device details</h2>
              <p style={styles.panelHint}>Gateway: {gatewayLabel}</p>
            </div>
            <div style={styles.badgeStack}>
              <span style={styles.badge}>{selectedDeviceOption.category.toUpperCase()}</span>
              <span style={styles.badge}>{selectedDeviceOption.shortLabel}</span>
            </div>
          </div>

          {message && <div style={styles.notice}>{message}</div>}

          <div style={styles.fieldGrid}>
            <label style={styles.field}>
              Badge / Device
              <select
                value={device.type}
                onChange={(e) => updateDevice("type", e.target.value)}
                style={styles.input}
              >
                {deviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              Device ID
              <input
                value={device.deviceId}
                onChange={(e) => updateDevice("deviceId", e.target.value)}
                placeholder={selectedDeviceOption.deviceIdPlaceholder}
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              Name
              <input
                value={device.name}
                onChange={(e) => updateDevice("name", e.target.value)}
                placeholder={selectedDeviceOption.namePlaceholder}
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              DevEUI
              <input
                value={device.devEui}
                onChange={(e) => updateDevice("devEui", e.target.value)}
                placeholder="16 hex characters"
                maxLength={16}
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              JoinEUI
              <input
                value={device.joinEui}
                onChange={(e) => updateDevice("joinEui", e.target.value)}
                placeholder="16 hex characters"
                maxLength={16}
                style={styles.input}
              />
            </label>

            <label style={styles.fieldWide}>
              AppKey
              <input
                value={device.appKey}
                onChange={(e) => updateDevice("appKey", e.target.value)}
                placeholder="32 hex characters"
                maxLength={32}
                style={styles.input}
              />
            </label>

            <label style={styles.fieldWide}>
              Description
              <textarea
                value={device.description}
                onChange={(e) => updateDevice("description", e.target.value)}
                placeholder={`Optional notes for this ${selectedDeviceOption.label}`}
                rows={3}
                style={{ ...styles.input, resize: "vertical" }}
              />
            </label>
          </div>
        </section>

        <aside style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Payload preview</h2>
              <p style={styles.panelHint}>Shape for the future backend route.</p>
            </div>
          </div>
          <pre style={styles.code}>{JSON.stringify(payloadPreview, null, 2)}</pre>
        </aside>
      </main>

      <section style={styles.draftsPanel}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.panelTitle}>Saved drafts</h2>
            <p style={styles.panelHint}>{drafts.length} badge/device drafts on this browser.</p>
          </div>
        </div>

        {drafts.length === 0 ? (
          <p style={styles.empty}>No device drafts yet.</p>
        ) : (
          <div style={styles.draftGrid}>
            {drafts.map((draft) => (
              <article key={draft.id} style={styles.draftCard}>
                <div style={styles.draftTop}>
                  <strong>{draft.name || draft.deviceId}</strong>
                  <button style={styles.removeBtn} onClick={() => removeDraft(draft.id)}>
                    Remove
                  </button>
                </div>
                <p style={styles.draftMeta}>
                  {deviceOptions.find((option) => option.value === draft.type)?.label || draft.type} linked
                  to {draft.gatewayId || "no gateway"}
                </p>
                <p style={styles.draftMono}>DevEUI {draft.devEui}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#f8f9fc",
    color: "#5a5c69",
    fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
    padding: 24,
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 20,
  },
  eyebrow: {
    margin: 0,
    color: "#4e73df",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "6px 0",
    color: "#5a5c69",
    fontSize: 30,
    lineHeight: 1.1,
  },
  subTitle: {
    margin: 0,
    maxWidth: 620,
    color: "#858796",
    fontSize: 14,
    lineHeight: 1.5,
  },
  headerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryBtn: {
    background: "#4e73df",
    border: "none",
    color: "#fff",
    fontWeight: 800,
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "#fff",
    border: "1px solid #d1d3e2",
    color: "#5a5c69",
    fontWeight: 700,
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.75fr)",
    gap: 16,
    alignItems: "start",
  },
  panel: {
    background: "#fff",
    border: "1px solid #e3e6f0",
    borderRadius: 8,
    padding: 18,
    minWidth: 0,
    boxShadow: "0 2px 10px rgba(58, 59, 69, 0.12)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  panelTitle: {
    margin: 0,
    color: "#4e73df",
    fontSize: 18,
  },
  panelHint: {
    margin: "4px 0 0",
    color: "#858796",
    fontSize: 13,
  },
  badge: {
    background: "#4e73df",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    borderRadius: 4,
    padding: "4px 8px",
  },
  badgeStack: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  notice: {
    background: "#f8f9fc",
    border: "1px solid #e3e6f0",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#5a5c69",
    marginBottom: 14,
    fontSize: 13,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#5a5c69",
    fontSize: 13,
    fontWeight: 700,
  },
  fieldWide: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#5a5c69",
    fontSize: 13,
    fontWeight: 700,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    border: "1px solid #d1d3e2",
    borderRadius: 8,
    color: "#5a5c69",
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  },
  code: {
    margin: 0,
    background: "#f8f9fc",
    border: "1px solid #e3e6f0",
    borderRadius: 8,
    padding: 14,
    color: "#4e73df",
    overflowX: "auto",
    fontSize: 12,
    lineHeight: 1.5,
  },
  draftsPanel: {
    background: "#fff",
    border: "1px solid #e3e6f0",
    borderRadius: 8,
    padding: 18,
    marginTop: 16,
    boxShadow: "0 2px 10px rgba(58, 59, 69, 0.12)",
  },
  empty: {
    margin: 0,
    color: "#858796",
  },
  draftGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 12,
  },
  draftCard: {
    background: "#f8f9fc",
    border: "1px solid #e3e6f0",
    borderRadius: 8,
    padding: 14,
  },
  draftTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  draftMeta: {
    color: "#858796",
    fontSize: 13,
    margin: "8px 0",
  },
  draftMono: {
    color: "#4e73df",
    fontFamily: "Consolas, monospace",
    fontSize: 12,
    margin: 0,
    overflowWrap: "anywhere",
  },
  removeBtn: {
    background: "transparent",
    border: "1px solid #d1d3e2",
    color: "#e74a3b",
    borderRadius: 6,
    cursor: "pointer",
    padding: "5px 8px",
    fontSize: 12,
  },
};
