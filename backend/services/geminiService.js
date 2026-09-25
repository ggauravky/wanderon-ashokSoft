import crypto from 'node:crypto';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite';
export const DEFAULT_QUOTATION_GEMINI_MODEL = 'gemini-3.1-flash-lite';
export const DEFAULT_QUOTATION_GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_TIMEOUT_MS = 25_000;
const QUOTATION_TIMEOUT_MS = 15_000;

const SAFE_MESSAGES = {
  AI_NOT_CONFIGURED: 'AI writing is not configured. Safe defaults and structured import remain available.',
  AI_AUTH_FAILED: 'AI writing is not configured correctly.',
  AI_MODEL_NOT_FOUND: 'AI writing model is unavailable. Ask an administrator to verify Gemini configuration.',
  AI_QUOTA_EXCEEDED: 'AI usage limit has been reached. Safe defaults and structured import remain available.',
  AI_RATE_LIMITED: 'AI writing is temporarily rate limited. Safe defaults and structured import remain available.',
  AI_PROVIDER_UNAVAILABLE: 'AI writing is temporarily unavailable. Safe defaults and structured import remain available.',
  AI_INVALID_RESPONSE: 'AI writing returned an invalid response. No quotation content was changed.',
  AI_OUTPUT_REJECTED: 'AI wording could not be used safely. No quotation content was changed.',
  AI_CONTEXT_INSUFFICIENT: 'Add the required confirmed facts before asking AI to write this field.'
};

const emptyHealth = () => ({ providerReachable: null, lastCheckedAt: null, model: null, code: null });
const latestHealthByPurpose = {
  general: emptyHealth(),
  quotation: emptyHealth()
};

const configuredApiKey = () => String(
  process.env.GEMINI_API_KEY
  || process.env.GOOGLE_API_KEY
  || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  || ''
).trim();

const conciseMessage = (error) => String(error?.message || error || '').slice(0, 800);

export class GeminiServiceError extends Error {
  constructor(code, options = {}) {
    super(options.safeMessage || SAFE_MESSAGES[code] || SAFE_MESSAGES.AI_PROVIDER_UNAVAILABLE);
    this.name = 'GeminiServiceError';
    this.code = code;
    this.status = options.status || 503;
    this.retryable = options.retryable === true;
    this.model = options.model || null;
    this.referenceId = options.referenceId || crypto.randomUUID();
    this.technicalMessage = options.technicalMessage || '';
  }
}

export const getGeminiModelConfig = ({ purpose = 'general' } = {}) => {
  const generalModel = String(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
  const primaryModel = purpose === 'quotation'
    ? String(process.env.QUOTATION_AI_MODEL || DEFAULT_QUOTATION_GEMINI_MODEL).trim()
    : generalModel;
  const fallbackModel = purpose === 'quotation'
    ? String(process.env.QUOTATION_AI_FALLBACK_MODEL || DEFAULT_QUOTATION_GEMINI_FALLBACK_MODEL).trim()
    : String(process.env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_FALLBACK_MODEL).trim();
  const candidates = [...new Set([primaryModel, fallbackModel].filter(Boolean))];
  return {
    configured: Boolean(configuredApiKey()),
    primaryModel,
    fallbackModel: candidates.find((model) => model !== primaryModel) || null,
    candidates
  };
};

export const getThinkingConfig = ({ purpose = 'general', model = '' } = {}) => {
  if (purpose !== 'quotation' || !/^gemini-3(?:\.|$)/i.test(String(model))) return null;
  return { thinkingLevel: ThinkingLevel.MINIMAL, includeThoughts: false };
};

export const classifyGeminiError = (error, { model = null, referenceId = crypto.randomUUID() } = {}) => {
  if (error instanceof GeminiServiceError) return error;
  const status = Number(error?.status || error?.statusCode || error?.code);
  const technicalMessage = conciseMessage(error);
  const normalized = technicalMessage.toLowerCase();

  if (error?.name === 'AbortError' || /timeout|timed out|deadline exceeded|deadline expired/.test(normalized)) {
    return new GeminiServiceError('AI_PROVIDER_UNAVAILABLE', {
      status: 503, retryable: true, model, referenceId, technicalMessage
    });
  }
  if (status === 401 || (status === 403 && /api key|credential|permission|unauth/.test(normalized))) {
    return new GeminiServiceError('AI_AUTH_FAILED', {
      status: 503, retryable: false, model, referenceId, technicalMessage
    });
  }
  if (status === 404 || /model.+not found|not supported for generatecontent/.test(normalized)) {
    return new GeminiServiceError('AI_MODEL_NOT_FOUND', {
      status: 503, retryable: true, model, referenceId, technicalMessage
    });
  }
  if (status === 429 && /quota|resource.exhausted|limit has been reached/.test(normalized)) {
    return new GeminiServiceError('AI_QUOTA_EXCEEDED', {
      status: 429, retryable: false, model, referenceId, technicalMessage
    });
  }
  if (status === 429) {
    return new GeminiServiceError('AI_RATE_LIMITED', {
      status: 429, retryable: false, model, referenceId, technicalMessage
    });
  }
  if ([408, 500, 502, 503, 504].includes(status) || /fetch failed|temporar|unavailable|high demand/.test(normalized)) {
    return new GeminiServiceError('AI_PROVIDER_UNAVAILABLE', {
      status: 503, retryable: true, model, referenceId, technicalMessage
    });
  }
  return new GeminiServiceError('AI_PROVIDER_UNAVAILABLE', {
    status: 503, retryable: false, model, referenceId, technicalMessage
  });
};

const logResult = ({ action, model, result, latencyMs, code, referenceId, usage }) => {
  const parts = [
    '[QuotationAI]',
    `action=${String(action || 'generation').replace(/\s+/g, '_')}`,
    `model=${model || 'unavailable'}`,
    `result=${result}`,
    `latency=${latencyMs}ms`
  ];
  if (Number.isFinite(usage?.promptTokenCount)) parts.push(`inputTokens=${usage.promptTokenCount}`);
  if (Number.isFinite(usage?.candidatesTokenCount)) parts.push(`outputTokens=${usage.candidatesTokenCount}`);
  if (Number.isFinite(usage?.totalTokenCount)) parts.push(`totalTokens=${usage.totalTokenCount}`);
  if (code) parts.push(`code=${code}`);
  if (referenceId) parts.push(`referenceId=${referenceId}`);
  const message = parts.join(' ');
  if (result === 'success') console.info(message);
  else console.warn(message);
};

const parseJsonResponse = (response, { model, referenceId }) => {
  const responseText = typeof response?.text === 'string' ? response.text.trim() : '';
  if (!responseText) {
    throw new GeminiServiceError('AI_INVALID_RESPONSE', {
      status: 502,
      retryable: false,
      model,
      referenceId,
      technicalMessage: `Empty structured response; candidateCount=${response?.candidates?.length || 0}`
    });
  }
  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new GeminiServiceError('AI_INVALID_RESPONSE', {
      status: 502,
      retryable: false,
      model,
      referenceId,
      technicalMessage: `Malformed JSON response; length=${responseText.length}; ${conciseMessage(error)}`
    });
  }
};

