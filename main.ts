/**
 * ZtoApi - OpenAI-compatible API proxy server
 *
 * Overview:
 * - Provides an OpenAI-compatible API interface for Z.ai's GLM-4.5 models
 * - Supports streaming and non-streaming responses
 * - Includes a real-time monitoring Dashboard
 * - Supports automatic anonymous token fetching
 * - Intelligently handles model "thinking" content display
 * - Complete request statistics and error handling
 *
 * Tech stack:
 * - Deno native HTTP API
 * - TypeScript for type safety
 * - Server-Sent Events (SSE) streaming
 * - Supports Deno Deploy and self-hosted deployment
 *
 * @author ZtoApi Team
 * @version 2.0.0
 * @since 2024
 */
declare namespace Deno {
  interface Conn {
    readonly rid: number;
    localAddr: Addr;
    remoteAddr: Addr;
    read(p: Uint8Array): Promise<number | null>;
    write(p: Uint8Array): Promise<number>;
    close(): void;
  }

  interface Addr {
    hostname: string;
    port: number;
    transport: string;
  }

  interface Listener extends AsyncIterable<Conn> {
    readonly addr: Addr;
    accept(): Promise<Conn>;
    close(): void;
    [Symbol.asyncIterator](): AsyncIterableIterator<Conn>;
  }

  interface HttpConn {
    nextRequest(): Promise<RequestEvent | null>;
    [Symbol.asyncIterator](): AsyncIterableIterator<RequestEvent>;
  }

  interface RequestEvent {
    request: Request;
    respondWith(r: Response | Promise<Response>): Promise<void>;
  }

  function listen(options: { port: number }): Listener;
  function serveHttp(conn: Conn): HttpConn;
  function serve(handler: (request: Request) => Promise<Response>): void;

  namespace env {
    function get(key: string): string | undefined;
  }

  export function readTextFile(path: string): Promise<string>;
  export function readFile(path: string): Promise<Uint8Array>;
}

/**
 * Request statistics interface
 * Tracks metrics for API calls
 */
interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastRequestTime: Date;
  averageResponseTime: number;
}

/**
 * Live request info for Dashboard display
 */
interface LiveRequest {
  id: string;
  timestamp: Date;
  method: string;
  path: string;
  status: number;
  duration: number;
  userAgent: string;
  model?: string;
}

/**
 * OpenAI-compatible request structure (chat completions)
 */
interface OpenAIRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Chat message structure
 * Supports multimodal content: text, image, video, document, audio
 */
interface Message {
  role: string;
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: {url: string};
    video_url?: {url: string};
    document_url?: {url: string};
    audio_url?: {url: string};
  }>;
  reasoning_content?: string;
}

/**
 * Upstream request structure (to Z.ai)
 */
interface UpstreamRequest {
  stream: boolean;
  model: string;
  messages: Message[];
  params: Record<string, unknown>;
  features: Record<string, unknown>;
  background_tasks?: Record<string, boolean>;
  chat_id?: string;
  id?: string;
  mcp_servers?: string[];
  model_item?: {
    id: string;
    name: string;
    owned_by: string;
    openai?: any;
    urlIdx?: number;
    info?: any;
    actions?: any[];
    tags?: any[];
  };
  tool_servers?: string[];
  variables?: Record<string, string>;
}

/**
 * OpenAI-compatible response structure
 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage?: Usage;
}

interface Choice {
  index: number;
  message?: Message;
  delta?: Delta;
  finish_reason?: string;
}

interface Delta {
  role?: string;
  content?: string;
  reasoning_content?: string;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Upstream SSE data structure
 */
interface UpstreamData {
  type: string;
  data: {
    delta_content: string;
    edit_content?: string;  // Contains complete thinking block when phase changes
    edit_index?: number;
    phase: string;
    done: boolean;
    usage?: Usage;
    error?: UpstreamError;
    inner?: {
      error?: UpstreamError;
    };
  };
  error?: UpstreamError;
}

interface UpstreamError {
  detail: string;
  code: number;
}

interface ModelsResponse {
  object: string;
  data: Model[];
}

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

/**
 * Configuration constants
 */

// Thinking content handling mode:
// - "strip": remove <details> tags and show only content
// - "think": convert <details> to <thinking> tags
// - "raw": keep as-is
// - "separate": separate reasoning into reasoning_content field
const THINK_TAGS_MODE = "separate"; // options: "strip", "think", "raw", "separate"

// Spoofed front-end headers (observed from capture)
// Updated to match capture in example.json
const X_FE_VERSION = "prod-fe-1.0.95";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0";
const SEC_CH_UA = "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Microsoft Edge\";v=\"140\"";
const SEC_CH_UA_MOB = "?0";
const SEC_CH_UA_PLAT = "\"Windows\"";
const ORIGIN_BASE = "https://chat.z.ai";

const ANON_TOKEN_ENABLED = true;

/**
 * Environment variable configuration
 */
const UPSTREAM_URL = Deno.env.get("UPSTREAM_URL") || "https://chat.z.ai/api/chat/completions";
const DEFAULT_KEY = Deno.env.get("DEFAULT_KEY") || "sk-your-key";
const ZAI_TOKEN = Deno.env.get("ZAI_TOKEN") || "";

/**
 * Supported model configuration
 */
interface ModelConfig {
  id: string;           // Model ID as exposed by API
  name: string;         // Display name
  upstreamId: string;   // Upstream Z.ai model ID
  capabilities: {
    vision: boolean;
    mcp: boolean;
    thinking: boolean;
  };
  defaultParams: {
    top_p: number;
    temperature: number;
    max_tokens?: number;
  };
}

const SUPPORTED_MODELS: ModelConfig[] = [
  {
    id: "0727-360B-API",
    name: "GLM-4.5",
    upstreamId: "0727-360B-API",
    capabilities: {
      vision: false,
      mcp: true,
      thinking: true
    },
    defaultParams: {
      top_p: 0.95,
      temperature: 0.6,
      max_tokens: 80000
    }
  },
  {
    id: "GLM-4-6-API-V1",
    name: "GLM-4.6",
    upstreamId: "GLM-4-6-API-V1",
    capabilities: {
      vision: false,
      mcp: true,
      thinking: true
    },
    defaultParams: {
      top_p: 0.95,
      temperature: 0.6,
      max_tokens: 195000
    }
  },
  {
    id: "glm-4.5v",
    name: "GLM-4.5V",
    upstreamId: "glm-4.5v",
    capabilities: {
      vision: true,
      mcp: false,
      thinking: true
    },
    defaultParams: {
      top_p: 0.6,
      temperature: 0.8
    }
  }
];

// Default model
const DEFAULT_MODEL = SUPPORTED_MODELS[0];

// Get model configuration by ID
function getModelConfig(modelId: string): ModelConfig {
  // Normalize model ID to handle case differences from various clients
  const normalizedModelId = normalizeModelId(modelId);
  const found = SUPPORTED_MODELS.find(m => m.id === normalizedModelId);

  if (!found) {
    debugLog("⚠️ Model config not found: %s (normalized: %s). Using default: %s", 
      modelId, normalizedModelId, DEFAULT_MODEL.name);
  }

  return found || DEFAULT_MODEL;
}

/**
 * Normalize model ID to handle different client naming formats
 */
