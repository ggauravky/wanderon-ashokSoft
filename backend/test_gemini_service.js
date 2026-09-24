import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyGeminiError, generateStructuredJson } from './services/geminiService.js';

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