export async function generateStructuredJson({
  action,
  contents,
  responseJsonSchema,
  purpose = 'general',
  temperature = 0.25,
  maxOutputTokens = 8_192,
  timeoutMs,
  systemInstruction,
  client = null
}) {
  const referenceId = crypto.randomUUID();
  const config = getGeminiModelConfig({ purpose });
  const apiKey = configuredApiKey();
  if (!client && !apiKey) {
    throw new GeminiServiceError('AI_NOT_CONFIGURED', {
      status: 503, retryable: false, model: config.primaryModel, referenceId
    });
  }

  const ai = client || new GoogleGenAI({ apiKey });
  let lastError = null;
  for (const [index, model] of config.candidates.entries()) {
    const startedAt = Date.now();
    try {
      const thinkingConfig = getThinkingConfig({ purpose, model });
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          ...(thinkingConfig ? { thinkingConfig } : {}),
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json',
          responseJsonSchema,
          httpOptions: { timeout: timeoutMs ?? (purpose === 'quotation' ? QUOTATION_TIMEOUT_MS : DEFAULT_TIMEOUT_MS), retryOptions: { attempts: 1 } }
        }
      });
      const data = parseJsonResponse(response, { model, referenceId });
      const usage = {
        promptTokenCount: Number(response?.usageMetadata?.promptTokenCount),
        candidatesTokenCount: Number(response?.usageMetadata?.candidatesTokenCount),
        totalTokenCount: Number(response?.usageMetadata?.totalTokenCount)
      };
      latestHealthByPurpose[purpose] = {
        providerReachable: true,
        lastCheckedAt: new Date().toISOString(),
        model: response?.modelVersion || model,
        code: null
      };
      logResult({ action, model, result: 'success', latencyMs: Date.now() - startedAt, referenceId, usage });
      return {
        data,
        provider: 'gemini',
        model: response?.modelVersion || model,
        requestedModel: model,
        latencyMs: Date.now() - startedAt,
        referenceId,
        usage
      };
    } catch (error) {
      const classified = classifyGeminiError(error, { model, referenceId });
      lastError = classified;
      latestHealthByPurpose[purpose] = {
        providerReachable: false,
        lastCheckedAt: new Date().toISOString(),
        model,
        code: classified.code
      };
      logResult({
        action,
        model,
        result: 'failure',
        latencyMs: Date.now() - startedAt,
        code: classified.code,
        referenceId
      });
      const hasFallback = index < config.candidates.length - 1;
      if (!classified.retryable || !hasFallback) throw classified;
    }
  }
  throw lastError || new GeminiServiceError('AI_PROVIDER_UNAVAILABLE', { referenceId });
}

export const getGeminiStatus = ({ purpose = 'quotation' } = {}) => {
  const config = getGeminiModelConfig({ purpose });
  const health = latestHealthByPurpose[purpose] || emptyHealth();
  return {
    configured: config.configured,
    model: health.model || config.primaryModel,
    providerReachable: config.configured ? health.providerReachable : false,
    lastCheckedAt: health.lastCheckedAt
  };
};

export async function checkGeminiHealth({ purpose = 'quotation' } = {}) {
  const result = await generateStructuredJson({
    action: 'health_check',
    purpose,
    contents: 'Return a successful service health result.',
    temperature: 0,
    maxOutputTokens: 64,
    responseJsonSchema: {
      type: 'object',
      properties: { ok: { type: 'boolean' } },
      required: ['ok'],
      additionalProperties: false
    }
  });
  if (result.data?.ok !== true) {
    throw new GeminiServiceError('AI_INVALID_RESPONSE', {
      status: 502,
      model: result.model,
      referenceId: result.referenceId,
      technicalMessage: 'Health response did not contain ok=true.'
    });
  }
  return { ...getGeminiStatus({ purpose }), latencyMs: result.latencyMs };
}

export const createAiOutputRejectedError = (technicalMessage, options = {}) => new GeminiServiceError(
  'AI_OUTPUT_REJECTED',
  { status: 422, retryable: false, technicalMessage, ...options }
);

export const publicAiError = (error) => {
  const classified = classifyGeminiError(error);
  return {
    status: classified.status,
    body: {
      success: false,
      available: false,
      code: classified.code,
      message: classified.message,
      retryable: classified.retryable,
      model: classified.model,
      referenceId: classified.referenceId
    }
  };
};
