# ZtoApi - OpenAI兼容API代理服务器

![Deno](https://img.shields.io/badge/deno-v1.40+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**ZtoApi** 是一个高性能的 OpenAI 兼容 API 代理服务器，专为 Z.ai 的 GLM-4.5 和 GLM-4.5V 模型设计。使用 Deno 原生 HTTP API 实现，支持完整的流式和非流式响应，提供实时监控 Dashboard，让你能够无缝地将 Z.ai 的强大 AI 能力集成到现有的 OpenAI 客户端应用中。

## 🌟 核心特性

- **🔄 完全 OpenAI 兼容**: 支持标准 OpenAI API 格式，无需修改客户端代码
- **🌊 智能流式传输**: 支持 Server-Sent Events (SSE) 实时流式响应
- **🧠 思考过程处理**: 智能解析和展示 GLM-4.5 的推理思考过程
- **📊 实时监控面板**: 内置 Web Dashboard，实时显示 API 调用统计和性能指标
- **🔐 安全身份验证**: 支持 API 密钥验证和匿名 Token 自动获取
- **⚡ 高性能架构**: 基于 Deno 原生 HTTP API，支持高并发请求处理
- **🌍 多平台部署**: 支持 Deno Deploy 边缘计算和自托管部署
- **🛠️ 灵活配置**: 通过环境变量进行全面配置管理

## 🤖 支持的模型

ZtoApi 支持 Z.ai 的多个先进 AI 模型：

| 模型ID | 模型名称 | 特性 |
|---------|----------|------|
| 0727-360B-API | GLM-4.5 | 通用对话、代码生成、工具调用 |
| glm-4.6 | GLM-4.6 | 🚀 最新增强模型，具备更强的推理和代码能力 |
| glm-4.5v | GLM-4.5V | 🎯 全方位多模态理解：图像、视频、文档、音频 |

### 模型特性对比

**GLM-4.5** (`0727-360B-API`)
- ✅ 思考过程展示
- ✅ MCP 工具调用
- ✅ 代码生成与分析
- ❌ 多模态理解

**GLM-4.6** (`glm-4.6`)
- ✅ 🚀 更强的思考过程展示
- ✅ 🚀 增强的MCP工具调用
- ✅ 🚀 顶级的代码生成与分析
- ❌ 多模态理解

**GLM-4.5V** (`glm-4.5v`) - 全方位多模态理解
- ✅ 思考过程展示
- ✅ 图像理解与分析
- ✅ 视频内容分析
- ✅ 复杂图表解读
- ✅ 长文档处理
- ✅ 音频内容理解
- ❌ MCP 工具调用

### 🎯 GLM-4.5V 支持的媒体类型

| 媒体类型 | 支持格式 | 应用场景 |
|---------|----------|----------|
| 📷 **图像** | JPEG, PNG, GIF, WebP | 图像描述、OCR、图表分析 |
| 🎥 **视频** | MP4, AVI, MOV | 视频摘要、动作识别、场景分析 |
| 📄 **文档** | PDF, DOC, TXT | 文档分析、信息提取、摘要生成 |
| 🎵 **音频** | MP3, WAV, AAC | 语音转文字、音频分析、内容理解 |

> ⚠️ **重要提示**: 多模态功能（图像、视频、文档、音频）需要**正式的Z.ai API Token**，匿名token不支持多媒体处理。

## 🔑 获取 Z.ai API Token

要使用完整的多模态功能，需要获取正式的 Z.ai API Token：

### 方式1: 通过 Z.ai 网站
1. 访问 [Z.ai 官网](https://chat.z.ai)
2. 注册账户并登录
3. 在开发者设置中获取 API Token
4. 将 Token 设置为 `ZAI_TOKEN` 环境变量

### 方式2: 浏览器开发者工具（临时方案）
1. 打开 [Z.ai 聊天界面](https://chat.z.ai)
2. 按 F12 打开开发者工具
3. 切换到 "Application" 或 "存储" 标签
4. 查看 Local Storage 中的认证token
5. 复制token值设置为环境变量

> ⚠️ **注意**: 方式2获取的token可能有时效性，建议使用方式1获取长期有效的API Token。

## 部署方式

### 1. Deno Deploy部署

Deno Deploy是一个全球分布式的边缘计算平台，非常适合部署Deno应用。

#### 步骤：

1. **准备代码**
   - 确保你有一个GitHub仓库，包含`main.ts`文件
   - 将代码推送到GitHub仓库

2. **登录Deno Deploy**
   - 访问 [https://dash.deno.com/](https://dash.deno.com/)
   - 使用GitHub账号登录

3. **创建新项目**
   - 点击"New Project"按钮
   - 选择你的GitHub仓库
   - 选择包含`main.ts`文件的分支

4. **配置环境变量**
   - 在项目设置中，添加以下环境变量：
     - `DEFAULT_KEY`: 客户端API密钥（可选，默认: sk-your-key）
     - `ZAI_TOKEN`: Z.ai访问令牌（**多模态功能必需**，不提供仅支持文本对话）
     - `DEBUG_MODE`: 调试模式开关（可选，默认: true）
     - `DEFAULT_STREAM`: 默认流式响应（可选，默认: true）
     - `DASHBOARD_ENABLED`: Dashboard功能开关（可选，默认: true）

5. **部署**
   - 点击"Deploy"按钮
   - 等待部署完成

6. **测试**
   - 部署完成后，你会获得一个URL
   - 访问 `{你的URL}/v1/models` 测试API是否正常工作
   - 访问 `{你的URL}/dashboard` 查看监控仪表板

### 2. 本地开发运行

适合本地开发、测试和内网部署场景。

#### 🚀 快速开始

1. **安装Deno**
   ```bash
   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://deno.land/install.sh | sh
   
   # 或访问 https://deno.land/#installation 查看更多安装方式
   ```

2. **下载项目文件**
   - 确保你有 `main.ts` 文件

3. **配置环境变量（可选）**
   ```bash
   # Linux/macOS
   export DEFAULT_KEY="sk-your-local-key"
   export DEBUG_MODE="true"
   export PORT="9090"
   
   # Windows CMD
   set DEFAULT_KEY=sk-your-local-key
   set DEBUG_MODE=true
   set PORT=9090
   
   # Windows PowerShell
   $env:DEFAULT_KEY="sk-your-local-key"
   $env:DEBUG_MODE="true"
   $env:PORT="9090"
   ```

4. **启动服务**
   ```bash
   deno run --allow-net --allow-env main.ts
   ```

#### 🏠 本地访问地址

启动成功后，通过以下地址访问各项功能：

| 功能 | 本地地址 | 描述 |
|------|----------|------|
| 🏠 服务首页 | `http://localhost:9090/` | 功能概览和导航 |
| 🤖 API端点 | `http://localhost:9090/v1/chat/completions` | 主要聊天接口 |
| 📊 监控面板 | `http://localhost:9090/dashboard` | 实时请求统计 |
| 📚 API文档 | `http://localhost:9090/docs` | 完整使用说明 |
| 📋 模型列表 | `http://localhost:9090/v1/models` | 可用模型信息 |

#### 🔧 本地配置推荐

```bash
# 开发环境推荐配置
export DEFAULT_KEY="sk-your-development-key"  # 自定义API密钥
export DEBUG_MODE="true"                      # 启用详细日志
export DEFAULT_STREAM="true"                  # 默认流式响应
export DASHBOARD_ENABLED="true"               # 启用监控面板
export PORT="9090"                            # 自定义端口
```

#### ⚡ 快速测试

```bash
# 测试API连通性
curl http://localhost:9090/v1/models

# 测试聊天功能
curl -X POST http://localhost:9090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-your-local-key" \
  -d '{
    "model": "0727-360B-API",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": false
  }'
```

### 3. 生产环境部署

适合需要更高控制力的生产环境部署。

#### 📦 编译为独立可执行文件

```bash
# 编译为二进制文件（推荐用于生产环境）
deno compile --allow-net --allow-env --output ztoapi main.ts

# 运行编译后的文件
./ztoapi          # Linux/macOS
ztoapi.exe        # Windows
```

#### 🐳 Docker 部署 (推荐)

使用 Docker Compose 可以一键启动服务，是本地开发和生产部署的推荐方式。

1. **准备文件**
   - 项目已包含 `Dockerfile` 和 `docker-compose.yml` 文件，无需手动创建。

2. **配置环境变量**
   - 打开 `docker-compose.yml` 文件。
   - 修改 `environment` 部分的 `DEFAULT_KEY` 为你自己的安全密钥。
   - 根据需要，可以取消注释并设置 `ZAI_TOKEN` 等其他变量。

3. **构建和运行**
   ```bash
   # 在 ZtoApi 目录下，一键构建并启动服务
   docker-compose up -d

   # 查看服务日志
   docker-compose logs -f

   # 关闭并移除容器
   docker-compose down
   ```

#### 🔄 服务管理

使用进程管理器确保服务稳定运行：

```bash
# 使用 PM2 (需要先安装 pm2)
pm2 start "deno run --allow-net --allow-env main.ts" --name ztoapi

# 使用 systemd (Linux)
# 创建 /etc/systemd/system/ztoapi.service
[Unit]
Description=ZtoApi Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/app
ExecStart=/path/to/deno run --allow-net --allow-env main.ts
Restart=always
Environment=DEFAULT_KEY=sk-your-key
Environment=DEBUG_MODE=false

[Install]
WantedBy=multi-user.target
```

### 4. 本地 vs 云端部署对比

| 特性 | 本地运行 | Deno Deploy |
|------|----------|-------------|
| **部署难度** | ⭐⭐ 需要手动配置 | ⭐⭐⭐⭐⭐ 一键部署 |
| **端口配置** | 🔧 可自定义 | ⚡ 自动分配 |
| **SSL证书** | ❌ 需要手动配置 | ✅ 自动HTTPS |
| **全球分发** | ❌ 单节点 | ✅ 边缘网络 |
| **成本** | 🆓 服务器资源 | 🆓 有免费额度 |
| **控制力** | ⭐⭐⭐⭐⭐ 完全控制 | ⭐⭐⭐ 受平台限制 |
| **维护难度** | ⭐⭐ 需要运维 | ⭐⭐⭐⭐⭐ 托管服务 |

## 🔧 环境变量配置

### 🟢 基础配置（开箱即用）

所有配置项都有合理的默认值，可直接部署使用。

| 变量名 | 说明 | 默认值 | 示例值 |
|--------|------|--------|--------|
| `DEFAULT_KEY` | 客户端API密钥（用于身份验证） | `sk-your-key` | `sk-my-secure-key-2024` |
| `MODEL_NAME` | 对外显示的模型名称 | `GLM-4.5` | `GLM-4.5-Pro` |

### 🟡 功能开关配置

| 变量名 | 说明 | 默认值 | 可选值 |
|--------|------|--------|--------|
| `DEBUG_MODE` | 调试模式（详细日志输出） | `true` | `true` / `false` |
| `DEFAULT_STREAM` | 默认流式响应模式 | `true` | `true` / `false` |
| `DASHBOARD_ENABLED` | 实时监控Dashboard | `true` | `true` / `false` |

### 🔴 高级配置（通常无需修改）

| 变量名 | 说明 | 默认值 | 示例值 |
|--------|------|--------|--------|
| `UPSTREAM_URL` | Z.ai上游API地址 | `https://chat.z.ai/api/chat/completions` | 自定义代理地址 |
| `ZAI_TOKEN` | Z.ai官方访问令牌 | 空（自动匿名模式） | `eyJhbGciOiJFUzI1NiIs...` |
| `PORT` | 服务器端口（仅自托管） | `9090` | `8080` |

> **💡 提示**: 
> - **必须设置 `ZAI_TOKEN`** 才能使用多模态功能（图像、视频、文档、音频）
> - 不设置 `ZAI_TOKEN` 将使用匿名token，仅支持纯文本对话
> - 生产环境建议设置 `DEBUG_MODE=false` 以提升性能
> - `DASHBOARD_ENABLED=false` 可禁用监控面板以节省资源

## 📝 API使用示例

### 🐍 Python 示例

```python
import openai

# 配置客户端
client = openai.OpenAI(
    api_key="your-api-key",  # 对应 DEFAULT_KEY
    base_url="https://your-project.deno.dev/v1"
)

# 使用 GLM-4.5 进行文本对话
response = client.chat.completions.create(
    model="0727-360B-API",  # GLM-4.5
    messages=[{"role": "user", "content": "你好，请介绍一下自己"}]
)
print(response.choices[0].message.content)

# 使用 GLM-4.6 进行增强对话
response = client.chat.completions.create(
    model="glm-4.6",
    messages=[{"role": "user", "content": "用Python写一个快速排序算法"}]
)
print(response.choices[0].message.content)

# 使用 GLM-4.5V 进行全方位多模态理解

# 1. 图像分析
response = client.chat.completions.create(
    model="glm-4.5v",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "分析这张图片的内容和情感"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
        ]
    }]
)

# 2. 视频理解
response = client.chat.completions.create(
    model="glm-4.5v",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "总结这个视频的主要内容"},
            {"type": "video_url", "video_url": {"url": "data:video/mp4;base64,..."}}
        ]
    }]
)

# 3. 文档分析
response = client.chat.completions.create(
    model="glm-4.5v",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "提取这份文档的关键信息"},
            {"type": "document_url", "document_url": {"url": "data:application/pdf;base64,..."}}
        ]
    }]
)

# 4. 音频理解
response = client.chat.completions.create(
    model="glm-4.5v",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "转录并分析这段音频内容"},
            {"type": "audio_url", "audio_url": {"url": "data:audio/mp3;base64,..."}}
        ]
    }]
)

# 5. 多媒体组合分析
response = client.chat.completions.create(
    model="glm-4.5v",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "综合分析这些多媒体内容的关联性"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}},
            {"type": "document_url", "document_url": {"url": "data:application/pdf;base64,..."}},
            {"type": "audio_url", "audio_url": {"url": "data:audio/wav;base64,..."}}
        ]
    }]
)

print(response.choices[0].message.content)

# 流式请求示例
response = client.chat.completions.create(
    model="0727-360B-API",
    messages=[{"role": "user", "content": "请写一首关于春天的诗"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### 🌐 cURL 示例

```bash
# 使用 GLM-4.5 进行文本对话
curl -X POST https://your-project.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "0727-360B-API",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": false
  }'

# 使用 GLM-4.6 进行增强对话
curl -X POST https://your-project.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "glm-4.6",
    "messages": [{"role": "user", "content": "用Python写一个快速排序算法"}],
    "stream": false
  }'

# 使用 GLM-4.5V 进行全方位多模态理解

# 图像分析
curl -X POST https://your-project.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "glm-4.5v",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "分析这张图片"},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
      ]
    }]
  }'

