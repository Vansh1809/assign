# TTN Gateway Registration - Testing Guide

## Testing Methods

### 1. **Test via TTN Console (Easiest)**

#### Step 1: Manual Registration
1. Go to [TTN Console](https://console.cloud.thethingsindustries.com)
2. Sign in with your account
3. Navigate to **Gateways**
4. Click **Create Gateway**
5. Fill in:
   - **Gateway ID**: `my-test-gateway`
   - **Gateway EUI**: Your gateway's EUI (from hardware label)
   - **Frequency Plan**: Select your region (EU_863_870, US_902_928, etc.)
   - **Gateway Server Address**: `eu1.cloud.thethingsindustries.com:8887`
   - **Antenna Placement**: OUTDOOR (if on roof) or INDOOR
   - **Location**: Your latitude/longitude
6. Click **Create Gateway**

#### Step 2: Verify in Console
- Your gateway should appear in the Gateways list
- Click on it to see details
- Check the "Live Data" tab to see if gateway is connected

---

### 2. **Test with cURL (HTTP/REST API)**

#### Prerequisites
```bash
export TTN_API_KEY="your-api-key-here"
export TTN_USERNAME="your-username"
export EU1_GATEWAY_SERVER="https://eu1.cloud.thethingsindustries.com"
```

#### Create Gateway
```bash
curl -X POST \
  "${EU1_GATEWAY_SERVER}/api/v3/users/${TTN_USERNAME}/gateways" \
  -H "Authorization: Bearer ${TTN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": {
      "ids": {
        "gateway_id": "test-gateway-001",
        "eui": "70B3D57ED000A0B1"
      },
      "name": "Test Gateway",
      "description": "Testing gateway registration via cURL",
      "frequency_plan_ids": ["EU_863_870"],
      "gateway_server_address": "eu1.cloud.thethingsindustries.com:8887",
      "status_public": true,
      "location_public": true,
      "antennas": [
        {
          "gain": 2,
          "location": {
            "latitude": 52.52,
            "longitude": 13.405,
            "altitude": 50
          }
        }
      ]
    }
  }'
```

**Expected Response:**
```json
{
  "ids": {
    "gateway_id": "test-gateway-001",
    "eui": "70B3D57ED000A0B1"
  },
  "created_at": "2026-06-01T10:00:00Z",
  "updated_at": "2026-06-01T10:00:00Z",
  "name": "Test Gateway",
  "description": "Testing gateway registration via cURL",
  "frequency_plan_ids": ["EU_863_870"],
  ...
}
```

#### Get Gateway Details
```bash
curl -X GET \
  "${EU1_GATEWAY_SERVER}/api/v3/gateways/test-gateway-001" \
  -H "Authorization: Bearer ${TTN_API_KEY}" \
  -H "Content-Type: application/json"
```

#### List All Gateways
```bash
curl -X GET \
  "${EU1_GATEWAY_SERVER}/api/v3/gateways" \
  -H "Authorization: Bearer ${TTN_API_KEY}" \
  -H "Content-Type: application/json"
```

#### Delete Gateway
```bash
curl -X DELETE \
  "${EU1_GATEWAY_SERVER}/api/v3/gateways/test-gateway-001" \
  -H "Authorization: Bearer ${TTN_API_KEY}"
```

---

### 3. **Test with Postman**

#### Step 1: Setup Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create new collection: **TTN Gateway Tests**

#### Step 2: Create Environment Variables

1. Click **Environments** → **Create**
2. Add variables:
   ```
   TTN_API_KEY: your-api-key-here
   TTN_USERNAME: your-username
   TTN_SERVER: https://eu1.cloud.thethingsindustries.com
   GATEWAY_ID: test-gateway-001
   GATEWAY_EUI: 70B3D57ED000A0B1
   ```

#### Step 3: Create Requests

**Request 1: Create Gateway**
- Method: POST
- URL: `{{TTN_SERVER}}/api/v3/users/{{TTN_USERNAME}}/gateways`
- Headers:
  - `Authorization`: `Bearer {{TTN_API_KEY}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "gateway": {
    "ids": {
      "gateway_id": "{{GATEWAY_ID}}",
      "eui": "{{GATEWAY_EUI}}"
    },
    "name": "Postman Test Gateway",
    "description": "Created via Postman API test",
    "frequency_plan_ids": ["EU_863_870"],
    "gateway_server_address": "eu1.cloud.thethingsindustries.com:8887",
    "status_public": true,
    "location_public": true,
    "antennas": [{
      "gain": 2,
      "location": {
        "latitude": 52.52,
        "longitude": 13.405,
        "altitude": 50
      }
    }]
  }
}
```

**Request 2: Get Gateway**
- Method: GET
- URL: `{{TTN_SERVER}}/api/v3/gateways/{{GATEWAY_ID}}`
- Headers:
  - `Authorization`: `Bearer {{TTN_API_KEY}}`

**Request 3: List Gateways**
- Method: GET
- URL: `{{TTN_SERVER}}/api/v3/gateways`
- Headers:
  - `Authorization`: `Bearer {{TTN_API_KEY}}`

---

### 4. **Test with Node.js Script**

#### Create `test-gateway.js`

```javascript
#!/usr/bin/env node

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Configuration
const API_KEY = process.env.TTN_API_KEY;
const TTN_SERVER = process.env.TTN_SERVER || 'eu1.cloud.thethingsindustries.com:8887';
const USERNAME = process.env.TTN_USERNAME;

if (!API_KEY || !USERNAME) {
  console.error('Error: TTN_API_KEY and TTN_USERNAME environment variables required');
  process.exit(1);
}

// Proto loader options
const protoOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [path.join(__dirname, 'proto')]
};

console.log('Loading gRPC definitions...');

// Load gateway proto (you need to have TTN proto files)
// For testing, we'll use the HTTP API instead
const http = require('http');
const https = require('https');

// Helper function for API calls
function apiCall(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://eu1.cloud.thethingsindustries.com${path}`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testCreateGateway() {
  console.log('\n=== Test 1: Create Gateway ===');
  
  const gatewayData = {
    gateway: {
      ids: {
        gateway_id: 'test-node-gateway-' + Date.now(),
        eui: '70B3D57ED000A0B1'
      },
      name: 'Node.js Test Gateway',
      description: 'Created via Node.js test script',
      frequency_plan_ids: ['EU_863_870'],
      gateway_server_address: 'eu1.cloud.thethingsindustries.com:8887',
      status_public: true,
      location_public: true,
      antennas: [{
        gain: 2,
        location: {
          latitude: 52.52,
          longitude: 13.405,
          altitude: 50
        }
      }]
    }
  };

  try {
    const result = await apiCall(
      'POST',
      `/api/v3/users/${USERNAME}/gateways`,
      gatewayData
    );
    
    console.log('✓ Gateway created successfully');
    console.log(`  Gateway ID: ${result.ids.gateway_id}`);
    console.log(`  Gateway EUI: ${result.ids.eui}`);
    console.log(`  Created at: ${result.created_at}`);
    
    return result.ids.gateway_id;
  } catch (error) {
    console.error('✗ Failed to create gateway:', error.message);
    throw error;
  }
}

async function testGetGateway(gatewayId) {
  console.log('\n=== Test 2: Get Gateway ===');
  
  try {
    const result = await apiCall(
      'GET',
      `/api/v3/gateways/${gatewayId}`
    );
    
    console.log('✓ Gateway retrieved successfully');
    console.log(`  Name: ${result.name}`);
    console.log(`  Frequency Plans: ${result.frequency_plan_ids.join(', ')}`);
    console.log(`  Status Public: ${result.status_public}`);
    
    return result;
  } catch (error) {
    console.error('✗ Failed to get gateway:', error.message);
    throw error;
  }
}

async function testListGateways() {
  console.log('\n=== Test 3: List Gateways ===');
  
  try {
    const result = await apiCall(
      'GET',
      `/api/v3/gateways`
    );
    
    console.log('✓ Gateways listed successfully');
    console.log(`  Total gateways: ${result.gateways ? result.gateways.length : 0}`);
    
    if (result.gateways && result.gateways.length > 0) {
      result.gateways.forEach(gw => {
        console.log(`    - ${gw.ids.gateway_id} (${gw.name})`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('✗ Failed to list gateways:', error.message);
    throw error;
  }
}

async function testUpdateGateway(gatewayId) {
  console.log('\n=== Test 4: Update Gateway ===');
  
  const updateData = {
    gateway: {
      ids: {
        gateway_id: gatewayId
      },
      name: 'Updated Test Gateway',
      description: 'Updated via test script'
    },
    field_mask: {
      paths: ['name', 'description']
    }
  };

  try {
    const result = await apiCall(
      'PUT',
      `/api/v3/gateways/${gatewayId}`,
      updateData
    );
    
    console.log('✓ Gateway updated successfully');
    console.log(`  New name: ${result.name}`);
    console.log(`  New description: ${result.description}`);
    
    return result;
  } catch (error) {
    console.error('✗ Failed to update gateway:', error.message);
    throw error;
  }
}

async function testCreateAPIKey(gatewayId) {
  console.log('\n=== Test 5: Create Gateway API Key ===');
  
  const apiKeyData = {
    name: 'Test Gateway Connection Key',
    rights: ['RIGHT_GATEWAY_LINK', 'RIGHT_GATEWAY_INFO']
  };

  try {
    const result = await apiCall(
      'POST',
      `/api/v3/gateways/${gatewayId}/api-keys`,
      apiKeyData
    );
    
    console.log('✓ API Key created successfully');
    console.log(`  Key ID: ${result.id}`);
    console.log(`  Key: ${result.key.substring(0, 10)}...***`); // Don't show full key
    
    return result;
  } catch (error) {
    console.error('✗ Failed to create API key:', error.message);
    throw error;
  }
}

async function testDeleteGateway(gatewayId) {
  console.log('\n=== Test 6: Delete Gateway ===');
  
  try {
    await apiCall(
      'DELETE',
      `/api/v3/gateways/${gatewayId}`
    );
    
    console.log('✓ Gateway deleted successfully');
  } catch (error) {
    console.error('✗ Failed to delete gateway:', error.message);
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting TTN Gateway API Tests...');
  console.log(`Server: ${TTN_SERVER}`);
  console.log(`Username: ${USERNAME}`);

  let gatewayId = null;

  try {
    // Run tests in sequence
    gatewayId = await testCreateGateway();
    await testGetGateway(gatewayId);
    await testListGateways();
    await testUpdateGateway(gatewayId);
    await testCreateAPIKey(gatewayId);
    await testDeleteGateway(gatewayId);

    console.log('\n' + '='.repeat(50));
    console.log('✓ All tests passed!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n✗ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
```

#### Run the test:
```bash
export TTN_API_KEY="your-api-key"
export TTN_USERNAME="your-username"
node test-gateway.js
```

---

### 5. **Test with Python Script**

#### Create `test_gateway.py`

```python
#!/usr/bin/env python3

import os
import requests
import json
from datetime import datetime

# Configuration
API_KEY = os.getenv('TTN_API_KEY')
USERNAME = os.getenv('TTN_USERNAME')
BASE_URL = 'https://eu1.cloud.thethingsindustries.com'

if not API_KEY or not USERNAME:
    print('Error: TTN_API_KEY and TTN_USERNAME environment variables required')
    exit(1)

# Setup headers
headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def api_request(method, endpoint, data=None):
    """Make API request to TTN"""
    url = f'{BASE_URL}{endpoint}'
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        
        response.raise_for_status()
        return response.json() if response.content else None
    except requests.exceptions.RequestException as e:
        raise Exception(f'API Error: {e.response.status_code} - {e.response.text}')

def test_create_gateway():
    """Test creating a gateway"""
    print('\n=== Test 1: Create Gateway ===')
    
    gateway_id = f'test-py-gateway-{int(datetime.now().timestamp())}'
    data = {
        'gateway': {
            'ids': {
                'gateway_id': gateway_id,
                'eui': '70B3D57ED000A0B1'
            },
            'name': 'Python Test Gateway',
            'description': 'Created via Python test script',
            'frequency_plan_ids': ['EU_863_870'],
            'gateway_server_address': 'eu1.cloud.thethingsindustries.com:8887',
            'status_public': True,
            'location_public': True,
            'antennas': [{
                'gain': 2,
                'location': {
                    'latitude': 52.52,
                    'longitude': 13.405,
                    'altitude': 50
                }
            }]
        }
    }
    
    try:
        result = api_request('POST', f'/api/v3/users/{USERNAME}/gateways', data)
        print('✓ Gateway created successfully')
        print(f"  Gateway ID: {result['ids']['gateway_id']}")
        print(f"  Gateway EUI: {result['ids']['eui']}")
        print(f"  Created at: {result['created_at']}")
        return gateway_id
    except Exception as e:
        print(f'✗ Failed to create gateway: {str(e)}')
        raise

def test_get_gateway(gateway_id):
    """Test getting gateway details"""
    print('\n=== Test 2: Get Gateway ===')
    
    try:
        result = api_request('GET', f'/api/v3/gateways/{gateway_id}')
        print('✓ Gateway retrieved successfully')
        print(f"  Name: {result['name']}")
        print(f"  Frequency Plans: {', '.join(result['frequency_plan_ids'])}")
        print(f"  Status Public: {result['status_public']}")
        return result
    except Exception as e:
        print(f'✗ Failed to get gateway: {str(e)}')
        raise

def test_list_gateways():
    """Test listing all gateways"""
    print('\n=== Test 3: List Gateways ===')
    
    try:
        result = api_request('GET', '/api/v3/gateways')
        gateways = result.get('gateways', [])
        print('✓ Gateways listed successfully')
        print(f'  Total gateways: {len(gateways)}')
        
        for gw in gateways:
            print(f"    - {gw['ids']['gateway_id']} ({gw['name']})")
        
        return result
    except Exception as e:
        print(f'✗ Failed to list gateways: {str(e)}')
        raise

def test_update_gateway(gateway_id):
    """Test updating gateway"""
    print('\n=== Test 4: Update Gateway ===')
    
    data = {
        'gateway': {
            'ids': {'gateway_id': gateway_id},
            'name': 'Updated Test Gateway',
            'description': 'Updated via Python test script'
        },
        'field_mask': {
            'paths': ['name', 'description']
        }
    }
    
    try:
        result = api_request('PUT', f'/api/v3/gateways/{gateway_id}', data)
        print('✓ Gateway updated successfully')
        print(f"  New name: {result['name']}")
        print(f"  New description: {result['description']}")
        return result
    except Exception as e:
        print(f'✗ Failed to update gateway: {str(e)}')
        raise

def test_create_api_key(gateway_id):
    """Test creating gateway API key"""
    print('\n=== Test 5: Create Gateway API Key ===')
    
    data = {
        'name': 'Test Gateway Connection Key',
        'rights': ['RIGHT_GATEWAY_LINK', 'RIGHT_GATEWAY_INFO']
    }
    
    try:
        result = api_request('POST', f'/api/v3/gateways/{gateway_id}/api-keys', data)
        print('✓ API Key created successfully')
        print(f"  Key ID: {result['id']}")
        print(f"  Key: {result['key'][:10]}...***")  # Don't show full key
        return result
    except Exception as e:
        print(f'✗ Failed to create API key: {str(e)}')
        raise

def test_delete_gateway(gateway_id):
    """Test deleting gateway"""
    print('\n=== Test 6: Delete Gateway ===')
    
    try:
        api_request('DELETE', f'/api/v3/gateways/{gateway_id}')
        print('✓ Gateway deleted successfully')
    except Exception as e:
        print(f'✗ Failed to delete gateway: {str(e)}')
        raise

def main():
    """Run all tests"""
    print('Starting TTN Gateway API Tests...')
    print(f'Server: {BASE_URL}')
    print(f'Username: {USERNAME}')

    gateway_id = None

    try:
        gateway_id = test_create_gateway()
        test_get_gateway(gateway_id)
        test_list_gateways()
        test_update_gateway(gateway_id)
        test_create_api_key(gateway_id)
        test_delete_gateway(gateway_id)

        print('\n' + '='*50)
        print('✓ All tests passed!')
        print('='*50)
    except Exception as e:
        print(f'\n✗ Test suite failed: {str(e)}')
        exit(1)

if __name__ == '__main__':
    main()
```

#### Run the test:
```bash
export TTN_API_KEY="your-api-key"
export TTN_USERNAME="your-username"
python3 test_gateway.py
```

---

## 6. **Test Checklist**

### Basic Functionality
- [ ] Create gateway successfully
- [ ] Gateway appears in TTN Console
- [ ] Get gateway details works
- [ ] List gateways includes new gateway
- [ ] Update gateway name/description
- [ ] Delete gateway

### API Key Management
- [ ] Create API key for gateway
- [ ] API key has correct rights
- [ ] List API keys for gateway
- [ ] Delete API key

### Gateway Details
- [ ] Frequency plan is correct
- [ ] Location is accurate
- [ ] Antenna gain is set
- [ ] Status is public/private as intended
- [ ] Gateway server address is correct

### Connection Test
- [ ] Physical gateway can connect to TTN
- [ ] Gateway appears online in console
- [ ] Live data shows receiving messages
- [ ] Status page shows uptime

---

## 7. **Troubleshooting**

### Common Errors

#### 401 Unauthorized
```
Issue: API key invalid or missing
Fix: 
- Check TTN_API_KEY is set correctly
- Verify API key has required rights
- Check if API key has expired
```

#### 404 Not Found
```
Issue: Gateway not found
Fix:
- Verify gateway ID exists
- Check gateway wasn't deleted
- Make sure you're using correct server region
```

#### 409 Conflict
```
Issue: Gateway ID already exists
Fix:
- Use unique gateway ID
- Delete previous gateway first
- Use timestamp in ID: test-gw-{timestamp}
```

#### EUI Format Error
```
Issue: Invalid EUI format
Fix:
- EUI must be 8 bytes (16 hex characters)
- Example: 70B3D57ED000A0B1
- Should be string, not array
```

### Enable Debug Logging

**Node.js:**
```bash
NODE_DEBUG=http* node test-gateway.js
```

**Python:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(logging.DEBUG)
requests_log.propagate = True
```

---

## 8. **Test Results Example**

```
Starting TTN Gateway API Tests...
Server: https://eu1.cloud.thethingsindustries.com
Username: myuser

=== Test 1: Create Gateway ===
✓ Gateway created successfully
  Gateway ID: test-py-gateway-1717153200
  Gateway EUI: 70B3D57ED000A0B1
  Created at: 2026-06-01T10:00:00Z

=== Test 2: Get Gateway ===
✓ Gateway retrieved successfully
  Name: Python Test Gateway
  Frequency Plans: EU_863_870
  Status Public: True

=== Test 3: List Gateways ===
✓ Gateways listed successfully
  Total gateways: 2
    - test-py-gateway-1717153200 (Python Test Gateway)
    - my-existing-gateway (My Gateway)

=== Test 4: Update Gateway ===
✓ Gateway updated successfully
  New name: Updated Test Gateway
  New description: Updated via Python test script

=== Test 5: Create Gateway API Key ===
✓ API Key created successfully
  Key ID: 0GV1234567890ABC
  Key: NSWGQ3DGB***

=== Test 6: Delete Gateway ===
✓ Gateway deleted successfully

==================================================
✓ All tests passed!
==================================================
```

---

## Summary

Choose your testing method based on your needs:

| Method | Best For | Difficulty |
|--------|----------|-----------|
| **TTN Console** | Quick manual testing | Easy |
| **cURL** | Simple API testing, CI/CD | Easy |
| **Postman** | Interactive testing, debugging | Easy |
| **Node.js Script** | Integration testing | Medium |
| **Python Script** | Automation, batch testing | Medium |

All methods validate that your gateway registration implementation works correctly!
