# The Things Industries (TTN) - Complete Gateway Registration Guide

## Table of Contents
1. [Understanding TTN Architecture](#understanding-ttn-architecture)
2. [Gateway Registration Overview](#gateway-registration-overview)
3. [Prerequisites](#prerequisites)
4. [gRPC API Deep Dive](#grpc-api-deep-dive)
5. [Step-by-Step Registration](#step-by-step-registration)
6. [Code Examples](#code-examples)
7. [Common Frequency Plans](#common-frequency-plans)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

---

## What is TTN

The Things Network (TTN) is a global, open-source LoRaWAN network designed for Internet of Things (IoT) applications. It provides:

- **Distributed Infrastructure**: A decentralized network where anyone can contribute gateways
- **LoRaWAN Support**: Long Range Wide Area Network technology for low-power IoT devices
- **Public Community Network**: Free access to a public LoRaWAN network infrastructure
- **Enterprise Solutions**: The Things Stack for private/enterprise deployments

### Key Components:
- **End Devices**: IoT devices that send/receive LoRa messages (sensors, actuators)
- **Gateways**: Radio receivers that capture LoRa signals and forward them to the network
- **Network Server**: Routes messages between gateways and applications
- **Application Server**: Manages applications and end device interactions
- **Integration Server**: Integrations with external systems (webhooks, MQTT, HTTP)

---

## How TTN Works

### 1. **Message Flow in TTN**

```
End Device (LoRa)
    ↓ (Radio Signal)
Gateway (Receives Signal)
    ↓ (Forwards via Internet/IP)
Network Server (TTN Cloud)
    ↓ (Routes to correct Application)
Application Server
    ↓ (Processes/Stores Data)
User Application
```

### 2. **Gateway Function**
Gateways act as radio receivers and forwarders:
- Listen on LoRa frequency bands (varies by region: EU868, US915, AS923, etc.)
- Receive uplink messages from end devices
- Forward messages to the TTN Network Server via IP connection
- Receive downlink messages from the Network Server
- Transmit downlink messages back to end devices

### 3. **LoRaWAN Specification**
- **Range**: Up to 10-15 km in rural areas, 2-5 km in urban areas
- **Bandwidth**: Narrow-band radio technology (125 kHz, 250 kHz, or 500 kHz)
- **Data Rate**: Low speed (0.3-50 kbps) optimized for long battery life
- **Frequency Bands**: Region-specific (868 MHz in Europe, 915 MHz in North America, etc.)

---

## TTN Architecture

### The Things Stack Components:

```
┌─────────────────────────────────────────────────────────────┐
│                    End User Applications                      │
│  (Mobile Apps, Dashboards, Business Logic)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│           Integration Layer (HTTP, MQTT, Webhooks)           │
│    (Application Pub/Sub APIs, Webhook APIs, etc.)            │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│              Application Server (gRPC APIs)                  │
│    (Manage Apps, Devices, Keys, Traffic, Configuration)     │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                 │
┌───────┴──────────────┐        ┌────────┴──────────────┐
│ Network Server       │        │ Identity Server       │
│ (gRPC APIs)          │        │ (gRPC APIs)           │
│ - Routing            │        │ - User Management     │
│ - Security           │        │ - Authentication      │
│ - Device Registry    │        │ - Authorization       │
└───────┬──────────────┘        └────────┬──────────────┘
        │                                 │
        │       ┌─────────────────────────┤
        │       │                         │
┌───────┴──┐  ┌─┴─────────────────────┐  │
│ Gateway  │  │  Gateway Server       │  │
│ Server   │  │  (gRPC APIs)          │  │
│ (gRPC)   │  │  - Gateway Registry   │  │
└─────┬────┘  │  - Configuration      │  │
      │       │  - Status/Stats       │  │
      │       └────────────┬──────────┘  │
      │                    │              │
      └────────────────────┴──────────────┘
             │
    ┌────────┴─────────┐
    │                  │
  Gateway 1        Gateway 2
  (Connected via    (Connected via
   IP/MQTT/etc.)    IP/MQTT/etc.)
    │                  │
    ↓ (LoRa)           ↓ (LoRa)
  End Devices
```

---

## TTN APIs Overview

TTN provides multiple API interfaces:

### 1. **gRPC APIs** (Primary)
- Modern, high-performance RPC framework
- Protocol Buffers (.proto) for message definitions
- Bidirectional streaming support
- Used for all backend services

### 2. **HTTP (REST) APIs**
- JSON over HTTP
- Automatically generated from gRPC definitions
- Suitable for web and simple integrations

### 3. **MQTT**
- Lightweight IoT protocol
- Real-time message streaming
- Used for gateway connections and application integrations

### 4. **Webhooks**
- HTTP callbacks for events
- Application-level integrations
- Real-time notifications

---

## gRPC in TTN

### What is gRPC?

**gRPC** is a high-performance Remote Procedure Call framework developed by Google:

- **Protocol**: Uses HTTP/2 for multiplexing and efficient data transfer
- **Serialization**: Protocol Buffers (protobuf) for compact binary encoding
- **Performance**: ~10x faster than REST APIs
- **Bidirectional Streaming**: Supports server push and client streaming
- **Language Support**: All major languages (Go, Python, Java, Node.js, C++, etc.)

### gRPC vs HTTP/REST

| Feature | gRPC | HTTP/REST |
|---------|------|----------|
| **Serialization** | Protocol Buffers (Binary) | JSON (Text) |
| **Performance** | ~10x faster | Slower |
| **Payload Size** | Smaller (binary) | Larger (JSON) |
| **Streaming** | Bidirectional | Request-Response |
| **Complexity** | Higher (needs .proto) | Lower (simple HTTP) |
| **Browser Support** | Limited (gRPC-Web) | Native |
| **Use Case** | Backend services, APIs | Web applications |

### TTN gRPC Services

Key services exposed by TTN:

1. **GatewayRegistry** - Gateway CRUD operations
2. **GatewayServer** - Gateway status and statistics
3. **Configuration** - Bands and frequency plans
4. **GatewayClaimingServer** - Gateway claiming workflow
5. **GatewayAccess** - API keys and collaborators

---

## Gateway Registration Process

### Overview

Gateway registration in TTN involves these steps:

1. **Account & Organization Setup**
   - Create TTN account
   - Create organization (optional but recommended for multi-user)

2. **Generate API Key**
   - Create application-scoped API key with gateway creation rights
   - Store securely

3. **Register Gateway**
   - Use gRPC API to create gateway
   - Provide gateway identification (ID, EUI)
   - Configure frequency plan based on region
   - Add antenna information and location

4. **Configure Gateway Connection**
   - Specify gateway server address (where to connect)
   - Configure authentication method
   - Download gateway credentials if needed

5. **Connect Physical Gateway**
   - Install gateway firmware
   - Configure gateway to connect to TTN
   - Verify connection in TTN console

### Key Concepts

#### Gateway Identifier (gateway_id)
- Unique identifier within TTN
- Format: `gateway-id` (lowercase alphanumeric with hyphens)
- Example: `my-gateway-001`, `roof-gateway`
- Max length: 36 characters

#### Gateway EUI (Electronic Unique Identifier)
- Hardware-based unique identifier
- 8 bytes (64 bits) in hexadecimal format
- Example: `70B3D57ED000A0B1`
- Assigned by gateway manufacturer
- Used to identify gateway hardware globally

#### Frequency Plan
- Region-specific radio configuration
- Specifies channels, data rates, bandwidth
- Examples:
  - `EU_863_870` - Europe
  - `US_902_928` - USA
  - `AS_923` - Asia Pacific
  - `IN_865_867` - India

#### Gateway Server Address
- Address where gateway connects
- Format: `host:port` or `scheme://host:port`
- Default: TTN public server (e.g., `eu1.cloud.thethingsnetwork.org:8887`)
- Can be custom for enterprise deployments

---

## Step-by-Step Gateway Registration

### Prerequisites
- TTN Account (free at console.cloud.thethingsindustries.com)
- API credentials (API Key with gateway creation rights)
- gRPC client library for your language
- Gateway hardware with EUI

### Step 1: Obtain API Credentials

1. Go to [TTN Console](https://console.cloud.thethingsindustries.com)
2. Sign in with your account
3. Create an Organization (optional but recommended):
   - Navigate to "Organizations"
   - Click "Create Organization"
   - Enter organization details
4. Generate API Key:
   - Go to "Authorizations" or Organization settings
   - Click "Create API Key"
   - Grant rights:
     - `RIGHT_GATEWAY_CREATE` - Create gateways
     - `RIGHT_GATEWAY_LINK` - Link gateway (for gateway connection)
   - Copy and store the API key securely

### Step 2: Prepare Gateway Information

Collect the following information:

```
Gateway Details:
├── Gateway ID: my-gateway-001
├── Gateway EUI: 70B3D57ED000A0B1  (from gateway label)
├── Gateway Name: "My First Gateway"
├── Frequency Plan: EU_863_870  (your region)
├── Gateway Server: eu1.cloud.thethingsindustries.com:8887
├── Antenna Location:
│   ├── Latitude: 52.5200
│   ├── Longitude: 13.4050
│   ├── Altitude: 50 (meters)
│   └── Placement: OUTDOOR
└── Antenna Gain: 0 (dBi, depends on antenna type)
```

### Step 3: Create gRPC Client

Example using Node.js (with @grpc/grpc-js):

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load the gateway proto definition
const gatewayProto = protoLoader.loadSync('gateway.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const gateway = grpc.loadPackageDefinition(gatewayProto);

// Create client
const client = new gateway.ttn.lorawan.v3.GatewayRegistry(
  'eu1.cloud.thethingsindustries.com:8887',
  grpc.credentials.createSsl()
);

// Add metadata with API key for authentication
const metadata = new grpc.Metadata();
metadata.add('authorization', 'Bearer <YOUR_API_KEY>');
```

### Step 4: Register Gateway via gRPC

Use the `GatewayRegistry.Create` method:

```javascript
const createGatewayRequest = {
  gateway: {
    ids: {
      gateway_id: 'my-gateway-001',
      eui: Buffer.from('70B3D57ED000A0B1', 'hex')
    },
    name: 'My First Gateway',
    description: 'Test gateway for TTN',
    frequency_plan_ids: ['EU_863_870'],
    gateway_server_address: 'eu1.cloud.thethingsindustries.com:8887',
    antennas: [
      {
        gain: 0,
        location: {
          latitude: 52.5200,
          longitude: 13.4050,
          altitude: 50,
          accuracy: 0,
          source: 3 // SOURCE_REGISTRY
        }
      }
    ],
    status_public: true,
    location_public: true,
    attributes: {
      'description': 'Rooftop gateway',
      'model': 'RAK7249'
    }
  },
  collaborator: {
    user_ids: {
      user_id: 'your-username'
    }
    // OR
    // organization_ids: {
    //   organization_id: 'your-organization'
    // }
  }
};

client.Create(createGatewayRequest, metadata, (err, response) => {
  if (err) {
    console.error('Error creating gateway:', err.message);
    return;
  }
  console.log('Gateway created successfully:', response);
  console.log('Gateway ID:', response.ids.gateway_id);
  console.log('Gateway EUI:', response.ids.eui);
});
```

### Step 5: Verify Gateway Registration

```javascript
const getGatewayRequest = {
  gateway_ids: {
    gateway_id: 'my-gateway-001'
  },
  field_mask: {
    paths: ['ids', 'name', 'frequency_plan_ids', 'antennas']
  }
};

client.Get(getGatewayRequest, metadata, (err, response) => {
  if (err) {
    console.error('Error retrieving gateway:', err.message);
    return;
  }
  console.log('Gateway details:', JSON.stringify(response, null, 2));
});
```

---

## Code Examples

### Node.js Complete Example

```javascript
#!/usr/bin/env node

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');

// Configuration
const API_KEY = process.env.TTN_API_KEY;
const GATEWAY_ID = 'my-gateway-001';
const GATEWAY_EUI = '70B3D57ED000A0B1';
const TTN_SERVER = 'eu1.cloud.thethingsindustries.com:8887';
const TTN_SERVER_CA = fs.readFileSync('/path/to/ca-cert.pem'); // Optional for self-signed certs

if (!API_KEY) {
  console.error('Error: TTN_API_KEY environment variable not set');
  process.exit(1);
}

// Load proto definitions
const protoPath = './ttn-proto/'; // Path to TTN proto files
const gatewayProto = protoLoader.loadSync(
  protoPath + 'ttn/lorawan/v3/gateway.proto',
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [protoPath]
  }
);

const ttnDef = grpc.loadPackageDefinition(gatewayProto);

// Create client with SSL
const credentials = grpc.credentials.createSsl(TTN_SERVER_CA);
const client = new ttnDef.ttn.lorawan.v3.GatewayRegistry(TTN_SERVER, credentials);

// Helper function to create metadata with API key
function createMetadata() {
  const metadata = new grpc.Metadata();
  metadata.add('authorization', `Bearer ${API_KEY}`);
  return metadata;
}

// Function to create gateway
async function createGateway() {
  return new Promise((resolve, reject) => {
    const request = {
      gateway: {
        ids: {
          gateway_id: GATEWAY_ID,
          eui: Buffer.from(GATEWAY_EUI, 'hex')
        },
        name: 'My Gateway',
        description: 'Gateway registered via API',
        frequency_plan_ids: ['EU_863_870'],
        gateway_server_address: TTN_SERVER,
        antennas: [{
          gain: 2,
          location: {
            latitude: 52.52,
            longitude: 13.405,
            altitude: 50,
            source: 3
          }
        }],
        status_public: true,
        location_public: true
      },
      collaborator: {
        user_ids: {
          user_id: 'your-username'
        }
      }
    };

    client.Create(request, createMetadata(), (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

// Function to get gateway
async function getGateway() {
  return new Promise((resolve, reject) => {
    const request = {
      gateway_ids: {
        gateway_id: GATEWAY_ID
      },
      field_mask: {
        paths: ['ids', 'name', 'status_public', 'antennas']
      }
    };

    client.Get(request, createMetadata(), (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

// Main function
async function main() {
  try {
    console.log('Creating gateway...');
    const createResult = await createGateway();
    console.log('Gateway created:', createResult);

    console.log('\nRetrieving gateway...');
    const getResult = await getGateway();
    console.log('Gateway details:', getResult);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
```

### Python Example

```python
#!/usr/bin/env python3

import grpc
import os
from google.protobuf.json_format import MessageToJson

# Import TTN gRPC stubs
from ttn_lw_v3 import gateway_pb2, gateway_pb2_grpc

# Configuration
API_KEY = os.getenv('TTN_API_KEY')
GATEWAY_ID = 'my-gateway-001'
GATEWAY_EUI = bytes.fromhex('70B3D57ED000A0B1')
TTN_SERVER = 'eu1.cloud.thethingsindustries.com:8887'

if not API_KEY:
    print('Error: TTN_API_KEY environment variable not set')
    exit(1)

# Create secure channel
channel = grpc.secure_channel(TTN_SERVER, grpc.ssl_channel_credentials())

# Create stub
stub = gateway_pb2_grpc.GatewayRegistryStub(channel)

# Create metadata with API key
metadata = [('authorization', f'Bearer {API_KEY}')]

def create_gateway():
    """Create a gateway in TTN"""
    gateway = gateway_pb2.Gateway(
        ids=gateway_pb2.GatewayIdentifiers(
            gateway_id=GATEWAY_ID,
            eui=GATEWAY_EUI
        ),
        name='My Gateway',
        description='Gateway registered via Python API',
        frequency_plan_ids=['EU_863_870'],
        gateway_server_address=TTN_SERVER,
        status_public=True,
        location_public=True
    )
    
    # Add antenna
    antenna = gateway_pb2.GatewayAntenna(
        gain=2,
        location=gateway_pb2.Location(
            latitude=52.52,
            longitude=13.405,
            altitude=50,
            source=3
        )
    )
    gateway.antennas.append(antenna)
    
    # Create request
    request = gateway_pb2.CreateGatewayRequest(
        gateway=gateway,
        collaborator=gateway_pb2.OrganizationOrUserIdentifiers(
            user_ids=gateway_pb2.UserIdentifiers(
                user_id='your-username'
            )
        )
    )
    
    # Call gRPC method
    response = stub.Create(request, metadata=metadata)
    return response

def get_gateway():
    """Get gateway details from TTN"""
    request = gateway_pb2.GetGatewayRequest(
        gateway_ids=gateway_pb2.GatewayIdentifiers(
            gateway_id=GATEWAY_ID
        ),
        field_mask=gateway_pb2.FieldMask(
            paths=['ids', 'name', 'frequency_plan_ids', 'antennas']
        )
    )
    
    response = stub.Get(request, metadata=metadata)
    return response

def main():
    try:
        print('Creating gateway...')
        result = create_gateway()
        print(f'Gateway created: {result.ids.gateway_id}')
        print(f'Gateway EUI: {result.ids.eui.hex()}')
        
        print('\nRetrieving gateway...')
        details = get_gateway()
        print('Gateway details:')
        print(MessageToJson(details, including_default_value_fields=False))
        
    except grpc.RpcError as e:
        print(f'Error: {e.code().name} - {e.details()}')
        exit(1)

if __name__ == '__main__':
    main()
```

### Configuration Messages Reference

#### Gateway Message Structure
```protobuf
message Gateway {
  GatewayIdentifiers ids = 1;           // Required: gateway ID and EUI
  string name = 2;                       // Gateway name
  string description = 3;                // Gateway description
  map<string, string> attributes = 4;   // Custom key-value pairs
  GatewayVersionIdentifiers version_ids = 5;  // Hardware/firmware version
  string gateway_server_address = 6;    // Where to connect
  bool auto_update = 7;                 // Enable auto-updates
  repeated string frequency_plan_ids = 8;  // Region frequency plans
  repeated GatewayAntenna antennas = 9; // Antenna details
  bool status_public = 10;               // Expose status publicly
  bool location_public = 11;             // Expose location publicly
  bool schedule_downlink_late = 12;     // Buffer downlink messages
  bool enforce_duty_cycle = 13;         // Enforce spectrum regulations
}

message GatewayAntenna {
  float gain = 1;                        // Antenna gain in dBi
  Location location = 2;                 // GPS location
  GatewayAntennaPlacement placement = 3; // INDOOR or OUTDOOR
  map<string, string> attributes = 4;   // Custom attributes
}

message Location {
  double latitude = 1;                   // -90 to +90 degrees
  double longitude = 2;                  // -180 to +180 degrees
  int32 altitude = 3;                    // Meters above sea level
  int32 accuracy = 4;                    // Meters accuracy
  LocationSource source = 5;             // SOURCE_GPS, SOURCE_REGISTRY, etc.
}
```

---

## Common Frequency Plans

### By Region & Band

| Region | Plan ID | Frequency | Uplink Channels | Use Case |
|--------|---------|-----------|-----------------|----------|
| **Europe** | `EU_863_870` | 863-870 MHz | 3×125kHz + 1×250kHz | Most European countries |
| **North America** | `US_902_928` | 902-928 MHz | 64×125kHz | USA, Canada |
| **Asia Pacific** | `AS_923` | 923 MHz | 16×125kHz | Japan, South Korea, Vietnam |
| **India** | `IN_865_867` | 865-867 MHz | 3×125kHz | India |
| **Brazil** | `BR_915_928` | 915-928 MHz | 64×125kHz | Brazil, Latin America |
| **Russia** | `RU_864_870` | 864-870 MHz | 10×125kHz | Russia, former Soviet |
| **Australia** | `AU_915_928` | 915-928 MHz | 64×125kHz | Australia, New Zealand |
| **China** | `CN_470_510` | 470-510 MHz | 96×125kHz | Mainland China |

### Frequency Plan Details

#### EU_863_870 (Europe)
```json
{
  "plan_id": "EU_863_870",
  "base_frequency": 868,
  "region": "Europe",
  "channels": [
    {
      "frequency": 868100000,
      "bandwidth": 125000,
      "data_rates": ["SF12BW125", "SF11BW125", ..., "SF7BW125"],
      "max_eirp": 16
    },
    ...
  ],
  "max_duty_cycle": 0.01  // 1% duty cycle required by regulation
}
```

#### US_902_928 (North America)
```json
{
  "plan_id": "US_902_928",
  "base_frequency": 915,
  "region": "North America",
  "channels": 64,  // 64 125kHz channels
  "frequency_range": "902-928 MHz",
  "max_eirp": 30,  // Higher power allowed
  "max_duty_cycle": 1.0  // No duty cycle restriction
}
```

### API to Query Frequency Plans

```python
# List all available frequency plans
request = gateway_pb2.ListFrequencyPlansRequest()
response = stub.ListFrequencyPlans(request)

for plan in response.frequency_plans:
    print(f"Plan ID: {plan.id}")
    print(f"Name: {plan.name}")
    print(f"Base Frequency: {plan.base_frequency} MHz")
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: "gateway_id already exists"
**Error:**
```
code = ALREADY_EXISTS desc = entity already exists
```

**Causes:**
- Tried to create gateway with same ID
- Gateway wasn't deleted cleanly

**Solution:**
```python
# Delete existing gateway first
stub.Delete(
    gateway_pb2.GatewayIdentifiers(gateway_id=GATEWAY_ID),
    metadata=metadata
)

# Or use different ID
request.gateway.ids.gateway_id = 'my-gateway-002'
```

#### Issue 2: "Invalid frequency plan"
**Error:**
```
code = INVALID_ARGUMENT desc = unknown frequency plan id
```

**Solution:**
```python
# Query available plans
plans = stub.ListFrequencyPlans(
    gateway_pb2.ListFrequencyPlansRequest(
        base_frequency=868  # For EU region
    )
)

# Use returned plan IDs
for plan in plans.frequency_plans:
    print(f"Valid plan: {plan.id}")
```

#### Issue 3: "EUI already registered"
**Error:**
```
code = ALREADY_EXISTS desc = gateway with eui already exists
```

**Solution:**
- Verify EUI from gateway label (should be unique)
- Check if gateway exists: `GET /api/v3/gateways`
- Use different physical gateway hardware

#### Issue 4: "Authentication failed"
**Error:**
```
code = UNAUTHENTICATED desc = missing required permission
```

**Solution:**
```python
# Check API key rights in TTN Console
# Verify API key has:
# ✓ RIGHT_GATEWAY_CREATE
# ✓ RIGHT_GATEWAY_LINK
# ✓ RIGHT_GATEWAY_SETTINGS_BASIC

# Or use admin API key for testing
metadata = [('authorization', f'Bearer {ADMIN_API_KEY}')]
```

#### Issue 5: "Gateway not connecting"
**Symptoms:** 
- Status shows "Last activity: never"
- No uplink/downlink visible

**Debugging Steps:**
1. Verify gateway configuration:
   ```bash
   # SSH into gateway
   cat /etc/config/lora.conf
   
   # Check gateway ID matches TTN registration
   # Check server address correct for your region
   # Check API key correct
   ```

2. Check network connectivity:
   ```bash
   # Test port connectivity
   nc -zv eu1.cloud.thethingsindustries.com 8887
   
   # Check DNS
   nslookup eu1.cloud.thethingsindustries.com
   ```

3. Monitor gateway logs:
   ```bash
   # For LoRa Basics Station
   journalctl -u lora_pkt_fwd -f
   
   # For packet forwarder
   tail -f /var/log/lora*.log
   ```

4. Verify TTN Gateway Server is accessible:
   ```bash
   # Test gRPC endpoint
   grpcurl -plaintext eu1.cloud.thethingsindustries.com:8887 list
   ```

### Debugging Tools

#### TTN CLI
```bash
# Install
npm install -g ttn-cli

# List gateways
ttn gateways list

# Get gateway details
ttn gateways info my-gateway-01

# Monitor gateway status
ttn gateways status my-gateway-01
```

#### Using Wireshark
```
Capture traffic on port 8887/8888 to inspect gRPC messages:
- Set filter: `grpc`
- Inspect frame details
- Check for TLS handshake issues
```

#### gRPC CLI
```bash
# Install grpcurl
brew install grpcurl

# List Gateway Server services
grpcurl -plaintext \
  eu1.cloud.thethingsindustries.com:8887 list

# Call a method (requires authentication)
grpcurl -plaintext \
  -H "authorization: Bearer YOUR_API_KEY" \
  eu1.cloud.thethingsindustries.com:8887 \
  ttn.lorawan.v3.GatewayRegistry/List
```

---

## Security Best Practices

### API Key Management

**Never expose API keys:**
```bash
# ❌ BAD - API key visible
curl -H "Authorization: Bearer NNSXS.MY_SECRET_KEY_HERE" ...

# ✅ GOOD - Use environment variable
export TTN_API_KEY="NNSXS.MY_SECRET_KEY_HERE"
curl -H "Authorization: Bearer $TTN_API_KEY" ...

# ✅ BETTER - Use secrets management
aws secretsmanager get-secret-value --secret-id ttn-api-key
```

**Minimum required rights per use case:**

1. **Gateway Registration Only:**
   ```
   RIGHT_GATEWAY_CREATE
   RIGHT_GATEWAY_SETTINGS_BASIC
   ```

2. **Gateway Connection Only:**
   ```
   RIGHT_GATEWAY_LINK
   RIGHT_GATEWAY_INFO
   ```

3. **Full Gateway Management:**
   ```
   RIGHT_GATEWAY_ALL
   ```

**Key rotation strategy:**
- Rotate every 90 days minimum
- More frequent for production systems
- Revoke old keys immediately
- Monitor API key usage in console

### Gateway Security

**Enable authenticated connections:**
```javascript
gateway.require_authenticated_connection = true  // Force TLS + auth
```

**Use TLS/SSL certificates:**
```python
# For self-hosted deployments
with open('ca-cert.pem', 'rb') as f:
    credentials = grpc.ssl_channel_credentials(f.read())

channel = grpc.secure_channel(SERVER, credentials)
```

**Monitor gateway traffic:**
```python
# Set up alerts for suspicious activity
# Monitor for:
# - Unusual data rates
# - Repeated failed authentication
# - Gateway connecting from unexpected IPs
# - Abnormal packet patterns
```

**Gateway firmware updates:**
```bash
# Keep firmware current
# Enable auto-updates in TTN:
gateway.auto_update = true

# Or manually update
# Check gateway manufacturer for latest firmware
```

### Network Security

**Firewall rules:**
```bash
# Allow only necessary ports
# TTN Gateway Server ports:
# - 8887: Packet forwarder v2 (UDP)
# - 8888: MQTT
# - 8884: gRPC
# - 8885: gRPC with certificate
# - 8886: HTTP/REST

# Whitelist TTN server IPs if possible
# Allow outbound: *.thethingsindustries.com:8887
```

**Rate limiting:**
```python
# Implement on application level
# Prevent API abuse and replay attacks
from ratelimit import RateLimitMiddleware

app.add_middleware(RateLimitMiddleware, calls=100, period=60)  # 100 calls/min
```

**Encryption in transit:**
- Always use HTTPS/TLS
- gRPC uses HTTP/2 with TLS
- Verify server certificates

### Data Security

**Payload encryption:**
```python
# LoRaWAN includes encryption, but consider:
# - Symmetric key for NwkSKey (Network Server Key)
# - Application key for AppSKey (Application Server Key)
# - End-to-end encryption for sensitive data
```

**Location privacy:**
```python
# Don't expose gateway location if not necessary
gateway.location_public = false

# For technical/internal use only
gateway.status_public = false
```

---

## Advanced Topics

### Multiple Frequency Plans
```python
gateway.frequency_plan_ids = [
    'EU_863_870',     # Primary
    'EU_863_870_TTN'  # Alternative
]
```

### Gateway Clustering
For high-availability setups:
```
Gateway 1 ─┐
Gateway 2 ──┼─→ TTN Backend (Redundant)
Gateway 3 ─┘
```

### Custom Gateway Server Address
For self-hosted TTN Stack:
```python
gateway.gateway_server_address = 'my-private-ttn.example.com:8887'
```

### LoRa Basics Station Integration
Modern protocol for gateway communication:
```
Gateway (LBS Protocol) ↔ TTN Gateway Server (gRPC)
  ├─ Uplink: Device messages
  ├─ Downlink: Server commands
  ├─ Status: Health reports
  └─ Config: Frequency plan updates (over-the-air)
```

---

## API Reference Summary

### Key gRPC Methods

| Service | Method | Purpose | Input | Output |
|---------|--------|---------|-------|--------|
| GatewayRegistry | Create | Register gateway | CreateGatewayRequest | Gateway |
| GatewayRegistry | Get | Fetch gateway | GetGatewayRequest | Gateway |
| GatewayRegistry | List | List gateways | ListGatewaysRequest | Gateways |
| GatewayRegistry | Update | Modify gateway | UpdateGatewayRequest | Gateway |
| GatewayRegistry | Delete | Remove gateway | GatewayIdentifiers | Empty |
| GatewayAccess | CreateAPIKey | Generate API key | CreateGatewayAPIKeyRequest | APIKey |
| GatewayAccess | ListAPIKeys | List API keys | ListGatewayAPIKeysRequest | APIKeys |
| Configuration | ListFrequencyPlans | Query freq plans | ListFrequencyPlansRequest | ListFrequencyPlansResponse |
| GatewayClaimingServer | Claim | Claim gateway | ClaimGatewayRequest | GatewayIdentifiers |

### HTTP/REST Endpoints

```
POST   /api/v3/users/{user_id}/gateways              - Create gateway
GET    /api/v3/gateways/{gateway_id}                 - Get gateway
GET    /api/v3/gateways                              - List gateways
PUT    /api/v3/gateways/{gateway_id}                 - Update gateway
DELETE /api/v3/gateways/{gateway_id}                 - Delete gateway
GET    /api/v3/gateways/{gateway_id}/api-keys        - List API keys
POST   /api/v3/gateways/{gateway_id}/api-keys        - Create API key
GET    /api/v3/configuration/frequency-plans         - List freq plans
```

---

## Resources

### Official Documentation
- **TTN Console**: https://console.cloud.thethingsindustries.com/
- **API Reference**: https://www.thethingsindustries.com/docs/api/reference/grpc/gateway/
- **Getting Started**: https://www.thethingsindustries.com/docs/getting-started/
- **LoRaWAN Spec**: https://lora-alliance.org/

### Community & Support
- **TTN Community Forum**: https://www.thethingscommunity.org/
- **GitHub Issues**: https://github.com/TheThingsNetwork/lorawan-stack
- **Discord**: https://discord.gg/thethingsnetwork

### Related Resources
- **LoRa Basics Station**: https://github.com/lorabasics/basicstation
- **Semtech UDP Packet Forwarder**: https://github.com/Lora-net/packet_forwarder
- **Gateway Hardware**: https://www.thethingsindustries.com/docs/hardware/gateways/

---

## Summary

### Gateway Registration Checklist
- [ ] Create TTN account & organization
- [ ] Generate API key with `RIGHT_GATEWAY_CREATE`
- [ ] Gather gateway hardware info (ID, EUI, location)
- [ ] Select correct frequency plan for your region
- [ ] Call `GatewayRegistry.Create` via gRPC
- [ ] Configure physical gateway credentials
- [ ] Verify connection in TTN console
- [ ] Monitor uplink/downlink traffic

### Key Takeaways
1. **gRPC = 10x faster** than REST for high-volume APIs
2. **Frequency plan** is region-specific and mandatory
3. **Gateway EUI** is globally unique hardware identifier
4. **API Key** is the primary authentication mechanism
5. **Location data** enables LoRa triangulation features

### What Happens After Registration
1. Gateway entry created in TTN registry
2. You get gateway credentials for connection
3. Physical gateway connects to TTN servers
4. Gateway shows "Connected" status in console
5. Nearby devices can start using the gateway
6. You receive uplink traffic from end devices

---

**Document Version**: 2.0 (June 2024)
**TTN Stack**: v3.x  
**gRPC Status**: Stable  
**Last Updated**: 2024-06-01
```

---

## Common Operations

### List All Gateways
```javascript
client.List(
  {
    field_mask: {
      paths: ['ids', 'name', 'frequency_plan_ids']
    }
  },
  metadata,
  (err, response) => {
    if (!err) {
      console.log('Gateways:', response.gateways);
    }
  }
);
```

### Update Gateway
```javascript
client.Update(
  {
    gateway: {
      ids: { gateway_id: 'my-gateway-001' },
      name: 'Updated Gateway Name',
      status_public: false
    },
    field_mask: {
      paths: ['name', 'status_public']
    }
  },
  metadata,
  (err, response) => {
    if (!err) console.log('Gateway updated');
  }
);
```

### Delete Gateway
```javascript
client.Delete(
  { gateway_id: 'my-gateway-001' },
  metadata,
  (err) => {
    if (!err) console.log('Gateway deleted');
  }
);
```

### Create API Key for Gateway
```javascript
client.CreateAPIKey(
  {
    gateway_ids: { gateway_id: 'my-gateway-001' },
    name: 'Gateway Connection Key',
    rights: [
      'RIGHT_GATEWAY_LINK', // Allow gateway to connect
      'RIGHT_GATEWAY_INFO'   // Allow gateway to read info
    ]
  },
  metadata,
  (err, response) => {
    if (!err) {
      console.log('API Key:', response.key);
      console.log('Key ID:', response.id);
    }
  }
);
```

---

## Best Practices

### Security
1. **Never hardcode API keys** - Use environment variables
2. **Use SSL/TLS** - Always connect securely
3. **Limit API Key Rights** - Grant only necessary permissions
4. **Rotate Keys Regularly** - Change API keys periodically
5. **Authenticate Gateway** - Use strong credentials

### Gateway Configuration
1. **Use Correct Frequency Plan** - Match your region
2. **Set Location Accurately** - For triangulation features
3. **Configure Proper Antenna Gain** - Match your hardware
4. **Enable Public Status** - Helps with troubleshooting
5. **Document Gateways** - Use names and descriptions

### Network
1. **Ensure Stable Connection** - Gateways need consistent IP connectivity
2. **Appropriate Firewall Rules** - Open necessary ports
3. **Monitor Gateway Status** - Check for offline gateways
4. **Redundancy** - Deploy multiple gateways for coverage

---

## Useful Resources

- **TTN Documentation**: https://www.thethingsindustries.com/docs/
- **Gateway API Reference**: https://www.thethingsindustries.com/docs/api/reference/grpc/gateway/
- **TTN Console**: https://console.cloud.thethingsindustries.com
- **LoRaWAN Specification**: https://lora-alliance.org/
- **gRPC Documentation**: https://grpc.io/docs/
- **Proto3 Documentation**: https://developers.google.com/protocol-buffers/docs/proto3

---

## Summary

**TTN** is a distributed LoRaWAN network managed through gRPC APIs. To register a gateway:

1. Create TTN account and get API credentials
2. Prepare gateway information (ID, EUI, location, frequency plan)
3. Use the **GatewayRegistry.Create** gRPC method
4. Configure gateway to connect to TTN server
5. Verify connection in TTN Console

The gRPC API provides efficient, high-performance access to all gateway management operations, making it ideal for automation and integration scenarios.