# 视频理解
curl -X POST https://your-project.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "glm-4.5v",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "总结这个视频内容"},
        {"type": "video_url", "video_url": {"url": "data:video/mp4;base64,..."}}
      ]
    }]
  }'

# 文档分析
curl -X POST https://your-project.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "glm-4.5v",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "分析这份文档"},
        {"type": "document_url", "document_url": {"url": "data:application/pdf;base64,..."}}
      ]
    }]
  }'

# 多媒体组合分析
curl -X POST https://your-project.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "glm-4.5v",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "综合分析这些内容"},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}},
        {"type": "document_url", "document_url": {"url": "data:application/pdf;base64,..."}}
      ]
    }]
  }'

# 流式请求示例
curl -X POST https://your-project.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "0727-360B-API",
    "messages": [{"role": "user", "content": "请写一首诗"}],
    "stream": true
  }'

```

### 🟨 JavaScript 示例

```javascript
// 使用 GLM-4.5 进行文本对话
async function chatWithGLM45(message, stream = false) {
  const response = await fetch('https://your-project.deno.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key'
    },
    body: JSON.stringify({
      model: '0727-360B-API',
      messages: [{ role: 'user', content: message }],
      stream: stream
    })
  });
  
  const data = await response.json();
  console.log(data.choices[0].message.content);
}

