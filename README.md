# 🚀 ZtoApi - OpenAI & Anthropic Claude Compatible API Proxy! 🌟

> ✅ **FULLY IMPLEMENTED** - Complete OpenAI AND Anthropic Claude API support with dual endpoints!

![Deno](https://img.shields.io/badge/deno-v1.40+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> 🎓 For personal, non-commercial or educational use only. Please use responsibly! 🌈

Hey there! 👋 Welcome to ZtoApi - your ultimate dual-API proxy that brings Z.ai's amazing GLM models to life through BOTH OpenAI AND Anthropic Claude compatible interfaces! ✨ Built with Deno's awesome native HTTP API, it supports streaming/non-streaming responses for both APIs, plus comes with a real-time monitoring dashboard! 😍

## 🎯 **DUAL API SUPPORT** - Use Either Format!

### 🔥 **OpenAI Compatible** → `/v1/` endpoints
### 🎭 **Anthropic Claude Compatible** → `/anthropic/v1/` endpoints

**Use your existing OpenAI OR Claude clients without any changes!** 🚀

## 🌟 Key Features

- 🔄 **OpenAI API fully compatible** — use your existing OpenAI clients seamlessly! 🎯
- 🎭 **Anthropic Claude API fully compatible** — use Claude Desktop, cline, cursor, and any Claude tools! 🤖
- 🌊 **SSE streaming support** for both APIs - real-time token delivery! ✨
- 🧠 **Advanced thinking content processing** with 5 amazing modes
- 📊 **Built-in web Dashboard** with live request stats for both APIs! 🎨
- 🔐 **API key authentication** with optional anonymous token fallback 🛡️
- ⚙️ **Configurable via environment variables** - make it yours! 🎛️
- 🚀 **Deployable on Deno Deploy or self-hosted** - your choice! 🏠

## 🤖 Supported Models & API Endpoints

### 🔥 **OpenAI-Compatible API** → `/v1/` endpoints
**Base URL**: `http://localhost:9090/v1`

| Model ID | GLM Model | Capabilities | Description |
|----------|-----------|--------------|-------------|
| `0727-360B-API` | GLM-4.5 | Text, Code, Tools | Balanced performance model 📝 |
| `GLM-4-6-API-V1` | GLM-4.6 | Text, Code, Tools | **🧠✨ Smartest model!** |
| `glm-4.5v` | GLM-4.5V | Multimodal (Image, Video, Audio, Docs) | 🎥🖼️🎵 Full multimodal |

### 🎭 **Anthropic Claude-Compatible API** → `/anthropic/v1/` endpoints  
**Base URL**: `http://localhost:9090/anthropic/v1`

**ALL real Claude models + direct GLM access supported!**

#### 🚀 **Latest Claude 4.x Models** (2025 - Most Advanced!)
| Claude Model | → GLM Model | Date | Description |
|-------------|-------------|------|-------------|
| `claude-sonnet-4-5-20250929` | `GLM-4-6-API-V1` | Sep 2025 | **🚀 LATEST! Sonnet 4.5** |
| `claude-opus-4-1-20250805` | `GLM-4-6-API-V1` | Aug 2025 | **🏆 LATEST! Opus 4.1 - Ultimate** |
| `claude-opus-4-20250514` | `GLM-4-6-API-V1` | May 2025 | **🏆 Opus 4.0** |
| `claude-sonnet-4-20250514` | `GLM-4-6-API-V1` | May 2025 | **🎯 Sonnet 4.0** |

#### ⚡ **Claude 3.x Models** (Current & Previous Gen)
| Claude Model | → GLM Model | Date | Description |
|-------------|-------------|------|-------------|
| `claude-3-7-sonnet-20250219` | `GLM-4-6-API-V1` | Feb 2025 | **⚡ NEW! Claude 3.7 Sonnet** |
| `claude-3-5-haiku-20241022` | `glm-4.5v` | Oct 2024 | **🚀 Latest Haiku - Multimodal** |
| `claude-3-5-sonnet-20241022` | `GLM-4-6-API-V1` | Oct 2024 | Claude 3.5 Sonnet (Oct) |
| `claude-3-5-sonnet-20240620` | `GLM-4-6-API-V1` | Jun 2024 | Claude 3.5 Sonnet (June) |
| `claude-3-haiku-20240307` | `glm-4.5v` | Mar 2024 | Claude 3 Haiku - Fast |
| `claude-3-sonnet-20240229` | `0727-360B-API` | Feb 2024 | Claude 3 Sonnet - Balanced |
| `claude-3-opus-20240229` | `GLM-4-6-API-V1` | Feb 2024 | Claude 3 Opus - Powerful |

#### 🔗 **Generic Model Names** (Auto-Latest)
| Claude Model | → GLM Model | Description |
|-------------|-------------|-------------|
| `claude-4.5-sonnet` | `GLM-4-6-API-V1` | Latest Sonnet 4.5 |
| `claude-4.1-opus` | `GLM-4-6-API-V1` | Latest Opus 4.1 |
| `claude-4-opus` | `GLM-4-6-API-V1` | Latest Opus 4.x |
| `claude-4-sonnet` | `GLM-4-6-API-V1` | Latest Sonnet 4.x |
| `claude-3.7-sonnet` | `GLM-4-6-API-V1` | Claude 3.7 generic |
| `claude-3-haiku` | `glm-4.5v` | Latest haiku (multimodal) |
| `claude-3-sonnet` | `GLM-4-6-API-V1` | Latest 3.x sonnet |
| `claude-3-opus` | `GLM-4-6-API-V1` | Claude 3 opus |

#### 🎯 **Direct GLM Model Access** (Via Claude API!)
**Use GLM models directly through the Anthropic API format:**

| GLM Model Name | → GLM Model | Description |
|---------------|-------------|-------------|
| `glm-4.6` | `GLM-4-6-API-V1` | **🧠 Smartest GLM model direct access** |
| `glm-4.5` | `0727-360B-API` | **📝 Balanced GLM model direct access** |
| `glm-4.5v` | `glm-4.5v` | **🎥 Multimodal GLM model direct access** |
| `glm4.6` / `glm_4.6` | `GLM-4-6-API-V1` | Alternative naming variants |
| `glm4.5` / `glm_4.5` | `0727-360B-API` | Alternative naming variants |
| `glm4.5v` / `glm_4.5v` | `glm-4.5v` | Alternative naming variants |

**🎉 30+ supported model names! All REAL Claude models + direct GLM access!**

## 🔌 **API Endpoints Overview**

### **OpenAI Compatible Endpoints** 🔥
```
GET  /v1/models                    # List available models
POST /v1/chat/completions          # Chat completions (streaming & non-streaming)
```

### **Anthropic Claude Compatible Endpoints** 🎭
```
GET  /anthropic/v1/models          # List available Claude models
POST /anthropic/v1/messages        # Messages (streaming & non-streaming)  
POST /anthropic/v1/messages/count_tokens  # Count tokens in messages
```

### **Dashboard & Monitoring** 📊
```
GET  /                             # Welcome page & overview
GET  /dashboard                    # Real-time API monitoring dashboard
GET  /docs                         # API documentation
```
| `claude-3-haiku` | `glm-4.5v` | Haiku | Vision, Multimodal | Generic haiku model |
| `claude-3-sonnet` | `GLM-4-6-API-V1` | Sonnet | Text, Tools | Generic sonnet model |
| `claude-3-opus` | `GLM-4-6-API-V1` | Opus | Text, Tools | Generic opus model |
| **Compatibility Mappings** | | | | |
| `glm-4.5` | `0727-360B-API` | Sonnet | Text, Tools | GLM-4.5 compatibility |
| `glm-4.6` | `GLM-4-6-API-V1` | Sonnet | Text, Tools | GLM-4.6 compatibility |
| `glm-4.5v` | `glm-4.5v` | Haiku | Vision, Multimodal | GLM-4.5V compatibility |

> 💡 **Smart Model Mapping**: Claude model names are automatically prefixed with "claude-" and support both exact matches and pattern-based fallbacks for maximum compatibility!

## 🎯 Model Capabilities

### GLM-4.5 (0727-360B-API) 🧠
- Thinking/chain-of-thought display 💭
- MCP tool calls 🛠️
- Code generation 💻
- No multimodal support 🚫

### GLM-4.6 (GLM-4-6-API-V1) 🌟 **NEW!**
- **Super smart and intelligent!** 🧠✨
- Thinking/chain-of-thought display 💭
- MCP tool calls 🛠️
- Code generation 💻
- **All the amazing features of GLM-4.5 but even smarter!** 🚀
- No multimodal support 🚫
- **Huge context window (195K tokens!)** 📚

### GLM-4.5V (glm-4.5v) 🌈
- Thinking display 💭
- Image/video/document/audio understanding 🎥🖼️🎵
- No MCP tool calls 🚫

> 💡 **Important**: Multimodal features require a valid Z.ai API token. Anonymous tokens don't support multimedia. Sorry! 😅
>
> 🌟 **Pro tip**: GLM-4.6 is the smartest model with the largest context window! Perfect for complex tasks! 🎯

## 🔑 Getting a Z.ai API Token

Ready to get started? Here's how! 🚀

1. 🌐 Visit https://chat.z.ai and sign up / log in
2. 🔍 Find your API token in the developer or account settings
3. ⚙️ Set the token as the ZAI_TOKEN environment variable

## 🚀 Deployment

### ☁️ Deno Deploy

Super easy deployment to the cloud! ☁️

- 📤 Push your repository containing main.ts to GitHub
- 🏗️ Create a new project on Deno Deploy and connect the repo
- ⚙️ Set environment variables (DEFAULT_KEY, ZAI_TOKEN, DEBUG_MODE, etc)

### 🏠 Self-hosted / Local

Run it right on your machine! 🏠

**Prerequisites**: Install Deno (if you haven't already!) 🦕

Start locally:
```bash
deno run --allow-net --allow-env --allow-read main.ts
```

Default port: 9090 (override with PORT env var) 🌐

### 🐳 Optional: Compile or Docker

Want to compile it or use Docker? We got you! 🐳

```bash
deno compile --allow-net --allow-env --allow-read --output ztoapi main.ts
```

Dockerfile example:
```dockerfile
FROM denoland/deno:1.40.0
WORKDIR /app
COPY main.ts anthropic.ts ./
EXPOSE 9090
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
```

Build and run:
```bash
docker build -t ztoapi .
docker run -p 9090:9090 -e DEFAULT_KEY="sk-your-key" ztoapi
```

## 🧪 Quick Local Test

Let's test it out! 🧪

**OpenAI API:**
```bash
curl http://localhost:9090/v1/models
```

```bash
curl -X POST http://localhost:9090/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-your-local-key" \
-d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"Hello"}],"stream":false}'
```

**Claude API:**
```bash
curl http://localhost:9090/anthropic/v1/models
```

```bash
curl -X POST http://localhost:9090/anthropic/v1/messages \
-H "Content-Type: application/json" \
-H "x-api-key: sk-your-local-key" \
-d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hello Claude!"}]}'
```

## ⚙️ Environment Variables

Customize your experience with these settings! 🎛️

- `DEFAULT_KEY` — API key for clients (default: sk-your-key) 🔑
- `ZAI_TOKEN` — official Z.ai API token (required for multimodal) 🎟️
- `UPSTREAM_URL` — upstream Z.ai endpoint (default: https://chat.z.ai/api/chat/completions) 🔗
- `DEBUG_MODE` — enable debug logs (true/false, default: true) 🐛
- `DEFAULT_STREAM` — default streaming mode (true/false, default: true) 🌊
- `DASHBOARD_ENABLED` — enable dashboard (true/false, default: true) 📊
- `PORT` — server port (default: 9090) 🌐

## 🌐 API Endpoints

Here are all the amazing endpoints you can use! 🎯

### OpenAI-Compatible Endpoints
- `GET /` — homepage 🏠
- `GET /v1/models` — list available OpenAI models 🤖
- `POST /v1/chat/completions` — main chat endpoint (OpenAI-compatible) 💬
- `GET /docs` — API documentation page 📚
- `GET /dashboard` — monitoring dashboard (if enabled) 📊

### Claude-Compatible Endpoints (NEW! 🎉)
- `GET /anthropic/v1/models` — list available Claude models 🤖
- `POST /anthropic/v1/messages` — Claude messages endpoint 💬
- `POST /anthropic/v1/messages/count_tokens` — token counting endpoint 🔢

Base paths:
- OpenAI: http://localhost:9090/v1 🌐
- Claude: http://localhost:9090/anthropic/v1 🎭

## 🎛️ Feature Control Headers

You can control various model features using HTTP headers when making requests to the `/v1/chat/completions` endpoint. These headers override the default model capabilities - how cool is that?! 😎

### Available Headers

- `X-Feature-Thinking` — Enable/disable thinking mode (true/false) 💭
- `X-Feature-Web-Search` — Enable/disable web search (true/false) 🔍
- `X-Feature-Auto-Web-Search` — Enable/disable automatic web search (true/false) 🤖
- `X-Feature-Image-Generation` — Enable/disable image generation (true/false) 🎨
- `X-Feature-Title-Generation` — Enable/disable title generation (true/false) 📝
- `X-Feature-Tags-Generation` — Enable/disable tags generation (true/false) 🏷️
- `X-Feature-MCP` — Enable/disable MCP (Model Context Protocol) tools (true/false) 🛠️
- `X-Think-Tags-Mode` — **NEW!** Customize thinking content processing mode per request ✨

### Usage Examples

**Enable thinking mode:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Thinking: true" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"Explain quantum computing"}],"stream":false}'
```

**Disable thinking mode:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Thinking: false" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"What is 2+2?"}],"stream":false}'
```

**Enable web search:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Web-Search: true" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"What are the latest news about AI?"}],"stream":false}'
```

**Multiple features at once:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Thinking: true" \
  -H "X-Feature-Web-Search: true" \
  -H "X-Feature-MCP: true" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"Research and analyze current AI trends"}],"stream":false}'
```

### 🎉 NEW: Dynamic Think Tags Mode

The `X-Think-Tags-Mode` header allows you to customize how thinking content is processed **per request**, giving you complete control over the model's reasoning display format without restarting the server! How amazing is that?! 🚀✨

#### Available Modes

- `"strip"` - Remove `<details>` tags and show only the final content 🧹
- `"thinking"` - Convert `<details>` tags to `<thinking>` tags 💭
- `"think"` - Convert `<details>` to `<think>` tags
- `"raw"` - Keep the content exactly as-is from the upstream 📄
- `"separate"` - Separate reasoning into `reasoning_content` field (default) 📊

#### Usage Examples

**Strip thinking content for clean responses:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Thinking: true" \
  -H "X-Think-Tags-Mode: strip" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"Explain quantum computing"}],"stream":false}'
```

**Convert to thinking tags for debugging:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Thinking: true" \
  -H "X-Think-Tags-Mode: thinking" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"Debug this code"}],"stream":true}'
```

**Convert to simple think tags:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Thinking: true" \
  -H "X-Think-Tags-Mode: think" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"Debug this code"}],"stream":true}'
```

**Get raw content for advanced processing:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Thinking: true" \
  -H "X-Think-Tags-Mode: raw" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"Analyze this complex problem"}]}'
```

**Separate reasoning for structured data:**
```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "X-Feature-Thinking: true" \
  -H "X-Think-Tags-Mode: separate" \
  -d '{"model":"GLM-4-6-API-V1","messages":[{"role":"user","content":"Solve step by step"}]}'
```

**Python example with dynamic thinking mode:**
```python
from openai import OpenAI

client = OpenAI(api_key="your-api-key", base_url="http://localhost:9090/v1")

response = client.chat.completions.create(
    model="GLM-4-6-API-V1",  # Using the smartest GLM-4.6 model! 🌟
    messages=[{"role": "user", "content": "Explain black holes"}],
    extra_headers={
        "X-Feature-Thinking": "true",
        "X-Think-Tags-Mode": "separate"  # Get reasoning and content separately!
    }
)

print("Content:", response.choices[0].message.content)
print("Reasoning:", response.choices[0].message.reasoning_content)
```

#### Benefits

- **🔄 Per-Request Control**: Switch between modes without server restart
- **🎯 Use-Case Specific**: Choose the perfect format for your application
- **🐛 Debugging Friendly**: Use "thinking" or "raw" modes to see the model's reasoning
- **🧹 Clean Output**: Use "strip" mode for production-ready responses
- **📊 Structured Data**: Use "separate" mode for educational tools or analytics

Python example with headers:
```python
from openai import OpenAI

client = OpenAI(api_key="your-api-key", base_url="http://localhost:9090/v1")

response = client.chat.completions.create(
    model="GLM-4-6-API-V1",  # Using GLM-4.6 for maximum intelligence! 🧠✨
    messages=[{"role": "user", "content": "Explain black holes"}],
    extra_headers={
        "X-Feature-Thinking": "true",
        "X-Feature-Web-Search": "false"
    }
)

print(response.choices[0].message.content)
```

### Header Value Format

All feature headers accept the following values (case-insensitive):
- `"true"` or `"1"` or `"yes"` — Enable the feature ✅
- `"false"` or `"0"` or `"no"` — Disable the feature ❌
- If not specified, the feature uses the model's default capability 🤷‍♂️

Note: Some features are model-dependent. For example, MCP tools are only available on models that support them, and web search requires a valid Z.ai API token. 💡

## 🧠 Thinking Content Processing

When thinking mode is enabled (`X-Feature-Thinking: true`), the server processes the model's reasoning content according to the specified mode. You have **two ways** to control this! 🎯

### 🎯 Method 1: Per-Request Control (Recommended!)

Use the `X-Think-Tags-Mode` header to customize thinking content processing **per request**:

```bash
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "X-Think-Tags-Mode: separate" \
  # ... other headers and request body
```

### ⚙️ Method 2: Server Default Configuration

Set the default mode by modifying the `THINK_TAGS_MODE` constant in `main.ts`:

```typescript
const THINK_TAGS_MODE = "separate"; // options: "strip", "thinking", "think", "raw", "separate"
```

**Note**: The `X-Think-Tags-Mode` header always overrides the server default! 🔄

### Available Modes

1. **`"strip"`** - Removes all thinking tags and shows only the clean final answer 🧹
   ```json
   {
     "choices": [{
       "message": {
         "role": "assistant",
         "content": "The answer is 8. Here's how I calculated it: 5 + 3 = 8"
       }
     }]
   }
   ```
3. **`"think"`** - Converts `<details>` tags to `<think>` tags for better readability 💭
   ```json
   {
     "choices": [{
       "message": {
         "role": "assistant",
         "content": "<think>Let me solve this step by step: 5 + 3...</think>\n\nThe answer is 8."
       }
     }]
   }
   ```

2. **`"thinking"`** - Converts `<details>` tags to `<thinking>` tags for better readability 💭
   ```json
   {
     "choices": [{
       "message": {
         "role": "assistant",
         "content": "<thinking>Let me solve this step by step: 5 + 3...</thinking>\n\nThe answer is 8."
       }
     }]
   }
   ```

4. **`"raw"`** - Preserves original `<details>` tags as-is 📄
   ```json
   {
     "choices": [{
       "message": {
         "role": "assistant",
         "content": "<details>Let me solve this step by step: 5 + 3...</details>\n\nThe answer is 8."
       }
     }]
   }
   ```

5. **`"separate"`** - Extracts reasoning into a separate `reasoning_content` field 📊
   ```json
   {
     "choices": [{
       "message": {
         "role": "assistant",
         "content": "The answer is 8.",
         "reasoning_content": "Let me solve this step by step: 5 + 3 = 8. This is basic addition..."
       }
     }]
   }
   ```

### Use Case Recommendations

- **🧹 Production Apps**: Use `"strip"` for clean, user-friendly responses
- **🐛 Debugging**: Use `"thinking"` or `"raw"` to see the model's reasoning process
- **📚 Educational Tools**: Use `"separate"` to display reasoning and answers separately
- **🔍 Advanced Processing**: Use `"raw"` for custom parsing and analysis

The `"separate"` mode is particularly useful for applications that want to display reasoning and final answers separately, such as educational tools or debugging interfaces! 🎓

## 💻 **Usage Examples - Both APIs**

### 🔥 **OpenAI API Examples**

#### **Python (OpenAI SDK)**
```python
import openai

# Use any OpenAI client - works out of the box!
client = openai.OpenAI(
    api_key="your-api-key",
    base_url="http://localhost:9090/v1"  # Point to ZtoApi
)

# Chat with GLM-4.6 (smartest model)
response = client.chat.completions.create(
    model="GLM-4-6-API-V1",
    messages=[{"role": "user", "content": "Hello! How are you?"}]
)
print(response.choices[0].message.content)

# Multimodal with GLM-4.5V
response = client.chat.completions.create(
    model="glm-4.5v",
    messages=[{
        "role": "user", 
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
        ]
    }]
)
```

#### **cURL (OpenAI)**
```bash
# Non-streaming
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "GLM-4-6-API-V1",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'

# Streaming
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "GLM-4-6-API-V1", 
    "messages": [{"role": "user", "content": "Tell me a story"}],
    "stream": true
  }'
```

### 🎭 **Anthropic Claude API Examples**

#### **Python (Anthropic SDK)**
```python
import anthropic

# Use official Anthropic client - works seamlessly!
client = anthropic.Anthropic(
    api_key="your-api-key",
    base_url="http://localhost:9090/anthropic/v1"  # Point to ZtoApi
)

# Latest Claude 4.5 Sonnet (REAL model - maps to GLM-4.6)
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",  # 🚀 REAL LATEST MODEL!
    max_tokens=1000,
    messages=[{"role": "user", "content": "Hello Claude 4.5!"}]
)
print(response.content[0].text)

# Latest Claude 4.1 Opus (REAL model - ultimate capability!)
response = client.messages.create(
    model="claude-opus-4-1-20250805",  # 🏆 REAL OPUS 4.1!
    max_tokens=1000,
    messages=[{"role": "user", "content": "Most capable Claude model!"}]
)

# New Claude 3.7 Sonnet (REAL model from Feb 2025)
response = client.messages.create(
    model="claude-3-7-sonnet-20250219",  # ⚡ NEW 3.7!
    max_tokens=1000,
    messages=[{"role": "user", "content": "Hello Claude 3.7!"}]
)

# Direct GLM access via Claude API!
response = client.messages.create(
    model="glm-4.6",  # 🎯 Direct GLM model access!
    max_tokens=1000,
    messages=[{"role": "user", "content": "You're GLM-4.6 via Claude API!"}]
)

# Multimodal with haiku models (map to GLM-4.5V)
response = client.messages.create(
    model="claude-3-5-haiku-20241022",
    max_tokens=1000,
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Describe this image"},
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": "..."}}
        ]
    }]
)
```

#### **cURL (Anthropic)**
```bash
# Latest Claude 4.5 Sonnet (REAL model!)
curl -X POST http://localhost:9090/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "Hello from REAL Claude 4.5!"}]
  }'

# Latest Claude 4.1 Opus (REAL ultimate model!)
curl -X POST http://localhost:9090/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "claude-opus-4-1-20250805", 
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "Most capable REAL Claude!"}]
  }'

# Direct GLM access via Anthropic API
curl -X POST http://localhost:9090/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "glm-4.6",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "GLM via Claude API!"}]
  }'

# Token counting with REAL Claude models
curl -X POST http://localhost:9090/anthropic/v1/messages/count_tokens \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "messages": [{"role": "user", "content": "Count my tokens!"}]
  }'

# Streaming with latest Claude 3.7
curl -X POST http://localhost:9090/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 1000,
    "stream": true,
    "messages": [{"role": "user", "content": "Stream me a story!"}]
  }'
```

#### **JavaScript (Both APIs)**
```javascript
// OpenAI API
const openaiResponse = await fetch('http://localhost:9090/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    model: 'GLM-4-6-API-V1',
    messages: [{role: 'user', content: 'Hello OpenAI API!'}]
  })
});

// Anthropic API - Latest REAL Claude 4.5!
const claudeResponse = await fetch('http://localhost:9090/anthropic/v1/messages', {
  method: 'POST', 
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',  // 🚀 REAL Latest model!
    max_tokens: 1000,
    messages: [{role: 'user', content: 'Hello REAL Claude 4.5!'}]
  })
});
```

### 🎯 **Which API Should You Use?**

- **🔥 OpenAI API**: If you have existing OpenAI integrations, ChatGPT clients, or OpenAI-based tools
- **🎭 Anthropic API**: If you use Claude Desktop, cline, cursor, or prefer Anthropic's format
- **🚀 Both work identically** - same GLM models, same performance, same features!
- **💡 Pro tip**: Try both! Some tools work better with different API formats

## 🛠️ Troubleshooting

Having trouble? Don't worry, we've got you covered! 🤗

- **401 Unauthorized** — check Authorization header format: "Authorization: Bearer your-key" 🔑
- **502 Bad Gateway** — upstream Z.ai error or network issue; check UPSTREAM_URL and ZAI_TOKEN 🌐
- **Streaming interrupted** — network instability; set "stream": false to disable SSE 🌊
- **Multimodal failures** — ensure ZAI_TOKEN is set and media sizes/formats are supported 🎥🖼️

## 🐛 Debugging

Enable verbose logs with DEBUG_MODE=true to see what's happening under the hood! 🔍

```bash
deno run --allow-net --allow-env --allow-read main.ts
```

## 🛡️ Security tips

Keep your API secure with these tips! 🛡️

- Use a long, random DEFAULT_KEY 🔑
- Set DEBUG_MODE=false in production 🚫
- Rotate keys regularly 🔄

## 🤝 Contributing

Want to help make ZtoApi even better? We'd love your help! 💪

- Open issues and pull requests on the project repository 🎉

## 📜 License

This project is released under the MIT License. See LICENSE for details. 📄

---

## 🌈 Thanks for reading!

Hope you enjoy using ZtoApi as much as we enjoyed building it! If you have any questions or feedback, don't hesitate to reach out! 🤗✨

Happy coding! (´｡• ᵕ •｡`) 💖

## 🙏 Acknowledgments

Special thanks to the amazing open-source community! This project was inspired by and includes code adapted from:

- **[claude-proxy](https://github.com/simpx/claude-proxy)** by [simpx](https://github.com/simpx) - Claude API proxy implementation patterns and Anthropic API structure. Their excellent work provided the foundation for our Claude API compatibility layer! 🎭✨

## 🌟 Key Contributors

**🚀 MASSIVE THANKS TO THE HEROES WHO SAVED THIS PROJECT:**

- **🏆 [@sarices (ZhengWeiDong)](https://github.com/sarices) - THE ABSOLUTE LEGEND** 🔥🔥🔥
  - **🎯 SINGLE-HANDEDLY FIXED Z.ai upstream authentication** - WITHOUT HIM THIS PROJECT WOULD BE BROKEN!
  - **⚡ IMPLEMENTED Base64 encoding signature algorithm** - Critical fix that restored ALL API functionality
  - **🛠️ RESOLVED the dreaded "502 Bad Gateway" errors** - Both OpenAI AND Anthropic endpoints now work flawlessly  
  - **💡 PR**: [feat(api): update signature algorithm to align with upstream](https://github.com/roseforyou/ZtoApi/pull/6)
  - **🎖️ IMPACT**: This genius-level contribution literally SAVED the entire project! 🙌✨
  - **🏅 HERO STATUS**: ZhengWeiDong (Z.ai upstream fixing) - WE OWE YOU EVERYTHING! 🎉

*This man deserves a medal! Without @sarices, none of this would work! 🏆*

## 📜 License

This project is released under the MIT License. See LICENSE for details. 📄
