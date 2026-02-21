import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const personasPath = path.join(__dirname, '../src/data/personas.json');
const personas = JSON.parse(fs.readFileSync(personasPath, 'utf8')).personas;

const targetsPath = path.join(__dirname, '../src/data/targets.json');
const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8')).targets;

const OUTPUT_DIR = path.join(__dirname, '../public/resume');
const BASE_URL = 'http://localhost:4321/portfolio';

async function generatePDFs() {
  console.log('🚀 Starting Colossal PDF Generation Factory...');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Generate Persona PDFs
  for (const persona of personas) {
    const url = `${BASE_URL}/resume/${persona.slug}/`;
    const outputPath = path.join(OUTPUT_DIR, `Anthony_James_Padavano_${persona.title.replace(/\s+/g, '_')}.pdf`);
    
    console.log(`📄 Generating PDF for Persona: ${persona.title}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.pdf({
        path: outputPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      console.log(`✅ Saved to ${outputPath}`);
    } catch (err) {
      console.error(`❌ Failed to generate PDF for ${persona.title}:`, err.message);
    }
  }

  // 2. Generate Targeted Application Bundles
  for (const target of targets) {
    const url = `${BASE_URL}/for/${target.slug}/`;
    const outputPath = path.join(OUTPUT_DIR, `Anthony_James_Padavano_App_${target.company.replace(/\s+/g, '_')}.pdf`);
    
    console.log(`🎯 Generating Application Bundle for: ${target.company}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.pdf({
        path: outputPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      console.log(`✅ Saved to ${outputPath}`);
    } catch (err) {
      console.error(`❌ Failed to generate PDF for ${target.company}:`, err.message);
    }
  }

  // 3. Generate Full Polymath PDF
  console.log('📄 Generating PDF for Visionary Polymath...');
  try {
    const polymathPath = path.join(OUTPUT_DIR, 'Anthony_James_Padavano_CV_Polymath.pdf');
    await page.goto(`${BASE_URL}/resume/polymath/`, { waitUntil: 'networkidle' });
    await page.pdf({
      path: polymathPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    console.log(`✅ Saved to ${polymathPath}`);
  } catch (err) {
    console.error('❌ Failed to generate Polymath PDF:', err.message);
  }

  await browser.close();
  console.log('🏁 PDF Generation Factory Complete.');
}

generatePDFs().catch(console.error);