// 使用 GLM-4.5V 进行全方位多模态理解

// 1. 图像分析
async function analyzeImage(text, imageUrl) {
  const response = await fetch('https://your-project.deno.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key'
    },
    body: JSON.stringify({
      model: 'glm-4.5v',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: text },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }]
    })
  });
  
  const data = await response.json();
  console.log(data.choices[0].message.content);
}

// 2. 视频理解
async function analyzeVideo(text, videoUrl) {
  const response = await fetch('https://your-project.deno.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key'
    },
    body: JSON.stringify({
      model: 'glm-4.5v',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: text },
          { type: 'video_url', video_url: { url: videoUrl } }
        ]
      }]
    })
  });
  
  const data = await response.json();
  console.log(data.choices[0].message.content);
}

// 3. 文档分析
async function analyzeDocument(text, documentUrl) {
  const response = await fetch('https://your-project.deno.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key'
    },
    body: JSON.stringify({
      model: 'glm-4.5v',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: text },
          { type: 'document_url', document_url: { url: documentUrl } }
        ]
      }]
    })
  });
  
  const data = await response.json();
  console.log(data.choices[0].message.content);
}

// 4. 多媒体组合分析
async function analyzeMultimedia(text, mediaUrls) {
  const content = [{ type: 'text', text: text }];
  
  // 添加各种媒体类型
  if (mediaUrls.image) content.push({ type: 'image_url', image_url: { url: mediaUrls.image } });
  if (mediaUrls.video) content.push({ type: 'video_url', video_url: { url: mediaUrls.video } });
  if (mediaUrls.document) content.push({ type: 'document_url', document_url: { url: mediaUrls.document } });
  if (mediaUrls.audio) content.push({ type: 'audio_url', audio_url: { url: mediaUrls.audio } });
  
  const response = await fetch('https://your-project.deno.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key'
    },
    body: JSON.stringify({
      model: 'glm-4.5v',
      messages: [{ role: 'user', content }]
    })
  });
  
  const data = await response.json();
  console.log(data.choices[0].message.content);
}

