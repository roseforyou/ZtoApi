/**
 * Anthropic API Integration Module
 *
 * Provides Anthropic-compatible API endpoints for Claude AI models
 * Integrates with the existing OpenAI-compatible proxy server
 *
 * @author ZtoApi Team
 * @version 1.0.0
 * @since 2024
 */

import { encode } from "gpt-tokenizer";

// Import model normalization from main.ts
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
    console.log(`🔄 Model ID mapping: ${modelId} → ${mapped}`);
    return mapped;
  }
 
  return normalized;
}

// Function to get display name from upstream model ID
function getDisplayName(upstreamId: string): string {
  const displayNames: Record<string, string> = {
    '0727-360B-API': 'GLM-4.5',
    'GLM-4-6-API-V1': 'GLM-4.6',
    'glm-4.5v': 'GLM-4.5V'
  };
  
  return displayNames[upstreamId] || upstreamId;
}

/**
 * Anthropic API Configuration
 */
const _ANTHROPIC_BASE_URL = "https://api.anthropic.com";
const _ANTHROPIC_VERSION = "2023-06-01";

/**
 * Anthropic API request interfaces
 */
export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<{
    type: "text" | "image";
    text?: string;
    source?: {
      type: "base64";
      media_type: string;
      data: string;
    };
  }>;
}

export interface AnthropicMessagesRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
}

export interface AnthropicMessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{
    type: "text";
    text: string;
  }>;
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence";
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicModel {
  id: string;
  object: "model";
  created: number;
  type: "claude";
}

export interface AnthropicModelsResponse {
  data: AnthropicModel[];
}

export interface AnthropicCountTokensRequest {
  model: string;
  messages: AnthropicMessage[];
}

export interface AnthropicCountTokensResponse {
  input_tokens: number;
}

export interface AnthropicMessageBatchRequest {
  requests: Array<{
    custom_id: string;
    params: AnthropicMessagesRequest;
  }>;
}

export interface AnthropicMessageBatchResponse {
  id: string;
  type: "message_batch";
  status: "in_progress" | "completed" | "failed";
  results?: Array<{
    custom_id: string;
    result: AnthropicMessagesResponse;
    error?: AnthropicError;
  }>;
}

export interface AnthropicError {
  type: "error";
  error: {
    type: "invalid_request_error" | "authentication_error" | "permission_error" | 
          "rate_limit_error" | "api_error" | "overloaded_error" | "timeout_error" | 
          "billing_error" | "not_found_error";
    message: string;
  };
}

/**
 * Supported Anthropic models
 */
// Import the existing models from main.ts
export const ANTHROPIC_MODELS: AnthropicModel[] = [
  {
    id: "GLM-4.5",
    object: "model",
    created: 1698908800,
    type: "claude" // Keep as "claude" for Anthropic compatibility
  },
  {
    id: "GLM-4.6",
    object: "model",
    created: 1698908800,
    type: "claude" // Keep as "claude" for Anthropic compatibility
  },
  {
    id: "GLM-4.5V",
    object: "model",
    created: 1698908800,
    type: "claude" // Keep as "claude" for Anthropic compatibility
  }
];

/**
 * Token counting utility using gpt-tokenizer
 */
export function countTokens(text: string): number {
  try {
    const tokens = encode(text);
    return tokens.length;
  } catch (error) {
    console.error("Error counting tokens:", error);
    // Fallback: approximate tokens (roughly 4 characters per token)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens in Anthropic messages
 */
export function countTokensInMessages(messages: AnthropicMessage[]): number {
  let totalTokens = 0;
  
  for (const message of messages) {
    if (typeof message.content === "string") {
      totalTokens += countTokens(message.content);
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === "text" && content.text) {
          totalTokens += countTokens(content.text);
        }
        // Note: Image tokens are more complex to calculate, using a rough estimate
        if (content.type === "image") {
          totalTokens += 85; // Approximate token count for images
        }
      }
    }
  }
  
  return totalTokens;
}

/**
 * Convert OpenAI message format to Anthropic format
 */
