import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PERSONAS_PATH = path.join(__dirname, '../src/data/personas.json');

/**
 * Tactical Tool: Semantic AI Market Fit Check
 * Usage: node scripts/check-market-fit.mjs [persona-id] [path-to-job-desc.txt]
 */
async function checkFit() {
  const personaId = process.argv[2];
  const jobDescPath = process.argv[3];

  if (!personaId || !jobDescPath) {
    console.error('Usage: npm run check:fit [persona-id] [path-to-job-desc.txt]');
    process.exit(1);
  }

  const personas = JSON.parse(fs.readFileSync(PERSONAS_PATH, 'utf8')).personas;
  const persona = personas.find(p => p.id === personaId);

  if (!persona) {
    console.error(`❌ Persona '${personaId}' not found in the intelligence ledger.`);
    process.exit(1);
  }

  if (!fs.existsSync(jobDescPath)) {
    console.error(`❌ Job description file '${jobDescPath}' not found.`);
    process.exit(1);
  }

  const jobDesc = fs.readFileSync(jobDescPath, 'utf8');

  console.log(`\n🧐 Initializing Semantic Operative Intelligence...`);
  console.log(`📡 Analyzing alignment between '${persona.title}' and target job description...`);
  
  const prompt = `
You are an elite, highly analytical Technical Recruiter and Systems Architect. Your job is to strictly evaluate the semantic "market fit" of a candidate against a job description.

Candidate Persona: "${persona.title}"
Core Thesis: "${persona.thesis}"
Tech Stack: ${persona.stack.join(', ')}
Featured Projects: ${persona.featured_projects.map(p => p.slug).join(', ')}

Target Job Description:
"""
${jobDesc.substring(0, 3000)} // truncate to avoid massive prompts just in case
"""

Analyze the alignment. Provide the output in exactly this format, and nothing else (no markdown blocks, no conversational preamble):

MATCH SCORE: [A percentage from 0 to 100]
CORE ALIGNMENT: [1 sentence summarizing why this is or isn't a good fit]
MISSING CRITICAL SKILLS: [Comma separated list of things the job wants that the persona lacks, or "None"]
STRATEGIC ADVICE: [1 sentence of advice on how to tailor the application/resume to bridge any gaps or emphasize strengths]
  `.trim();

  try {
    const output = execSync(`gemini -p ${JSON.stringify(prompt)} 2>/dev/null`, { encoding: 'utf8' });
    
    // Clean up CLI noise
    const lines = output.replace(/\u001b\[[0-9;]*m/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const cleanOutput = lines.filter(l => !l.startsWith('Loading ') && !l.startsWith('Server ') && !l.startsWith('Tools ') && !l.startsWith('Loaded ') && !l.includes('tool update notification'));
    
    console.log('\n--- 🧠 SEMANTIC MATCH REPORT ---');
    console.log(cleanOutput.join('\n'));
    console.log('--------------------------------\n');
    
  } catch (error) {
    console.error('\n⚠️  AI semantic analysis failed. Falling back to primitive string matching.');
    // Fallback logic
    const results = { matched: [], missing: [], score: 0 };
    persona.stack.forEach(tech => {
      if (jobDesc.toLowerCase().includes(tech.toLowerCase())) {
        results.matched.push(tech);
      } else {
        results.missing.push(tech);
      }
    });
    results.score = (results.matched.length / persona.stack.length) * 100;

    console.log('\n--- PRIMITIVE MATCH REPORT ---');
    console.log(`MATCHED KEYWORDS: ${results.matched.join(', ')}`);
    console.log(`MISSING KEYWORDS: ${results.missing.join(', ')}`);
    console.log(`RAW SIGNAL SCORE: ${results.score.toFixed(2)}%`);
  }
}

checkFit().catch(console.error);
