/**
 * Anthropic API implementation for ZtoApi-Deno
 * Complete rewrite for stability and proper format compliance
 * 
 * @author ZtoApi Team
 * @version 2.0.0
 * @since 2024
 */

// Temporary simple tokenizer to avoid import issues
function simpleTokenize(text: string): number {
  // Rough approximation: 1 token per 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Anthropic API interfaces
 */
interface AnthropicTextContent {
  type: "text";
  text: string;
}

interface AnthropicImageContent {
  type: "image";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
}

interface AnthropicToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface AnthropicToolResultContent {
  type: "tool_result";
  tool_use_id: string;
  content?: string | AnthropicTextContent[];
  is_error?: boolean;
}

type AnthropicContent = AnthropicTextContent | AnthropicImageContent | AnthropicToolUseContent | AnthropicToolResultContent;

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContent[];
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface AnthropicToolChoice {
  type: "auto" | "any" | "tool";
  name?: string;
}

interface AnthropicMessagesRequest {
  model: string;
  max_tokens?: number;
  messages: AnthropicMessage[];
  system?: string | Array<{ type: "text"; text: string }>;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  stop_sequences?: string[];
  tools?: AnthropicTool[];
  tool_choice?: AnthropicToolChoice;
}

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicMessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: AnthropicContent[];
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | null;
  stop_sequence: string | null;
  usage: AnthropicUsage;
}

interface AnthropicStreamEvent {
  type: "message_start" | "content_block_start" | "content_block_delta" | "content_block_stop" | "message_delta" | "message_stop" | "error";
  message?: Partial<AnthropicMessagesResponse>;
  content_block?: AnthropicContent;
  delta?: {
    type: "text_delta" | "input_json_delta";
    text?: string;
    partial_json?: string;
    stop_reason?: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | null;
    stop_sequence?: string | null;
  };
  index?: number;
  usage?: { output_tokens: number };
}

interface AnthropicTokenCountRequest {
  model: string;
  system?: string | Array<{ type: "text"; text: string }>;
  messages: AnthropicMessage[];
}

interface AnthropicTokenCountResponse {
  input_tokens: number;
}

interface AnthropicModel {
  id: string;
  object: "model";
  created: number;
  type: "claude";
}

interface AnthropicError {
  type: "error";
  error: {
    type: "invalid_request_error" | "authentication_error" | "permission_error" | "rate_limit_error" | "api_error" | "overloaded_error" | "timeout_error" | "billing_error" | "not_found_error";
    message: string;
  };
}

/**
 * Claude model mapping configuration
 */
interface ClaudeModelMapping {
  claudeModel: string;
  zaiModel: string;
  category: "haiku" | "sonnet" | "opus" | "glm";
  description: string;
}

const CLAUDE_MODEL_MAPPINGS: ClaudeModelMapping[] = [
  // === CLAUDE 4.x SERIES (ACTUAL EXISTING MODELS) ===
  // Sonnet 4.5 (Latest Sonnet)
  { claudeModel: "claude-sonnet-4-5-20250929", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "🚀 LATEST! Claude Sonnet 4.5 (Sep 2025)" },
  { claudeModel: "claude-4.5-sonnet", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "🚀 Claude Sonnet 4.5 generic" },
  
  // Opus 4.1 (Latest Opus - Most Capable)
  { claudeModel: "claude-opus-4-1-20250805", zaiModel: "GLM-4-6-API-V1", category: "opus", description: "🏆 LATEST! Claude Opus 4.1 (Aug 2025) - Ultimate capability" },
  { claudeModel: "claude-4.1-opus", zaiModel: "GLM-4-6-API-V1", category: "opus", description: "🏆 Claude Opus 4.1 generic" },
  
  // Opus 4.0 
  { claudeModel: "claude-opus-4-20250514", zaiModel: "GLM-4-6-API-V1", category: "opus", description: "🏆 Claude Opus 4.0 (May 2025)" },
  { claudeModel: "claude-4-opus", zaiModel: "GLM-4-6-API-V1", category: "opus", description: "🏆 Claude Opus 4.0 generic" },
  
  // Sonnet 4.0
  { claudeModel: "claude-sonnet-4-20250514", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "🎯 Claude Sonnet 4.0 (May 2025)" },
  { claudeModel: "claude-4-sonnet", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "🎯 Claude Sonnet 4.0 generic" },

  // === CLAUDE 3.x SERIES ===
  // Claude 3.7 Sonnet (New!)
  { claudeModel: "claude-3-7-sonnet-20250219", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "⚡ NEW! Claude 3.7 Sonnet (Feb 2025)" },
  { claudeModel: "claude-3.7-sonnet", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "⚡ Claude 3.7 Sonnet generic" },
  
  // Claude 3.5 Haiku (Latest Haiku)
  { claudeModel: "claude-3-5-haiku-20241022", zaiModel: "glm-4.5v", category: "haiku", description: "🚀 Claude 3.5 Haiku (Oct 2024) - Fast multimodal" },
  
  // Claude 3 Haiku (Original)
  { claudeModel: "claude-3-haiku-20240307", zaiModel: "glm-4.5v", category: "haiku", description: "Claude 3 Haiku (Mar 2024) - Fast lightweight" },
  
  // Previous Claude 3.5 Sonnets (keeping for compatibility)
  { claudeModel: "claude-3-5-sonnet-20241022", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "Claude 3.5 Sonnet (Oct 2024)" },
  { claudeModel: "claude-3-5-sonnet-20240620", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "Claude 3.5 Sonnet (June 2024)" },
  
  // Claude 3 Sonnet/Opus (Original)
  { claudeModel: "claude-3-sonnet-20240229", zaiModel: "0727-360B-API", category: "sonnet", description: "Claude 3 Sonnet (Feb 2024) - Balanced" },
  { claudeModel: "claude-3-opus-20240229", zaiModel: "GLM-4-6-API-V1", category: "opus", description: "Claude 3 Opus (Feb 2024) - High capability" },
  
  // === GENERIC MODEL NAMES (Auto-Latest) ===
  { claudeModel: "claude-3-haiku", zaiModel: "glm-4.5v", category: "haiku", description: "Generic Claude 3 haiku → latest haiku" },
  { claudeModel: "claude-3-sonnet", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "Generic Claude 3 sonnet → latest 3.x sonnet" },
  { claudeModel: "claude-3-opus", zaiModel: "GLM-4-6-API-V1", category: "opus", description: "Generic Claude 3 opus → Claude 3 Opus" },
  { claudeModel: "claude-4-opus", zaiModel: "GLM-4-6-API-V1", category: "opus", description: "Generic Claude 4 opus → latest opus" },
  { claudeModel: "claude-4-sonnet", zaiModel: "GLM-4-6-API-V1", category: "sonnet", description: "Generic Claude 4 sonnet → latest sonnet" },
  
  // === GLM COMPATIBILITY MAPPINGS (Direct Access) ===
  // Exact GLM model names for direct access via Claude API
  { claudeModel: "glm-4.5", zaiModel: "0727-360B-API", category: "glm", description: "Direct GLM-4.5 access" },
  { claudeModel: "glm-4.6", zaiModel: "GLM-4-6-API-V1", category: "glm", description: "Direct GLM-4.6 access" },
  { claudeModel: "glm-4.5v", zaiModel: "glm-4.5v", category: "glm", description: "Direct GLM-4.5V multimodal access" },
  
  // Alternative naming for GLM models
  { claudeModel: "glm4.5", zaiModel: "0727-360B-API", category: "glm", description: "GLM-4.5 alt naming" },
  { claudeModel: "glm4.6", zaiModel: "GLM-4-6-API-V1", category: "glm", description: "GLM-4.6 alt naming" },
  { claudeModel: "glm4.5v", zaiModel: "glm-4.5v", category: "glm", description: "GLM-4.5V alt naming" },
  
  // Underscore variants
  { claudeModel: "glm_4.5", zaiModel: "0727-360B-API", category: "glm", description: "GLM-4.5 underscore variant" },
  { claudeModel: "glm_4.6", zaiModel: "GLM-4-6-API-V1", category: "glm", description: "GLM-4.6 underscore variant" },
  { claudeModel: "glm_4.5v", zaiModel: "glm-4.5v", category: "glm", description: "GLM-4.5V underscore variant" },
];

