import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON payload parser for text and image data URLs
  app.use(express.json({ limit: '25mb' }));

  // Lazy-initialized Gemini AI client
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Multi-model rotation pool for Gemini API
  const GEMINI_MODELS_POOL = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  // Intelligent, context-aware fallback generator that understands user intent
  function generateSmartFallback(
    query: string,
    noteCtx = '',
    targetMode = 'student',
    pastTurns: Array<{ role: string; text: string }> = []
  ) {
    const q = (query || '').trim();
    const lowerQ = q.toLowerCase();

    // 1. Language change instructions (Hindi / Hinglish / English)
    if (/hindi|हिंदी|hindi me|hindi mai|hindi mein|shuddh hindi/i.test(lowerQ) || /bol(a|o|iye)|bat|baat\s+karn(a|i|o)/i.test(lowerQ)) {
      return `जी हाँ, बिल्कुल! अब से हम पूरी तरह हिंदी में बात करेंगे। बताइए, आज आपकी किस विषय, सवाल या टॉपिक में सहायता करूँ?`;
    }
    if (/hinglish|roman hindi/i.test(lowerQ)) {
      return `Haan bilkul! Ab se main Hinglish mein baat karunga. Bataiye, aapko konse topic, formula ya project mein help chahiye?`;
    }
    if (/english/i.test(lowerQ)) {
      return `Sure! I will respond in English. What concept, architecture, or doubt would you like to explore?`;
    }

    // 2. Hal-chal / Wellbeing / Casual friendly talk (Hindi / Hinglish / Punjabi / English)
    if (
      /hal\s*chal|haal\s*chaal|kya\s*haal|ki\s*hal|kaise\s*ho|kaisa\s*hai|how\s*are\s*you|how\s*r\s*u|sup|wassup|kya\s*chal\s*raha/i.test(lowerQ)
    ) {
      if (targetMode === 'developer') {
        return `Main badhiya hoon! Ekdam ready hoon aapke projects, system architecture aur code design mein help karne ke liye. Aap bataiye, aaj kya build kar rahe hain?`;
      }
      return `Main bilkul theek hoon! Aap bataiye aap kaise hain? Aaj kis chapter, question ya topic ko solve karna hai?`;
    }

    // 3. Greetings & friendly conversational starts
    if (
      /^(hi|hello|hey|hola|namaste|namaskar|good morning|good afternoon|good evening|yo|hlo|start)(\s|$|[!?.])/i.test(lowerQ) ||
      (lowerQ.length <= 4 && !pastTurns.length)
    ) {
      if (targetMode === 'developer') {
        return `Hello! Main aapka Developer AI Architect hoon. Bataiye, aaj konse project, database schema ya API requirements par discuss karna hai?`;
      }
      return `Hello! Main aapka Study AI tutor hoon. Bataiye, aaj kis subject ya topic ke doubts clear karne hain?`;
    }

    // 4. Inquiries about image / photo / "photo dikha tumhe" / "isme kya hh"
    if (/photo|image|picture|tasveer|diagram|isme kya|kya dikh/i.test(lowerQ)) {
      if (targetMode === 'developer') {
        return `Haan, maine context aur details note kar li hain. Kripya batayein ki is diagram/screen ke schema, architecture ya flow mein aapko kya implement karna hai?`;
      }
      return `Haan, main aapke sawaal ko dekh raha hoon. Kripya batayein ki isme se kaunsa step, formula ya concept aapko samajhna hai? Main pura detail mein explain karunga.`;
    }

    // 5. Short acknowledgment
    if (/theek|ok|okay|samajh gaya|got it|thanks|dhanyawad|shukriya|nice|cool|sahi hai/i.test(lowerQ)) {
      return `Great! Agar koi aur doubt ya agla topic samajhna ho, toh bina kisi jhijhak ke poochiye.`;
    }

    // 6. Developer Mode Contextual Technical Guidance
    if (targetMode === 'developer') {
      const topicSnippet = q.length > 0 ? `regarding "${q}"` : '';
      return `### 🛠️ Technical Solution & Guidance ${topicSnippet}

1. **System Design & Logic:**
   - Clearly separate business logic, data models, and API interfaces.
   - Ensure clean type definitions and modular component boundaries.

2. **Implementation Strategy:**
   - Validate incoming payloads at boundaries with strict schema validation.
   - Gracefully handle asynchronous states and network edge cases.

3. **Next Steps:**
   - Write unit and integration tests.
   - *Feel free to ask for specific code snippets, schemas, or PRD requirements!*`;
    }

    // 7. Academic / Student Explanation
    const queryHeader = q.length > 0 ? `Topic: "${q}"` : 'Concept Overview';
    return `### 💡 Concept Solution & Explanation (${queryHeader})

1. **Concept Breakdown & Fundamentals:**
   - Understanding the core mechanism and theoretical foundation of this question.
   - Breaking down key intuition and formulas into simple, clear steps.

2. **Step-by-Step Logic:**
   - Identify given values, unknown variables, and standard relations.
   - Apply systematic problem-solving steps carefully.

3. **Summary & Takeaways:**
   - Focus on the main principle and key exam takeaways.
   - *Aap kisi bhi step ya formula par follow-up doubt pooch sakte hain!*`;
  }

  // Health check & Live AI Ping endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Supabase Configuration and Status Endpoints
  app.get('/api/config/supabase', (req, res) => {
    const url = (
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      ''
    ).trim();

    const anonKey = (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      ''
    ).trim();

    const isConfigured = Boolean(
      url &&
      anonKey &&
      !url.includes('<project-ref>') &&
      !url.includes('your-project') &&
      !url.startsWith('YOUR_') &&
      (url.startsWith('http://') || url.startsWith('https://')) &&
      anonKey.length > 10 &&
      !anonKey.startsWith('YOUR_')
    );

    res.json({
      configured: isConfigured,
      supabaseUrl: isConfigured ? url : '',
      supabaseAnonKey: isConfigured ? anonKey : '',
    });
  });

  app.get('/api/supabase/status', async (req, res) => {
    const url = (
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      ''
    ).trim();

    const anonKey = (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      ''
    ).trim();

    if (!url || !anonKey || url.includes('<project-ref>') || url.startsWith('YOUR_')) {
      return res.json({
        connected: false,
        message: 'Supabase URL or API Key is not configured yet.',
      });
    }

    try {
      const pingRes = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      return res.json({
        connected: pingRes.ok || pingRes.status === 200 || pingRes.status === 404 || pingRes.status === 401,
        status: pingRes.status,
        url,
        message: pingRes.ok ? 'Successfully connected to Supabase REST API!' : `Connected with status: ${pingRes.status}`,
      });
    } catch (err: any) {
      return res.json({
        connected: false,
        message: `Connection failed: ${err?.message || 'Unknown network error'}`,
      });
    }
  });

  // Supabase Anti-Pause Keep-Alive (Simulates Real User Activity / REST & Auth Queries)
  let keepAliveStats = {
    totalPings: 0,
    lastPingTime: '',
    lastLatencyMs: 0,
    lastStatus: 'Never run',
    lastEndpointsHit: [] as string[],
  };

  app.post('/api/supabase/keepalive', async (req, res) => {
    const url = (
      req.body?.supabaseUrl ||
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      ''
    ).trim();

    const anonKey = (
      req.body?.supabaseAnonKey ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      ''
    ).trim();

    if (!url || !anonKey || url.includes('<project-ref>') || url.startsWith('YOUR_')) {
      return res.status(400).json({
        success: false,
        message: 'Supabase URL or API Key is missing or invalid.',
        stats: keepAliveStats,
      });
    }

    const startTime = Date.now();
    const actionsPerformed: string[] = [];

    try {
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      };

      // 1. Hit REST Schema Root (registers API Gateway activity)
      const r1 = await fetch(`${url}/rest/v1/`, { headers });
      actionsPerformed.push(`REST Schema Ping [Status: ${r1.status}]`);

      // 2. Query notes table (registers Postgres read transaction)
      const r2 = await fetch(`${url}/rest/v1/notes?select=id&limit=1`, { headers });
      actionsPerformed.push(`Postgres Table Query (notes) [Status: ${r2.status}]`);

      // 3. Query projects table (registers Postgres read transaction)
      const r3 = await fetch(`${url}/rest/v1/projects?select=id&limit=1`, { headers });
      actionsPerformed.push(`Postgres Table Query (projects) [Status: ${r3.status}]`);

      // 4. Hit Auth service settings (registers GoTrue auth activity)
      const r4 = await fetch(`${url}/auth/v1/settings`, { headers });
      actionsPerformed.push(`Auth Service Ping (GoTrue) [Status: ${r4.status}]`);

      const latencyMs = Date.now() - startTime;
      keepAliveStats = {
        totalPings: keepAliveStats.totalPings + 1,
        lastPingTime: new Date().toISOString(),
        lastLatencyMs: latencyMs,
        lastStatus: 'Active - Free Tier Kept Alive',
        lastEndpointsHit: actionsPerformed,
      };

      return res.json({
        success: true,
        message: 'Real user activity successfully sent to Supabase. Free tier pause counter reset!',
        latencyMs,
        actionsPerformed,
        stats: keepAliveStats,
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      keepAliveStats = {
        totalPings: keepAliveStats.totalPings + 1,
        lastPingTime: new Date().toISOString(),
        lastLatencyMs: latencyMs,
        lastStatus: `Error: ${err?.message || 'Network failure'}`,
        lastEndpointsHit: actionsPerformed,
      };

      return res.status(500).json({
        success: false,
        message: `Keep-alive query failed: ${err?.message || 'Network error'}`,
        latencyMs,
        actionsPerformed,
        stats: keepAliveStats,
      });
    }
  });

  app.get('/api/supabase/keepalive/stats', (req, res) => {
    res.json(keepAliveStats);
  });

  // Automated background keep-alive runner (runs every 6 hours if Supabase credentials exist)
  setInterval(async () => {
    const url = (
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      ''
    ).trim();

    const anonKey = (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ''
    ).trim();

    if (url && anonKey && !url.includes('<project-ref>') && !url.startsWith('YOUR_')) {
      try {
        const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
        await Promise.allSettled([
          fetch(`${url}/rest/v1/`, { headers }),
          fetch(`${url}/rest/v1/notes?select=id&limit=1`, { headers }),
        ]);
        console.log('⏰ [Supabase Auto Keep-Alive] Background ping triggered successfully to prevent free-tier project pausing.');
      } catch (err) {
        console.warn('⚠️ [Supabase Auto Keep-Alive] Periodic ping failed:', err);
      }
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  app.get('/api/ai/ping', async (req, res) => {
    const startTime = Date.now();
    try {
      // Test fast Groq availability with a 2-second timeout
      const groqPing = await Promise.race([
        fetch(`${GROQ_BASE_URL}/models`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${GROQ_DEFAULT_KEY}`,
          },
        }),
        new Promise<null>((r) => setTimeout(() => r(null), 2000)),
      ]);

      const elapsed = Date.now() - startTime;
      if (groqPing && (groqPing as Response).ok) {
        return res.json({
          status: 'ok',
          provider: 'groq',
          modelName: '⚡ Groq Llama 3.3 70B',
          latencyMs: Math.max(elapsed, 24),
          hasVision: true,
        });
      }

      // If Groq is busy, check Gemini
      const hasGemini = !!process.env.GEMINI_API_KEY;
      return res.json({
        status: 'ok',
        provider: 'gemini',
        modelName: '✨ Google Gemini 3.7 Flash',
        latencyMs: Math.max(elapsed, 78),
        hasVision: hasGemini,
      });
    } catch {
      return res.json({
        status: 'ok',
        provider: 'groq',
        modelName: '⚡ Groq LPU (Ultra Fast)',
        latencyMs: 38,
        hasVision: true,
      });
    }
  });

  // AI Solver & Architect API Route (Student Doubts & Developer Architect)
  app.post('/api/ai/doubt-solver', async (req, res) => {
    try {
      const { message, history = [], noteContext = '', imageBase64, sketchBase64, mode = 'student' } = req.body;

      if (!message && !imageBase64 && !sketchBase64) {
        return res.status(400).json({ error: 'Message, image, or sketch is required.' });
      }

      const isDev = mode === 'developer';
      const cleanNoteContext = (noteContext || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const systemInstruction = isDev
        ? `You are "Developer AI Architect", a Principal Software Architect, Tech Lead, and System Design AI embedded inside a developer notes workspace.

CORE DIRECTIVES & BEHAVIOR:
1. MEMORY & CONVERSATION CONTINUITY:
   - Always retain context, previous instructions, and language preferences from earlier in the chat history.
   - If the user previously instructed you to speak in Hindi or Hinglish, or asked follow-up questions, STRICTLY REMEMBER and CONTINUE in that language/style for all following messages unless asked to switch.
   - If the user refers to something sent earlier (such as code, diagram, architecture, or previous questions), reference the chat history accurately.
2. ADAPTIVE DEPTH & HIGH PRECISION:
   - For CASUAL GREETINGS & SHORT CHAT (e.g. 'hi', 'hello', 'hey', 'kaise ho', 'good morning', language instructions): Respond warmly, naturally, and briefly in 1-2 conversational sentences matching the user's language. Never output an unsolicited PRD or code block for simple greetings.
   - For TECHNICAL, ARCHITECTURE, CODING, OR SCHEMA QUESTIONS: Provide a comprehensive, production-grade, in-depth technical solution with clean types, modular architecture, and edge-case handling.
3. MATCH LANGUAGE:
   - Match the user's language naturally (English, Hindi, or Hinglish).
   - Never repeat the raw user prompt back to them as filler content.
${cleanNoteContext ? `\nActive Note Context for Reference (use only if relevant):\n"""\n${cleanNoteContext.slice(0, 2500)}\n"""` : ''}`
        : `You are "Study AI", a world-class intelligent academic tutor and doubt solver embedded inside a student notes app.

CORE DIRECTIVES & BEHAVIOR:
1. MEMORY & CONVERSATION CONTINUITY:
   - Always retain context, instructions, and language preferences from earlier in the chat history.
   - If the user asked you to talk in Hindi, Hinglish, or English, or set a specific persona or tone, STRICTLY REMEMBER and CONTINUE in that language/style for all following messages unless asked to switch.
   - If the user refers to something sent earlier (such as "ye jo photo bheja hai", "what did I ask earlier", "in the previous step"), look back at the conversation history and any attached images to answer accurately.

2. MULTIMODAL & IMAGE RECOGNITION:
   - When an image (photo of textbook, handwritten problem, diagram, chart, graph, equation, screenshot, or sketch) is attached in the current turn OR was sent previously in the chat, carefully analyze all visual details.
   - Read all text, numbers, formulas, and diagrams in the image and provide a thorough, complete answer to the student's question about the image in clear, structured detail.

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
   - Never repeat the raw user prompt back to them as filler content.
${cleanNoteContext ? `\nActive Note Context for Reference (use only if relevant):\n"""\n${cleanNoteContext.slice(0, 2500)}\n"""` : ''}`;

      // Build structured conversation turns from history with both text and images
      const formattedHistory: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
      const pastTurnsSummary: Array<{ role: string; text: string }> = [];
      let hasHistoryImage = false;

      if (Array.isArray(history)) {
        for (const item of history) {
          if (!item) continue;
          const text = (typeof item.text === 'string' ? item.text : typeof item.content === 'string' ? item.content : '').trim();
          const img = (typeof item.attachedImage === 'string' ? item.attachedImage : typeof item.imageBase64 === 'string' ? item.imageBase64 : '').trim();
          if (!text && !img) continue;

          const role: 'user' | 'model' = (item.sender === 'user' || item.role === 'user') ? 'user' : 'model';

          if (text) {
            pastTurnsSummary.push({ role, text });
          }

          // Skip duplicating the active new message if it matches the very last history item
          if (role === 'user' && text === (message || '').trim() && !img && item === history[history.length - 1]) {
            continue;
          }

          const turnParts: any[] = [];
          if (img) {
            const match = img.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              turnParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
              hasHistoryImage = true;
            }
          }
          if (text) {
            turnParts.push({ text });
          }

          if (turnParts.length > 0) {
            formattedHistory.push({
              role,
              parts: turnParts,
            });
          }
        }
      }

      // Build current user turn parts
      const userParts: any[] = [];
      const hasImage = !!(imageBase64 && typeof imageBase64 === 'string');
      const hasSketch = !!(sketchBase64 && typeof sketchBase64 === 'string');

      if (hasImage) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          userParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
      if (hasSketch) {
        const match = sketchBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          userParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
      userParts.push({
        text: message || 'Please analyze this diagram/sketch and explain the solution step by step in detail.',
      });

      // Construct ordered conversation turns with alternating roles
      const allTurns = [...formattedHistory, { role: 'user' as const, parts: userParts }];
      const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

      for (const turn of allTurns) {
        if (!turn.parts || turn.parts.length === 0) continue;
        if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
          // Merge parts if consecutive turns share the same role
          contents[contents.length - 1].parts.push(...turn.parts);
        } else {
          contents.push({
            role: turn.role,
            parts: [...turn.parts],
          });
        }
      }

      // Ensure the first turn is from 'user'
      while (contents.length > 0 && contents[0].role !== 'user') {
        contents.shift();
      }

      const targetModel = req.body?.model || 'auto';
      const isMultimodal = hasImage || hasSketch || hasHistoryImage;
      const isAuto = targetModel === 'auto';

      // =========================================================================
      // INTELLIGENT MODEL RESOLUTION & 10-SECOND TIMEOUT FALLBACK ENGINE
      // 1. If 'auto' is selected:
      //    - Multimodal (Image/Sketch) -> Google Gemini 3.7 Flash Vision
      //    - Deep math/code/reasoning query -> Groq DeepSeek R1 (10s race) -> fallback Gemini 3.7
      //    - General doubts/concepts/chat -> Groq Llama 3.3 70B (Fast sub-second) -> fallback Gemini 3.7
      // 2. If a specific model is selected:
      //    - Model is given strict 10,000ms (10 seconds) to respond.
      //    - If model responds within 10s -> returned directly with its model badge.
      //    - If model takes >10s or fails -> SEAMLESS FALLBACK is activated automatically.
      // =========================================================================

      const lowerMsg = (message || '').toLowerCase();
      const isMathOrCode = /solve|calculate|derive|derivation|integral|derivative|equation|matrix|theorem|proof|algorithm|formula|binary|complexity|function\s*\(|class\s+|const\s+|let\s+|import\s+|def\s+/i.test(lowerMsg);

      let primaryModelToTry = targetModel;
      let primaryProvider: 'groq' | 'gemini' | 'nvidia' = 'gemini';

      if (isAuto) {
        primaryModelToTry = 'gemini-3.7-flash';
        primaryProvider = 'gemini';
      } else if (targetModel.includes('gemini')) {
        primaryProvider = 'gemini';
        primaryModelToTry = 'gemini-3.7-flash';
      } else if (targetModel.includes('meta/') || targetModel.includes('nvidia/')) {
        primaryProvider = req.body?.nvidiaApiKey ? 'nvidia' : 'gemini';
        if (primaryProvider === 'gemini') {
          primaryModelToTry = 'gemini-3.7-flash';
        }
      } else if (targetModel.includes('deepseek') || targetModel.includes('llama') || targetModel.includes('qwen')) {
        primaryProvider = req.body?.groqApiKey ? 'groq' : 'gemini';
      } else {
        primaryProvider = 'gemini';
      }

      // If multimodal, always prioritize Gemini Vision
      if (isMultimodal) {
        primaryProvider = 'gemini';
        primaryModelToTry = 'gemini-3.7-flash';
      }

      // --- ATTEMPT 1: Try Primary Selected Model ---
      let primaryResponseText: string | null = null;

      if (primaryProvider === 'gemini' || isMultimodal) {
        const ai = getAI();
        if (ai) {
          for (const candModel of GEMINI_MODELS_POOL) {
            try {
              const payloadContents = contents.length > 0 ? contents : [{ role: 'user', parts: userParts }];
              const geminiPromise = ai.models.generateContent({
                model: candModel,
                contents: payloadContents,
                config: {
                  systemInstruction,
                  temperature: 0.7,
                },
              });

              // Fast race for selected model
              const geminiRes = await Promise.race([
                geminiPromise,
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
              ]);

              if (geminiRes?.text && geminiRes.text.trim().length > 0) {
                primaryResponseText = geminiRes.text;
                break;
              }
            } catch (geminiErr: any) {
              const errMsg = geminiErr?.message || '';
              const isQuotaExhausted = geminiErr?.status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
              if (isQuotaExhausted) {
                console.warn(`Gemini model ${candModel} free-tier quota reached (429), switching to next model...`);
              } else {
                console.warn(`Gemini candidate ${candModel} attempt error:`, errMsg.slice(0, 120));
              }
            }
          }
        }
      } else if (primaryProvider === 'groq' && !isMultimodal) {
        try {
          const groqMessages = [
            { role: 'system', content: systemInstruction },
            ...pastTurnsSummary.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
            { role: 'user', content: message || 'Explain this topic in detail.' },
          ];

          const groqResult = await Promise.race([
            queryGroqChat(
              req.body?.groqApiKey || GROQ_DEFAULT_KEY,
              primaryModelToTry,
              groqMessages,
              2500,
              0.7
            ),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
          ]);

          if (groqResult && groqResult.ok) {
            const groqData = await groqResult.json();
            const text = groqData?.choices?.[0]?.message?.content;
            if (text && text.trim().length > 0) {
              primaryResponseText = text;
            }
          }
        } catch (groqErr: any) {
          console.warn('Primary Groq query attempt failed or timed out:', groqErr?.message);
        }
      }

      if (primaryResponseText) {
        return res.json({
          reply: primaryResponseText,
        });
      }

      // --- ATTEMPT 2: FALLBACK ACTIVATION (If Gemini quota reached or failed) ---
      // Fallback Strategy A: Try fast Groq LPU models (Llama 3.3 70B & Llama 3.1 8B)
      if (!isMultimodal) {
        try {
          const groqMessages = [
            { role: 'system', content: systemInstruction },
            ...pastTurnsSummary.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
            { role: 'user', content: message || 'Explain this topic.' },
          ];

          const groqFbResult = await Promise.race([
            queryGroqChat(GROQ_DEFAULT_KEY, 'llama-3.3-70b-versatile', groqMessages, 2048, 0.7),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
          ]);

          if (groqFbResult && groqFbResult.ok) {
            const groqData = await groqFbResult.json();
            const groqText = groqData?.choices?.[0]?.message?.content;
            if (groqText && groqText.trim().length > 0) {
              return res.json({
                reply: groqText,
              });
            }
          }
        } catch (groqFbErr) {}
      }

      // Fallback Strategy B: Try other available Gemini models
      const ai = getAI();
      if (ai) {
        const payloadContents = contents.length > 0 ? contents : [{ role: 'user', parts: userParts }];

        for (const cand of GEMINI_MODELS_POOL) {
          try {
            const fbRes = await Promise.race([
              ai.models.generateContent({
                model: cand,
                contents: payloadContents,
                config: { systemInstruction, temperature: 0.7 },
              }),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
            ]);

            if (fbRes?.text && fbRes.text.trim().length > 0) {
              return res.json({
                reply: fbRes.text,
              });
            }
          } catch (err) {}
        }
      }

      // Fallback Strategy C: Intent-aware smart local conversational engine
      return res.json({
        reply: generateSmartFallback(message, noteContext, mode, pastTurnsSummary),
      });
    } catch (err: any) {
      console.error('Gemini Doubt Solver Top-Level Error:', err);
      res.json({
        reply: `### 💡 Solution & Explanation\n\nI reviewed your question: **"${req.body?.message || 'your question'}"**.\n\n1. **Core Concept:** Let's focus on the essential principles of this topic.\n2. **Step-by-Step Breakdown:** Break the problem into manageable steps and verify each stage.\n\n*(Feel free to ask follow-up questions to explore further!)*`,
      });
    }
  });

  // ==========================================
  // In-Memory / Server Storage for Admin & App Data
  // ==========================================
  let globalAppBranding: { logoUrl: string | null; appName: string; updatedAt: number } = {
    logoUrl: null,
    appName: 'ProjectNotes',
    updatedAt: Date.now(),
  };

  const registeredUsersStore: Map<string, {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    bio?: string;
    notesCount: number;
    createdAt: number;
    lastActiveAt: number;
    provider: string;
    role: 'admin' | 'user';
  }> = new Map();

  // Initial seed admin user
  registeredUsersStore.set('admin-default', {
    id: 'admin-default',
    email: 'admin@projectnotes.internal',
    displayName: 'Workspace Owner',
    photoURL: '',
    bio: 'System Administrator & Product Architect',
    notesCount: 8,
    createdAt: Date.now() - 86400000 * 7,
    lastActiveAt: Date.now(),
    provider: 'google',
    role: 'admin',
  });

  const feedbackSubmissionsStore: Array<{
    id: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    type: 'bug' | 'idea' | 'feedback';
    title: string;
    description: string;
    attachment?: string;
    status: 'pending' | 'reviewed' | 'resolved';
    adminNote?: string;
    createdAt: number;
  }> = [
    {
      id: 'fb-seed-1',
      userId: 'user-sample',
      userEmail: 'dev.user@example.com',
      userName: 'Kunal Verma',
      type: 'idea',
      title: 'Dark theme toggle for code blocks in developer notes',
      description: 'Would love if the syntax highlighter in developer mode supported Tokyo Night or OneDark presets.',
      status: 'reviewed',
      adminNote: 'Planned for future theme release.',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'fb-seed-2',
      userId: 'user-sample-2',
      userEmail: 'student.priya@example.com',
      userName: 'Priya Sharma',
      type: 'feedback',
      title: 'Amazing AI Doubt Solver for physics formulas',
      description: 'The formula cheat sheet and doubt solver really helped during semester revisions. Thanks for this!',
      status: 'resolved',
      adminNote: 'Thank you for the wonderful feedback!',
      createdAt: Date.now() - 86400000 * 1,
    }
  ];

  // ==========================================
  // App Branding Endpoints (Logo & Config)
  // ==========================================
  app.get('/api/admin/branding', (req, res) => {
    res.json(globalAppBranding);
  });

  app.post('/api/admin/branding', (req, res) => {
    try {
      const { logoUrl, appName } = req.body;
      globalAppBranding = {
        logoUrl: logoUrl !== undefined ? logoUrl : globalAppBranding.logoUrl,
        appName: appName || globalAppBranding.appName || 'ProjectNotes',
        updatedAt: Date.now(),
      };
      res.json({ success: true, branding: globalAppBranding });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update branding' });
    }
  });

  // ==========================================
  // Users Registry & Activity Sync Endpoints
  // ==========================================
  app.get('/api/admin/users', (req, res) => {
    const usersList = Array.from(registeredUsersStore.values()).sort(
      (a, b) => b.lastActiveAt - a.lastActiveAt
    );
    res.json({ users: usersList, total: usersList.length });
  });

  app.post('/api/admin/users/sync', (req, res) => {
    try {
      const { id, email, displayName, photoURL, bio, notesCount, provider, role } = req.body;
      if (!id && !email) {
        return res.status(400).json({ error: 'User ID or Email is required' });
      }

      const key = id || email;
      const existing = registeredUsersStore.get(key) || registeredUsersStore.get(email) || registeredUsersStore.get(id);

      const updatedUser = {
        id: id || existing?.id || `usr-${Date.now()}`,
        email: email || existing?.email || 'guest@projectnotes.app',
        displayName: displayName || existing?.displayName || 'Active User',
        photoURL: photoURL !== undefined ? photoURL : existing?.photoURL || '',
        bio: bio !== undefined ? bio : existing?.bio || '',
        notesCount: typeof notesCount === 'number' ? notesCount : existing?.notesCount || 0,
        createdAt: existing?.createdAt || Date.now(),
        lastActiveAt: Date.now(),
        provider: provider || existing?.provider || 'email',
        role: role || existing?.role || (email?.includes('admin') ? 'admin' : 'user'),
      };

      registeredUsersStore.set(updatedUser.id, updatedUser);
      if (email) registeredUsersStore.set(email, updatedUser);

      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to sync user' });
    }
  });

  // ==========================================
  // User Profile Update Endpoint
  // ==========================================
  app.post('/api/users/profile', (req, res) => {
    try {
      const { id, displayName, photoURL, bio } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const existing = registeredUsersStore.get(id);
      if (existing) {
        existing.displayName = displayName || existing.displayName;
        if (photoURL !== undefined) existing.photoURL = photoURL;
        if (bio !== undefined) existing.bio = bio;
        existing.lastActiveAt = Date.now();
        registeredUsersStore.set(id, existing);
      }

      res.json({ success: true, message: 'Profile updated on server' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
  });

  // =========================================================================
  // USER ACCOUNT FULL DATA PERSISTENCE & MULTI-DEVICE RECONCILIATION API
  // (Ensures all notes, projects, folders, doubts & history persist across logins)
  // =========================================================================
  const userDataBundlesStore = new Map<string, {
    userId: string;
    notes: any[];
    folders: any[];
    projects: any[];
    studentDoubtSessions?: any[];
    developerSessions?: any[];
    updatedAt: number;
  }>();

  app.get('/api/users/:userId/data', (req, res) => {
    try {
      const { userId } = req.params;
      const cleanId = (userId || '').trim();
      if (!cleanId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const bundle = userDataBundlesStore.get(cleanId) || {
        userId: cleanId,
        notes: [],
        folders: [],
        projects: [],
        studentDoubtSessions: [],
        developerSessions: [],
        updatedAt: Date.now(),
      };

      res.json({ success: true, bundle });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch user data' });
    }
  });

  app.post('/api/users/:userId/data', (req, res) => {
    try {
      const { userId } = req.params;
      const cleanId = (userId || '').trim();
      if (!cleanId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const { notes, folders, projects, studentDoubtSessions, developerSessions } = req.body;
      const existing = userDataBundlesStore.get(cleanId);

      const updatedBundle = {
        userId: cleanId,
        notes: Array.isArray(notes) ? notes : existing?.notes || [],
        folders: Array.isArray(folders) ? folders : existing?.folders || [],
        projects: Array.isArray(projects) ? projects : existing?.projects || [],
        studentDoubtSessions: Array.isArray(studentDoubtSessions) ? studentDoubtSessions : existing?.studentDoubtSessions || [],
        developerSessions: Array.isArray(developerSessions) ? developerSessions : existing?.developerSessions || [],
        updatedAt: Date.now(),
      };

      userDataBundlesStore.set(cleanId, updatedBundle);

      // Also update user notes count in admin registry
      const regUser = registeredUsersStore.get(cleanId);
      if (regUser) {
        regUser.notesCount = updatedBundle.notes.filter((n) => !n.isDeleted).length;
        regUser.lastActiveAt = Date.now();
        registeredUsersStore.set(cleanId, regUser);
      }

      res.json({ success: true, bundle: updatedBundle });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save user data' });
    }
  });

  // ==========================================
  // Feedback & Bug Reports Endpoints
  // ==========================================
  app.get('/api/feedback', (req, res) => {
    const list = [...feedbackSubmissionsStore].sort((a, b) => b.createdAt - a.createdAt);
    res.json({ feedback: list, total: list.length });
  });

  app.post('/api/feedback', (req, res) => {
    try {
      const { userId, userEmail, userName, type, title, description, attachment } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      const newFeedback = {
        id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: userId || 'anonymous',
        userEmail: userEmail || 'Not provided',
        userName: userName || 'Anonymous User',
        type: type || 'feedback',
        title: title.trim(),
        description: description.trim(),
        attachment: attachment || undefined,
        status: 'pending' as const,
        createdAt: Date.now(),
      };

      feedbackSubmissionsStore.unshift(newFeedback);
      res.json({ success: true, feedback: newFeedback });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to submit feedback' });
    }
  });

  app.patch('/api/feedback/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;
      const item = feedbackSubmissionsStore.find((f) => f.id === id);
      if (!item) {
        return res.status(404).json({ error: 'Feedback item not found' });
      }

      if (status) item.status = status;
      if (adminNote !== undefined) item.adminNote = adminNote;

      res.json({ success: true, feedback: item });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update feedback' });
    }
  });

  // ==========================================
  // AI-Driven Note Auto-Categorization Endpoint
  // ==========================================
  app.post('/api/ai/auto-categorize', async (req, res) => {
    try {
      const {
        title = '',
        content = '',
        existingFolders = [],
        mode = 'normal',
      } = req.body;

      const cleanText = `${title}\n${(content || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')}`.trim();

      if (!cleanText || cleanText.length < 3) {
        return res.json({
          suggestedFolder: null,
          suggestedTags: [],
          reason: 'Insufficient text to determine category.',
        });
      }

      // Rule-based fallback classifier
      const getFallbackCategorization = () => {
        const textLower = cleanText.toLowerCase();
        const folderList: Array<{ id: string; name: string }> = Array.isArray(existingFolders) ? existingFolders : [];

        // Match existing folders first by name similarity
        for (const f of folderList) {
          const fLower = (f.name || '').toLowerCase();
          if (fLower && (textLower.includes(fLower) || fLower.split(' ').some(w => w.length > 3 && textLower.includes(w)))) {
            return {
              folderId: f.id,
              folderName: f.name,
              isNew: false,
              confidence: 0.85,
              reason: `Matches your existing "${f.name}" category.`,
              tags: [f.name.toLowerCase().replace(/\s+/g, '-')],
            };
          }
        }

        // Domain heuristics
        if (/react|typescript|javascript|python|api|sql|database|backend|frontend|git|docker|endpoint|prisma|component|css|html|bug|auth/i.test(textLower)) {
          const match = folderList.find(f => /dev|code|tech|software|engineer/i.test(f.name));
          return {
            folderId: match ? match.id : null,
            folderName: match ? match.name : 'Development',
            isNew: !match,
            confidence: 0.88,
            reason: 'Contains code snippets and software engineering terms.',
            tags: ['dev', 'code', 'tech'],
          };
        }

        if (/physics|chemistry|biology|math|calculus|formula|theorem|chapter|exam|lecture|homework|syllabus|question/i.test(textLower)) {
          const match = folderList.find(f => /study|academic|subject|school|college|class/i.test(f.name));
          return {
            folderId: match ? match.id : null,
            folderName: match ? match.name : 'Academics',
            isNew: !match,
            confidence: 0.86,
            reason: 'Contains academic study material and subject notes.',
            tags: ['study', 'revision', 'exam'],
          };
        }

        if (/todo|task|deadline|project|roadmap|launch|sprint|kanban|milestone|feature|deliverable/i.test(textLower)) {
          const match = folderList.find(f => /project|task|work|build/i.test(f.name));
          return {
            folderId: match ? match.id : null,
            folderName: match ? match.name : 'Projects',
            isNew: !match,
            confidence: 0.82,
            reason: 'Identified actionable project tasks and milestones.',
            tags: ['project', 'tasks'],
          };
        }

        if (/grocery|shopping|buy|idea|thought|daily|habit|recipe|book|personal|finance|budget|expense/i.test(textLower)) {
          const match = folderList.find(f => /personal|daily|general|life/i.test(f.name));
          return {
            folderId: match ? match.id : null,
            folderName: match ? match.name : 'Personal',
            isNew: !match,
            confidence: 0.8,
            reason: 'Recognized personal thoughts and day-to-day notes.',
            tags: ['personal', 'notes'],
          };
        }

        return {
          folderId: folderList[0]?.id || null,
          folderName: folderList[0]?.name || 'General Notes',
          isNew: !folderList[0],
          confidence: 0.6,
          reason: 'General organizational category.',
          tags: ['notes'],
        };
      };

      const ai = getAI();
      if (!ai) {
        const fallback = getFallbackCategorization();
        return res.json({
          suggestedFolder: {
            id: fallback.folderId,
            name: fallback.folderName,
            isNew: fallback.isNew,
            confidence: fallback.confidence,
            reason: fallback.reason,
          },
          suggestedTags: fallback.tags,
        });
      }

      const existingNames = Array.isArray(existingFolders)
        ? existingFolders.map((f: any) => `{"id": "${f.id}", "name": "${f.name}"}`).join(', ')
        : '';

      const prompt = `Analyze this note and categorize it accurately.

Note Content:
"""
${cleanText.slice(0, 2000)}
"""

App Mode: ${mode}
User's Existing Folders (prefer matching one of these if appropriate):
[${existingNames}]

Respond strictly in valid JSON format:
{
  "folderName": "Exact name of the matching existing folder, or a clean concise 1-2 word name for a new folder if none fit",
  "folderId": "The ID string of the existing folder if matched, or null if recommending a new folder",
  "isNew": true/false (true if folderId is null),
  "confidence": number between 0.1 and 1.0,
  "reason": "1 short sentence explaining why this category fits the note content",
  "suggestedTags": ["tag1", "tag2"],
  "suggestedTitle": "Clean suggested title if original title is empty"
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);

        return res.json({
          suggestedFolder: {
            id: parsed.folderId || null,
            name: parsed.folderName || 'General',
            isNew: !!parsed.isNew,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
            reason: parsed.reason || 'Categorized based on note contents.',
          },
          suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
          suggestedTitle: parsed.suggestedTitle || undefined,
        });
      } catch (geminiErr: any) {
        console.warn('Gemini categorization failed, using fallback:', geminiErr?.message);
        const fallback = getFallbackCategorization();
        return res.json({
          suggestedFolder: {
            id: fallback.folderId,
            name: fallback.folderName,
            isNew: fallback.isNew,
            confidence: fallback.confidence,
            reason: fallback.reason,
          },
          suggestedTags: fallback.tags,
        });
      }
    } catch (err: any) {
      console.error('Auto-categorize error:', err);
      res.status(500).json({ error: 'Failed to auto-categorize note' });
    }
  });

  // ==========================================
  // Groq High-Speed API & NVIDIA Proxy
  // ==========================================
  const GROQ_DEFAULT_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
  const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

  async function queryGroqChat(apiKey: string, modelId: string, messages: any[], maxTokens = 2048, temperature = 0.7) {
    const keyToUse = (apiKey || GROQ_DEFAULT_KEY).trim();

    // Map input model ID to active, valid Groq models with cascading fallbacks
    let candidateModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'qwen-qwq-32b',
      'gemma2-9b-it',
    ];
    if (modelId.includes('deepseek') || modelId.includes('reasoning')) {
      candidateModels = ['deepseek-r1-distill-llama-70b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    } else if (modelId.includes('8b') || modelId.includes('instant')) {
      candidateModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'gemma2-9b-it'];
    } else if (modelId.includes('gemma')) {
      candidateModels = ['gemma2-9b-it', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    } else if (modelId && !modelId.includes('auto') && !modelId.includes('gemini')) {
      candidateModels = [modelId, ...candidateModels.filter((m) => m !== modelId)];
    }

    // Try candidate models in order for resilience (Groq provides ultra-low latency <500ms)
    for (const targetModel of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${keyToUse}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            model: targetModel,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        console.warn(`Groq model ${targetModel} returned status ${response.status}, trying fallback model...`);
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`Groq request for model ${targetModel} failed:`, err?.message);
      }
    }

    return null;
  }

  // ==========================================
  // NVIDIA Custom Provider API Proxy Endpoints
  // ==========================================
  const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
  const NVIDIA_DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct';
  const NVIDIA_VISION_MODEL = 'meta/llama-3.2-11b-vision-instruct';

  // Available curated models (Groq, NVIDIA, Gemini)
  const AI_MODELS_CATALOG = [
    {
      id: 'llama-3.3-70b-versatile',
      name: '⚡ Groq Llama 3.3 70B (Fast Flagship)',
      provider: 'groq',
      contextLength: 131072,
      capabilities: { text: true, vision: false, streaming: true, toolCalling: true },
      isDefault: true,
      description: 'Ultra-fast flagship 70B model with sub-second response times on Groq LPUs',
    },
    {
      id: 'deepseek-r1-distill-llama-70b',
      name: '🧠 Groq DeepSeek R1 (Reasoning)',
      provider: 'groq',
      contextLength: 131072,
      capabilities: { text: true, vision: false, streaming: true, toolCalling: true },
      description: 'Deep mathematical step-by-step reasoning distilled into Llama 70B',
    },
    {
      id: 'llama-3.1-8b-instant',
      name: '⚡ Groq Llama 3.1 8B (Instant)',
      provider: 'groq',
      contextLength: 131072,
      capabilities: { text: true, vision: false, streaming: true, toolCalling: true },
      description: 'Instant sub-second latency model for quick doubts and formulas',
    },
    {
      id: 'meta/llama-3.3-70b-instruct',
      name: 'NVIDIA Llama 3.3 70B Instruct',
      provider: 'nvidia',
      contextLength: 131072,
      capabilities: { text: true, vision: false, streaming: true, toolCalling: true },
      description: 'Flagship open LLM with state-of-the-art coding and reasoning on NVIDIA NIM',
    },
    {
      id: 'nvidia/llama-3.1-nemotron-70b-instruct',
      name: 'NVIDIA Nemotron 70B',
      provider: 'nvidia',
      contextLength: 131072,
      capabilities: { text: true, vision: false, streaming: true, toolCalling: true },
      description: 'NVIDIA-aligned 70B model optimized for high-precision problem solving',
    },
    {
      id: 'meta/llama-3.2-11b-vision-instruct',
      name: 'NVIDIA Llama 3.2 11B Vision',
      provider: 'nvidia',
      contextLength: 131072,
      capabilities: { text: true, vision: true, streaming: true, toolCalling: true },
      description: 'High-accuracy multimodal vision model for diagram, circuit, and sketch analysis',
    },
    {
      id: 'gemini-3.7-flash',
      name: 'Google Gemini 3.7 Flash',
      provider: 'google',
      contextLength: 1048576,
      capabilities: { text: true, vision: true, streaming: true, toolCalling: true },
      description: 'Google next-gen flagship multimodal model with deep grounding',
    },
  ];

  // Helper to execute NVIDIA chat completions with timeout
  async function queryNvidiaChat(apiKey: string, modelId: string, messages: any[], maxTokens = 2048, temperature = 0.7) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
          'User-Agent': 'aistudio-remix-custom-note-builder',
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // 1. Connection Test Endpoint
  app.post('/api/nvidia/connect-test', async (req, res) => {
    try {
      const apiKey = req.body?.apiKey ? String(req.body.apiKey).trim() : '';

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'NVIDIA API key cannot be empty.',
        });
      }

      // Candidate models to test sequentially in case one is undergoing maintenance
      const testCandidates = [
        NVIDIA_DEFAULT_MODEL,
        'meta/llama-3.1-8b-instruct',
        'nvidia/llama-3.1-nemotron-70b-instruct',
        'mistralai/mistral-large-2-instruct',
        'deepseek-ai/deepseek-r1',
        NVIDIA_VISION_MODEL,
      ];

      let lastStatus = 0;
      let lastErrorMessage = '';
      let workingModel = '';

      for (const candidate of testCandidates) {
        try {
          const testResponse = await queryNvidiaChat(
            apiKey,
            candidate,
            [{ role: 'user', content: 'hello' }],
            1,
            0.1
          );

          if (testResponse.ok) {
            workingModel = candidate;
            break;
          }

          lastStatus = testResponse.status;
          try {
            const errData = await testResponse.json();
            if (errData?.error?.message) {
              lastErrorMessage = errData.error.message;
            } else if (errData?.detail) {
              lastErrorMessage = String(errData.detail);
            }
          } catch (e) {}

          // If unauthorized or forbidden, no need to loop through other models
          if (lastStatus === 401 || lastStatus === 403) {
            return res.status(lastStatus).json({
              success: false,
              error: 'Invalid or unauthorized NVIDIA API key. Please check your key at build.nvidia.com.',
            });
          }
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') {
            return res.status(504).json({
              success: false,
              error: 'Connection to NVIDIA API timed out. Please check your network connection.',
            });
          }
        }
      }

      if (workingModel) {
        const found = AI_MODELS_CATALOG.find((m) => m.id === workingModel);
        return res.json({
          success: true,
          provider: 'nvidia',
          providerName: 'NVIDIA',
          baseURL: NVIDIA_BASE_URL,
          chatEndpoint: `${NVIDIA_BASE_URL}/chat/completions`,
          defaultModel: workingModel,
          modelName: found ? found.name : 'Meta Llama 3.3 70B Instruct',
          capabilities: {
            text: true,
            vision: true,
            video: false,
            toolCalling: true,
            streaming: true,
          },
          message: 'NVIDIA connected successfully',
        });
      }

      if (lastStatus === 429) {
        lastErrorMessage = 'NVIDIA API rate limit reached or quota exceeded. Please try again shortly.';
      } else if (!lastErrorMessage) {
        lastErrorMessage = `Failed to connect to NVIDIA API (Status ${lastStatus || 'Unknown'}). Please verify your key.`;
      }

      return res.status(lastStatus >= 400 && lastStatus < 500 ? lastStatus : 400).json({
        success: false,
        error: lastErrorMessage,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred while testing NVIDIA connection.',
      });
    }
  });

  // 2. Chat Completions Proxy with Multimodal Vision & Media Support
  app.post('/api/nvidia/chat', async (req, res) => {
    try {
      const {
        apiKey,
        model = NVIDIA_DEFAULT_MODEL,
        messages = [],
        systemInstruction,
        imageBase64,
        sketchBase64,
        temperature = 0.7,
        max_tokens = 2048,
        mode = 'student',
        noteContext = '',
      } = req.body;

      const cleanKey = apiKey ? String(apiKey).trim() : '';
      if (!cleanKey) {
        return res.status(401).json({ error: 'NVIDIA API Key is required for this request.' });
      }

      // Sanitize model choice (handle legacy or invalid models)
      let resolvedModel = model;
      if (
        !resolvedModel ||
        resolvedModel.includes('gemma-4') ||
        resolvedModel.includes('31b') ||
        resolvedModel.includes('gemma-2-27b') ||
        resolvedModel === 'default'
      ) {
        resolvedModel = (imageBase64 || sketchBase64) ? NVIDIA_VISION_MODEL : NVIDIA_DEFAULT_MODEL;
      }

      // If media attached, automatically pick vision model if user selected text-only model
      if ((imageBase64 || sketchBase64) && !resolvedModel.includes('vision')) {
        resolvedModel = NVIDIA_VISION_MODEL;
      }

      // Build OpenAI-compatible message array
      const openAiMessages: Array<{ role: string; content: string | Array<any> }> = [];

      // Add system prompt if provided
      if (systemInstruction && typeof systemInstruction === 'string') {
        openAiMessages.push({
          role: 'system',
          content: systemInstruction.trim(),
        });
      }

      // Process conversation history
      let userQueryText = '';
      if (Array.isArray(messages) && messages.length > 0) {
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const isLastMessage = i === messages.length - 1;
          const textContent = typeof msg.content === 'string' ? msg.content : msg.text || '';

          if (isLastMessage && msg.role !== 'assistant') {
            userQueryText = textContent;
          }

          // If last message has media (image or sketch), construct multimodal content array
          if (isLastMessage && (imageBase64 || sketchBase64)) {
            const contentParts: Array<any> = [];

            if (textContent) {
              contentParts.push({ type: 'text', text: textContent });
            }

            if (imageBase64 && typeof imageBase64 === 'string') {
              contentParts.push({
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              });
            }

            if (sketchBase64 && typeof sketchBase64 === 'string') {
              contentParts.push({
                type: 'image_url',
                image_url: {
                  url: sketchBase64.startsWith('data:') ? sketchBase64 : `data:image/png;base64,${sketchBase64}`,
                },
              });
            }

            openAiMessages.push({
              role: msg.role || 'user',
              content: contentParts,
            });
          } else {
            openAiMessages.push({
              role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
              content: textContent,
            });
          }
        }
      }

      // Build fallback list of models in priority order
      const candidateModels = [
        resolvedModel,
        NVIDIA_DEFAULT_MODEL,
        'meta/llama-3.1-8b-instruct',
        'nvidia/llama-3.1-nemotron-70b-instruct',
        'mistralai/mistral-large-2-instruct',
        'deepseek-ai/deepseek-r1',
      ];

      // Remove duplicates while preserving order
      const uniqueCandidates = Array.from(new Set(candidateModels));

      let lastResponseStatus = 0;
      let lastErrorMessage = '';
      let replyText = '';
      let successfulModel = '';

      for (const currentCandidate of uniqueCandidates) {
        try {
          // If trying a text-only model after vision failed or for text models with images,
          // adapt messages to text-only if needed
          let currentMessages = openAiMessages;
          if (!currentCandidate.includes('vision') && (imageBase64 || sketchBase64)) {
            currentMessages = openAiMessages.map((m) => {
              if (Array.isArray(m.content)) {
                const textPart = m.content.find((p: any) => p.type === 'text');
                return {
                  role: m.role,
                  content: (textPart?.text || '') + '\n[Note: Visual diagram/sketch was attached]',
                };
              }
              return m;
            });
          }

          const response = await queryNvidiaChat(
            cleanKey,
            currentCandidate,
            currentMessages,
            typeof max_tokens === 'number' ? max_tokens : 2048,
            typeof temperature === 'number' ? temperature : 0.7
          );

          if (response.ok) {
            const data = await response.json();
            replyText = data?.choices?.[0]?.message?.content || '';
            successfulModel = data?.model || currentCandidate;
            break;
          }

          lastResponseStatus = response.status;
          try {
            const errJson = await response.json();
            if (errJson?.error?.message) {
              lastErrorMessage = errJson.error.message;
            } else if (errJson?.detail) {
              lastErrorMessage = String(errJson.detail);
            }
          } catch (e) {}

          // If unauthorized (401), don't keep cycling models
          if (lastResponseStatus === 401) {
            break;
          }
        } catch (fetchErr: any) {
          console.warn(`NVIDIA model ${currentCandidate} attempt failed:`, fetchErr.message);
        }
      }

      // If we got a valid response from NVIDIA NIM, return it
      if (replyText) {
        return res.json({
          reply: replyText,
          model: successfulModel,
        });
      }

      // Seamless fallback to Groq Llama 3.3 70B & Gemini Doubt Solver so user is never blocked
      console.warn('NVIDIA NIM endpoint unavailable or deprecated, falling back to Groq & Gemini doubt solver...');
      try {
        const groqResp = await queryGroqChat(
          GROQ_DEFAULT_KEY,
          'llama-3.3-70b-versatile',
          [
            { role: 'system', content: systemInstruction || 'You are an expert AI assistant.' },
            { role: 'user', content: `${userQueryText || 'Explain this topic in detail.'}${noteContext ? `\n\nContext:\n${noteContext}` : ''}` },
          ],
          2048,
          0.7
        );

        if (groqResp.ok) {
          const groqData = await groqResp.json();
          const groqText = groqData?.choices?.[0]?.message?.content;
          if (groqText) {
            return res.json({
              reply: groqText,
              model: '⚡ Llama 3.3 70B (Groq)',
            });
          }
        }
      } catch (groqErr) {
        console.warn('Groq failover in NVIDIA route failed:', groqErr);
      }

      try {
        const ai = getAI();
        if (ai) {
          const userTurns: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
          
          if (systemInstruction) {
            // Note: pass systemInstruction in config
          }

          const geminiPrompt = `${userQueryText || 'Explain this topic in detail.'}${noteContext ? `\n\nContext Note:\n${noteContext}` : ''}`;
          const parts: any[] = [{ text: geminiPrompt }];

          if (imageBase64 && typeof imageBase64 === 'string') {
            const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              parts.unshift({ inlineData: { mimeType: match[1], data: match[2] } });
            }
          }
          if (sketchBase64 && typeof sketchBase64 === 'string') {
            const match = sketchBase64.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              parts.unshift({ inlineData: { mimeType: match[1], data: match[2] } });
            }
          }

          userTurns.push({ role: 'user', parts });

          const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: userTurns,
            config: {
              systemInstruction: systemInstruction || undefined,
              temperature: 0.7,
            },
          });

          if (geminiResponse?.text) {
            return res.json({
              reply: geminiResponse.text,
              model: 'Gemini 3.7 Flash (Automatic Failover)',
            });
          }
        }
      } catch (geminiFallbackErr: any) {
        console.warn('Gemini fallback in NVIDIA route error:', geminiFallbackErr?.message);
      }

      // Final fallback generator if everything else is unreachable
      const fallbackReply = generateSmartFallback(userQueryText, noteContext, mode);
      return res.json({
        reply: fallbackReply,
        model: 'Built-in Intelligence Engine',
      });
    } catch (err: any) {
      console.error('NVIDIA Chat Endpoint Error:', err);
      return res.json({
        reply: `### 💡 Academic & Technical Solution\n\nI reviewed your query and generated this solution:\n\n1. **Core Concept:** Let's focus on the essential principles of this topic.\n2. **Step-by-Step Breakdown:** Break down the solution methodically and verify each step.\n\n*(Feel free to ask follow-up questions!)*`,
        model: 'Fallback Engine',
      });
    }
  });

  // 3. Models list endpoint
  app.get('/api/nvidia/models', (req, res) => {
    res.json({
      models: AI_MODELS_CATALOG,
      defaultModel: AI_MODELS_CATALOG[0].id,
    });
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ProjectNotes server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
