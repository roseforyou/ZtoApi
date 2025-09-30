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

// Thinking content handling mode: "strip" to remove <details>, "think" to convert to <thinking>, "raw" to keep as-is
const THINK_TAGS_MODE = "strip";

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

function transformThinking(content: string): string {
  // Remove <summary>…</summary>
  let result = content.replace(/<summary>.*?<\/summary>/gs, "");
  // Clean up custom tags left over like </thinking>, <Full>, etc.
  result = result.replace(/<\/thinking>/g, "");
  result = result.replace(/<Full>/g, "");
  result = result.replace(/<\/Full>/g, "");
  result = result.trim();

  switch (THINK_TAGS_MODE as "strip" | "think" | "raw") {
    case "think":
      result = result.replace(/<details[^>]*>/g, "<thinking>");
      result = result.replace(/<\/details>/g, "</thinking>");
      break;
    case "strip":
      result = result.replace(/<details[^>]*>/g, "");
      result = result.replace(/<\/details>/g, "");
      break;
  }

  // Remove "> " line prefix (including at start)
  result = result.replace(/^> /, "");
  result = result.replace(/\n> /g, "\n");
  return result.trim();
}

async function processUpstreamStream(
  body: ReadableStream<Uint8Array>,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  modelName: string
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
              return;
            }

            debugLog("Parsed upstream - type: %s, phase: %s, content length: %d, done: %v",
              upstreamData.type, upstreamData.data.phase,
              upstreamData.data.delta_content ? upstreamData.data.delta_content.length : 0,
              upstreamData.data.done);

            // Handle content
            if (upstreamData.data.delta_content && upstreamData.data.delta_content !== "") {
              let out = upstreamData.data.delta_content;
              if (upstreamData.data.phase === "thinking") {
                out = transformThinking(out);
              }

              if (out !== "") {
                debugLog("Sending content(%s): %s", upstreamData.data.phase, out);

                const chunk: OpenAIResponse = {
                  id: `chatcmpl-${Date.now()}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: modelName,
                  choices: [
                    {
                      index: 0,
                      delta: { content: out }
                    }
                  ]
                };

                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            }

            // Check for done
            if (upstreamData.data.done || upstreamData.data.phase === "done") {
              debugLog("Detected stream end signal");

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
              return;
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
}

// Collect full response for non-streaming mode
async function collectFullResponse(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

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

            if (upstreamData.data.delta_content !== "") {
              let out = upstreamData.data.delta_content;
              if (upstreamData.data.phase === "thinking") {
                out = transformThinking(out);
              }

              if (out !== "") {
                fullContent += out;
              }
            }

            if (upstreamData.data.done || upstreamData.data.phase === "done") {
              debugLog("Detected completion signal, stopping collection");
              return fullContent;
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

  return fullContent;
}

/**
 * HTTP server and routing
 */

function getIndexHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZtoApi - OpenAI-compatible API proxy</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
            margin-top: 40px;
        }
        header {
            text-align: center;
            margin-bottom: 40px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5rem;
        }
        .subtitle {
            color: #666;
            font-size: 1.2rem;
            margin-bottom: 30px;
        }
        .links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        .link-card {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e9ecef;
        }
        .link-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .link-card h3 {
            margin-top: 0;
            color: #007bff;
        }
        .link-card p {
            color: #666;
            margin-bottom: 20px;
        }
        .link-card a {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .link-card a:hover {
            background-color: #0056b3;
        }
        .features {
            margin-top: 60px;
        }
        .features h2 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .feature-item {
            text-align: center;
            padding: 20px;
        }
        .feature-item i {
            font-size: 2rem;
            color: #007bff;
            margin-bottom: 15px;
        }
        .feature-item h3 {
            color: #333;
            margin-bottom: 10px;
        }
        .feature-item p {
            color: #666;
        }
        footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>ZtoApi</h1>
            <div class="subtitle">OpenAI-compatible proxy for Z.ai GLM-4.5</div>
            <p>A high-performance, easy-to-deploy API proxy that allows you to use OpenAI-compatible formats to access Z.ai's GLM-4.5 models.</p>
        </header>

        <div class="links">
            <div class="link-card">
                <h3>📖 API Docs</h3>
                <p>View full API documentation and usage examples.</p>
                <a href="/docs">View Docs</a>
            </div>

            <div class="link-card">
                <h3>📊 Dashboard</h3>
                <p>Real-time monitoring of API calls, statistics, and performance.</p>
                <a href="/dashboard">View Dashboard</a>
            </div>

            <div class="link-card">
                <h3>🤖 Models</h3>
                <p>See the available AI models and their details.</p>
                <a href="/v1/models">View Models</a>
            </div>
        </div>

        <div class="features">
            <h2>Features</h2>
            <div class="feature-list">
                <div class="feature-item">
                    <div>🔄</div>
                    <h3>OpenAI API Compatible</h3>
                    <p>Fully compatible with OpenAI API format — no client changes required</p>
                </div>

                <div class="feature-item">
                    <div>🌊</div>
                    <h3>Streaming Support</h3>
                    <p>Supports real-time streaming output for a better user experience</p>
                </div>

                <div class="feature-item">
                    <div>🔐</div>
                    <h3>Authentication</h3>
                    <p>API key validation to secure the service</p>
                </div>

                <div class="feature-item">
                    <div>🛠️</div>
                    <h3>Flexible Configuration</h3>
                    <p>Configured via environment variables</p>
                </div>

                <div class="feature-item">
                    <div>📝</div>
                    <h3>Thinking Display</h3>
                    <p>Intelligently processes and displays the model's thinking</p>
                </div>

                <div class="feature-item">
                    <div>📊</div>
                    <h3>Real-time Monitoring</h3>
                    <p>Provides a web dashboard to show live forwarding and stats</p>
                </div>
            </div>
        </div>

        <footer>
            <p>© 2024 ZtoApi. Powered by Deno & Z.ai GLM-4.5</p>
        </footer>
    </div>
</body>
</html>`;
}

async function handleIndex(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response(getIndexHTML(), {
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
      enable_thinking: modelConfig.capabilities.thinking,
      image_generation: false,
      web_search: false,
      auto_web_search: false,
      preview_mode: modelConfig.capabilities.vision
    },
    background_tasks: {
      title_generation: false,
      tags_generation: false
    },
    mcp_servers: modelConfig.capabilities.mcp ? [] : undefined,
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
      return await handleStreamResponse(upstreamReq, chatID, authToken, startTime, path, userAgent, req, modelConfig);
    } else {
      return await handleNonStreamResponse(upstreamReq, chatID, authToken, startTime, path, userAgent, req, modelConfig);
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
  modelConfig: ModelConfig
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
    processUpstreamStream(response.body, writer, encoder, req.model).catch(error => {
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
  modelConfig: ModelConfig
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

    const finalContent = await collectFullResponse(response.body);
    debugLog("Content collection completed, final length: %d", finalContent.length);

    const openAIResponse: OpenAIResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: req.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: finalContent
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
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
function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Dashboard</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        .stat-label {
            font-size: 14px;
            color: #6c757d;
            margin-top: 5px;
        }
        .requests-container {
            margin-top: 30px;
        }
        .requests-table {
            width: 100%;
            border-collapse: collapse;
        }
        .requests-table th, .requests-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .requests-table th {
            background-color: #f8f9fa;
        }
        .status-success {
            color: #28a745;
        }
        .status-error {
            color: #dc3545;
        }
        .refresh-info {
            text-align: center;
            margin-top: 20px;
            color: #6c757d;
            font-size: 14px;
        }
        .pagination-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 20px;
            gap: 10px;
        }
        .pagination-container button {
            padding: 5px 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .pagination-container button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .pagination-container button:hover:not(:disabled) {
            background-color: #0056b3;
        }
        .chart-container {
            margin-top: 30px;
            height: 300px;
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>API Dashboard</h1>

        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-value" id="total-requests">0</div>
                <div class="stat-label">Total Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="successful-requests">0</div>
                <div class="stat-label">Successful Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="failed-requests">0</div>
                <div class="stat-label">Failed Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="avg-response-time">0s</div>
                <div class="stat-label">Average Response Time</div>
            </div>
        </div>

        <div class="chart-container">
            <h2>Request Statistics Chart</h2>
            <canvas id="requestsChart"></canvas>
        </div>

        <div class="requests-container">
            <h2>Live Requests</h2>
            <table class="requests-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Model</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>User Agent</th>
                    </tr>
                </thead>
                <tbody id="requests-tbody">
                    <!-- request rows injected by JavaScript -->
                </tbody>
            </table>
            <div class="pagination-container">
                <button id="prev-page" disabled>Prev</button>
                <span id="page-info">Page 1 of 1</span>
                <button id="next-page" disabled>Next</button>
            </div>
        </div>

        <div class="refresh-info">
            Data refreshes automatically every 5 seconds
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        let allRequests = [];
        let currentPage = 1;
        const itemsPerPage = 10;
        let requestsChart = null;

        function updateStats() {
            fetch('/dashboard/stats')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('total-requests').textContent = data.totalRequests || 0;
                    document.getElementById('successful-requests').textContent = data.successfulRequests || 0;
                    document.getElementById('failed-requests').textContent = data.failedRequests || 0;
                    document.getElementById('avg-response-time').textContent = ((data.averageResponseTime || 0) / 1000).toFixed(2) + 's';
                })
                .catch(error => console.error('Error fetching stats:', error));
        }

        function updateRequests() {
            fetch('/dashboard/requests')
                .then(response => response.json())
                .then(data => {
                    if (!Array.isArray(data)) {
                        console.error('Returned data is not an array:', data);
                        return;
                    }

                    allRequests = data;

                    allRequests.sort((a, b) => {
                        const timeA = new Date(a.timestamp);
                        const timeB = new Date(b.timestamp);
                        return timeB - timeA;
                    });

                    updateTable();
                    updateChart();
                    updatePagination();
                })
                .catch(error => console.error('Error fetching requests:', error));
        }

        function updateTable() {
            const tbody = document.getElementById('requests-tbody');
            tbody.innerHTML = '';

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentRequests = allRequests.slice(startIndex, endIndex);

            currentRequests.forEach(request => {
                const row = document.createElement('tr');

                let timeStr = "Invalid Date";
                if (request.timestamp) {
                    try {
                        const time = new Date(request.timestamp);
                        if (!isNaN(time.getTime())) {
                            timeStr = time.toLocaleTimeString();
                        }
                    } catch (e) {
                        console.error("Time formatting error:", e);
                    }
                }

                let modelName = "GLM-4.5";
                if (request.path && request.path.includes('glm-4.5v')) {
                    modelName = "GLM-4.5V";
                } else if (request.model) {
                    modelName = request.model;
                }

                const statusClass = request.status >= 200 && request.status < 300 ? 'status-success' : 'status-error';
                const status = request.status || "undefined";

                let userAgent = request.user_agent || "undefined";
                if (userAgent.length > 30) {
                    userAgent = userAgent.substring(0, 30) + "...";
                }

                row.innerHTML = "<td>" + timeStr + "</td>" + "<td>" + modelName + "</td>" + "<td>" + (request.method || "undefined") + "</td>" + "<td class='" + statusClass + "'>" + status + "</td>" + "<td>" + ((request.duration / 1000).toFixed(2) || "undefined") + "s</td>" + "<td title='" + (request.user_agent || "") + "'>" + userAgent + "</td>";

                tbody.appendChild(row);
            });
        }

        function updatePagination() {
            const totalPages = Math.ceil(allRequests.length / itemsPerPage);
            document.getElementById('page-info').textContent = "Page " + currentPage + " of " + totalPages;

            document.getElementById('prev-page').disabled = currentPage <= 1;
            document.getElementById('next-page').disabled = currentPage >= totalPages;
        }

        function updateChart() {
            const ctx = document.getElementById('requestsChart').getContext('2d');

            const chartData = allRequests.slice(0, 20).reverse();
            const labels = chartData.map(req => {
                const time = new Date(req.timestamp);
                return time.toLocaleTimeString();
            });
            const responseTimes = chartData.map(req => req.duration);

            if (requestsChart) {
                requestsChart.destroy();
            }

            requestsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Response Time (s)',
                        data: responseTimes.map(time => time / 1000),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Response Time (s)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Time'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Response time trend for last 20 requests (s)'
                        }
                    }
                }
            });
        }

        document.getElementById('prev-page').addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updateTable();
                updatePagination();
            }
        });

        document.getElementById('next-page').addEventListener('click', function() {
            const totalPages = Math.ceil(allRequests.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updateTable();
                updatePagination();
            }
        });

        updateStats();
        updateRequests();

        setInterval(updateStats, 5000);
        setInterval(updateRequests, 5000);
    </script>