// 使用示例
chatWithGLM45('你好，请介绍一下JavaScript');
analyzeImage('分析这张图片', 'data:image/jpeg;base64,...');
analyzeVideo('总结视频内容', 'data:video/mp4;base64,...');
analyzeDocument('提取文档要点', 'data:application/pdf;base64,...');
analyzeMultimedia('综合分析这些内容', {
  image: 'data:image/jpeg;base64,...',
  document: 'data:application/pdf;base64,...'
});

```

## 🎯 技术架构特性

### 🔧 核心技术栈
- **运行时**: Deno 1.40+ (零配置、安全优先)
- **语言**: TypeScript 5.0+ (类型安全、现代语法)
- **HTTP服务**: Deno 原生 HTTP API (高性能、低延迟)
- **流式传输**: Server-Sent Events (SSE) 标准实现
- **部署平台**: 支持 Deno Deploy 边缘计算和传统服务器

### 🚀 性能特性
- **零依赖**: 无需外部依赖包，启动速度极快
- **内存优化**: 智能请求缓存和内存管理
- **并发处理**: 支持高并发请求和连接复用
- **边缘部署**: 基于 Deno Deploy 的全球边缘网络

### 🧠 AI 处理特性
- **思考过程解析**: 智能提取和展示 GLM-4.5 推理过程
- **多模态支持**: 支持文本和图像输入处理
- **流式优化**: 实时逐token输出，响应更流畅
- **匿名会话**: 每次对话独立token，保护隐私

### 📊 监控运维特性
- **实时Dashboard**: Web界面实时监控API使用情况
- **性能指标**: 响应时间、成功率、错误统计
- **请求追踪**: 详细的请求日志和用户代理分析
- **SSE监控**: 实时数据推送，无需页面刷新

## 🌐 服务端点访问

部署完成后，你可以通过以下端点访问各项功能：

| 端点 | 功能 | 描述 |
|------|------|------|
| `/` | 🏠 服务首页 | 功能概览和快速导航 |
| `/v1/models` | 📋 模型列表 | 获取可用AI模型信息 |
| `/v1/chat/completions` | 🤖 聊天完成 | OpenAI兼容的主要API端点 |
| `/dashboard` | 📊 监控面板 | 实时API使用统计和性能监控 |
| `/docs` | 📚 API文档 | 完整的API使用说明和示例 |

**示例URL**: `https://your-project.deno.dev/v1/chat/completions`

