import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(__dirname, '../src/data/operative-log.json');

async function analyze() {
  console.log('🧐 Analyzing Operative Intelligence...');
  
  const data = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
  const strikes = data.strikes;

  // Reset performance metrics
  const perf = {
    "ai-systems-engineer": { "sent": 0, "replies": 0, "interviews": 0 },
    "systems-architect": { "sent": 0, "replies": 0, "interviews": 0 },
    "creative-technologist": { "sent": 0, "replies": 0, "interviews": 0 },
    "technical-pm": { "sent": 0, "replies": 0, "interviews": 0 }
  };

  strikes.forEach(s => {
    if (perf[s.persona]) {
      perf[s.persona].sent++;
      if (s.response_received) perf[s.persona].replies++;
      if (s.status === 'INTERVIEW') perf[s.persona].interviews++;
    }
  });

  data.persona_performance = perf;
  data.global_stats.total_strikes = strikes.length;
  data.global_stats.conversion_rate = strikes.length > 0 
    ? (strikes.filter(s => s.response_received).length / strikes.length) * 100 
    : 0;

  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
  
  console.log('📊 Analysis Complete:');
  console.table(perf);
  console.log(`🚀 Global Conversion Rate: ${data.global_stats.conversion_rate.toFixed(2)}%`);
}

analyze().catch(console.error);