/**
 * Map Claude model name to Z.ai model
 */
function mapClaudeToZaiModel(claudeModel: string): string {
  const normalizedModel = claudeModel.toLowerCase().trim();
  
  const mapping = CLAUDE_MODEL_MAPPINGS.find(m => 
    m.claudeModel.toLowerCase() === normalizedModel
  );
  
  if (mapping) {
    console.log(`🔄 Claude model mapping: ${claudeModel} → ${mapping.zaiModel} (${mapping.category})`);
    return mapping.zaiModel;
  }
  
  // Pattern-based fallbacks
  if (normalizedModel.includes("haiku")) return "glm-4.5v";
  if (normalizedModel.includes("sonnet") || normalizedModel.includes("glm-4.6")) return "GLM-4-6-API-V1";
  if (normalizedModel.includes("opus")) return "GLM-4-6-API-V1";
  if (normalizedModel.includes("glm-4.5")) return "0727-360B-API";
  
  console.log(`⚠️ Unknown Claude model: ${claudeModel}, using default GLM-4-6-API-V1`);
  return "GLM-4-6-API-V1";
}

/**
 * Convert Anthropic request to OpenAI-compatible format
 */
function convertAnthropicToOpenAI(request: AnthropicMessagesRequest): any {
  const messages: any[] = [];
  
  // Add system message if present
  if (request.system) {
    let systemContent = "";
    if (typeof request.system === "string") {
      systemContent = request.system;
    } else if (Array.isArray(request.system)) {
      systemContent = request.system
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("\n");
    }
    
    if (systemContent.trim()) {
      messages.push({
        role: "system",
        content: systemContent
      });
    }
  }
  
  // Convert Anthropic messages to OpenAI format
  for (const message of request.messages) {
    const openaiMessage: any = {
      role: message.role
    };
    
    if (typeof message.content === "string") {
      openaiMessage.content = message.content;
    } else if (Array.isArray(message.content)) {
      const contentParts: any[] = [];
      const toolCalls: any[] = [];
      
      for (const part of message.content) {
        switch (part.type) {
          case "text":
            contentParts.push({
              type: "text",
              text: part.text
            });
            break;
            
          case "image":
            const source = part.source;
            if (source.type === "base64") {
              contentParts.push({
                type: "image_url",
                image_url: {
                  url: `data:${source.media_type};base64,${source.data}`
                }
              });
            }
            break;
            
          case "tool_use":
            toolCalls.push({
              id: part.id,
              type: "function",
              function: {
                name: part.name,
                arguments: JSON.stringify(part.input)
              }
            });
            break;
            
          case "tool_result":
            let toolContent = "";
            if (typeof part.content === "string") {
              toolContent = part.content;
            } else if (Array.isArray(part.content)) {
              toolContent = part.content
                .filter(item => item.type === "text")
                .map(item => item.text)
                .join("\n");
            }
            
            messages.push({
              role: "tool",
              content: toolContent,
              tool_call_id: part.tool_use_id
            });
            continue;
        }
      }
      
      if (toolCalls.length > 0) {
        openaiMessage.tool_calls = toolCalls;
        const textContent = contentParts
          .filter(part => part.type === "text")
          .map(part => part.text)
          .join("\n");
        openaiMessage.content = textContent || null;
      } else if (contentParts.length > 0) {
        openaiMessage.content = contentParts;
      } else {
        openaiMessage.content = "";
      }
    }
    
    messages.push(openaiMessage);
  }
  
  // Build the OpenAI request
  const openaiRequest: any = {
    model: mapClaudeToZaiModel(request.model),
    messages,
    stream: request.stream || false
  };
  
  // Add max_tokens if specified
  if (request.max_tokens !== undefined) {
    openaiRequest.max_tokens = request.max_tokens;
  }
  
  // Add optional parameters
  if (request.temperature !== undefined) {
    openaiRequest.temperature = request.temperature;
  }
  if (request.top_p !== undefined) {
    openaiRequest.top_p = request.top_p;
  }
  if (request.stop_sequences && request.stop_sequences.length > 0) {
    openaiRequest.stop = request.stop_sequences;
  }
  
  // Convert tools if present
  if (request.tools && request.tools.length > 0) {
    openaiRequest.tools = request.tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema
      }
    }));
    
    if (request.tool_choice) {
      switch (request.tool_choice.type) {
        case "auto":
          openaiRequest.tool_choice = "auto";
          break;
        case "any":
          openaiRequest.tool_choice = "required";
          break;
        case "tool":
          if (request.tool_choice.name) {
            openaiRequest.tool_choice = {
              type: "function",
              function: { name: request.tool_choice.name }
            };
          }
          break;
      }
    }
  }
  
  return openaiRequest;
}

