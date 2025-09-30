# ZtoApi - OpenAI-compatible API proxy server

![Deno](https://img.shields.io/badge/deno-v1.40+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

ZtoApi is a high-performance OpenAI-compatible API proxy that exposes Z.ai's GLM-4.5 and GLM-4.5V models via a standard OpenAI-style interface. Implemented with Deno's native HTTP API, it supports streaming and non-streaming responses and includes a real-time monitoring dashboard.

## Key Features

- OpenAI API compatible — use existing OpenAI clients without changes
- SSE streaming support for real-time token delivery
- Transforms and presents model "thinking" content
- Built-in web Dashboard with live request stats
- API key authentication and optional anonymous token fallback
- Configurable via environment variables
- Deployable on Deno Deploy or self-hosted

## Supported Models

- 0727-360B-API — GLM-4.5 (text, code, tools)
- glm-4.5v — GLM-4.5V (full multimodal: image, video, document, audio)

## Model Capabilities

GLM-4.5 (0727-360B-API)
- Thinking/chain-of-thought display
- MCP tool calls
- Code generation
- No multimodal support

GLM-4.5V (glm-4.5v)
- Thinking display
- Image/video/document/audio understanding
- No MCP tool calls

> Important: Multimodal features require a valid Z.ai API token. Anonymous tokens do not support multimedia.

## Getting a Z.ai API Token

1. Visit https://chat.z.ai and sign up / log in.
2. Find your API token in the developer or account settings.
3. Set the token as the ZAI_TOKEN environment variable.

## Deployment

### Deno Deploy

- Push your repository containing main.ts to GitHub.
- Create a new project on Deno Deploy and connect the repo.
- Set environment variables (DEFAULT_KEY, ZAI_TOKEN, DEBUG_MODE, etc).

### Self-hosted / Local

Prerequisites: Install Deno.

Start locally:
deno run --allow-net --allow-env main.ts

Default port: 9090 (override with PORT env var)

### Optional: Compile or Docker

deno compile --allow-net --allow-env --output ztoapi main.ts

Dockerfile example:
FROM denoland/deno:1.40.0
WORKDIR /app
COPY main.ts .
EXPOSE 9090
CMD ["deno", "run", "--allow-net", "--allow-env", "main.ts"]

Build and run:
docker build -t ztoapi .
docker run -p 9090:9090 -e DEFAULT_KEY="sk-your-key" ztoapi

## Quick Local Test

curl http://localhost:9090/v1/models

curl -X POST http://localhost:9090/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-your-local-key" \
-d '{"model":"0727-360B-API","messages":[{"role":"user","content":"Hello"}],"stream":false}'

## Environment Variables

- DEFAULT_KEY — API key for clients (default: sk-your-key)
- ZAI_TOKEN — official Z.ai API token (required for multimodal)
- UPSTREAM_URL — upstream Z.ai endpoint (default: https://chat.z.ai/api/chat/completions)
- DEBUG_MODE — enable debug logs (true/false, default: true)
- DEFAULT_STREAM — default streaming mode (true/false, default: true)
- DASHBOARD_ENABLED — enable dashboard (true/false, default: true)
- PORT — server port (default: 9090)

## API Endpoints

- GET / — homepage
- GET /v1/models — list available models
- POST /v1/chat/completions — main chat endpoint (OpenAI-compatible)
- GET /docs — API documentation page
- GET /dashboard — monitoring dashboard (if enabled)

Base path: http://localhost:9090/v1

## Examples

Python (non-streaming)
from openai import OpenAI
client = OpenAI(api_key="your-api-key", base_url="http://localhost:9090/v1")
resp = client.chat.completions.create(model="0727-360B-API", messages=[{"role":"user","content":"Hello"}])
print(resp.choices[0].message.content)

cURL (streaming)
curl -X POST http://localhost:9090/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-api-key" \
-d '{"model":"0727-360B-API","messages":[{"role":"user","content":"Write a short poem about spring"}],"stream":true}'

JavaScript (fetch)
async function chat(message, stream=false) {
const response = await fetch('http://localhost:9090/v1/chat/completions', {
method: 'POST',
headers: {'Content-Type':'application/json','Authorization':'Bearer your-api-key'},
body: JSON.stringify({model:'0727-360B-API', messages:[{role:'user', content:message}], stream})
});
if (stream) { /* handle SSE stream */ } else { const data = await response.json(); console.log(data.choices[0].message.content); }
}

## Troubleshooting

- 401 Unauthorized — check Authorization header format: "Authorization: Bearer your-key"
- 502 Bad Gateway — upstream Z.ai error or network issue; check UPSTREAM_URL and ZAI_TOKEN
- Streaming interrupted — network instability; set "stream": false to disable SSE
- Multimodal failures — ensure ZAI_TOKEN is set and media sizes/formats are supported

## Debugging

Enable verbose logs with DEBUG_MODE=true.

deno run --allow-net --allow-env main.ts

## Security tips

- Use a long, random DEFAULT_KEY
- Set DEBUG_MODE=false in production
- Rotate keys regularly

## Contributing

- Open issues and pull requests on the project repository

## License

This project is released under the MIT License. See LICENSE for details.

-- End
