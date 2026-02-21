import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PERSONAS_PATH = path.join(__dirname, '../src/data/personas.json');

/**
 * Tactical Tool: Check Market Fit
 * Usage: node scripts/check-market-fit.mjs [persona-id] [path-to-job-desc.txt]
 */
async function checkFit() {
  const personaId = process.argv[2];
  const jobDescPath = process.argv[3];

  if (!personaId || !jobDescPath) {
    console.error('❌ Usage: node scripts/check-market-fit.mjs [persona-id] [path-to-job-desc.txt]');
    process.exit(1);
  }

  const personas = JSON.parse(fs.readFileSync(PERSONAS_PATH, 'utf8')).personas;
  const persona = personas.find(p => p.id === personaId);
  const jobDesc = fs.readFileSync(jobDescPath, 'utf8').toLowerCase();

  if (!persona) {
    console.error(`❌ Persona ${personaId} not found.`);
    process.exit(1);
  }

  console.log(`
🧐 Optimizing Signal for: ${persona.title}`);
  console.log(`📄 Analyzing Job Description: ${path.basename(jobDescPath)}`);

  const results = {
    matched: [],
    missing: [],
    score: 0
  };

  persona.stack.forEach(tech => {
    if (jobDesc.includes(tech.toLowerCase())) {
      results.matched.push(tech);
    } else {
      results.missing.push(tech);
    }
  });

  results.score = (results.matched.length / persona.stack.length) * 100;

  console.log('
--- MATCH REPORT ---');
  console.log(`✅ MATCHED KEYWORDS: ${results.matched.join(', ')}`);
  console.log(`⚠️ MISSING KEYWORDS: ${results.missing.join(', ')}`);
  console.log(`📊 RAW SIGNAL SCORE: ${results.score.toFixed(2)}%`);

  if (results.score < 70) {
    console.log('
🚨 STRATEGIC ADVICE: Signal too low. Adjust persona impact statements or choose a different mask.');
  } else {
    console.log('
🚀 STRATEGIC ADVICE: High-signal match. Proceed to Strike.');
  }
}

checkFit().catch(console.error);
