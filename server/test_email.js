const fetch = require('node-fetch');

async function testEmail() {
  try {
    const response = await fetch('http://localhost:3003/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Ceci est un test de notification email pour vérifier que le système fonctionne correctement.'
      })
    });

    const result = await response.text();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail();