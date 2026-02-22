import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

  // 1. Persona Analysis
  strikes.forEach(s => {
    if (perf[s.persona]) {
      perf[s.persona].sent++;
      if (s.response_received) perf[s.persona].replies++;
      if (s.status === 'INTERVIEW') perf[s.persona].interviews++;
    }
  });

  // 2. Channel & Tier Analysis
  const channels = {};
  const tiers = {};

  strikes.forEach(s => {
    // Channel Analysis
    const channel = s.channel || 'Unknown';
    if (!channels[channel]) channels[channel] = { sent: 0, replies: 0 };
    channels[channel].sent++;
    if (s.response_received) channels[channel].replies++;

    // Tier Analysis
    const tier = s.tier || 'Unknown';
    if (!tiers[tier]) tiers[tier] = { sent: 0, replies: 0 };
    tiers[tier].sent++;
    if (s.response_received) tiers[tier].replies++;
  });

  data.persona_performance = perf;
  data.channel_performance = channels;
  data.tier_performance = tiers;
  data.global_stats.total_strikes = strikes.length;
  data.global_stats.conversion_rate = strikes.length > 0 
    ? (strikes.filter(s => s.response_received).length / strikes.length) * 100 
    : 0;

  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
  
  console.log('\n--- PERSONA PERFORMANCE ---');
  console.table(perf);

  console.log('\n--- CHANNEL PERFORMANCE ---');
  console.table(channels);

  console.log('\n--- TIER PERFORMANCE ---');
  console.table(tiers);

  console.log(`\n🚀 Global Conversion Rate: ${data.global_stats.conversion_rate.toFixed(2)}%`);
}

analyze().catch(console.error);