## 🛠️ 故障排除指南

### ❌ 常见问题及解决方案

#### 🚫 部署相关问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| Deno Deploy 部署失败 | TypeScript 语法错误 | 检查 `main.ts` 文件语法，运行 `deno check main.ts` |
| 模块加载错误 | 权限不足 | 确保启动命令包含 `--allow-net --allow-env` |
| 启动时崩溃 | 环境变量冲突 | 检查环境变量格式，使用默认值测试 |

#### 🔑 API 请求问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 401 Unauthorized | API密钥错误 | 检查 `Authorization: Bearer your-key` 格式 |
| 502 Bad Gateway | 上游服务异常 | 检查 Z.ai 服务状态，等待恢复 |
| 超时无响应 | 网络连接问题 | 检查 `UPSTREAM_URL` 设置，测试网络连通性 |

#### 📊 Dashboard 问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 页面无法访问 | Dashboard 未启用 | 设置 `DASHBOARD_ENABLED=true` |
| 数据不更新 | SSE 连接中断 | 刷新页面，检查浏览器控制台错误 |
| 样式异常 | CDN 资源加载失败 | 检查网络连接，等待 CDN 恢复 |

#### 🌊 流式响应问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 流式响应中断 | 网络不稳定 | 使用非流式模式：`stream: false` |
| 响应格式错误 | 客户端不支持 SSE | 确认客户端支持 `text/event-stream` |
| 内容乱码 | 编码问题 | 检查客户端字符编码设置 |

