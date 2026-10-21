import { env } from 'node:process';
import OpenAI from 'openai';

// The group's AI gateway (LiteLLM) speaks the OpenAI API and routes to Bedrock.
// From a laptop: kubectl port-forward -n data-ai-prep svc/ai-gateway 4000:80
// Inside the cluster: http://ai-gateway.data-ai-prep.svc.cluster.local/v1
const baseURL = env.AI_GATEWAY_URL || 'http://localhost:4000/v1';

// A gateway alias, not a Bedrock model ID. GET /v1/models lists them.
export const analysisModel = env.AI_ANALYSIS_MODEL || 'chat-claude';

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI_GATEWAY_KEY is not set');
  }
}

let client: OpenAI | undefined;

// Created on first use rather than at import, so the rest of the API keeps
// working for anyone who hasn't set up the gateway key.
export function getAiClient(): OpenAI {
  if (!env.AI_GATEWAY_KEY) {
    throw new AiNotConfiguredError();
  }
  client ??= new OpenAI({
    baseURL,
    apiKey: env.AI_GATEWAY_KEY,
    timeout: 120_000,
    maxRetries: 1,
  });
  return client;
}
