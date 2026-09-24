import 'dotenv/config';
import { checkGeminiHealth, getGeminiModelConfig } from '../services/geminiService.js';

const config = getGeminiModelConfig({ purpose: 'quotation' });
if (!config.configured) {
  console.error('Gemini smoke test failed: GEMINI_API_KEY is not configured.');
  process.exitCode = 1;
} else {
  try {
    const result = await checkGeminiHealth({ purpose: 'quotation' });
    console.log(`Gemini quotation AI PASS model=${result.model} latency=${result.latencyMs}ms`);
  } catch (error) {
    console.error(`Gemini quotation AI FAIL code=${error.code || 'UNKNOWN'} model=${error.model || config.primaryModel} referenceId=${error.referenceId || 'none'}`);
    process.exitCode = 1;
  }
}