function normalizeModelId(modelId: string): string {
  const normalized = modelId.toLowerCase().trim();
 
  const modelMappings: Record<string, string> = {
    'glm-4.5v': 'glm-4.5v',
    'glm4.5v': 'glm-4.5v',
    'glm_4.5v': 'glm-4.5v',
    'gpt-4-vision-preview': 'glm-4.5v',  // backward compatibility
    '0727-360b-api': '0727-360B-API',
    'glm-4.5': '0727-360B-API',
    'glm4.5': '0727-360B-API',
    'glm_4.5': '0727-360B-API',
    'gpt-4': '0727-360B-API',  // backward compatibility
    // GLM-4.6 mappings (from example requests)
    'glm-4.6': 'GLM-4-6-API-V1',
    'glm4.6': 'GLM-4-6-API-V1',
    'glm_4.6': 'GLM-4-6-API-V1',
    'glm-4-6-api-v1': 'GLM-4-6-API-V1',
    'glm-4-6': 'GLM-4-6-API-V1'
  };
 
  const mapped = modelMappings[normalized];
  if (mapped) {
    debugLog("🔄 Model ID mapping: %s → %s", modelId, mapped);
    return mapped;
  }
 
  return normalized;
}

/**
 * Process and validate multimodal messages
 * Supports image, video, document, audio types
 */
