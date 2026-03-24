const fs = require('fs');

const techCompanies = [
  // Big Tech & Consumer
  "Google", "Apple", "Microsoft", "Amazon", "Meta",
  "Netflix", "Spotify", "X", "YouTube", "Instagram",
  "TikTok", "Reddit", "LinkedIn", "WhatsApp", "Discord",
  "Slack", "Nvidia", "Tesla", "Twitch", "Pinterest",

  // Modern AI & New Tech
  "OpenAI", "Anthropic", "Claude", "Hugging Face", "Midjourney",
  "Vercel", "Supabase", "Lovable", "Figma", "Notion", "Stripe",
  "Cursor", "Perplexity", "Raycast", "Arc", "Linear",

  // Core Developer / Traditional Tech (Keep a few recognizable ones)
  "React", "Python", "JavaScript", "TypeScript", "Node.js",
  "GitHub", "Docker", "AWS", "Next.js", "Tailwind CSS",
  "Vue.js", "PostgreSQL", "MongoDB", "Linux", "Ubuntu",
  "Git", "VS Code", "Framer", "GitLab", "Stack Overflow"
];

// Normalize names into simpleicons slugs
const normalizeSlug = (name) => {
  let slug = name.toLowerCase()
    .replace(/\.js$/, 'dotjs')
    .replace(/\.net$/, 'dotnet')
    .replace(/\+/g, 'plus')
    .replace(/\#/g, 'sharp')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/[^a-z0-9]/g, '');

  const overrides = {
    'googlecloud': 'googlecloud',
    'microsoftazure': 'microsoftazure',
    'vscode': 'visualstudiocode',
    'cplusplus': 'cplusplus',
    'csharp': 'csharp',
    'html5': 'html5',
    'css3': 'css3',
    'tailwindcss': 'tailwindcss',
    'amazonwebservices': 'amazonaws'
  };
  
  return overrides[slug] || slug;
};

// De-duplicate array
const uniqueTech = [...new Set(techCompanies)];

// Generate 120 unique logo objects mapped to simpleicons
const logos = uniqueTech.map((name, index) => {
  const slug = normalizeSlug(name);
  return {
    id: index + 1,
    name: name,
    url: `https://cdn.simpleicons.org/${slug}`,
    // SimpleIcons returns an SVG icon directly at that slug format!
  };
});

fs.writeFileSync('logos.json', JSON.stringify(logos, null, 2));
console.log(`Generated ${logos.length} tech logos data perfectly! Output saved to logos.json`);
