// AI services: stubs + optional LLM via getAIService

import { getAIService } from './openai-service';

export interface TranscriptionResult {
  text: string;
  segments: { start: number; end: number; text: string }[];
}

export interface ScopeExtractionResult {
  scope_json: Record<string, unknown>;
  confidence: number;
  missing_fields: string[];
}

export interface ProposalGenerationResult {
  html: string;
  pricing_json: any;
}

export async function transcribeAudio(storagePath: string): Promise<TranscriptionResult> {
  // TODO: Call OpenAI Whisper or similar
  console.log('Stub: Transcribing audio from', storagePath);
  return {
    text: "This is a simulated transcription of the walkthrough.",
    segments: [{ start: 0, end: 10, text: "This is a simulated transcription..." }]
  };
}

/**
 * Extract scope (rooms, sqft, surfaces) from a walk-through transcript.
 * If orgId is provided and AI is configured (ai_config or OPENAI_API_KEY), uses LLM; otherwise returns stub.
 */
export async function extractScope(
  transcriptText: string,
  orgId?: string
): Promise<ScopeExtractionResult> {
  if (orgId) {
    const service = await getAIService(orgId);
    if (service) {
      return service.extractScopeFromTranscript(transcriptText);
    }
  }
  return {
    scope_json: { rooms: [{ name: 'Lobby', sqft: 500, floor: 'tile' }] },
    confidence: 0.95,
    missing_fields: [],
  };
}

export async function generateProposal(scopeJson: any, pricingRules: any): Promise<ProposalGenerationResult> {
  // TODO: Call LLM to generate proposal HTML
  console.log('Stub: Generating proposal');
  return {
    html: "<div class='proposal'><h1>Cleaning Proposal</h1><p>We will clean the lobby.</p></div>",
    pricing_json: { total_monthly: 1500, line_items: [{ description: "Lobby", amount: 1500 }] }
  };
}
