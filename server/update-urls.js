const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('localhost:3007')) {
      content = content.replace(/localhost:3007/g, 'localhost:3008');
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`❌ ${filePath}: ${err.message}`);
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  });
}

console.log('🔄 Mise à jour des URLs...');
processDirectory('./src');
console.log('🎉 Terminé ! Toutes les URLs pointent maintenant vers localhost:3008');