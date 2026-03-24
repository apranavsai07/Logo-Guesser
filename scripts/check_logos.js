const fs = require('fs');
const https = require('https');
const path = require('path');

const logosPath = path.resolve(__dirname, '../logos.json');
const logosData = JSON.parse(fs.readFileSync(logosPath, 'utf8'));

let invalidCount = 0;
let checked = 0;

console.log(`Checking ${logosData.length} logos...`);

logosData.forEach(logo => {
  https.request(logo.url, { method: 'HEAD' }, (res) => {
    checked++;
    if (res.statusCode >= 400 && res.statusCode !== 405) { // 405 method not allowed is ok sometimes, but 404 is bad
      console.error(`❌ Broken URL for ${logo.name}: ${logo.url} (Status: ${res.statusCode})`);
      invalidCount++;
    }
    
    if (checked === logosData.length) {
      if (invalidCount === 0) {
        console.log("✅ All logos are valid!");
      } else {
        console.log(`\nFound ${invalidCount} invalid logos. Update the overrides in generate_logos.js.`);
      }
    }
  }).on('error', (err) => {
    checked++;
    console.error(`Fetch error for ${logo.name}:`, err.message);
  }).end();
});
