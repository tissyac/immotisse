// Test rapide de la connectivité frontend-backend
const http = require('http');

console.log('🔍 Test de la connectivité...\n');

// Test du backend
const backendReq = http.get('http://localhost:3008/', (res) => {
  console.log('✅ Backend (3008):', res.statusCode);
  res.resume();
}).on('error', (e) => {
  console.log('❌ Backend (3008):', e.message);
});

// Test des offres (API principale)
setTimeout(() => {
  const offersReq = http.get('http://localhost:3008/offers?status=approved&limit=5', (res) => {
    console.log('✅ API Offres (3008):', res.statusCode);
    res.resume();
  }).on('error', (e) => {
    console.log('❌ API Offres (3008):', e.message);
  });
}, 500);

// Test du frontend
setTimeout(() => {
  const frontendReq = http.get('http://localhost:5189/', (res) => {
    console.log('✅ Frontend (5189):', res.statusCode);
    res.resume();
  }).on('error', (e) => {
    console.log('❌ Frontend (5189):', e.message);
  });
}, 1000);