export function convertOpenAIToAnthropicMessages(openaiMessages: Array<{
  role: string;
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: {url: string};
    video_url?: {url: string};
    document_url?: {url: string};
    audio_url?: {url: string};
  }>;
}>): AnthropicMessage[] {
  return openaiMessages.map(msg => {
    const anthropicMsg: AnthropicMessage = {
      role: msg.role === "system" ? "user" : msg.role as "user" | "assistant",
      content: ""
    };

    if (typeof msg.content === "string") {
      anthropicMsg.content = msg.content;
    } else if (Array.isArray(msg.content)) {
      anthropicMsg.content = msg.content.map((block: {
        type: string;
        text?: string;
        image_url?: {url: string};
        video_url?: {url: string};
        document_url?: {url: string};
        audio_url?: {url: string};
      }) => {
        if (block.type === "text") {
          return {
            type: "text" as const,
            text: block.text || ""
          };
        } else if (block.type === "image_url" && block.image_url?.url) {
          // Convert base64 data URL to Anthropic format
          const url = block.image_url.url;
          if (url.startsWith("data:image/")) {
            const [mediaInfo, base64Data] = url.split(",");
            const mediaType = mediaInfo.split(":")[1].split(";")[0];
            return {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: mediaType,
                data: base64Data
              }
            };
          }
        }
        return {
          type: "text" as const,
          text: ""
        };
      }).filter((block: {
        type: string;
        text?: string;
        image_url?: {url: string};
        video_url?: {url: string};
        document_url?: {url: string};
        audio_url?: {url: string};
      }) => block.text || block.type === "image");
    }

    return anthropicMsg;
  });
}

/**
 * Convert Anthropic response to OpenAI format
 */
export function convertAnthropicToOpenAIResponse(
  anthropicResponse: AnthropicMessagesResponse,
  model: string
): {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
} {
  return {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: anthropicResponse.content[0]?.text || ""
        },
        finish_reason: anthropicResponse.stop_reason === "end_turn" ? "stop" : anthropicResponse.stop_reason
      }
    ],
    usage: {
      prompt_tokens: anthropicResponse.usage.input_tokens,
      completion_tokens: anthropicResponse.usage.output_tokens,
      total_tokens: anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens
    }
  };
}

/**
 * Handle Anthropic messages API endpoint
 */