/**
 * Convert OpenAI response to Anthropic format
 */
function convertOpenAIToAnthropic(
  response: any, 
  originalModel: string,
  requestId: string
): AnthropicMessagesResponse {
  const choice = response.choices?.[0];
  if (!choice) {
    throw new Error("Invalid OpenAI response: no choices found");
  }
  
  const message = choice.message;
  const content: AnthropicContent[] = [];
  
  // Add text content if present
  if (message.content && typeof message.content === "string" && message.content.trim()) {
    content.push({
      type: "text",
      text: message.content
    });
  }
  
  // Add tool calls if present
  if (message.tool_calls && Array.isArray(message.tool_calls)) {
    for (const toolCall of message.tool_calls) {
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(toolCall.function.arguments);
      } catch {
        // If parsing fails, use empty object
      }
      
      content.push({
        type: "tool_use",
        id: toolCall.id,
        name: toolCall.function.name,
        input
      });
    }
  }
  
  // Convert finish reason
  let stopReason: AnthropicMessagesResponse["stop_reason"] = "end_turn";
  switch (choice.finish_reason) {
    case "length":
      stopReason = "max_tokens";
      break;
    case "function_call":
    case "tool_calls":
      stopReason = "tool_use";
      break;
    case "content_filter":
      stopReason = "stop_sequence";
      break;
    default:
      stopReason = "end_turn";
  }
  
  const usage = response.usage || {};
  
  return {
    id: `msg_${requestId}`,
    type: "message",
    role: "assistant",
    model: originalModel,
    content,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0
    }
  };
}

/**
 * Count tokens using gpt-tokenizer
 */
