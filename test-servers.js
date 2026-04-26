// Script de test rapide pour vérifier les serveurs
const http = require('http');

console.log('Test des serveurs...\n');

// Test du backend
const backendReq = http.get('http://localhost:3006/', (res) => {
  console.log('Backend (3006):', res.statusCode);
  res.resume();
}).on('error', (e) => {
  console.log('Backend (3006):', e.message);
});

// Test du frontend
setTimeout(() => {
  const frontendReq = http.get('http://localhost:5180/', (res) => {
    console.log('Frontend (5180):', res.statusCode);
    res.resume();
  }).on('error', (e) => {
    console.log('Frontend (5180):', e.message);
  });
}, 1000);