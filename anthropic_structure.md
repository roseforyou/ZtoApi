# Anthropic API Structure Documentation

## Overview 🌟

Anthropic provides a comprehensive API for interacting with Claude AI models. This documentation covers the main API endpoints, their structure, and comparisons with OpenAI's API for easier migration.

## Base URL 🔗

```
https://api.anthropic.com
```

## Authentication 🔐

All API requests require authentication using API keys:

**Headers:**
- `x-api-key`: Your Anthropic API key
- `anthropic-version`: API version (e.g., "2023-06-01")
- `content-type`: "application/json"

## Main API Endpoints 🚀

### 1. Messages API (Chat Completions)

**Endpoint:** `POST /v1/messages`

This is the primary endpoint for generating responses from Claude models, equivalent to OpenAI's `/v1/chat/completions`.

#### Request Structure:

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello, Claude"
    }
  ],
  "system": "Optional system prompt",
  "temperature": 0.7,
  "top_p": 0.9,
  "stop_sequences": ["\n\nHuman:"],
  "stream": false
}
```

#### Response Structure:

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help you today?"
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 12,
    "output_tokens": 8
  }
}
```

### 2. Models List

**Endpoint:** `GET /v1/models`

Returns available Claude models.

#### Response Structure:

```json
{
  "data": [
    {
      "id": "claude-3-5-sonnet-20241022",
      "object": "model",
      "created": 1698908800,
      "type": "claude"
    }
  ]
}
```

### 3. Message Batches

**Endpoint:** `POST /v1/messages/batches`

Process multiple requests asynchronously.

#### Request Structure:

```json
{
  "requests": [
    {
      "custom_id": "request-1",
      "params": {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [
          {"role": "user", "content": "Hello"}
        ]
      }
    }
  ]
}
```

### 4. Count Tokens

**Endpoint:** `POST /v1/messages/count_tokens`

Count tokens in messages without generating a response.

#### Request Structure:

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "messages": [
    {"role": "user", "content": "Hello, world"}
  ]
}
```

#### Response Structure:

```json
{
  "input_tokens": 3
}
```

## Admin API Endpoints 🛠️

### 1. API Keys Management

**List API Keys:** `GET /v1/organizations/api_keys`
**Create API Key:** `POST /v1/organizations/api_keys`
**Get API Key:** `GET /v1/organizations/api_keys/{api_key_id}`
**Update API Key:** `POST /v1/organizations/api_keys/{api_key_id}`

### 2. Workspaces Management

**List Workspaces:** `GET /v1/organizations/workspaces`
**Update Workspace:** `POST /v1/organizations/workspaces/{workspace_id}`

### 3. Users Management

**List Users:** `GET /v1/organizations/users`
**Get User:** `GET /v1/organizations/users/{user_id}`

### 4. Invites Management

**List Invites:** `GET /v1/organizations/invites`
**Create Invite:** `POST /v1/organizations/invites`

## Available Models 🤖

| Model Name | Description |
|------------|-------------|
| `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet (latest) |
| `claude-3-opus-20240229` | Claude 3 Opus |
| `claude-3-sonnet-20240229` | Claude 3 Sonnet |
| `claude-3-haiku-20240307` | Claude 3 Haiku |
| `claude-opus-4-1-20250805` | Claude Opus 4.1 |

## Error Handling ⚠️

All errors follow this structure:

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "The provided input is invalid."
  }
}
```

### Error Types:

- `invalid_request_error`: Invalid request parameters
- `authentication_error`: Authentication failed
- `permission_error`: Insufficient permissions
- `rate_limit_error`: Rate limit exceeded
- `api_error`: General API error
- `overloaded_error`: Service overloaded
- `timeout_error`: Request timeout
- `billing_error`: Billing issue
- `not_found_error`: Resource not found

## OpenAI Compatibility 🔄

Anthropic provides an OpenAI-compatible endpoint:

**Endpoint:** `POST /v1/chat/completions`

#### Request Structure (OpenAI format):

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ]
}
```

#### Response Structure (OpenAI format):

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "claude-3-5-sonnet-20241022",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 8,
    "total_tokens": 20
  }
}
```

## Comparison with OpenAI API 📊

| Feature | OpenAI | Anthropic |
|---------|--------|-----------|
| Base URL | `https://api.openai.com` | `https://api.anthropic.com` |
| Chat Endpoint | `/v1/chat/completions` | `/v1/messages` |
| Models Endpoint | `/v1/models` | `/v1/models` |
| Auth Header | `Authorization: Bearer` | `x-api-key` |
| Version Header | Optional | Required (`anthropic-version`) |
| System Prompt | In messages array | Separate `system` parameter |
| Response Format | OpenAI format | Anthropic format |
| Streaming | Supported | Supported |
| Token Counting | `/v1/chat/completions` with `max_tokens=0` | `/v1/messages/count_tokens` |

## SDK Support 💻

### Python

```python
from anthropic import Anthropic

client = Anthropic(api_key="your-api-key")
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}]
)
```

### TypeScript/JavaScript

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'your-api-key',
});

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
});
```

## Rate Limits 🚦

- Requests per minute: Varies by plan
- Tokens per minute: Varies by plan
- Concurrent requests: Varies by plan

Check your account settings for specific limits.

## Best Practices 🎯

1. **Use appropriate models** - Choose the right model for your use case
2. **Implement retry logic** - Handle rate limits and temporary errors
3. **Cache responses** - Avoid duplicate requests
4. **Monitor usage** - Track token consumption
5. **Use streaming** - For long responses, consider streaming
6. **Set appropriate max_tokens** - Control response length
7. **Use system prompts** - Guide model behavior effectively

## Versioning 📅

Always specify the API version in your requests:

```
anthropic-version: 2023-06-01
```

Check the [Anthropic documentation](https://docs.anthropic.com) for the latest version information.

## Additional Resources 📚

- [Official Documentation](https://docs.anthropic.com)
- [API Reference](https://docs.anthropic.com/en/api)
- [Model Documentation](https://docs.anthropic.com/en/docs/models-overview)
- [Migration Guide](https://docs.anthropic.com/en/api/migrating-from-text-completions-to-messages)