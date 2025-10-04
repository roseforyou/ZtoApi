# X-Think-Tags-Mode Header Usage Examples 🚀

The `X-Think-Tags-Mode` header allows you to customize how thinking content is processed on a per-request basis! This gives you complete control over how the model's reasoning is displayed. ✨

## Available Modes

- **"strip"** - Remove `<details>` tags and show only the final content
- **"think"** - Convert `<details>` tags to `<thinking>` tags 
- **"raw"** - Keep the content exactly as-is from the upstream
- **"separate"** - Separate reasoning into `reasoning_content` field (default)

## Usage Examples

### Example 1: Strip thinking content
```bash
curl -X POST "http://localhost:9090/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Think-Tags-Mode: strip" \
  -d '{
    "model": "GLM-4.5",
    "messages": [
      {"role": "user", "content": "Explain quantum computing"}
    ],
    "stream": false
  }'
```

### Example 2: Convert to thinking tags
```bash
curl -X POST "http://localhost:9090/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Think-Tags-Mode: think" \
  -d '{
    "model": "GLM-4.5",
    "messages": [
      {"role": "user", "content": "Write a poem about AI"}
    ],
    "stream": true
  }'
```

### Example 3: Get raw content
```bash
curl -X POST "http://localhost:9090/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Think-Tags-Mode: raw" \
  -d '{
    "model": "GLM-4.5",
    "messages": [
      {"role": "user", "content": "Debug this code"}
    ]
  }'
```

### Example 4: Separate reasoning (default behavior)
```bash
curl -X POST "http://localhost:9090/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Think-Tags-Mode: separate" \
  -d '{
    "model": "GLM-4.5",
    "messages": [
      {"role": "user", "content": "Solve this complex problem"}
    ]
  }'
```

## Response Format Differences

### Strip Mode Response
```json
{
  "choices": [{
    "message": {
      "content": "Here's the final answer without the thinking process...",
      "role": "assistant"
    }
  }]
}
```

### Think Mode Response
```json
{
  "choices": [{
    "message": {
      "content": "<thinking>Let me think through this step by step...</thinking>Here's my final answer.",
      "role": "assistant"
    }
  }]
}
```

### Separate Mode Response
```json
{
  "choices": [{
    "message": {
      "content": "Here's the final answer...",
      "reasoning_content": "Let me think through this step by step...",
      "role": "assistant"
    }
  }]
}
```

## Benefits

- **Flexibility**: Choose the best format for your use case
- **Compatibility**: Works with both streaming and non-streaming requests
- **Debugging**: Use "raw" or "think" modes to see the model's reasoning process
- **Clean Output**: Use "strip" mode for clean, final responses
- **Structured Data**: Use "separate" mode to keep reasoning and content separate

## Notes

- If the header is not provided, the server uses the default `THINK_TAGS_MODE` setting
- Invalid values in the header will fall back to the default mode with a debug warning
- The header is case-insensitive and whitespace is trimmed
- Works with all supported GLM models (GLM-4.5, GLM-4.6, GLM-4.5V)

Happy coding! 🎉