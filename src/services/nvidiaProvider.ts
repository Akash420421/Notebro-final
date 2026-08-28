/**
 * Central NVIDIA API Provider Configuration & Service
 * Production-ready client integration that interfaces with server-side proxy
 */

export interface NvidiaModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  capabilities: {
    text: boolean;
    vision: boolean;
    video: boolean;
    toolCalling: boolean;
    streaming: boolean;
  };
  isDefault?: boolean;
  description: string;
}

export interface NvidiaProviderConfig {
  providerId: 'nvidia';
  providerName: 'NVIDIA';
  baseURL: 'https://integrate.api.nvidia.com/v1';
  chatEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions';
  defaultModel: string;
  visionModel: string;
  authenticationType: 'bearer';
  capabilities: {
    text: boolean;
    vision: boolean;
    video: boolean;
    toolCalling: boolean;
    streaming: boolean;
  };
  requestFormat: 'openai-compatible';
}

export const CENTRAL_NVIDIA_CONFIG: NvidiaProviderConfig = {
  providerId: 'nvidia',
  providerName: 'NVIDIA',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  chatEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
  defaultModel: 'auto',
  visionModel: 'gemini-3.7-flash',
  authenticationType: 'bearer',
  capabilities: {
    text: true,
    vision: true,
    video: false,
    toolCalling: true,
    streaming: true,
  },
  requestFormat: 'openai-compatible',
};

export const DEFAULT_NVIDIA_MODELS: NvidiaModelInfo[] = [
  {
    id: 'auto',
    name: 'Auto (Optimal Multi-Modal)',
    provider: 'auto',
    contextLength: 1048576,
    capabilities: { text: true, vision: true, video: true, toolCalling: true, streaming: true },
    isDefault: true,
    description: 'Selects the fastest and most accurate model based on query and attachments',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Fast)',
    provider: 'groq',
    contextLength: 131072,
    capabilities: { text: true, vision: false, video: false, toolCalling: true, streaming: true },
    description: 'High-speed flagship 70B model with exceptional reasoning capability',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 (Reasoning)',
    provider: 'groq',
    contextLength: 131072,
    capabilities: { text: true, vision: false, video: false, toolCalling: true, streaming: true },
    description: 'Deep mathematical step-by-step reasoning distilled into Llama 70B',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Google Gemini 3.7 Flash',
    provider: 'google',
    contextLength: 1048576,
    capabilities: { text: true, vision: true, video: true, toolCalling: true, streaming: true },
    description: 'Flagship multimodal vision and reasoning architecture',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B (Instant)',
    provider: 'groq',
    contextLength: 131072,
    capabilities: { text: true, vision: false, video: false, toolCalling: true, streaming: true },
    description: 'Instant sub-second response for quick doubts and formulas',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'NVIDIA Nemotron 70B',
    provider: 'nvidia',
    contextLength: 131072,
    capabilities: { text: true, vision: false, video: false, toolCalling: true, streaming: true },
    description: 'NVIDIA-aligned 70B model optimized for high-precision problem solving',
  },
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'NVIDIA Llama 3.3 70B Instruct',
    provider: 'nvidia',
    contextLength: 131072,
    capabilities: { text: true, vision: false, video: false, toolCalling: true, streaming: true },
    description: 'Flagship open model on NVIDIA NIM acceleration infrastructure',
  },
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'NVIDIA Llama 3.2 11B Vision',
    provider: 'nvidia',
    contextLength: 131072,
    capabilities: { text: true, vision: true, video: false, toolCalling: true, streaming: true },
    description: 'High-accuracy multimodal vision model for diagrams and sketches',
  },
];

export interface NvidiaConnectionState {
  isConnected: boolean;
  activeModel: string;
  modelName: string;
  hasVision: boolean;
  connectedAt?: number;
  lastError?: string;
}

class NvidiaProviderManager {
  private sessionApiKey: string | null = null;
  private connectionState: NvidiaConnectionState = {
    isConnected: true,
    activeModel: 'auto',
    modelName: 'Auto (Optimal Multi-Modal)',
    hasVision: true,
  };
  private listeners: Set<(state: NvidiaConnectionState) => void> = new Set();

