const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': 0
  }
};

const data = JSON.stringify({
  email: 'admin@immotiss.com',
  password: 'admin123'
});

options.headers['Content-Length'] = Buffer.byteLength(data);

const req = http.request(options, (res) => {
  let body = '';
  
  console.log(`📊 Status: ${res.statusCode}`);
  console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('\n🔍 Réponse brute:');
    console.log(body);
    console.log('\n📦 Parsed:');
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));
      console.log('\n✅ Champs:');
      console.log('  - token:', parsed.token ? '✅' : '❌');
      console.log('  - user:', parsed.user ? '✅' : '❌');
      if (parsed.user) console.log('    - user.role:', parsed.user.role);
    } catch (e) {
      console.log('Erreur parse:', e.message);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`problème: ${e.message}`);
  process.exit(1);
});

req.write(data);
req.end();