export async function handleAnthropicMessages(
  request: Request,
  upstreamHandler: (request: Request) => Promise<Response>
): Promise<Response> {
  try {
    const body = await request.text();
    const anthropicRequest = JSON.parse(body) as AnthropicMessagesRequest;
    
    // Normalize model ID and convert to OpenAI format for upstream processing
    const normalizedModelId = normalizeModelId(anthropicRequest.model);
    const openAIRequest = {
      model: normalizedModelId,
      messages: convertOpenAIToAnthropicMessages(anthropicRequest.messages),
      stream: anthropicRequest.stream || false,
      temperature: anthropicRequest.temperature,
      max_tokens: anthropicRequest.max_tokens,
      system: anthropicRequest.system
    };

    // Create new request with OpenAI format
    const openAIRequestObj = new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": request.headers.get("Authorization") || ""
      },
      body: JSON.stringify(openAIRequest)
    });

    // Get response from upstream
    const response = await upstreamHandler(openAIRequestObj);
    
    if (!response.ok) {
      return response;
    }

    if (anthropicRequest.stream) {
      // Handle streaming response
      return response;
    } else {
      // Convert non-streaming response to Anthropic format
      const openAIResponse = await response.json();
      
      const anthropicResponse: AnthropicMessagesResponse = {
        id: `msg_${Date.now()}`,
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: openAIResponse.choices[0]?.message?.content || ""
          }
        ],
        model: getDisplayName(normalizedModelId),
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: openAIResponse.usage?.prompt_tokens || 0,
          output_tokens: openAIResponse.usage?.completion_tokens || 0
        }
      };

      return new Response(JSON.stringify(anthropicResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }
  } catch (error) {
    console.error("Error in Anthropic messages handler:", error);
    
    const errorResponse: AnthropicError = {
      type: "error",
      error: {
        type: "api_error",
        message: "Failed to process request"
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Handle Anthropic models endpoint
 */
export function handleAnthropicModels(): Response {
  const response: AnthropicModelsResponse = {
    data: ANTHROPIC_MODELS
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true"
    }
  });
}

/**
 * Handle Anthropic count tokens endpoint
 */
export async function handleAnthropicCountTokens(request: Request): Promise<Response> {
  try {
    const text = await request.text();
    const countRequest = JSON.parse(text) as AnthropicCountTokensRequest;
    
    const tokenCount = countTokensInMessages(countRequest.messages);
    
    const response: AnthropicCountTokensResponse = {
      input_tokens: tokenCount
    };

    return new Response(JSON.stringify(response), {
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
    console.error("Error counting tokens:", error);
    
    const errorResponse: AnthropicError = {
      type: "error",
      error: {
        type: "invalid_request_error",
        message: "Failed to count tokens"
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Simple in-memory queue for message batches
const messageBatchQueue = new Map<string, {
  requests: AnthropicMessageBatchRequest;
  status: "in_progress" | "completed" | "failed";
  results?: Array<{
    custom_id: string;
    result: AnthropicMessagesResponse;
    error?: AnthropicError;
  }>;
}>();

/**
 * Handle Anthropic message batches endpoint
 */
export async function handleAnthropicMessageBatches(
  request: Request,
  upstreamHandler: (request: Request) => Promise<Response>
): Promise<Response> {
  try {
    const body = await request.text();
    const batchRequest = JSON.parse(body) as AnthropicMessageBatchRequest;
    
    // Generate batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store batch in queue
    messageBatchQueue.set(batchId, {
      requests: batchRequest,
      status: "in_progress"
    });
    
    // Process each request in the batch
    const results: Array<{
      custom_id: string;
      result: AnthropicMessagesResponse;
      error?: AnthropicError;
    }> = [];
    
    for (const batchItem of batchRequest.requests) {
      try {
        // Normalize model ID and convert to OpenAI format for upstream processing
        const normalizedModelId = normalizeModelId(batchItem.params.model);
        const openAIRequest = {
          model: normalizedModelId,
          messages: convertOpenAIToAnthropicMessages(batchItem.params.messages),
          stream: false, // Batches are always non-streaming
          temperature: batchItem.params.temperature,
          max_tokens: batchItem.params.max_tokens,
          system: batchItem.params.system
        };

        // Create new request with OpenAI format
        const openAIRequestObj = new Request("http://localhost/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": request.headers.get("Authorization") || ""
          },
          body: JSON.stringify(openAIRequest)
        });

        // Get response from upstream
        const response = await upstreamHandler(openAIRequestObj);
        
        if (response.ok) {
          const openAIResponse = await response.json();
          
          const anthropicResponse: AnthropicMessagesResponse = {
            id: `msg_${Date.now()}`,
            type: "message",
            role: "assistant",
            content: [
              {
                type: "text",
                text: openAIResponse.choices[0]?.message?.content || ""
              }
            ],
            model: getDisplayName(normalizedModelId),
            stop_reason: "end_turn",
            stop_sequence: null,
            usage: {
              input_tokens: openAIResponse.usage?.prompt_tokens || 0,
              output_tokens: openAIResponse.usage?.completion_tokens || 0
            }
          };
          
          results.push({
            custom_id: batchItem.custom_id,
            result: anthropicResponse
          });
        } else {
          results.push({
            custom_id: batchItem.custom_id,
            result: {} as AnthropicMessagesResponse,
            error: {
              type: "error",
              error: {
                type: "api_error",
                message: `Request failed with status ${response.status}`
              }
            }
          });
        }
      } catch (error) {
        results.push({
          custom_id: batchItem.custom_id,
          result: {} as AnthropicMessagesResponse,
          error: {
            type: "error",
            error: {
              type: "api_error",
              message: `Request failed: ${error instanceof Error ? error.message : String(error)}`
            }
          }
        });
      }
    }
    
    // Update batch status
    const batch = messageBatchQueue.get(batchId);
    if (batch) {
      batch.status = "completed";
      batch.results = results;
    }
    
    const batchResponse: AnthropicMessageBatchResponse = {
      id: batchId,
      type: "message_batch",
      status: "completed",
      results: results
    };

    return new Response(JSON.stringify(batchResponse), {
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
    console.error("Error in Anthropic message batches handler:", error);
    
    const errorResponse: AnthropicError = {
      type: "error",
      error: {
        type: "api_error",
        message: "Failed to process batch request"
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Set Anthropic-specific headers
 */
export function setAnthropicHeaders(headers: Headers): void {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, anthropic-version");
  headers.set("Access-Control-Allow-Credentials", "true");
}

/**
 * Validate Anthropic API key
 */
export function validateAnthropicApiKey(headers: Headers): boolean {
  const apiKey = headers.get("x-api-key");
  const authHeader = headers.get("Authorization");
  
  // Accept either x-api-key or Authorization header
  if (apiKey) {
    return apiKey.length > 10; // Basic validation
  }
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return token.length > 10; // Basic validation
  }
  
  return false;
}