#### 🎯 多模态内容问题

| 问题 | 排查步骤 | 解决方案 |
|------|----------|----------|
| GLM-4.5V 无法识别多媒体 | 1. 确认模型ID: `"glm-4.5v"`<br>2. 开启调试模式查看日志<br>3. 检查媒体格式和大小 | 使用正确的多模态消息格式 |
| 多媒体数据未发送到后台 | 查看调试日志中的 `🎯 检测到全方位多模态请求` | 验证消息结构包含对应的 URL 字段 |
| 媒体格式不支持 | 检查是否为 Base64 或 HTTP URL | 支持图像/视频/文档/音频多种格式 |
| **上游返回"something went wrong"** | **检查是否设置了 `ZAI_TOKEN` 环境变量** | **多模态功能需要正式API Token，不支持匿名token** |

> ⚠️ **重要**: 如果使用匿名token（未设置`ZAI_TOKEN`），多媒体请求会被Z.ai服务器拒绝。

**支持的多模态消息格式：**

```json
{
  "model": "glm-4.5v",
  "messages": [{
    "role": "user", 
    "content": [
      {"type": "text", "text": "分析这些多媒体内容"},
      {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}},
      {"type": "video_url", "video_url": {"url": "data:video/mp4;base64,..."}},
      {"type": "document_url", "document_url": {"url": "data:application/pdf;base64,..."}},
      {"type": "audio_url", "audio_url": {"url": "data:audio/mp3;base64,..."}}
    ]
  }]
}
```

**调试日志关键字：**
- `🎯 检测到全方位多模态请求` - 确认收到多媒体内容
- `🖼️ 消息[X] 图像[Y]` - 图像数据详情
- `🎥 消息[X] 视频[Y]` - 视频数据详情  
- `📄 消息[X] 文档[Y]` - 文档数据详情
- `🎵 消息[X] 音频[Y]` - 音频数据详情
- `🎯 多模态内容统计` - 各类媒体统计信息
- `⚠️ 警告: 模型不支持多模态` - 模型选择错误
- `⚠️ 重要警告: 正在使用匿名token处理多模态请求` - **Token权限不足**
- `✅ 使用正式API Token，支持完整多模态功能` - Token配置正确

### 调试模式

启用调试模式以获取详细日志：

```bash
# 在Deno Deploy中，设置环境变量
DEBUG_MODE=true

# 在自托管环境中
export DEBUG_MODE=true
deno run --allow-net --allow-env main.ts
```

