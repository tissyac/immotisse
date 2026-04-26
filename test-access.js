// Test rapide des serveurs
const http = require('http');

console.log('🔍 Test des serveurs...\n');

const backendReq = http.get('http://localhost:3008/', (res) => {
  console.log('✅ Backend (3008):', res.statusCode);
  res.resume();
}).on('error', (e) => {
  console.log('❌ Backend (3008):', e.message);
});

const frontendReq = http.get('http://localhost:5189/', (res) => {
  console.log('✅ Frontend (5189):', res.statusCode);
  res.resume();
}).on('error', (e) => {
  console.log('❌ Frontend (5189):', e.message);
});