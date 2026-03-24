import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logosJsonPath = path.join(__dirname, 'logos.json');
const publicLogosDir = path.join(__dirname, 'public', 'logos');

const logosData = JSON.parse(fs.readFileSync(logosJsonPath, 'utf8'));

if (!fs.existsSync(publicLogosDir)) {
  fs.mkdirSync(publicLogosDir, { recursive: true });
}

async function downloadLogos() {
  console.log(`Starting download of ${logosData.length} logos...`);
  let successCount = 0;
  let failCount = 0;

  for (const logo of logosData) {
    // Generate a clean filename: e.g. "Google" -> "google", "Next.js" -> "next.js"
    // Using simple icons sluggification or just the id is safer. Let's use the id.
    const filename = `${logo.id}.svg`;
    const destPath = path.join(publicLogosDir, filename);

    if (fs.existsSync(destPath)) {
      console.log(`[SKIPPED] ${logo.name} (already exists)`);
      successCount++;
      continue;
    }

    try {
      console.log(`[DOWNLOADING] ${logo.name} from ${logo.url}...`);
      const response = await fetch(logo.url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      
      const svgText = await response.text();
      fs.writeFileSync(destPath, svgText);
      successCount++;
    } catch (err) {
      console.error(`[ERROR] Failed to download ${logo.name}:`, err.message);
      failCount++;
    }
    
    // Add small delay to be polite to the simpleicons CDN
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\nFinished! Successfully downloaded: ${successCount}, Failed: ${failCount}`);
  if (failCount === 0) {
    console.log("Next steps: Update your Database or API to serve /logos/[id].svg instead of the CDN URL.");
  }
}

downloadLogos();
