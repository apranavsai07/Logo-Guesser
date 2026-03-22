const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const logosPath = path.resolve(__dirname, '../logos.json');
  const logosData = JSON.parse(fs.readFileSync(logosPath, 'utf8'));
  
  const records = logosData.map(logo => ({
    name: logo.name,
    image_url: logo.url
  }));

  console.log('Clearing old questions and resetting state...');
  await supabase.from('questions').delete().neq('id', 0); // Deletes all

  console.log(`Seeding ${records.length} clean logos...`);
  const { error } = await supabase.from('questions').upsert(records, { onConflict: 'name' });
  
  if (error) {
    console.error("Error seeding logos:", error);
  } else {
    console.log("Logos seeded successfully!");
  }
}

seed();
