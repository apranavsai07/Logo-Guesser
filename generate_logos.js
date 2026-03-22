const fs = require('fs');

const techCompanies = [
  "React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "Gatsby", "Vite", "Webpack", "Babel", 
  "Node.js", "Deno", "Bun", "Express", "NestJS", "Fastify", 
  "Python", "Django", "Flask", "FastAPI", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Keras",
  "Java", "Spring", "Kotlin", "Scala", "Groovy", 
  "C", "C++", "C#", ".NET", "F#", 
  "Ruby", "Rails", "PHP", "Laravel", "Symfony", "Go", "Rust", "Swift", "Objective-C", "Dart", "Flutter",
  "HTML5", "CSS3", "JavaScript", "TypeScript", "WebAssembly",
  "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra", "Neo4j", "MariaDB", "Elasticsearch", "Couchbase",
  "Git", "GitHub", "GitLab", "Bitbucket", "Docker", "Kubernetes", "Podman", "Vagrant",
  "Linux", "Ubuntu", "Debian", "Fedora", "Arch Linux", "CentOS", "Alpine Linux",
  "AWS", "Google Cloud", "Microsoft Azure", "DigitalOcean", "Heroku", "Vercel", "Netlify", "Cloudflare", "Firebase", "Supabase",
  "Nginx", "Apache", "Caddy", "RabbitMQ", "Kafka",
  "GraphQL", "Apollo", "Prisma", "Sequelize", "Mongoose",
  "Jest", "Cypress", "Playwright", "Mocha", "Selenium", 
  "Figma", "Adobe XD", "Sketch", "InVision", "Framer",
  "Stripe", "PayPal", "Shopify", "WooCommerce", 
  "Slack", "Discord", "Zoom", "Microsoft Teams", "Trello", "Jira", "Asana", "Notion",
  "Vim", "Neovim", "VS Code", "IntelliJ IDEA", "WebStorm", "PyCharm", "Eclipse", "Android Studio",
  "Haskell", "Elixir", "Clojure", "OCaml", "Tailwind CSS", "Bootstrap", "Sass", "Less", "Stylus", "GraphQL", "Redis"
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
