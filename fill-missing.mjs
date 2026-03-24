import fs from 'fs';

const logos = JSON.parse(fs.readFileSync('logos.json'));
const missing = logos.filter(l => !fs.existsSync(`public/logos/${l.id}.svg`));

const mappedSlugs = {
  'Microsoft': 'microsoft',
  'Amazon': 'amazon',
  'LinkedIn': 'linkedin',
  'OpenAI': 'openai',
  'Midjourney': 'midjourney',
  'Lovable': 'lovable',
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
  'Windows11': 'windows11',
  'Java': 'java', 
  'C#': 'csharp'
};

async function downloadMissing() {
  for (const logo of missing) {
    if (logo.name === 'Java') {
        const javaFallback = `<svg viewBox="0 0 24 24" fill="#E76F00" xmlns="http://www.w3.org/2000/svg"><path d="M15.42 16.32c-1.3-.23-2.9-.38-4.66-.38-2.6 0-4.64.33-5.26.85-2.06.66-.45 1.7 1.83 2 1.3.17 2.87.27 4.65.27 2.65 0 4.7-.35 5.3-.87 2.1-.65.48-1.72-1.85-1.87zm-7.66 1.4c-1.55-.16-2.52-.36-2.6-.54-.04-.15.35-.35 1.14-.54 1.25-.3 3.4-.47 5.86-.47 1.6 0 3.03.1 4.14.28 1.4.2 2.1.4 2.17.57.04.14-.26.33-.94.52-1.38.38-3.95.6-6.85.6-1.02.02-2.02-.02-2.92-.04zM16.5 14c-1.4-.2-3.1-.34-5-.34-3 0-5.32.32-5.9.82-1.9.6-.32 1.5 1.95 1.73 1.45.14 3.16.2 5.04.2 2.86 0 5.1-.34 5.7-.85 1.9-.6.28-1.46-1.8-1.57zM8.88 15.34c-1.5-.16-2.4-.35-2.5-.52-.02-.13.3-.3 1.05-.47 1.2-.28 3.24-.46 5.57-.46 1.57 0 2.94.1 4.02.26 1.34.2 2 .38 2.05.53.03.12-.22.28-.84.45-1.28.35-3.66.56-6.32.56-1 .02-2 .02-2.93-.05zM11.53 11c-1.6-.08-3.08-.1-4.27 0-1.8.18-1.4.67-.3 1.05.7.25 1.72.4 3 .47 1.76.1 3.8.03 5.48-.2 1.98-.28 2.53-.78.9-1.08-1-.24-2.53-.33-4.8-.24zm-.5 1.05c-1.35 0-2.5-.1-3.13-.27-.58-.16-.62-.26-.54-.3.04-.04.28-.15.96-.28 1.3-.24 3.32-.28 5.6-.1 1.07.08 1.94.22 2.5.38.74.2.82.35.7.4-.1.05-.4.18-1.3.3-1.34.17-3.03.22-4.8.22z"/><path d="M12.9 8.24c-2.45-.6-3.8-1.82-3.8-2.6 0-.82 1.25-1.6 3.47-1.8 1.4-.13 2.97-.04 4.35.24.6.13.98.35.98.54 0 .28-.86.3-1.35.3-.47 0-.77.1-.64.2.14.1.66.23 1.42.34.6.1.92.3.92.5 0 .42-1 .76-2.56 1-.36.05-.56.13-.42.23.16.12.87.12 1.83 0 .54-.05.86.13.86.4 0 .62-1.9 1.24-5.06 1.64h-.02zm.54-3.56c-1.3-.23-2.9-.38-4.67-.38-2.6 0-4.65.33-5.27.85-2.07.66-.46 1.7 1.83 2 1.3.17 2.87.27 4.65.27 2.65 0 4.7-.35 5.3-.87 2.1-.65.48-1.72-1.85-1.87z"/></svg>`;
        fs.writeFileSync(`public/logos/${logo.id}.svg`, javaFallback);
        console.log(`Fallback Java created for ID ${logo.id}`);
        continue;
    }

    const slug = mappedSlugs[logo.name];
    if (slug) {
        // Try unpkg first
        let res = await fetch(`https://unpkg.com/simple-icons@latest/icons/${slug}.svg`);
        if (!res.ok && slug === 'windows') {
            res = await fetch(`https://unpkg.com/simple-icons@latest/icons/windows11.svg`);
        }
        
        if (res.ok) {
            fs.writeFileSync(`public/logos/${logo.id}.svg`, await res.text());
            console.log(`Downloaded ${logo.name} (${slug})`);
        } else {
            console.log(`Failed ${logo.name} (${slug})`);
        }
    } else {
        console.log(`No slug mapped for ${logo.name}`);
    }
  }
}
downloadMissing();
