const fs = require('fs');
const https = require('https');
const path = require('path');

const logosPath = path.resolve(__dirname, '../logos.json');
const logosData = JSON.parse(fs.readFileSync(logosPath, 'utf8'));

async function checkLogos() {
  console.log('Checking logos in parallel...');
  
  const results = await Promise.all(logosData.map(async (logo) => {
    return new Promise((resolve) => {
      https.get(logo.url, (res) => {
        resolve({ logo, ok: res.statusCode >= 200 && res.statusCode < 400 });
      }).on('error', () => resolve({ logo, ok: false }));
    });
  }));
  
  const broken = results.filter(r => !r.ok).map(r => r.logo);
  const fixed = results.filter(r => r.ok).map(r => r.logo);
  
  console.log(`Found ${broken.length} broken logos...`);
  
  fs.writeFileSync(path.resolve(__dirname, '../logos.json'), JSON.stringify(fixed, null, 2));
  console.log(`Saved ${fixed.length} valid logos to logos.json`);
}

checkLogos();