function countTokens(request: AnthropicTokenCountRequest): number {
  let text = "";
  
  // Add system text
  if (request.system) {
    if (typeof request.system === "string") {
      text += request.system + "\n";
    } else if (Array.isArray(request.system)) {
      text += request.system
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("\n") + "\n";
    }
  }
  
  // Add message text
  for (const message of request.messages) {
    text += `${message.role}: `;
    
    if (typeof message.content === "string") {
      text += message.content;
    } else if (Array.isArray(message.content)) {
      text += message.content
        .filter(part => part.type === "text")
        .map(part => (part as AnthropicTextContent).text)
        .join("\n");
    }
    
    text += "\n";
  }
  
  try {
    return simpleTokenize(text);
  } catch (error) {
    console.warn("Token counting failed, using character-based estimation:", error);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Process streaming response and convert to Anthropic format
 */
async function* processAnthropicStream(
  body: ReadableStream<Uint8Array>,
  originalModel: string,
  requestId: string
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let messageStarted = false;
  let contentBlockStarted = false;
  let inputTokens = 0;
  let outputTokens = 0;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.substring(6).trim();
          if (dataStr === "[DONE]") {
            // Send message_stop event
            yield `event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n`;
            return;
          }
          
          try {
            const chunk = JSON.parse(dataStr);
            const choice = chunk.choices?.[0];
            
            if (!choice) continue;
            
            // Send message_start if this is the first chunk
            if (!messageStarted) {
              messageStarted = true;
              
              const startEvent: AnthropicStreamEvent = {
                type: "message_start",
                message: {
                  id: `msg_${requestId}`,
                  type: "message",
                  role: "assistant",
                  model: originalModel,
                  content: [],
                  stop_reason: null,
                  usage: { input_tokens: 0, output_tokens: 0 }
                }
              };
              
              yield `event: message_start\ndata: ${JSON.stringify(startEvent)}\n\n`;
            }
            
            const delta = choice.delta || {};
            
            // Handle text content
            if (delta.content && typeof delta.content === "string") {
              // Send content_block_start if this is the first content
              if (!contentBlockStarted) {
                contentBlockStarted = true;
                const blockStartEvent: AnthropicStreamEvent = {
                  type: "content_block_start",
                  index: 0,
                  content_block: {
                    type: "text",
                    text: ""
                  }
                };
                yield `event: content_block_start\ndata: ${JSON.stringify(blockStartEvent)}\n\n`;
              }
              
              // Send content delta
              const deltaEvent: AnthropicStreamEvent = {
                type: "content_block_delta",
                index: 0,
                delta: {
                  type: "text_delta",
                  text: delta.content
                }
              };
              yield `event: content_block_delta\ndata: ${JSON.stringify(deltaEvent)}\n\n`;
            }
            
            // Handle completion
            if (choice.finish_reason) {
              // Send content_block_stop if we had content
              if (contentBlockStarted) {
                const blockStopEvent: AnthropicStreamEvent = {
                  type: "content_block_stop",
                  index: 0
                };
                yield `event: content_block_stop\ndata: ${JSON.stringify(blockStopEvent)}\n\n`;
              }
              
              // Map finish reason
              let stopReason: AnthropicMessagesResponse["stop_reason"] = "end_turn";
              switch (choice.finish_reason) {
                case "length":
                  stopReason = "max_tokens";
                  break;
                case "function_call":
                case "tool_calls":
                  stopReason = "tool_use";
                  break;
                case "content_filter":
                  stopReason = "stop_sequence";
                  break;
                default:
                  stopReason = "end_turn";
              }
              
              // Get usage info
              if (chunk.usage) {
                outputTokens = chunk.usage.completion_tokens || 0;
                inputTokens = chunk.usage.prompt_tokens || 0;
              }
              
              // Send message_delta
              const messageDeltaEvent: AnthropicStreamEvent = {
                type: "message_delta",
                delta: {
                  type: "text_delta",
                  stop_reason: stopReason,
                  stop_sequence: null
                },
                usage: { output_tokens: outputTokens }
              };
              yield `event: message_delta\ndata: ${JSON.stringify(messageDeltaEvent)}\n\n`;
              
              // Send message_stop
              yield `event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n`;
              return;
            }
            
          } catch (error) {
            console.warn("Failed to parse streaming chunk:", error);
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in Anthropic stream processing:", error);
    // Send error event
    const errorEvent = {
      type: "error",
      error: {
        type: "api_error",
        message: "Stream processing error"
      }
    };
    yield `event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore lock release errors
    }
  }
}

/**
 * Get list of available Claude models
 */
function getClaudeModels(): AnthropicModel[] {
  return CLAUDE_MODEL_MAPPINGS.map(mapping => ({
    id: mapping.claudeModel,
    object: "model",
    created: Math.floor(Date.now() / 1000),
    type: "claude"
  }));
}

/**
 * Create error response
 */
function createErrorResponse(
  type: AnthropicError["error"]["type"], 
  message: string
): AnthropicError {
  return {
    type: "error",
    error: {
      type,
      message
    }
  };
}

export {
  type AnthropicMessagesRequest,
  type AnthropicMessagesResponse,
  type AnthropicTokenCountRequest,
  type AnthropicTokenCountResponse,
  type AnthropicStreamEvent,
  type AnthropicModel,
  type AnthropicError,
  mapClaudeToZaiModel,
  convertAnthropicToOpenAI,
  convertOpenAIToAnthropic,
  countTokens,
  processAnthropicStream,
  getClaudeModels,
  createErrorResponse,
  CLAUDE_MODEL_MAPPINGS
};