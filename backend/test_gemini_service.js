import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_QUOTATION_GEMINI_FALLBACK_MODEL,
  DEFAULT_QUOTATION_GEMINI_MODEL,
  classifyGeminiError,
  generateStructuredJson,
  getGeminiModelConfig,
  getThinkingConfig
} from './services/geminiService.js';

const schema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] };

test('central Gemini adapter parses valid structured output', async () => {
  const calls = [];
  const client = { models: { generateContent: async (input) => {
    calls.push(input);
    return { text: '{"ok":true}', modelVersion: 'mock-current-model' };
  } } };
  const result = await generateStructuredJson({ action: 'unit-valid', contents: 'health', responseJsonSchema: schema, client });
  assert.deepEqual(result.data, { ok: true });
  assert.equal(result.model, 'mock-current-model');
  assert.equal(calls[0].config.responseMimeType, 'application/json');
  assert.equal(calls[0].config.httpOptions.retryOptions.attempts, 1);
});

test('quotation model configuration is isolated from the general planner model', () => {
  const previous = {
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    QUOTATION_AI_MODEL: process.env.QUOTATION_AI_MODEL,
    QUOTATION_AI_FALLBACK_MODEL: process.env.QUOTATION_AI_FALLBACK_MODEL
  };
  try {
    delete process.env.GEMINI_MODEL;
    delete process.env.QUOTATION_AI_MODEL;
    delete process.env.QUOTATION_AI_FALLBACK_MODEL;
    assert.equal(getGeminiModelConfig({ purpose: 'general' }).primaryModel, DEFAULT_GEMINI_MODEL);
    const quotation = getGeminiModelConfig({ purpose: 'quotation' });
    assert.equal(quotation.primaryModel, DEFAULT_QUOTATION_GEMINI_MODEL);
    assert.equal(quotation.fallbackModel, DEFAULT_QUOTATION_GEMINI_FALLBACK_MODEL);
    process.env.GEMINI_MODEL = 'planner-model';
    process.env.QUOTATION_AI_MODEL = 'quotation-primary';
    process.env.QUOTATION_AI_FALLBACK_MODEL = 'quotation-fallback';
    assert.equal(getGeminiModelConfig({ purpose: 'general' }).primaryModel, 'planner-model');
    assert.deepEqual(getGeminiModelConfig({ purpose: 'quotation' }).candidates, ['quotation-primary', 'quotation-fallback']);
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});

test('quotation generation uses minimal thinking, a 15 second timeout, and usage metadata', async () => {
  const calls = [];
  const client = { models: { generateContent: async (input) => {
    calls.push(input);
    return {
      text: '{"ok":true}',
      modelVersion: input.model,
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 4, totalTokenCount: 16 }
    };
  } } };
  const result = await generateStructuredJson({
    action: 'unit-quotation-config',
    purpose: 'quotation',
    contents: 'health',
    systemInstruction: 'Return only the requested field.',
    responseJsonSchema: schema,
    maxOutputTokens: 80,
    client
  });
  assert.equal(calls[0].model, DEFAULT_QUOTATION_GEMINI_MODEL);
  assert.equal(calls[0].config.thinkingConfig.thinkingLevel, 'MINIMAL');
  assert.equal(calls[0].config.thinkingConfig.includeThoughts, false);
  assert.equal(calls[0].config.maxOutputTokens, 80);
  assert.equal(calls[0].config.httpOptions.timeout, 15_000);
  assert.equal(calls[0].config.systemInstruction, 'Return only the requested field.');
  assert.deepEqual(result.usage, { promptTokenCount: 12, candidatesTokenCount: 4, totalTokenCount: 16 });
  assert.equal(getThinkingConfig({ purpose: 'general', model: DEFAULT_GEMINI_MODEL }), null);
});

test('quotation model-not-found retries the configured quotation fallback', async () => {
  const models = [];
  const client = { models: { generateContent: async ({ model }) => {
    models.push(model);
    if (models.length === 1) throw Object.assign(new Error('model not found for generateContent'), { status: 404 });
    return { text: '{"ok":true}', modelVersion: model };
  } } };
  const result = await generateStructuredJson({ action: 'unit-quotation-fallback', purpose: 'quotation', contents: 'health', responseJsonSchema: schema, client });
  assert.deepEqual(models, [DEFAULT_QUOTATION_GEMINI_MODEL, DEFAULT_QUOTATION_GEMINI_FALLBACK_MODEL]);
  assert.equal(result.model, DEFAULT_QUOTATION_GEMINI_FALLBACK_MODEL);
});

test('malformed output is classified without leaking response text', async () => {
  const client = { models: { generateContent: async () => ({ text: 'not-json secret payload' }) } };
  await assert.rejects(
    generateStructuredJson({ action: 'unit-invalid', contents: 'health', responseJsonSchema: schema, client }),
    (error) => error.code === 'AI_INVALID_RESPONSE' && !error.message.includes('secret payload')
  );
});

test('model-not-found uses the controlled fallback once', async () => {
  const models = [];
  const client = { models: { generateContent: async ({ model }) => {
    models.push(model);
    if (models.length === 1) throw Object.assign(new Error('model not found for generateContent'), { status: 404 });
    return { text: '{"ok":true}', modelVersion: model };
  } } };
  const result = await generateStructuredJson({ action: 'unit-fallback', contents: 'health', responseJsonSchema: schema, client });
  assert.equal(models.length, 2);
  assert.equal(result.data.ok, true);
});

test('quota, auth, and timeout failures have stable safe codes', () => {
  assert.equal(classifyGeminiError(Object.assign(new Error('quota exhausted'), { status: 429 })).code, 'AI_QUOTA_EXCEEDED');
  assert.equal(classifyGeminiError(Object.assign(new Error('invalid API key'), { status: 401 })).code, 'AI_AUTH_FAILED');
  assert.equal(classifyGeminiError(Object.assign(new Error('deadline exceeded'), { status: 504 })).code, 'AI_PROVIDER_UNAVAILABLE');
});
