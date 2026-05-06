const http = require('http');

// Créez un token admin factice ou utilisez un token valide
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTM4Y2UzNzIyZmYzMzAwMzY2YzI2NTAiLCJlbWFpbCI6ImFkbWluQGltbW90aXNzZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2OTc2OTUwNjAsImV4cCI6MTcyNTI5NTA2MH0.xPqW1vYz_cK2J2_Z3_P4_Q5_R6_S7_T8_U9_V0_W1_X2';

const options = {
  hostname: 'localhost',
  port: 3008,
  path: '/auth/admin/clear-all-data',
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

req.end();