function processMessages(messages: Message[], modelConfig: ModelConfig): Message[] {
  const processedMessages: Message[] = [];

  for (const message of messages) {
    const processedMessage: Message = { ...message };

    if (Array.isArray(message.content)) {
      debugLog("Detected multimodal message, blocks: %d", message.content.length);

      const mediaStats = {
        text: 0,
        images: 0,
        videos: 0,
        documents: 0,
        audios: 0,
        others: 0
      };

      if (!modelConfig.capabilities.vision) {
        debugLog("Warning: Model %s does not support multimodal content but received it", modelConfig.name);
        // Keep only text blocks
        const textContent = message.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');
        processedMessage.content = textContent;
      } else {
        // GLM-4.5V supports full multimodal handling
        for (const block of message.content) {
          switch (block.type) {
            case 'text':
              if (block.text) {
                mediaStats.text++;
                debugLog("📝 Text block length: %d", block.text.length);
              }
              break;

            case 'image_url':
              if (block.image_url?.url) {
                mediaStats.images++;
                const url = block.image_url.url;
                if (url.startsWith('data:image/')) {
                  const mimeMatch = url.match(/data:image\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("🖼️ Image data: %s format, size: %d chars", format, url.length);
                } else if (url.startsWith('http')) {
                  debugLog("🔗 Image URL: %s", url);
                } else {
                  debugLog("⚠️ Unknown image format: %s", url.substring(0, 50));
                }
              }
              break;

            case 'video_url':
              if (block.video_url?.url) {
                mediaStats.videos++;
                const url = block.video_url.url;
                if (url.startsWith('data:video/')) {
                  const mimeMatch = url.match(/data:video\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("🎥 Video data: %s format, size: %d chars", format, url.length);
                } else if (url.startsWith('http')) {
                  debugLog("🔗 Video URL: %s", url);
                } else {
                  debugLog("⚠️ Unknown video format: %s", url.substring(0, 50));
                }
              }
              break;

            case 'document_url':
              if (block.document_url?.url) {
                mediaStats.documents++;
                const url = block.document_url.url;
                if (url.startsWith('data:application/')) {
                  const mimeMatch = url.match(/data:application\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("📄 Document data: %s format, size: %d chars", format, url.length);
                } else if (url.startsWith('http')) {
                  debugLog("🔗 Document URL: %s", url);
                } else {
                  debugLog("⚠️ Unknown document format: %s", url.substring(0, 50));
                }
              }
              break;

            case 'audio_url':
              if (block.audio_url?.url) {
                mediaStats.audios++;
                const url = block.audio_url.url;
                if (url.startsWith('data:audio/')) {
                  const mimeMatch = url.match(/data:audio\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("🎵 Audio data: %s format, size: %d chars", format, url.length);
                } else if (url.startsWith('http')) {
                  debugLog("🔗 Audio URL: %s", url);
                } else {
                  debugLog("⚠️ Unknown audio format: %s", url.substring(0, 50));
                }
              }
              break;

            default:
              mediaStats.others++;
              debugLog("❓ Unknown block type: %s", block.type);
          }
        }

        const totalMedia = mediaStats.images + mediaStats.videos + mediaStats.documents + mediaStats.audios;
        if (totalMedia > 0) {
          debugLog("🎯 Multimodal stats: text(%d) images(%d) videos(%d) documents(%d) audio(%d)",
            mediaStats.text, mediaStats.images, mediaStats.videos, mediaStats.documents, mediaStats.audios);
        }
      }
    } else if (typeof message.content === 'string') {
      debugLog("📝 Plain text message, length: %d", message.content.length);
    }

    processedMessages.push(processedMessage);
  }

  return processedMessages;
}

const DEBUG_MODE = Deno.env.get("DEBUG_MODE") !== "false"; // default true
const DEFAULT_STREAM = Deno.env.get("DEFAULT_STREAM") !== "false"; // default true
const DASHBOARD_ENABLED = Deno.env.get("DASHBOARD_ENABLED") !== "false"; // default true

/**
 * Global state
 */

let stats: RequestStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastRequestTime: new Date(),
  averageResponseTime: 0
};

let liveRequests: LiveRequest[] = [];

/**
 * Utility functions
 */

function debugLog(format: string, ...args: unknown[]): void {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${format}`, ...args);
  }
}

function recordRequestStats(startTime: number, path: string, status: number): void {
  const duration = Date.now() - startTime;

  stats.totalRequests++;
  stats.lastRequestTime = new Date();

  if (status >= 200 && status < 300) {
    stats.successfulRequests++;
  } else {
    stats.failedRequests++;
  }

  if (stats.totalRequests > 0) {
    const totalDuration = stats.averageResponseTime * (stats.totalRequests - 1) + duration;
    stats.averageResponseTime = totalDuration / stats.totalRequests;
  } else {
    stats.averageResponseTime = duration;
  }
}

function addLiveRequest(method: string, path: string, status: number, duration: number, userAgent: string, model?: string): void {
  const request: LiveRequest = {
    id: Date.now().toString(),
    timestamp: new Date(),
    method,
    path,
    status,
    duration,
    userAgent,
    model
  };

  liveRequests.push(request);

  if (liveRequests.length > 100) {
    liveRequests = liveRequests.slice(1);
  }
}

function getLiveRequestsData(): string {
  try {
    if (!Array.isArray(liveRequests)) {
      debugLog("liveRequests is not an array, resetting to []");
      liveRequests = [];
    }

    const requestData = liveRequests.map(req => ({
      id: req.id || "",
      timestamp: req.timestamp || new Date(),
      method: req.method || "",
      path: req.path || "",
      status: req.status || 0,
      duration: req.duration || 0,
      user_agent: req.userAgent || ""
    }));

    return JSON.stringify(requestData);
  } catch (error) {
    debugLog("Failed to get live requests data: %v", error);
    return JSON.stringify([]);
  }
}

function getStatsData(): string {
  try {
    if (!stats) {
      debugLog("stats object missing, using defaults");
      stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        lastRequestTime: new Date(),
        averageResponseTime: 0
      };
    }

    const statsData = {
      totalRequests: stats.totalRequests || 0,
      successfulRequests: stats.successfulRequests || 0,
      failedRequests: stats.failedRequests || 0,
      averageResponseTime: stats.averageResponseTime || 0
    };

    return JSON.stringify(statsData);
  } catch (error) {
    debugLog("Failed to get stats data: %v", error);
    return JSON.stringify({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    });
  }
}

function getClientIP(request: Request): string {
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) {
    const ips = xff.split(",");
    if (ips.length > 0) {
      return ips[0].trim();
    }
  }

  const xri = request.headers.get("X-Real-IP");
  if (xri) {
    return xri;
  }

  // For Deno Deploy we can't read remoteAddr; return unknown
  return "unknown";
}

function setCORSHeaders(headers: Headers): void {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Credentials", "true");
}

function validateApiKey(authHeader: string | null): boolean {
  // Accept a valid Bearer token if present.
  // Backwards-compatible: allow DEFAULT_KEY, configured ZAI_TOKEN, or any JWT-like/long token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
 
  const apiKey = authHeader.substring(7);
  if (apiKey === DEFAULT_KEY) return true;
  if (ZAI_TOKEN && apiKey === ZAI_TOKEN) return true;
  // Accept typical JWTs (three parts separated by '.') or long opaque tokens seen in captures
  if (apiKey.split('.').length === 3) return true;
  if (apiKey.length > 30) return true;
  return false;
}

async function getAnonymousToken(): Promise<string> {
  try {
    const response = await fetch(`${ORIGIN_BASE}/api/v1/auths/`, {
      method: "GET",
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "X-FE-Version": X_FE_VERSION,
        "sec-ch-ua": SEC_CH_UA,
        "sec-ch-ua-mobile": SEC_CH_UA_MOB,
        "sec-ch-ua-platform": SEC_CH_UA_PLAT,
        "Origin": ORIGIN_BASE,
        "Referer": `${ORIGIN_BASE}/`
      }
    });

    if (!response.ok) {
      throw new Error(`Anonymous token request failed with status ${response.status}`);
    }

    const data = await response.json() as { token: string };
    if (!data.token) {
      throw new Error("Anonymous token is empty");
    }

    return data.token;
  } catch (error) {
    debugLog("Failed to obtain anonymous token: %v", error);
    throw error;
  }
}

// Call upstream API with headers
async function callUpstreamWithHeaders(
  upstreamReq: UpstreamRequest,
  refererChatID: string,
  authToken: string
): Promise<Response> {
  try {
    debugLog("Calling upstream API: %s", UPSTREAM_URL);

    const hasMultimedia = upstreamReq.messages.some(msg =>
      Array.isArray(msg.content) &&
      msg.content.some(block =>
        ['image_url', 'video_url', 'document_url', 'audio_url'].includes(block.type)
      )
    );

    if (hasMultimedia) {
      debugLog("🎯 Request contains multimedia data, sending to upstream...");

      for (let i = 0; i < upstreamReq.messages.length; i++) {
        const msg = upstreamReq.messages[i];
        if (Array.isArray(msg.content)) {
          for (let j = 0; j < msg.content.length; j++) {
            const block = msg.content[j];

            // Handle image
            if (block.type === 'image_url' && block.image_url?.url) {
              const url = block.image_url.url;
              if (url.startsWith('data:image/')) {
                const mimeMatch = url.match(/data:image\/([^;]+)/);
                const format = mimeMatch ? mimeMatch[1] : 'unknown';
                const sizeKB = Math.round(url.length * 0.75 / 1024);
                debugLog("🖼️ Message[%d] Image[%d]: %s format, length: %d chars (~%dKB)",
                  i, j, format, url.length, sizeKB);

                if (sizeKB > 1000) {
                  debugLog("⚠️ Image is large (%dKB), may cause upstream failures", sizeKB);
                  debugLog("💡 Suggestion: compress images under 500KB");
                } else if (sizeKB > 500) {
                  debugLog("⚠️ Image somewhat large (%dKB), consider compression", sizeKB);
                }
              } else {
                debugLog("🔗 Message[%d] Image[%d]: external URL - %s", i, j, url);
              }
            }

            // Handle video
            if (block.type === 'video_url' && block.video_url?.url) {
              const url = block.video_url.url;
              if (url.startsWith('data:video/')) {
                const mimeMatch = url.match(/data:video\/([^;]+)/);
                const format = mimeMatch ? mimeMatch[1] : 'unknown';
                debugLog("🎥 Message[%d] Video[%d]: %s format, length: %d chars",
                  i, j, format, url.length);
              } else {
                debugLog("🔗 Message[%d] Video[%d]: external URL - %s", i, j, url);
              }
            }

            // Handle document
            if (block.type === 'document_url' && block.document_url?.url) {
              const url = block.document_url.url;
              if (url.startsWith('data:application/')) {
                const mimeMatch = url.match(/data:application\/([^;]+)/);
                const format = mimeMatch ? mimeMatch[1] : 'unknown';
                debugLog("📄 Message[%d] Document[%d]: %s format, length: %d chars",
                  i, j, format, url.length);
              } else {
                debugLog("🔗 Message[%d] Document[%d]: external URL - %s", i, j, url);
              }
            }

            // Handle audio
            if (block.type === 'audio_url' && block.audio_url?.url) {
              const url = block.audio_url.url;
              if (url.startsWith('data:audio/')) {
                const mimeMatch = url.match(/data:audio\/([^;]+)/);
                const format = mimeMatch ? mimeMatch[1] : 'unknown';
                debugLog("🎵 Message[%d] Audio[%d]: %s format, length: %d chars",
                  i, j, format, url.length);
              } else {
                debugLog("🔗 Message[%d] Audio[%d]: external URL - %s", i, j, url);
              }
            }
          }
        }
      }
    }

    debugLog("Upstream request body: %s", JSON.stringify(upstreamReq));

    const response = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "User-Agent": BROWSER_UA,
        "Authorization": `Bearer ${authToken}`,
        "Accept-Language": "en-US",
        "sec-ch-ua": SEC_CH_UA,
        "sec-ch-ua-mobile": SEC_CH_UA_MOB,
        "sec-ch-ua-platform": SEC_CH_UA_PLAT,
        "X-FE-Version": X_FE_VERSION,
        "Origin": ORIGIN_BASE,
        "Referer": `${ORIGIN_BASE}/c/${refererChatID}`
      },
      body: JSON.stringify(upstreamReq)
    });

    debugLog("Upstream response status: %d %s", response.status, response.statusText);
    return response;
  } catch (error) {
    debugLog("Failed to call upstream: %v", error);
    throw error;
  }
}

/**
 * Transform thinking content based on specified mode
 * Returns either a string (for "strip", "think", "raw" modes) or an object with reasoning and content
 */
function transformThinking(content: string, mode: "strip" | "think" | "raw" | "separate" = THINK_TAGS_MODE as "strip" | "think" | "raw" | "separate"): string | { reasoning: string; content: string } {

  // Raw mode: return as-is
  if (mode === "raw") {
    return content;
  }

  // Separate mode: extract reasoning and content separately
  if (mode === "separate") {
    let reasoning = "";
    let finalContent = "";

    // Try standard regex first (for complete <details> tags)
    let detailsMatch = content.match(/<details[^>]*>(.*?)<\/details>/gs);

    if (detailsMatch) {
      // Process reasoning content
      reasoning = detailsMatch.join("\n");

      // Remove <summary>...</summary>
      reasoning = reasoning.replace(/<summary>.*?<\/summary>/gs, "");

      // Remove <details> tags
      reasoning = reasoning.replace(/<details[^>]*>/g, "");
      reasoning = reasoning.replace(/<\/details>/g, "");

      // Handle line prefix "> " (using multiline flag)
      reasoning = reasoning.replace(/^> /gm, "");

      reasoning = reasoning.trim();

      // Extract final content (everything outside <details> tags)
      finalContent = content.replace(/<details[^>]*>.*?<\/details>/gs, "").trim();
    } else if (content.includes("</details>")) {
      // Handle partial edit_content (starts mid-tag)
      // Split by </details> to separate reasoning from content
      const parts = content.split("</details>");

      reasoning = parts[0];
      finalContent = parts.slice(1).join("</details>").trim();

      // Remove <summary>...</summary>
      reasoning = reasoning.replace(/<summary>.*?<\/summary>/gs, "");

      // Remove any partial opening tags at the start (e.g., 'true" duration="5"...')
      reasoning = reasoning.replace(/^[^>]*>/, "");

      // Handle line prefix "> "
      reasoning = reasoning.replace(/^> /gm, "");

      reasoning = reasoning.trim();

      debugLog("Separate mode - extracted reasoning length: %d, content length: %d", reasoning.length, finalContent.length);
      debugLog("Separate mode - content preview: %s", finalContent.substring(0, 50));
    } else {
      // No details tags, treat all as final content
      finalContent = content;
    }

    return { reasoning, content: finalContent };
  }

  // For "strip" and "think" modes, process as string
  let result = content;

  // Handle complete <details> tags first
  if (content.match(/<details[^>]*>.*?<\/details>/gs)) {
    switch (mode) {
      case "think":
        // Convert <details> to <thinking>, preserve content structure
        result = result.replace(/<details[^>]*>/g, "<thinking>");
        result = result.replace(/<\/details>/g, "</thinking>");
        break;
      case "strip":
        // Remove <details> tags but keep content
        result = result.replace(/<details[^>]*>/g, "");
        result = result.replace(/<\/details>/g, "");
        break;
    }
  } else if (content.includes("</details>")) {
    // Handle partial edit_content
    const parts = content.split("</details>");
    let thinkingPart = parts[0];
    const contentPart = parts.slice(1).join("</details>");

    // Remove partial opening tag
    thinkingPart = thinkingPart.replace(/^[^>]*>/, "");

    switch (mode) {
      case "think":
        result = "<thinking>" + thinkingPart + "</thinking>" + contentPart;
        break;
      case "strip":
        result = thinkingPart + contentPart;
        break;
    }
  }

  // Remove <summary>...</summary> tags
  result = result.replace(/<summary>.*?<\/summary>/gs, "");

  // Clean up other custom tags
  result = result.replace(/<Full>/g, "");
  result = result.replace(/<\/Full>/g, "");

  // Handle line prefix "> " (using multiline flag for proper matching)
  result = result.replace(/^> /gm, "");

  // Clean up extra whitespace but preserve paragraph structure
  result = result.replace(/\n\s*\n\s*\n/g, "\n\n"); // Multiple newlines to double newlines
  result = result.trim();

  return result;
}

async function processUpstreamStream(
  body: ReadableStream<Uint8Array>,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  modelName: string,
  thinkTagsMode: "strip" | "think" | "raw" | "separate" = THINK_TAGS_MODE as "strip" | "think" | "raw" | "separate"
): Promise<Usage | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalUsage: Usage | null = null;

  // For "separate" mode, accumulate thinking content
  let accumulatedThinking = "";
  let thinkingSent = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ""; // keep last partial line

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.substring(6);
          if (dataStr === "") continue;

          debugLog("Received SSE data: %s", dataStr);

          try {
            const upstreamData = JSON.parse(dataStr) as UpstreamData;

            // Error detection
            if (upstreamData.error || upstreamData.data.error ||
                (upstreamData.data.inner && upstreamData.data.inner.error)) {
              const errObj = upstreamData.error || upstreamData.data.error ||
                           (upstreamData.data.inner && upstreamData.data.inner.error);
              debugLog("Upstream error: code=%d, detail=%s", errObj?.code, errObj?.detail);

              const errorDetail = (errObj?.detail || "").toLowerCase();
              if (errorDetail.includes("something went wrong") || errorDetail.includes("try again later")) {
                debugLog("🚨 Z.ai server error analysis:");
                debugLog("   📋 Detail: %s", errObj?.detail);
                debugLog("   🖼️ Possible cause: image processing failure");
                debugLog("   💡 Suggested fixes:");
                debugLog("      1. Use smaller images (< 500KB)");
                debugLog("      2. Try different formats (JPEG over PNG)");
                debugLog("      3. Retry later (server load issue)");
                debugLog("      4. Check for corrupted images");
              }

              // Send end chunk
              const endChunk: OpenAIResponse = {
                id: `chatcmpl-${Date.now()}`,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: modelName,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: "stop"
                  }
                ]
              };

              await writer.write(encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`));
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              return finalUsage;
            }

            debugLog("Parsed upstream - type: %s, phase: %s, content length: %d, done: %v",
              upstreamData.type, upstreamData.data.phase,
              upstreamData.data.delta_content ? upstreamData.data.delta_content.length : 0,
              upstreamData.data.done);

            // Capture usage information if present
            if (upstreamData.data.usage) {
              finalUsage = upstreamData.data.usage;
              debugLog("Captured usage data: prompt=%d, completion=%d, total=%d",
                finalUsage.prompt_tokens, finalUsage.completion_tokens, finalUsage.total_tokens);
            }

            // Handle edit_content (complete thinking block sent when phase changes)
            if (upstreamData.data.edit_content && !thinkingSent) {
              debugLog("Received edit_content with complete thinking block, length: %d", upstreamData.data.edit_content.length);
              debugLog("Current mode: %s, thinkingSent: %s", THINK_TAGS_MODE, thinkingSent);

              if (thinkTagsMode === "separate") {
                const transformed = transformThinking(upstreamData.data.edit_content, thinkTagsMode);
                if (typeof transformed === "object" && transformed.reasoning) {
                  debugLog("Sending reasoning from edit_content, length: %d", transformed.reasoning.length);

                  // Send reasoning as a separate field
                  const reasoningChunk: OpenAIResponse = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: modelName,
                    choices: [
                      {
                        index: 0,
                        delta: { reasoning_content: transformed.reasoning }
                      }
                    ]
                  };

                  await writer.write(encoder.encode(`data: ${JSON.stringify(reasoningChunk)}\n\n`));
                  thinkingSent = true;
                }
              } else {
                // For other modes, process the complete thinking block from edit_content
                debugLog("Processing complete thinking block from edit_content for mode: %s", THINK_TAGS_MODE);

                const transformed = transformThinking(upstreamData.data.edit_content, thinkTagsMode);
                const processedContent = typeof transformed === "string" ? transformed : transformed.content;

                if (processedContent && processedContent.trim() !== "") {
                  debugLog("Sending processed thinking content from edit_content, length: %d", processedContent.length);

                  const chunk: OpenAIResponse = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: modelName,
                    choices: [
                      {
                        index: 0,
                        delta: { content: processedContent }
                      }
                    ]
                  };

                  await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  thinkingSent = true;
                } else {
                  debugLog("Processed thinking content from edit_content is empty");
                }
              }
            }

            // Handle content
            if (upstreamData.data.delta_content && upstreamData.data.delta_content !== "") {
              const rawContent = upstreamData.data.delta_content;
              const isThinking = upstreamData.data.phase === "thinking";

              if (thinkTagsMode === "separate") {
                // In separate mode, accumulate thinking content
                if (isThinking) {
                  accumulatedThinking += rawContent;

                  // Check if thinking block is complete (contains closing </details>)
                  if (accumulatedThinking.includes("</details>") && !thinkingSent) {
                    const transformed = transformThinking(accumulatedThinking, thinkTagsMode);
                    if (typeof transformed === "object" && transformed.reasoning) {
                      debugLog("Sending accumulated reasoning content, length: %d", transformed.reasoning.length);

                      // Send reasoning as a separate field
                      const reasoningChunk: OpenAIResponse = {
                        id: `chatcmpl-${Date.now()}`,
                        object: "chat.completion.chunk",
                        created: Math.floor(Date.now() / 1000),
                        model: modelName,
                        choices: [
                          {
                            index: 0,
                            delta: { reasoning_content: transformed.reasoning }
                          }
                        ]
                      };

                      await writer.write(encoder.encode(`data: ${JSON.stringify(reasoningChunk)}\n\n`));
                      thinkingSent = true;
                    }
                  }
                } else {
                  // Regular content
                  debugLog("Sending regular content: %s", rawContent);

                  const chunk: OpenAIResponse = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: modelName,
                    choices: [
                      {
                        index: 0,
                        delta: { content: rawContent }
                      }
                    ]
                  };

                  await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } else {
                // Other modes: accumulate thinking content and process when complete
                if (isThinking) {
                  accumulatedThinking += rawContent;
                  debugLog("Accumulated thinking content, total length: %d", accumulatedThinking.length);

                  // Check if thinking block is complete (contains closing </details>)
                  if (accumulatedThinking.includes("</details>") && !thinkingSent) {
                    debugLog("Processing complete thinking block, length: %d", accumulatedThinking.length);
                    debugLog("Thinking content preview: %s", accumulatedThinking.substring(0, 200));

                    const transformed = transformThinking(accumulatedThinking, thinkTagsMode);
                    const processedContent = typeof transformed === "string" ? transformed : transformed.content;

                    if (processedContent && processedContent.trim() !== "") {
                      debugLog("Sending processed thinking content, length: %d", processedContent.length);

                      const chunk: OpenAIResponse = {
                        id: `chatcmpl-${Date.now()}`,
                        object: "chat.completion.chunk",
                        created: Math.floor(Date.now() / 1000),
                        model: modelName,
                        choices: [
                          {
                            index: 0,
                            delta: { content: processedContent }
                          }
                        ]
                      };

                      await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                      thinkingSent = true;
                    } else {
                      debugLog("Processed thinking content is empty or whitespace-only");
                    }
                  } else {
                    debugLog("Thinking block not complete yet, contains </details>: %s, thinkingSent: %s",
                      accumulatedThinking.includes("</details>"), thinkingSent);
                  }
                  // Don't send individual thinking chunks - wait for complete block
                } else {
                  // Regular content (non-thinking)
                  debugLog("Sending regular content: %s", rawContent);

                  const chunk: OpenAIResponse = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: modelName,
                    choices: [
                      {
                        index: 0,
                        delta: { content: rawContent }
                      }
                    ]
                  };

                  await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              }
            }

            // Check for done
            if (upstreamData.data.done || upstreamData.data.phase === "done") {
              debugLog("Detected stream end signal");

              // Send final chunk with usage if available
              const endChunk: OpenAIResponse = {
                id: `chatcmpl-${Date.now()}`,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: modelName,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: "stop"
                  }
                ],
                usage: finalUsage || undefined
              };

              await writer.write(encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`));
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              return finalUsage;
            }
          } catch (error) {
            debugLog("Failed to parse SSE data: %v", error);
          }
        }
      }
    }
  } finally {
    writer.close();
  }
  
  return finalUsage;
}

// Collect full response for non-streaming mode
async function collectFullResponse(
  body: ReadableStream<Uint8Array>,
  thinkTagsMode: "strip" | "think" | "raw" | "separate" = THINK_TAGS_MODE as "strip" | "think" | "raw" | "separate"
): Promise<{content: string, reasoning_content?: string, usage: Usage | null}> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";
  let fullReasoning = "";
  let accumulatedThinking = "";
  let finalUsage: Usage | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.substring(6);
          if (dataStr === "") continue;

          try {
            const upstreamData = JSON.parse(dataStr) as UpstreamData;

            // Capture usage information if present
            if (upstreamData.data.usage) {
              finalUsage = upstreamData.data.usage;
              debugLog("Captured usage data in non-streaming: prompt=%d, completion=%d, total=%d",
                finalUsage.prompt_tokens, finalUsage.completion_tokens, finalUsage.total_tokens);
            }

            // Handle edit_content (complete thinking block)
            if (upstreamData.data.edit_content) {
              debugLog("Received edit_content in non-streaming, length: %d", upstreamData.data.edit_content.length);

              if (thinkTagsMode === "separate") {
                // For separate mode, extract reasoning and content separately
                if (!fullReasoning) {
                  const transformed = transformThinking(upstreamData.data.edit_content, thinkTagsMode);
                  if (typeof transformed === "object") {
                    fullReasoning = transformed.reasoning;
                    debugLog("Extracted reasoning from edit_content, length: %d", fullReasoning.length);

                    // Also add the content part from edit_content to fullContent
                    if (transformed.content && transformed.content.trim() !== "") {
                      fullContent += transformed.content;
                      debugLog("Added content part from edit_content, length: %d", transformed.content.length);
                    }
                  }
                }
              } else {
                // For other modes, process the thinking content and add to fullContent
                const transformed = transformThinking(upstreamData.data.edit_content, thinkTagsMode);
                const processedContent = typeof transformed === "string" ? transformed : transformed.content;

                if (processedContent && processedContent.trim() !== "") {
                  fullContent += processedContent;
                  debugLog("Added processed edit_content to fullContent, length: %d", processedContent.length);
                }
              }
            }

            if (upstreamData.data.delta_content !== "") {
              const rawContent = upstreamData.data.delta_content;
              const isThinking = upstreamData.data.phase === "thinking";

              if (thinkTagsMode === "separate") {
                if (isThinking) {
                  accumulatedThinking += rawContent;
                } else {
                  fullContent += rawContent;
                }
              } else {
                // For non-separate modes, only process non-thinking content
                // Thinking content is handled by edit_content
                if (!isThinking) {
                  fullContent += rawContent;
                }
              }
            }

            if (upstreamData.data.done || upstreamData.data.phase === "done") {
              debugLog("Detected completion signal, stopping collection");


              // Process accumulated thinking if in separate mode (only if not already set from edit_content)
              if (thinkTagsMode === "separate" && accumulatedThinking && !fullReasoning) {
                const transformed = transformThinking(accumulatedThinking, thinkTagsMode);
                if (typeof transformed === "object") {
                  fullReasoning = transformed.reasoning;
                  debugLog("Set fullReasoning from accumulated thinking, length: %d", fullReasoning.length);
                }
              }

              debugLog("collectFullResponse early return - content length: %d, reasoning length: %d",
                fullContent.length, fullReasoning ? fullReasoning.length : 0);

              return {
                content: fullContent,
                reasoning_content: fullReasoning || undefined,
                usage: finalUsage
              };
            }
          } catch (error) {
            // ignore parse errors
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Process accumulated thinking if in separate mode
  if (thinkTagsMode === "separate" && accumulatedThinking) {
    const transformed = transformThinking(accumulatedThinking, thinkTagsMode);
    if (typeof transformed === "object") {
      fullReasoning = transformed.reasoning;
    }
  }

  debugLog("collectFullResponse returning - content length: %d, reasoning length: %d",
    fullContent.length, fullReasoning ? fullReasoning.length : 0);

  return {
    content: fullContent,
    reasoning_content: fullReasoning || undefined,
    usage: finalUsage
  };
}

/**
 * HTTP server and routing
 */

async function getIndexHTML(): Promise<string> {
  try {
    return await Deno.readTextFile('./ui/index.html');
  } catch (error) {
    console.error('Failed to read index.html:', error);
    return '<h1>UI files not found. Please ensure ui folder exists.</h1>';
  }
}

async function handleIndex(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const html = await getIndexHTML();
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

async function handleOptions(request: Request): Promise<Response> {
  const headers = new Headers();
  setCORSHeaders(headers);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  return new Response("Not Found", { status: 404, headers });
}

async function handleModels(request: Request): Promise<Response> {
  const headers = new Headers();
  setCORSHeaders(headers);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  const models = SUPPORTED_MODELS.map(model => ({
    id: model.name,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: "z.ai"
  }));

  const response: ModelsResponse = {
    object: "list",
    data: models
  };

  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(response), {
    status: 200,
    headers
  });
}

async function handleChatCompletions(request: Request): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;
  const userAgent = request.headers.get("User-Agent") || "";

  debugLog("Received chat completions request");
  debugLog("🌐 User-Agent: %s", userAgent);

  // Cherry Studio detection
  const isCherryStudio = userAgent.toLowerCase().includes('cherry') || userAgent.toLowerCase().includes('studio');
  if (isCherryStudio) {
    debugLog("🍒 Detected Cherry Studio client version: %s",
      userAgent.match(/CherryStudio\/([^\s]+)/)?.[1] || 'unknown');
  }

  // Read feature control headers
  const thinkingHeader = request.headers.get("X-Feature-Thinking");
  const webSearchHeader = request.headers.get("X-Feature-Web-Search");
  const autoWebSearchHeader = request.headers.get("X-Feature-Auto-Web-Search");
  const imageGenerationHeader = request.headers.get("X-Feature-Image-Generation");
  const titleGenerationHeader = request.headers.get("X-Feature-Title-Generation");
  const tagsGenerationHeader = request.headers.get("X-Feature-Tags-Generation");
  const mcpHeader = request.headers.get("X-Feature-MCP");
  
  // Read think tags mode customization header
  const thinkTagsModeHeader = request.headers.get("X-Think-Tags-Mode");

  // Parse header values to boolean (default to model capabilities if not specified)
  const parseFeatureHeader = (headerValue: string | null, defaultValue: boolean): boolean => {
    if (headerValue === null) return defaultValue;
    const lowerValue = headerValue.toLowerCase().trim();
    return lowerValue === "true" || lowerValue === "1" || lowerValue === "yes";
  };

  // Parse think tags mode header with validation
  const parseThinkTagsMode = (headerValue: string | null): "strip" | "think" | "raw" | "separate" => {
    if (headerValue === null) return THINK_TAGS_MODE as "strip" | "think" | "raw" | "separate";
    
    const validModes = ["strip", "think", "raw", "separate"];
    const normalizedValue = headerValue.toLowerCase().trim();
    
    if (validModes.includes(normalizedValue)) {
      return normalizedValue as "strip" | "think" | "raw" | "separate";
    }
    
    debugLog("⚠️ Invalid X-Think-Tags-Mode value: %s. Using default: %s", headerValue, THINK_TAGS_MODE);
    return THINK_TAGS_MODE as "strip" | "think" | "raw" | "separate";
  };

  const currentThinkTagsMode = parseThinkTagsMode(thinkTagsModeHeader);

  debugLog("Feature headers received: Thinking=%s, WebSearch=%s, AutoWebSearch=%s, ImageGen=%s, TitleGen=%s, TagsGen=%s, MCP=%s",
    thinkingHeader, webSearchHeader, autoWebSearchHeader, imageGenerationHeader, titleGenerationHeader, tagsGenerationHeader, mcpHeader);
  debugLog("🎯 Think tags mode: %s (header: %s, default: %s)", currentThinkTagsMode, thinkTagsModeHeader || "not provided", THINK_TAGS_MODE);

  const headers = new Headers();
  setCORSHeaders(headers);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  // API key validation
  const authHeader = request.headers.get("Authorization");
  if (!validateApiKey(authHeader)) {
    debugLog("Missing or invalid Authorization header");
    const duration = Date.now() - startTime;
    recordRequestStats(startTime, path, 401);
    addLiveRequest(request.method, path, 401, duration, userAgent);
    return new Response("Missing or invalid Authorization header", {
      status: 401,
      headers
    });
  }

  debugLog("API key validated");

  // Read request body
  let body: string;
  try {
    body = await request.text();
    debugLog("📥 Received body length: %d chars", body.length);

    const bodyPreview = body.length > 1000 ? body.substring(0, 1000) + "..." : body;
    debugLog("📄 Body preview: %s", bodyPreview);
  } catch (error) {
    debugLog("Failed to read request body: %v", error);
    const duration = Date.now() - startTime;
    recordRequestStats(startTime, path, 400);
    addLiveRequest(request.method, path, 400, duration, userAgent);
    return new Response("Failed to read request body", {
      status: 400,
      headers
    });
  }

  // Parse JSON
  let req: OpenAIRequest;
  let incomingBody: any = null;
  try {
    incomingBody = JSON.parse(body);
    req = incomingBody as OpenAIRequest;
    debugLog("✅ JSON parsed successfully");
  } catch (error) {
    debugLog("JSON parse failed: %v", error);
    const duration = Date.now() - startTime;
    recordRequestStats(startTime, path, 400);
    addLiveRequest(request.method, path, 400, duration, userAgent);
    return new Response("Invalid JSON", {
      status: 400,
      headers
    });
  }

  // If client didn't specify stream parameter, use default
  if (!body.includes('"stream"')) {
    req.stream = DEFAULT_STREAM;
    debugLog("Client did not specify stream parameter; using default: %v", DEFAULT_STREAM);
  }

  const modelConfig = getModelConfig(req.model);
  debugLog("Request parsed - model: %s (%s), stream: %v, messages: %d", req.model, modelConfig.name, req.stream, req.messages.length);

  // Cherry Studio debug: inspect each message
  debugLog("🔍 Cherry Studio debug - inspect raw messages:");
  for (let i = 0; i < req.messages.length; i++) {
    const msg = req.messages[i];
    debugLog("  Message[%d] role: %s", i, msg.role);

    if (typeof msg.content === 'string') {
      debugLog("  Message[%d] content: string, length: %d", i, msg.content.length);
      if (msg.content.length === 0) {
        debugLog("  ⚠️  Message[%d] content is empty string!", i);
      } else {
        debugLog("  Message[%d] content preview: %s", i, msg.content.substring(0, 100));
      }
    } else if (Array.isArray(msg.content)) {
      debugLog("  Message[%d] content: array, blocks: %d", i, msg.content.length);
      for (let j = 0; j < msg.content.length; j++) {
        const block = msg.content[j];
        debugLog("    Block[%d] type: %s", j, block.type);
        if (block.type === 'text' && block.text) {
          debugLog("    Block[%d] text: %s", j, block.text.substring(0, 50));
        } else if (block.type === 'image_url' && block.image_url?.url) {
          debugLog("    Block[%d] image_url: %s format, length: %d", j,
            block.image_url.url.startsWith('data:') ? 'base64' : 'url',
            block.image_url.url.length);
        }
      }
    } else {
      debugLog("  ⚠️  Message[%d] content type unexpected: %s", i, typeof msg.content);
    }
  }

  // Process and validate messages (multimodal handling)
  const processedMessages = processMessages(req.messages, modelConfig);
  debugLog("Messages processed, count after processing: %d", processedMessages.length);

  const hasMultimodal = processedMessages.some(msg =>
    Array.isArray(msg.content) &&
    msg.content.some(block =>
      ['image_url', 'video_url', 'document_url', 'audio_url'].includes(block.type)
    )
  );

  if (hasMultimodal) {
    debugLog("🎯 Detected full multimodal request, model: %s", modelConfig.name);
    if (!modelConfig.capabilities.vision) {
      debugLog("❌ Severe error: model doesn't support multimodal but received media content!");
      debugLog("💡 Cherry Studio users: ensure you selected 'glm-4.5v' instead of 'GLM-4.5'");
      debugLog("🔧 Model mapping: %s → %s (vision: %s)",
        req.model, modelConfig.upstreamId, modelConfig.capabilities.vision);
    } else {
      debugLog("✅ GLM-4.5V supports full multimodal understanding: images, video, documents, audio");

      if (!ZAI_TOKEN || ZAI_TOKEN.trim() === "") {
        debugLog("⚠️ Important warning: using anonymous token for multimodal requests");
        debugLog("💡 Z.ai anonymous tokens may not support image/video/document processing");
        debugLog("🔧 Fix: set ZAI_TOKEN environment variable to an official API token");
        debugLog("📋 If requests fail, token permissions are likely the cause");
      } else {
        debugLog("✅ Using official API token; full multimodal features supported");
      }
    }
  } else if (modelConfig.capabilities.vision && modelConfig.id === 'glm-4.5v') {
    debugLog("ℹ️ Using GLM-4.5V model but no media detected; processing text only");
  }

  // Generate session IDs (prefer client-provided values if present in incoming body)
  const chatID = (typeof incomingBody === "object" && incomingBody?.chat_id) ? String(incomingBody.chat_id) : `${Date.now()}-${Math.floor(Date.now() / 1000)}`;
  const msgID = (typeof incomingBody === "object" && incomingBody?.id) ? String(incomingBody.id) : Date.now().toString();

  // Build upstream request
  const upstreamReq: UpstreamRequest = {
    stream: true, // always fetch upstream as stream
    chat_id: chatID,
    id: msgID,
    model: modelConfig.upstreamId,
    messages: processedMessages,
    params: modelConfig.defaultParams,
    features: {
      enable_thinking: parseFeatureHeader(thinkingHeader, modelConfig.capabilities.thinking),
      image_generation: parseFeatureHeader(imageGenerationHeader, false),
      web_search: parseFeatureHeader(webSearchHeader, false),
      auto_web_search: parseFeatureHeader(autoWebSearchHeader, false),
      preview_mode: modelConfig.capabilities.vision
    },
    background_tasks: {
      title_generation: parseFeatureHeader(titleGenerationHeader, false),
      tags_generation: parseFeatureHeader(tagsGenerationHeader, false)
    },
    mcp_servers: (parseFeatureHeader(mcpHeader, modelConfig.capabilities.mcp) && modelConfig.capabilities.mcp) ? [] : undefined,
    model_item: {
      id: modelConfig.upstreamId,
      name: modelConfig.name,
      owned_by: "openai",
      openai: {
        id: modelConfig.upstreamId,
        name: modelConfig.upstreamId,
        owned_by: "openai",
        openai: {
          id: modelConfig.upstreamId
        },
        urlIdx: 1
      },
      urlIdx: 1,
      info: {
        id: modelConfig.upstreamId,
        user_id: "api-user",
        base_model_id: null,
        name: modelConfig.name,
        params: modelConfig.defaultParams,
        meta: {
          profile_image_url: "/static/favicon.png",
          description: modelConfig.capabilities.vision ? "Advanced visual understanding and analysis" : "Most advanced model, proficient in coding and tool use",
          capabilities: {
            vision: modelConfig.capabilities.vision,
            citations: false,
            preview_mode: modelConfig.capabilities.vision,
            web_search: false,
            language_detection: false,
            restore_n_source: false,
            mcp: modelConfig.capabilities.mcp,
            file_qa: modelConfig.capabilities.mcp,
            returnFc: true,
            returnThink: modelConfig.capabilities.thinking,
            think: modelConfig.capabilities.thinking
          }
        }
      }
    },
    tool_servers: [],
    variables: {
      "{{USER_NAME}}": `Guest-${Date.now()}`,
      "{{USER_LOCATION}}": "Unknown",
      "{{CURRENT_DATETIME}}": new Date().toLocaleString('en-US'),
      "{{CURRENT_DATE}}": new Date().toLocaleDateString('en-US'),
      "{{CURRENT_TIME}}": new Date().toLocaleTimeString('en-US'),
      "{{CURRENT_WEEKDAY}}": new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      "{{CURRENT_TIMEZONE}}": "UTC",
      "{{USER_LANGUAGE}}": "en-US"
    }
  };

  // Choose token for this conversation
  let authToken = ZAI_TOKEN;
  if (ANON_TOKEN_ENABLED) {
    try {
      const anonToken = await getAnonymousToken();
      authToken = anonToken;
      debugLog("Anonymous token obtained: %s...", anonToken.substring(0, 10));
    } catch (error) {
      debugLog("Failed to obtain anonymous token; falling back to configured token: %v", error);
    }
  }

  // Call upstream
  try {
    if (req.stream) {
      return await handleStreamResponse(upstreamReq, chatID, authToken, startTime, path, userAgent, req, modelConfig, currentThinkTagsMode);
    } else {
      return await handleNonStreamResponse(upstreamReq, chatID, authToken, startTime, path, userAgent, req, modelConfig, currentThinkTagsMode);
    }
  } catch (error) {
    debugLog("Upstream call failed: %v", error);
    const duration = Date.now() - startTime;
    recordRequestStats(startTime, path, 502);
    addLiveRequest(request.method, path, 502, duration, userAgent);
    return new Response("Failed to call upstream", {
      status: 502,
      headers
    });
  }
}

async function handleStreamResponse(
  upstreamReq: UpstreamRequest,
  chatID: string,
  authToken: string,
  startTime: number,
  path: string,
  userAgent: string,
  req: OpenAIRequest,
  modelConfig: ModelConfig,
  thinkTagsMode: "strip" | "think" | "raw" | "separate"
): Promise<Response> {
  debugLog("Starting to handle stream response (chat_id=%s)", chatID);

  try {
    const response = await callUpstreamWithHeaders(upstreamReq, chatID, authToken);

    if (!response.ok) {
      debugLog("Upstream returned error status: %d", response.status);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 502);
      addLiveRequest("POST", path, 502, duration, userAgent);
      return new Response("Upstream error", { status: 502 });
    }

    if (!response.body) {
      debugLog("Upstream response body is empty");
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 502);
      addLiveRequest("POST", path, 502, duration, userAgent);
      return new Response("Upstream response body is empty", { status: 502 });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Send first chunk (role)
    const firstChunk: OpenAIResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: req.model,
      choices: [
        {
          index: 0,
          delta: { role: "assistant" }
        }
      ]
    };

    writer.write(encoder.encode(`data: ${JSON.stringify(firstChunk)}\n\n`));

    // Process upstream SSE stream asynchronously
    processUpstreamStream(response.body, writer, encoder, req.model, thinkTagsMode).then(usage => {
      if (usage) {
        debugLog("Stream completed with usage: prompt=%d, completion=%d, total=%d",
          usage.prompt_tokens, usage.completion_tokens, usage.total_tokens);
      }
    }).catch(error => {
      debugLog("Error while processing upstream stream: %v", error);
    });

    // Record stats
    const duration = Date.now() - startTime;
    recordRequestStats(startTime, path, 200);
    addLiveRequest("POST", path, 200, duration, userAgent, modelConfig.name);

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true"
      }
    });
  } catch (error) {
    debugLog("Error handling stream response: %v", error);
    const duration = Date.now() - startTime;
    recordRequestStats(startTime, path, 502);
    addLiveRequest("POST", path, 502, duration, userAgent);
    return new Response("Failed to process stream response", { status: 502 });
  }
}

async function handleNonStreamResponse(
  upstreamReq: UpstreamRequest,
  chatID: string,
  authToken: string,
  startTime: number,
  path: string,
  userAgent: string,
  req: OpenAIRequest,
  modelConfig: ModelConfig,
  thinkTagsMode: "strip" | "think" | "raw" | "separate"
): Promise<Response> {
  debugLog("Starting to handle non-stream response (chat_id=%s)", chatID);

  try {
    const response = await callUpstreamWithHeaders(upstreamReq, chatID, authToken);

    if (!response.ok) {
      debugLog("Upstream returned error status: %d", response.status);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 502);
      addLiveRequest("POST", path, 502, duration, userAgent);
      return new Response("Upstream error", { status: 502 });
    }

    if (!response.body) {
      debugLog("Upstream response body is empty");
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 502);
      addLiveRequest("POST", path, 502, duration, userAgent);
      return new Response("Upstream response body is empty", { status: 502 });
    }

    const { content: finalContent, reasoning_content: reasoningContent, usage: finalUsage } = await collectFullResponse(response.body, thinkTagsMode);
    debugLog("Content collection completed, final length: %d", finalContent.length);
    debugLog("Reasoning content status: %s", reasoningContent ? `present (${reasoningContent.length} chars)` : "not present");

    if (reasoningContent) {
      debugLog("Reasoning content collected, length: %d", reasoningContent.length);
      debugLog("Reasoning content preview: %s", reasoningContent.substring(0, 100));
    }

    if (finalUsage) {
      debugLog("Non-stream completed with usage: prompt=%d, completion=%d, total=%d",
        finalUsage.prompt_tokens, finalUsage.completion_tokens, finalUsage.total_tokens);
    }

    const message: Message = {
      role: "assistant",
      content: finalContent
    };

    // Add reasoning_content if available
    if (reasoningContent) {
      message.reasoning_content = reasoningContent;
    }

    const openAIResponse: OpenAIResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: req.model,
      choices: [
        {
          index: 0,
          message: message,
          finish_reason: "stop"
        }
      ],
      usage: finalUsage || undefined
    };

    const duration = Date.now() - startTime;
    recordRequestStats(startTime, path, 200);
    addLiveRequest("POST", path, 200, duration, userAgent, modelConfig.name);

    return new Response(JSON.stringify(openAIResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true"
      }
    });
  } catch (error) {
    debugLog("Error processing non-stream response: %v", error);
    const duration = Date.now() - startTime;
    recordRequestStats(startTime, path, 502);
    addLiveRequest("POST", path, 502, duration, userAgent);
    return new Response("Failed to process non-stream response", { status: 502 });
  }
}

/**
 * Dashboard HTML template
 * Provides live API call monitoring and statistics
 */
async function getDashboardHTML(): Promise<string> {
  try {
    return await Deno.readTextFile('./ui/dashboard.html');
  } catch (error) {
    console.error('Failed to read dashboard.html:', error);
    return '<h1>UI files not found. Please ensure ui folder exists.</h1>';
  }
}

/**
 * Dashboard request handlers
 */
async function handleDashboard(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const html = await getDashboardHTML();
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

async function handleDashboardStats(request: Request): Promise<Response> {
  return new Response(getStatsData(), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

async function handleDashboardRequests(request: Request): Promise<Response> {
  return new Response(getLiveRequestsData(), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

async function getDocsHTML(): Promise<string> {
  try {
    return await Deno.readTextFile('./ui/docs.html');
  } catch (error) {
    console.error('Failed to read docs.html:', error);
    return '<h1>UI files not found. Please ensure ui folder exists.</h1>';
  }
}

/**
 * Docs page handler
 */
async function handleDocs(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const html = await getDocsHTML();
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

async function handleStatic(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.substring(4); // remove /ui/ prefix
  const filePath = `./ui/${path}`;
  
  try {
    const fileBytes = await Deno.readFile(filePath);
    const contentType = getContentType(path);
    return new Response(fileBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    console.error(`Failed to serve static file ${filePath}:`, error);
    return new Response("File not found", { status: 404 });
  }
}

function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return 'text/html; charset=utf-8';
    case 'css': return 'text/css; charset=utf-8';
    case 'js': return 'application/javascript; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

// Main HTTP server entrypoint
async function main() {
console.log(`OpenAI-compatible API server starting`);
console.log(`Supported models: ${SUPPORTED_MODELS.map(m => `${m.id} (${m.name})`).join(', ')}`);
console.log(`Upstream: ${UPSTREAM_URL}`);
console.log(`Debug mode: ${DEBUG_MODE}`);
console.log(`Default streaming: ${DEFAULT_STREAM}`);
console.log(`Dashboard enabled: ${DASHBOARD_ENABLED}`);

// Detect if running on Deno Deploy
const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

if (isDenoDeploy) {
  console.log("Running on Deno Deploy");
  Deno.serve(handleRequest);
} else {
  const port = parseInt(Deno.env.get("PORT") || "9090");
  console.log(`Running locally on port: ${port}`);

  if (DASHBOARD_ENABLED) {
    console.log(`Dashboard enabled at: http://localhost:${port}/dashboard`);
  }

  const server = Deno.listen({ port });

  for await (const conn of server) {
    handleHttp(conn);
  }
}
}

