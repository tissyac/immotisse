#!/usr/bin/env node

/**
 * Script de test pour vérifier l'upload de documents
 * Usage: node test-upload.js
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function testUpload() {
  console.log('🧪 Test Upload de Documents\n');

  // Créer un fichier test PDF fictif
  const testPdfPath = path.join(__dirname, 'test-document.pdf');
  const testPdfContent = Buffer.from('%PDF-1.4\n%test pdf content\n');
  
  try {
    // Écrire le fichier test
    fs.writeFileSync(testPdfPath, testPdfContent);
    console.log(`✅ Fichier test créé: ${testPdfPath}\n`);

    // Créer FormData
    const form = new FormData();
    form.append('file', fs.createReadStream(testPdfPath));

    console.log('📤 Envoi du fichier à /upload/uploadPublic...\n');

    // Envoyer la requête
    const response = await fetch('http://localhost:3000/upload/uploadPublic', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const data = await response.json();

    console.log(`Status: ${response.status}\n`);
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Upload réussi!');
      console.log(`📍 URL du fichier: ${data.fileUrl}`);
      
      // Vérifier si le fichier est accessible
      console.log('\n🔍 Vérification de l\'accessibilité du fichier...');
      const fileResponse = await fetch(`http://localhost:3000${data.fileUrl}`);
      if (fileResponse.ok) {
        console.log(`✅ Fichier accessible via GET ${data.fileUrl}`);
      } else {
        console.log(`❌ Fichier non accessible (status: ${fileResponse.status})`);
      }
    } else {
      console.log('\n❌ Upload échoué!');
      console.log(`Erreur: ${data.message}`);
    }

    // Nettoyer
    fs.unlinkSync(testPdfPath);
    console.log('\n🧹 Fichier test supprimé');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  }
}

// Vérifier que le serveur est démarré
fetch('http://localhost:3000/')
  .then(res => {
    if (res.ok) {
      console.log('✅ Serveur backend connecté\n');
      testUpload();
    }
  })
  .catch(err => {
    console.error('❌ Serveur backend non accessible');
    console.error('Assurez-vous que le serveur est démarré: npm start');
    process.exit(1);
  });
