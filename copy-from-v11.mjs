import fs from 'fs';

const logos = JSON.parse(fs.readFileSync('logos.json', 'utf8'));
const missing = logos.filter(l => !fs.existsSync(`public/logos/${l.id}.svg`));

const mappedSlugs = {
  'Microsoft': 'microsoft',
  'Amazon': 'amazon',
  'LinkedIn': 'linkedin',
  'OpenAI': 'openai',
  'Midjourney': 'midjourney',
  'AWS': 'amazonaws',
  'VS Code': 'visualstudiocode',
  'Skype': 'skype',
  'IBM': 'ibm',
  'Oracle': 'oracle',
  'Salesforce': 'salesforce',
  'Adobe': 'adobe',
  'Bumble': 'bumble',
  'Canva': 'canva',
  'Heroku': 'heroku',
  'Windows': 'windows', 
  'C#': 'csharp'
};

for (const logo of missing) {
  if (logo.name === 'Java') { continue; } // Already handled
  if (logo.name === 'Lovable') { continue; } // Already handled
  
  const slug = mappedSlugs[logo.name];
  if (slug) {
    let src = `node_modules/simple-icons/icons/${slug}.svg`;
    if (!fs.existsSync(src) && slug === 'windows') {
        src = `node_modules/simple-icons/icons/windows11.svg`;
    }

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, `public/logos/${logo.id}.svg`);
      console.log(`Copied ${logo.name}`);
    } else {
      console.log(`Missing from npm v11: ${logo.name} (${src})`);
    }
  } else {
    console.log(`No slug mapped for ${logo.name}`);
  }
}