// Handle HTTP connection (self-hosted/local)
async function handleHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  while (true) {
    const requestEvent = await httpConn.nextRequest();
    if (!requestEvent) break;

    const { request, respondWith } = requestEvent;
    const url = new URL(request.url);
    const startTime = Date.now();
    const userAgent = request.headers.get("User-Agent") || "";

try {
  // Routing
  if (url.pathname === "/") {
    const response = await handleIndex(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else if (url.pathname.startsWith("/ui/")) {
    const response = await handleStatic(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else if (url.pathname === "/v1/models") {
    const response = await handleModels(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else if (url.pathname === "/v1/chat/completions") {
    const response = await handleChatCompletions(request);
    await respondWith(response);
    // stats recorded inside handleChatCompletions
  } else if (url.pathname === "/docs") {
    const response = await handleDocs(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else if (url.pathname === "/dashboard" && DASHBOARD_ENABLED) {
    const response = await handleDashboard(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else if (url.pathname === "/dashboard/stats" && DASHBOARD_ENABLED) {
    const response = await handleDashboardStats(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else if (url.pathname === "/dashboard/requests" && DASHBOARD_ENABLED) {
    const response = await handleDashboardRequests(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else {
    const response = await handleOptions(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  }
} catch (error) {
  debugLog("Error handling request: %v", error);
  const response = new Response("Internal Server Error", { status: 500 });
  await respondWith(response);
  recordRequestStats(startTime, url.pathname, 500);
  addLiveRequest(request.method, url.pathname, 500, Date.now() - startTime, userAgent);
}
}
}

// Handle HTTP requests (Deno Deploy)
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const startTime = Date.now();
  const userAgent = request.headers.get("User-Agent") || "";

  try {
    // Routing
    if (url.pathname === "/") {
      const response = await handleIndex(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else if (url.pathname.startsWith("/ui/")) {
      const response = await handleStatic(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else if (url.pathname === "/v1/models") {
      const response = await handleModels(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else if (url.pathname === "/v1/chat/completions") {
      const response = await handleChatCompletions(request);
      // stats recorded inside handleChatCompletions
      return response;
    } else if (url.pathname === "/docs") {
      const response = await handleDocs(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else if (url.pathname === "/dashboard" && DASHBOARD_ENABLED) {
      const response = await handleDashboard(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else if (url.pathname === "/dashboard/stats" && DASHBOARD_ENABLED) {
      const response = await handleDashboardStats(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else if (url.pathname === "/dashboard/requests" && DASHBOARD_ENABLED) {
      const response = await handleDashboardRequests(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else {
      const response = await handleOptions(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    }
  } catch (error) {
    debugLog("Error handling request: %v", error);
    recordRequestStats(startTime, url.pathname, 500);
    addLiveRequest(request.method, url.pathname, 500, Date.now() - startTime, userAgent);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Start server
main();
