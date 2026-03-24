const fs = require('fs');
const path = require('path');

try {
  const data = JSON.parse(fs.readFileSync('logos.json', 'utf8'));
  let csv = 'ID,Name,URL\n';
  data.forEach(item => {
      // Escape names with quotes in case they have commas
      const escapedName = item.name.includes(',') ? `"${item.name}"` : item.name;
      csv += `${item.id},${escapedName},${item.url}\n`;
  });

  fs.writeFileSync('logos.csv', csv);
  console.log('logos.csv created successfully');
} catch (error) {
  console.error('Error generating CSV:', error);
}
