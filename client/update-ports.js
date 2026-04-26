// Script pour mettre à jour toutes les URLs du port 3007 vers 3008
const fs = require('fs');
const path = require('path');

function updateFiles(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updateFiles(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('localhost:3007')) {
        content = content.replace(/localhost:3007/g, 'localhost:3008');
        fs.writeFileSync(filePath, content);
        console.log(`✅ Mis à jour: ${filePath}`);
      }
    }
  });
}

updateFiles('./src');
console.log('🎉 Toutes les URLs ont été mises à jour vers le port 3008 !');