</body>
</html>`;
}

/**
 * Dashboard request handlers
 */
async function handleDashboard(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response(getDashboardHTML(), {
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

function getDocsHTML(): string {
return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ZtoApi Docs</title>
<style>
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
        line-height: 1.6;
    }
    .container {
        max-width: 1200px;
        margin: 0 auto;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 30px;
    }
    h1 {
        color: #333;
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #007bff;
        padding-bottom: 10px;
    }
    h2 {
        color: #007bff;
        margin-top: 30px;
        margin-bottom: 15px;
    }
    h3 {
        color: #333;
        margin-top: 25px;
        margin-bottom: 10px;
    }
    .endpoint {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 20px;
        border-left: 4px solid #007bff;
    }
    .method {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        margin-right: 10px;
        font-size: 14px;
    }
    .get { background-color: #28a745; }
    .post { background-color: #007bff; }
    .path {
        font-family: monospace;
        background-color: #e9ecef;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 16px;
    }
    .description {
        margin: 15px 0;
    }
    .parameters {
        margin: 15px 0;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
    }
    th, td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    th {
        background-color: #f8f9fa;
        font-weight: bold;
    }
    .example {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 15px;
        margin: 15px 0;
        font-family: monospace;
        white-space: pre-wrap;
        overflow-x: auto;
    }
    .note {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 10px 15px;
        margin: 15px 0;
        border-radius: 0 4px 4px 0;
    }
    .response {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 15px;
        margin: 15px 0;
        font-family: monospace;
        white-space: pre-wrap;
        overflow-x: auto;
    }
    .tab {
        overflow: hidden;
        border: 1px solid #ccc;
        background-color: #f1f1f1;
        border-radius: 4px 4px 0 0;
    }
    .tab button {
        background-color: inherit;
        float: left;
        border: none;
        outline: none;
        cursor: pointer;
        padding: 14px 16px;
        transition: 0.3s;
        font-size: 16px;
    }
    .tab button:hover {
        background-color: #ddd;
    }
    .tab button.active {
        background-color: #ccc;
    }
    .tabcontent {
        display: none;
        padding: 6px 12px;
        border: 1px solid #ccc;
        border-top: none;
        border-radius: 0 0 4px 4px;
    }
    .toc {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 20px;
    }
    .toc ul {
        padding-left: 20px;
    }
    .toc li {
        margin: 5px 0;
    }
    .toc a {
        color: #007bff;
        text-decoration: none;
    }
    .toc a:hover {
        text-decoration: underline;
    }
</style>
</head>
<body>
<div class="container">
    <h1>ZtoApi Documentation</h1>

    <div class="toc">
        <h2>Contents</h2>
        <ul>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#authentication">Authentication</a></li>
            <li><a href="#endpoints">API Endpoints</a>
                <ul>
                    <li><a href="#models">Get Models</a></li>
                    <li><a href="#chat-completions">Chat Completions</a></li>
                </ul>
            </li>
            <li><a href="#examples">Examples</a></li>
            <li><a href="#error-handling">Error Handling</a></li>
        </ul>
    </div>

    <section id="overview">
        <h2>Overview</h2>
        <p>This is an OpenAI-compatible proxy for Z.ai GLM-4.5 models. It allows interactions using standard OpenAI API formats and supports streaming and non-streaming responses.</p>
        <p><strong>Base URL:</strong> <code>http://localhost:9090/v1</code></p>
        <div class="note">
            <strong>Note:</strong> Default port is 9090 and can be changed via PORT environment variable.
        </div>
    </section>

    <section id="authentication">
        <h2>Authentication</h2>
        <p>All API requests must include a valid API key in the request header:</p>
        <div class="example">
Authorization: Bearer your-api-key</div>
        <p>The default API key is <code>sk-your-key</code>. Change it with the <code>DEFAULT_KEY</code> environment variable.</p>
    </section>

    <section id="endpoints">
        <h2>API Endpoints</h2>

        <div class="endpoint" id="models">
            <h3>Get Models</h3>
            <div>
                <span class="method get">GET</span>
                <span class="path">/v1/models</span>
            </div>
            <div class="description">
                <p>Returns the list of available models.</p>
            </div>
            <div class="parameters">
                <h4>Request Parameters</h4>
                <p>None</p>
            </div>
            <div class="response">
{
  "object": "list",
  "data": [
    {
      "id": "GLM-4.5",
      "object": "model",
      "created": 1756788845,
      "owned_by": "z.ai"
    }
  ]
}</div>
        </div>

        <div class="endpoint" id="chat-completions">
            <h3>Chat Completions</h3>
            <div>
                <span class="method post">POST</span>
                <span class="path">/v1/chat/completions</span>
            </div>
            <div class="description">
                <p>Generate model responses from a list of messages. Supports streaming and non-streaming modes.</p>
            </div>
            <div class="parameters">
                <h4>Request Parameters</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>model</td>
                            <td>string</td>
                            <td>yes</td>
                            <td>Model ID to use, e.g. "GLM-4.5"</td>
                        </tr>
                        <tr>
                            <td>messages</td>
                            <td>array</td>
                            <td>yes</td>
                            <td>List of messages containing role and content</td>
                        </tr>
                        <tr>
                            <td>stream</td>
                            <td>boolean</td>
                            <td>no</td>
                            <td>Whether to use streaming responses; default true</td>
                        </tr>
                        <tr>
                            <td>temperature</td>
                            <td>number</td>
                            <td>no</td>
                            <td>Sampling temperature to control randomness</td>
                        </tr>
                        <tr>
                            <td>max_tokens</td>
                            <td>integer</td>
                            <td>no</td>
                            <td>Maximum tokens to generate</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="parameters">
                <h4>Message Format</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>role</td>
                            <td>string</td>
                            <td>Message role: system, user, assistant</td>
                        </tr>
                        <tr>
                            <td>content</td>
                            <td>string</td>
                            <td>Message content</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <section id="examples">
        <h2>Examples</h2>

        <div class="tab">
            <button class="tablinks active" onclick="openTab(event, 'python-tab')">Python</button>
            <button class="tablinks" onclick="openTab(event, 'curl-tab')">cURL</button>
            <button class="tablinks" onclick="openTab(event, 'javascript-tab')">JavaScript</button>
        </div>

        <div id="python-tab" class="tabcontent" style="display: block;">
            <h3>Python Example</h3>
            <div class="example">
import openai

# Configure client
client = openai.OpenAI(
api_key="your-api-key",  # corresponds to DEFAULT_KEY
base_url="http://localhost:9090/v1"
)

# Non-streaming example - GLM-4.5
response = client.chat.completions.create(
model="GLM-4.5",
messages=[{"role": "user", "content": "Hello, please introduce yourself"}]
)

print(response.choices[0].message.content)</div>
        </div>

        <div id="curl-tab" class="tabcontent">
            <h3>cURL Example</h3>
            <div class="example">
# Non-streaming
curl -X POST http://localhost:9090/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-api-key" \
-d '{
"model": "GLM-4.5",
"messages": [{"role": "user", "content": "Hello"}],
"stream": false
}'

# Streaming
curl -X POST http://localhost:9090/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-api-key" \
-d '{
"model": "GLM-4.5",
"messages": [{"role": "user", "content": "Hello"}],
"stream": true
}'</div>
        </div>

        <div id="javascript-tab" class="tabcontent">
            <h3>JavaScript Example</h3>
            <div class="example">
const fetch = require('node-fetch');

async function chatWithGLM(message, stream = false) {
const response = await fetch('http://localhost:9090/v1/chat/completions', {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer your-api-key'
},
body: JSON.stringify({
  model: 'GLM-4.5',
  messages: [{ role: 'user', content: message }],
  stream: stream
})
});

if (stream) {
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        console.log('\nStream complete');
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }
}
} else {
const data = await response.json();
console.log(data.choices[0].message.content);
}
}

// Example usage
chatWithGLM('Hello, please introduce JavaScript', false);</div>
        </div>
    </section>

    <section id="error-handling">
        <h2>Error Handling</h2>
        <p>The API uses standard HTTP status codes to denote success or failure:</p>
        <table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>200 OK</td>
                    <td>Request succeeded</td>
                </tr>
                <tr>
                    <td>400 Bad Request</td>
                    <td>Request malformed or invalid parameters</td>
                </tr>
                <tr>
                    <td>401 Unauthorized</td>
                    <td>API key invalid or missing</td>
                </tr>
                <tr>
                    <td>502 Bad Gateway</td>
                    <td>Upstream service error</td>
                </tr>
            </tbody>
        </table>
        <div class="note">
            <strong>Note:</strong> In debug mode the server logs detailed information. Enable with DEBUG_MODE=true.
        </div>
    </section>
</div>

<script>
    function openTab(evt, tabName) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";
    }
</script>
</body>
</html>`;
}

/**
 * Docs page handler
 */
async function handleDocs(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response(getDocsHTML(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
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