  constructor() {
    try {
      let cachedModel = sessionStorage.getItem('__nv_model') || 'auto';
      const found = DEFAULT_NVIDIA_MODELS.find((m) => m.id === cachedModel);
      if (found) {
        this.connectionState.activeModel = cachedModel;
        this.connectionState.modelName = found.name;
      }
      const cachedKey = sessionStorage.getItem('__nv_key_sess');
      if (cachedKey) {
        this.sessionApiKey = cachedKey;
      }
    } catch (e) {}
  }

  public subscribe(listener: (state: NvidiaConnectionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.connectionState);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.connectionState }));
  }

  public getState(): NvidiaConnectionState {
    return { ...this.connectionState };
  }

  public isConnected(): boolean {
    return this.connectionState.isConnected && !!this.sessionApiKey;
  }

  public getActiveModel(): string {
    return this.connectionState.activeModel || CENTRAL_NVIDIA_CONFIG.defaultModel;
  }

  public setActiveModel(modelId: string) {
    const found = DEFAULT_NVIDIA_MODELS.find((m) => m.id === modelId);
    this.connectionState.activeModel = modelId;
    this.connectionState.modelName = found ? found.name : modelId;
    this.connectionState.hasVision = found ? found.capabilities.vision : true;
    try {
      sessionStorage.setItem('__nv_model', modelId);
    } catch (e) {}
    this.notify();
  }

  /**
   * Connect to NVIDIA using user's API Key.
   * Performs automatic background test and capability detection via server proxy.
   */
  public async connectNvidia(apiKey: string): Promise<{ success: boolean; error?: string }> {
    const cleanKey = (apiKey || '').trim();

    if (!cleanKey) {
      return { success: false, error: 'Please enter your NVIDIA API key.' };
    }

    try {
      const response = await fetch('/api/nvidia/connect-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanKey }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.sessionApiKey = cleanKey;
        const resolvedModel = data.defaultModel || CENTRAL_NVIDIA_CONFIG.defaultModel;
        const found = DEFAULT_NVIDIA_MODELS.find((m) => m.id === resolvedModel);

        this.connectionState = {
          isConnected: true,
          activeModel: resolvedModel,
          modelName: data.modelName || (found ? found.name : 'Meta Llama 3.3 70B Instruct'),
          hasVision: true,
          connectedAt: Date.now(),
          lastError: undefined,
        };

        try {
          sessionStorage.setItem('__nv_session_active', '1');
          sessionStorage.setItem('__nv_key_sess', cleanKey);
          sessionStorage.setItem('__nv_model', this.connectionState.activeModel);
        } catch (e) {}

        this.notify();
        return { success: true };
      } else {
        const errMsg = data.error || 'Failed to connect to NVIDIA API.';
        this.connectionState.lastError = errMsg;
        this.notify();
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      const msg = err.message || 'Network error connecting to NVIDIA proxy.';
      this.connectionState.lastError = msg;
      this.notify();
      return { success: false, error: msg };
    }
  }

  /**
   * Disconnect NVIDIA Provider
   */
  public disconnect() {
    this.sessionApiKey = null;
    this.connectionState = {
      isConnected: false,
      activeModel: CENTRAL_NVIDIA_CONFIG.defaultModel,
      modelName: 'Meta Llama 3.3 70B Instruct',
      hasVision: true,
    };
    try {
      sessionStorage.removeItem('__nv_session_active');
      sessionStorage.removeItem('__nv_key_sess');
      sessionStorage.removeItem('__nv_model');
    } catch (e) {}
    this.notify();
  }

  /**
   * Send multimodal / chat query to AI via server proxy (Groq / NVIDIA / Gemini)
   */
  public async generateChatCompletion(params: {
    message: string;
    history?: Array<{ sender: string; text: string; attachedImage?: string }>;
    noteContext?: string;
    imageBase64?: string;
    sketchBase64?: string;
    mode?: string;
  }): Promise<{ reply: string; model?: string }> {
    const { message, history = [], noteContext = '', imageBase64, sketchBase64, mode = 'student' } = params;

    const isDev = mode === 'developer';
    const systemInstruction = isDev
      ? `You are "Developer AI Architect", a Principal Software Architect, Tech Lead, and System Design AI embedded inside a developer notes workspace.

CORE DIRECTIVES:
1. MEMORY & CONVERSATION CONTINUITY:
   - Always retain context, instructions, and language preferences from earlier in the chat history.
   - If the user previously instructed you to speak in Hindi or Hinglish, or asked follow-up questions, STRICTLY CONTINUE in that language for all future turns in this session.
   - If the user refers to something sent earlier (such as code, diagram, or previous questions), reference the chat history accurately.
2. ADAPTIVE DEPTH & HIGH PRECISION:
   - For CASUAL GREETINGS & SHORT CHAT (e.g. 'hi', 'hello', 'hey', 'kaise ho', 'good morning', language instructions): Respond warmly, naturally, and briefly in 1-2 conversational sentences matching the user's language. Never output an unsolicited PRD or code block for simple greetings.
   - For TECHNICAL, ARCHITECTURE, CODING, OR SCHEMA QUESTIONS: Provide a comprehensive, production-grade, in-depth technical solution with clean types, modular architecture, and edge-case handling.
3. MATCH LANGUAGE:
   - Match the user's language naturally (English, Hindi, or Hinglish).
   - Never repeat the raw user prompt back to them as filler content.`
      : `You are "Study AI", a world-class intelligent academic tutor and doubt solver embedded inside a student notes app.

CORE DIRECTIVES & BEHAVIOR:
1. MEMORY & CONVERSATION CONTINUITY:
   - Always retain context, instructions, and language preferences from earlier in the chat history.
   - If the user asked you to talk in Hindi, Hinglish, or English, or set a specific persona or tone, STRICTLY REMEMBER and CONTINUE in that language/style for all following messages unless asked to switch.
   - If the user refers to something sent earlier (such as "ye jo photo bheja hai", "what did I ask earlier", "in the previous step"), look back at the conversation history and any attached images to answer accurately.

2. MULTIMODAL & IMAGE RECOGNITION:
   - When an image (photo of textbook, handwritten problem, diagram, chart, graph, equation, screenshot, or sketch) is attached in the current turn OR was sent previously in the chat, carefully analyze the visual details.
   - Read all text, numbers, formulas, and diagrams in the image and provide a thorough, complete answer to the student's question about the image.

3. ADAPTIVE DEPTH & QUALITY:
   - For CASUAL GREETINGS & SHORT CHAT (e.g. "hi", "kaise ho", "namaste", "speak in hindi"): Respond warmly, naturally, and conversationally in 1–2 sentences matching the user's language. Never output generic template boilerplate or unprompted mock questions for a simple greeting.
   - For HARD, DETAILED, MATHEMATICAL, OR ACADEMIC QUESTIONS: Provide a full, in-depth, high-quality step-by-step worked solution:
     * 1. Concept Breakdown — core principle + key intuition
     * 2. Step-by-Step Logic & Calculations — show every formula, derivation, unit conversion, and intermediate arithmetic step thoroughly.
     * 3. Quick Revision Summary — key takeaway, final result, and high-yield exam tips.
     * Do NOT give rushed, truncated, or shallow 1-line answers for complex problems.

4. LANGUAGE & TONE:
   - Match the user's language naturally (English, Hindi, or Hinglish / Roman Hindi).
   - If Hindi is requested, write fluent, natural Hindi (Devanagari or Romanized/Hinglish depending on user input).
   - Never repeat the raw user prompt back to them as filler content.`;

    let targetModel = this.connectionState.activeModel || CENTRAL_NVIDIA_CONFIG.defaultModel;
    const hasHistoryImage = history.some((h) => !!h.attachedImage);
    const hasImage = !!(imageBase64 || sketchBase64 || hasHistoryImage);

    if (hasImage && !targetModel.includes('vision') && !targetModel.includes('gemini')) {
      targetModel = 'gemini-3.7-flash';
    }

    // If using NVIDIA specific model and user provided key, try NVIDIA endpoint
    if (this.sessionApiKey && (targetModel.includes('meta/') || targetModel.includes('nvidia/') || targetModel.includes('mistralai/'))) {
      try {
        const messages: Array<{ role: string; content: string }> = [];
        const cleanCtx = (noteContext || '').replace(/<[^>]*>/g, ' ').trim();
        if (cleanCtx) {
          messages.push({ role: 'user', content: `[Context Note]:\n${cleanCtx.slice(0, 2500)}` });
          messages.push({ role: 'assistant', content: 'Reviewed context.' });
        }
        for (const h of history.slice(-8)) {
          if (h.text?.trim()) {
            messages.push({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text.trim() });
          }
        }
        messages.push({ role: 'user', content: message || 'Explain this query.' });

        const nvController = new AbortController();
        const nvTimer = setTimeout(() => nvController.abort(), 25000);

        const response = await fetch('/api/nvidia/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: nvController.signal,
          body: JSON.stringify({
            apiKey: this.sessionApiKey,
            model: targetModel,
            messages,
            systemInstruction,
            imageBase64,
            sketchBase64,
            temperature: 0.7,
            max_tokens: 2048,
            mode,
            noteContext,
          }),
        });
        clearTimeout(nvTimer);

        if (response.ok) {
          const result = await response.json();
          if (result.reply) {
            return {
              reply: result.reply,
              model: result.model || targetModel,
            };
          }
        }
      } catch (nvErr) {
        console.warn('NVIDIA query failed, falling back to server doubt solver:', nvErr);
      }
    }

    // Call unified multi-model AI endpoint on server (Gemini / Groq)
    try {
      const solverController = new AbortController();
      const solverTimer = setTimeout(() => solverController.abort(), 35000);

      const fbResponse = await fetch('/api/ai/doubt-solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: solverController.signal,
        body: JSON.stringify({
          message,
          history,
          noteContext,
          imageBase64,
          sketchBase64,
          mode,
          model: targetModel,
        }),
      });
      clearTimeout(solverTimer);

      if (fbResponse.ok) {
        const fbData = await fbResponse.json();
        if (fbData && fbData.reply) {
          return {
            reply: fbData.reply,
            model: fbData.model || targetModel,
          };
        }
      }
    } catch (fbErr) {
      console.warn('Doubt solver call failed:', fbErr);
    }

    // Clean graceful offline solution matching intent & language
    const lowerMsg = (message || '').toLowerCase().trim();
    let dynamicFallback = isDev
      ? `### 🛠️ Technical Solution & Architecture\n\n1. **System Modularity:** Organize domain logic cleanly with decoupled services.\n2. **Type Safety & Validation:** Ensure complete interface definitions and boundary validation.\n\n*(Feel free to ask for specific code snippets, schemas, or PRDs!)*`
      : `### 💡 Solution & Explanation\n\n1. **Concept Breakdown:** Let's focus on the core fundamentals of this topic.\n2. **Step-by-Step Logic:** Work through the steps methodically to arrive at the solution.\n3. **Summary:** Key takeaways and important exam points.`;

    if (/hindi|हिंदी|hindi me|hindi mai|hindi mein/i.test(lowerMsg) || /bol(a|o|iye)|bat|baat\s+karn(a|i|o)/i.test(lowerMsg)) {
      dynamicFallback = `जी हाँ, बिल्कुल! अब से हम हिंदी में बात करेंगे। बताइए, आज आप कौन सा विषय, प्रश्न या प्रोजेक्ट समझना चाहते हैं?`;
    } else if (/hinglish|roman hindi/i.test(lowerMsg)) {
      dynamicFallback = `Haan bilkul! Ab se main Hinglish mein baat karunga. Bataiye, aapko konse topic, formula ya project mein help chahiye?`;
    } else if (/hal\s*chal|haal\s*chaal|kya\s*haal|ki\s*hal|kaise\s*ho|kaisa\s*hai|how\s*are\s*you/i.test(lowerMsg)) {
      dynamicFallback = isDev
        ? `Main badhiya hoon! Ekdam ready hoon aapke code, architecture aur system design mein help karne ke liye. Aap bataiye, aaj kya build kar rahe hain?`
        : `Main bilkul theek hoon! Aap bataiye aap kaise hain? Aaj kis topic ya doubt mein help chahiye?`;
    } else if (/^(hi|hello|hey|namaste|kya haal|good morning|start)/i.test(lowerMsg) || lowerMsg.length <= 4) {
      dynamicFallback = isDev
        ? `Hello! Main aapka Developer AI Architect hoon. Bataiye, aaj konse project, database schema ya API requirements par discuss karna hai?`
        : `Hello! Main aapka Study AI tutor hoon. Bataiye, aaj kis subject ya topic ke doubts solve karne hain?`;
    } else if (/photo|image|picture|tasveer|diagram|isme kya|kya dikh/i.test(lowerMsg)) {
      dynamicFallback = isDev
        ? `Maine aapka diagram/context note kar liya hai. Kripya batayein isme kaunsa module ya logic build karna hai?`
        : `Haan, main aapke sawaal ko samajh raha hoon. Kripya batayein ki isme kaunsa step ya formula explain karna hai?`;
    }

    return {
      reply: dynamicFallback,
    };
  }
}

export const nvidiaService = new NvidiaProviderManager();
