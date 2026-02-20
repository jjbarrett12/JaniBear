/**
 * OpenAI Service for AI-powered features
 * Handles AI requests for compliance, SDS, PO recommendations, invoicing, and phone calls
 */

interface AIConfig {
  apiKey: string;
  model?: string;
  orgId: string;
}

interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  feature: 'compliance' | 'sds' | 'po' | 'invoicing' | 'phone' | 'proposal' | 'general';
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4-turbo-preview';
  }

  async generateText(request: AIRequest): Promise<string> {
    try {
      const systemPrompt = this.getSystemPrompt(request.feature);
      const userPrompt = this.buildPrompt(request.prompt, request.context);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'AI request failed');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  /** Custom system + user messages, JSON response. Used for schedule extraction and crew split. */
  async generateJson(
    systemPrompt: string,
    userPrompt: string,
    options?: { temperature?: number; max_tokens?: number }
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.max_tokens ?? 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'AI request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');
    return JSON.parse(content) as Record<string, unknown>;
  }

  async analyzeSDS(documentText: string): Promise<{
    summary: string;
    keyHazards: string[];
    storageRequirements: string;
    disposalRequirements: string;
    emergencyProcedures: string;
  }> {
    const prompt = `Analyze this Safety Data Sheet (SDS) and extract:
1. A concise summary (2-3 sentences)
2. Key hazards (list as array)
3. Storage requirements
4. Disposal requirements
5. Emergency procedures

SDS Content:
${documentText.substring(0, 10000)}`;

    const response = await this.generateText({
      prompt,
      feature: 'sds',
    });

    try {
      return JSON.parse(response);
    } catch {
      // Fallback if JSON parsing fails
      return {
        summary: response,
        keyHazards: [],
        storageRequirements: '',
        disposalRequirements: '',
        emergencyProcedures: '',
      };
    }
  }

  async suggestComplianceActions(complianceData: {
    type: string;
    description: string;
    dueDate?: string;
    location?: string;
  }): Promise<string[]> {
    const prompt = `Based on this compliance requirement, suggest 3-5 actionable steps:
Type: ${complianceData.type}
Description: ${complianceData.description}
Due Date: ${complianceData.dueDate || 'Not specified'}
Location: ${complianceData.location || 'Not specified'}

Return as a JSON array of action items.`;

    const response = await this.generateText({
      prompt,
      feature: 'compliance',
    });

    try {
      return JSON.parse(response);
    } catch {
      return [response];
    }
  }

  async recommendPOItems(poContext: {
    location?: string;
    recentOrders?: any[];
    inventory?: any[];
  }): Promise<{
    suggestedItems: Array<{ name: string; quantity: number; reason: string }>;
    suggestedSuppliers: Array<{ name: string; reason: string }>;
  }> {
    const prompt = `Based on this purchase order context, suggest:
1. Items that might be needed (with quantities and reasons)
2. Recommended suppliers (with reasons)

Context:
Location: ${poContext.location || 'Not specified'}
Recent Orders: ${JSON.stringify(poContext.recentOrders || [])}
Current Inventory: ${JSON.stringify(poContext.inventory || [])}

Return as JSON with "suggestedItems" and "suggestedSuppliers" arrays.`;

    const response = await this.generateText({
      prompt,
      feature: 'po',
    });

    try {
      return JSON.parse(response);
    } catch {
      return {
        suggestedItems: [],
        suggestedSuppliers: [],
      };
    }
  }

  async generateInvoiceNotes(invoiceData: {
    customer: string;
    items: Array<{ description: string; quantity: number; price: number }>;
    total: number;
  }): Promise<string> {
    const prompt = `Generate professional invoice notes for:
Customer: ${invoiceData.customer}
Items: ${JSON.stringify(invoiceData.items)}
Total: $${invoiceData.total}

Generate 2-3 sentences of professional notes.`;

    return this.generateText({
      prompt,
      feature: 'invoicing',
    });
  }

  async analyzePhoneCall(transcript: string): Promise<{
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    actionItems: string[];
  }> {
    const prompt = `Analyze this phone call transcript:
${transcript}

Extract:
1. A brief summary (2-3 sentences)
2. Sentiment (positive, neutral, or negative)
3. Action items (as array)

Return as JSON.`;

    const response = await this.generateText({
      prompt,
      feature: 'phone',
    });

    try {
      return JSON.parse(response);
    } catch {
      return {
        summary: response,
        sentiment: 'neutral' as const,
        actionItems: [],
      };
    }
  }

  async suggestProposal(input: {
    square_footage: number;
    flooring_breakdown?: Array<{ type: string; sqft: number }>;
    cleaning_frequency?: string;
    restrooms?: number;
    notes?: string;
  }): Promise<{
    suggested_crew_size: number;
    estimated_hours_per_visit: number;
    cleaning_speed_sqft_per_hour: number;
    notes: string;
    labor_estimate?: number;
  }> {
    const prompt = `You are a janitorial bidding expert. Given:
- Square footage: ${input.square_footage} sq ft
- Flooring breakdown: ${JSON.stringify(input.flooring_breakdown || [])}
- Cleaning frequency: ${input.cleaning_frequency || 'Not specified'}
- Restrooms: ${input.restrooms ?? 'Not specified'}
- Notes: ${input.notes || 'None'}

Suggest:
1. suggested_crew_size: number of people needed per visit (integer)
2. estimated_hours_per_visit: total hours per cleaning visit (number)
3. cleaning_speed_sqft_per_hour: effective sq ft per hour for labor (number)
4. notes: brief recommendation (string)
5. labor_estimate: optional monthly labor cost if hourly rate is $25 (number)

Return valid JSON only, no markdown.`;

    const response = await this.generateText({
      prompt,
      feature: 'proposal',
    });

    try {
      const parsed = JSON.parse(response.replace(/^```\w*\n?|\n?```$/g, '').trim());
      return {
        suggested_crew_size: parsed.suggested_crew_size ?? 1,
        estimated_hours_per_visit: parsed.estimated_hours_per_visit ?? 0,
        cleaning_speed_sqft_per_hour: parsed.cleaning_speed_sqft_per_hour ?? 0,
        notes: parsed.notes ?? '',
        labor_estimate: parsed.labor_estimate,
      };
    } catch {
      return {
        suggested_crew_size: 1,
        estimated_hours_per_visit: 0,
        cleaning_speed_sqft_per_hour: 0,
        notes: response || 'AI suggestion unavailable.',
      };
    }
  }

  /** Extract structured scope (rooms, sqft, surfaces) from a walk-through transcript. */
  async extractScopeFromTranscript(transcriptText: string): Promise<{
    scope_json: Record<string, unknown>;
    confidence: number;
    missing_fields: string[];
  }> {
    const prompt = `Extract janitorial scope of work from this walk-through transcript.

Return valid JSON only (no markdown):
{
  "scope_json": {
    "rooms": [ { "name": "string", "sqft": number, "floor": "tile"|"carpet"|"hardwood"|"other", "notes": "string" } ],
    "total_sqft": number or null,
    "special_requirements": "string or null",
    "frequency": "string or null"
  },
  "confidence": number between 0 and 1,
  "missing_fields": ["list of required fields that could not be determined"]
}

Transcript:
${transcriptText.substring(0, 12000)}`;

    const response = await this.generateText({
      prompt,
      feature: 'general',
    });

    try {
      const raw = response.replace(/^```\w*\n?|\n?```$/g, '').trim();
      const parsed = JSON.parse(raw);
      return {
        scope_json: parsed.scope_json ?? { rooms: [], total_sqft: null, special_requirements: null, frequency: null },
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
        missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : [],
      };
    } catch {
      return {
        scope_json: { rooms: [], total_sqft: null, special_requirements: null, frequency: null },
        confidence: 0.5,
        missing_fields: ['structured extraction failed'],
      };
    }
  }

  /** Extract customer pain points / concerns from a walk-through transcript. */
  async extractPainPoints(transcriptText: string): Promise<{ pain_points: string[]; summary: string }> {
    const prompt = `From this janitorial walk-through transcript, extract:
1. Customer pain points or concerns (list as JSON array of strings)
2. A one-paragraph summary of what the customer cares about most

Return valid JSON only:
{ "pain_points": ["string", ...], "summary": "string" }

Transcript:
${transcriptText.substring(0, 8000)}`;

    const response = await this.generateText({
      prompt,
      feature: 'general',
    });

    try {
      const raw = response.replace(/^```\w*\n?|\n?```$/g, '').trim();
      const parsed = JSON.parse(raw);
      return {
        pain_points: Array.isArray(parsed.pain_points) ? parsed.pain_points : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      };
    } catch {
      return { pain_points: [], summary: '' };
    }
  }

  private getSystemPrompt(feature: string): string {
    const prompts: Record<string, string> = {
      compliance: 'You are a compliance expert helping janitorial businesses maintain regulatory compliance. Provide clear, actionable advice.',
      sds: 'You are a safety expert specializing in Safety Data Sheets. Extract and summarize key safety information accurately.',
      po: 'You are a procurement expert helping janitorial businesses optimize their supply orders. Provide practical recommendations.',
      invoicing: 'You are a professional business writer creating clear, professional invoice notes for janitorial services.',
      phone: 'You are a customer service analyst. Analyze phone calls and extract key information, sentiment, and action items.',
      proposal: 'You are a janitorial bidding expert. Suggest crew size, hours per visit, cleaning speeds (sq ft per hour), and labor estimates. Return only valid JSON.',
      general: 'You are Jani, the AI assistant for JANIBEAR—a janitorial quality inspection and operations platform. Help users clearly and concisely.',
    };

    return prompts[feature] || prompts.general;
  }

  private buildPrompt(prompt: string, context?: Record<string, any>): string {
    if (!context) return prompt;

    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    return `${prompt}\n\nContext:\n${contextStr}`;
  }
}

/**
 * Get AI service instance for an organization.
 * Uses org-level ai_config first; falls back to OPENAI_API_KEY env for testing.
 */
export async function getAIService(orgId: string): Promise<OpenAIService | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: config } = await supabase
      .from('ai_config')
      .select('*')
      .eq('org_id', orgId)
      .eq('feature', 'general')
      .eq('enabled', true)
      .single();

    if (config?.api_key_encrypted) {
      return new OpenAIService({
        apiKey: config.api_key_encrypted,
        model: config.model || 'gpt-4-turbo-preview',
        orgId,
      });
    }

    // Fallback: use env key so dev/single-tenant can test without ai_config
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey?.startsWith('sk-')) {
      return new OpenAIService({
        apiKey: envKey,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        orgId,
      });
    }

    return null;
  } catch (error) {
    console.error('Failed to get AI service:', error);
    return null;
  }
}
