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
  feature: 'compliance' | 'sds' | 'po' | 'invoicing' | 'phone' | 'general';
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

  private getSystemPrompt(feature: string): string {
    const prompts: Record<string, string> = {
      compliance: 'You are a compliance expert helping janitorial businesses maintain regulatory compliance. Provide clear, actionable advice.',
      sds: 'You are a safety expert specializing in Safety Data Sheets. Extract and summarize key safety information accurately.',
      po: 'You are a procurement expert helping janitorial businesses optimize their supply orders. Provide practical recommendations.',
      invoicing: 'You are a professional business writer creating clear, professional invoice notes for janitorial services.',
      phone: 'You are a customer service analyst. Analyze phone calls and extract key information, sentiment, and action items.',
      general: 'You are a helpful AI assistant for a janitorial quality inspection SaaS platform.',
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
 * Get AI service instance for an organization
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

    if (!config || !config.api_key_encrypted) {
      return null;
    }

    // In production, decrypt the API key
    // For now, assuming it's stored (should be encrypted)
    const apiKey = config.api_key_encrypted;

    return new OpenAIService({
      apiKey,
      model: config.model || 'gpt-4-turbo-preview',
      orgId,
    });
  } catch (error) {
    console.error('Failed to get AI service:', error);
    return null;
  }
}