## ⚡ 性能优化建议

### 🎯 生产环境优化

| 优化项 | 配置 | 效果 | 适用场景 |
|--------|------|------|----------|
| 关闭调试日志 | `DEBUG_MODE=false` | 减少 I/O 开销，提升 20-30% 性能 | 生产环境 |
| 禁用 Dashboard | `DASHBOARD_ENABLED=false` | 节省内存和 CPU 资源 | 无监控需求 |
| 流式响应优化 | `DEFAULT_STREAM=true` | 降低首字节延迟 | 实时对话场景 |

### 📈 并发处理优化

```bash
# 推荐的生产环境配置
export DEBUG_MODE=false
export DASHBOARD_ENABLED=true  # 保留监控功能
export DEFAULT_STREAM=true     # 优化响应速度
```

### 🚀 部署优化

- **Deno Deploy**: 自动全球边缘分发，无需额外配置
- **自托管**: 建议使用反向代理 (Nginx/Cloudflare) 进行负载均衡
- **监控**: 利用内置 Dashboard 监控关键指标

## 🔒 安全防护指南

### 🛡️ 身份验证安全

| 安全措施 | 配置方法 | 重要性 |
|----------|----------|--------|
| 自定义 API 密钥 | `DEFAULT_KEY=your-secure-key` | ⭐⭐⭐⭐⭐ |
| 使用复杂密钥 | 至少 32 位随机字符 | ⭐⭐⭐⭐ |
| 定期轮换密钥 | 建议每月更换 | ⭐⭐⭐ |

### 🌐 网络安全

```bash
# 推荐的安全配置
export DEFAULT_KEY="sk-$(openssl rand -hex 32)"  # 生成随机密钥
export DEBUG_MODE=false                           # 避免敏感信息泄露
```

### 📊 访问监控

- **实时监控**: 通过 Dashboard 监控异常请求模式
- **日志分析**: 关注频繁失败的 IP 地址
- **流量统计**: 监控 API 调用频率，防止滥用

### 🚨 应急响应

| 威胁类型 | 检测方法 | 应对措施 |
|----------|----------|----------|
| API 密钥泄露 | 异常调用量 | 立即更换 `DEFAULT_KEY` |
| 恶意请求 | 高错误率 | 临时禁用服务，检查日志 |
| 服务滥用 | 超高并发 | 考虑添加速率限制 |

## 更新维护

1. **定期更新**: 关注Deno官方更新，及时升级运行时
2. **依赖管理**: 虽然本项目使用原生API，但仍需关注Deno API变化
3. **备份策略**: 定期备份配置和环境变量

## 技术支持

如果遇到问题，可以通过以下方式获取帮助：

1. 查看Deno官方文档: [https://deno.land/manual](https://deno.land/manual)
2. 访问Deno Deploy文档: [https://deno.com/deploy/docs](https://deno.com/deploy/docs)
3. 提交Issue到原项目仓库

## 🤝 贡献和支持

### 📋 项目状态

- ✅ **稳定运行**: 已在生产环境验证
- 🔄 **持续更新**: 跟随 Deno 和 Z.ai 最新特性
- 🛡️ **安全优先**: 定期安全审计和更新
- 📈 **性能优化**: 持续性能调优和监控

### 🌟 Star History

如果这个项目对你有帮助，请给我们一个 ⭐ Star！

### 📞 技术支持

| 支持渠道 | 描述 | 链接 |
|----------|------|------|
| 📚 官方文档 | Deno 官方文档 | [deno.land/manual](https://deno.land/manual) |
| 🚀 部署平台 | Deno Deploy 文档 | [deno.com/deploy/docs](https://deno.com/deploy/docs) |
| 🐛 问题反馈 | GitHub Issues | 项目仓库 Issues 页面 |
| 💬 讨论交流 | GitHub Discussions | 项目仓库 Discussions 页面 |

### 📄 许可证

本项目基于 MIT 许可证开源，详见 [LICENSE](LICENSE) 文件。

---

**🎉 享受使用 ZtoApi 带来的便捷体验！**

*Made with ❤️ using Deno & TypeScript*
