# 技术文档：Z.ai API 请求签名机制重构

**日期**: 2025-10-07

---

## 1. 背景与目标

### 1.1 问题陈述

当前与上游服务 Z.ai API 的通信协议中，原有的请求验证机制安全性不足。为了防止潜在的数据篡改和未授权访问风险，必须升级签名算法，以符合最新的安全标准。

### 1.2 项目目标

本项目的核心目标是设计并实现一个新的、基于双层 HMAC-SHA256 算法的请求签名机制。该机制需要无缝集成到现有的 `ZtoApi` 服务中，确保所有出站请求的完整性、真实性和不可否认性。

## 2. 技术实现方案

### 2.1 方案概述

我们通过在 TypeScript 中利用 Deno 原生的 `crypto.subtle` API，实现了一个与 Z.ai 签名规范完全一致的异步签名函数 `generateSignature`。随后，对上游 API 的核心调用函数 `callUpstreamWithHeaders` 进行了重构，将签名生成逻辑作为前置步骤嵌入其中。

### 2.2 核心模块：`generateSignature` 函数

此函数是新签名机制的核心。它执行一个双层 HMAC-SHA256 哈希计算，以提高签名的抗碰撞性和安全性。

**函数定义与实现:**

```typescript
/**
 * 为 Z.ai API 请求生成加密签名。
 * @param e - 包含 requestId, timestamp, 和 user_id 的元数据字符串。
 * @param t - 用户消息的原始内容，用于签名计算。
 * @param timestamp - 请求发起时的毫秒级时间戳。
 * @returns 返回一个包含 { signature: string, timestamp: number } 的 Promise 对象。
 */
async function generateSignature(
  e: string,
  t: string,
  timestamp: number
): Promise<{ signature: string; timestamp: number }> {
  const r = String(timestamp);
  const i = `${e}|${t}|${r}`;
  // 基于时间窗口计算第一层 HMAC 的输入
  const n = Math.floor(timestamp / (5 * 60 * 1000));
  const key = new TextEncoder().encode("junjie"); // 密钥

  // 第一层 HMAC-SHA256
  const firstHmacKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const firstSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    firstHmacKey,
    new TextEncoder().encode(String(n))
  );
  // 将第一层哈希结果作为第二层 HMAC 的密钥
  const o = Array.from(new Uint8Array(firstSignatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 第二层 HMAC-SHA256
  const secondHmacKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(o),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secondSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    secondHmacKey,
    new TextEncoder().encode(i)
  );
  const signature = Array.from(new Uint8Array(secondSignatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  debugLog("签名生成成功: %s", signature);
  return {
    signature,
    timestamp,
  };
}
```

### 2.3 集成逻辑：`callUpstreamWithHeaders` 函数重构

为确保签名机制在每次 API 调用中强制执行，我们对 `callUpstreamWithHeaders` 函数进行了重构。该函数现在负责在请求发送前完成整个签名流程。

**执行流程:**

1.  **用户身份解析**: 从传入的 `authToken` (JWT) 中安全地解码 `user_id`。
2.  **签名参数构造**: 动态生成 `requestId` 和 `timestamp`，并从请求体中提取用户最后一条消息作为签名内容的一部分。
3.  **签名生成**: 调用 `generateSignature` 函数生成最终签名。
4.  **请求构建**: 将签名和相关元数据（`requestId`, `timestamp` 等）附加到请求的 URL 查询参数和 `X-Signature` HTTP 头中。
5.  **请求发送**: 发起 `fetch` 请求至上游服务。

**重构后的函数实现:**

```typescript
async function callUpstreamWithHeaders(
  upstreamReq: UpstreamRequest,
  refererChatID: string,
  authToken: string
): Promise<Response> {
  try {
    debugLog("调用上游API: %s", UPSTREAM_URL);

    // 1. 解码JWT获取user_id
    let userId = "unknown";
    try {
      const tokenParts = authToken.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(
          new TextDecoder().decode(decodeBase64(tokenParts[1]))
        );
        userId = payload.id || userId;
        debugLog("从JWT解析到 user_id: %s", userId);
      }
    } catch (e) {
      debugLog("解析JWT失败: %v", e);
    }

    // 2. 准备签名所需参数
    const timestamp = Date.now();
    const requestId = crypto.randomUUID();
    const userMessage = upstreamReq.messages
      .filter((m) => m.role === "user")
      .pop()?.content;
    const lastMessageContent =
      typeof userMessage === "string"
        ? userMessage
        : Array.isArray(userMessage)
        ? userMessage.find((c) => c.type === "text")?.text || ""
        : "";

    if (!lastMessageContent) {
      throw new Error("无法获取用于签名的用户消息内容");
    }

    const e = `requestId,${requestId},timestamp,${timestamp},user_id,${userId}`;

    // 3. 生成新签名
    const { signature } = await generateSignature(
      e,
      lastMessageContent,
      timestamp
    );
    debugLog("生成新版签名: %s", signature);

    const reqBody = JSON.stringify(upstreamReq);
    debugLog("上游请求体: %s", reqBody);

    // 4. 构建带新参数的URL和Headers
    const params = new URLSearchParams({
      timestamp: timestamp.toString(),
      requestId: requestId,
      user_id: userId,
      token: authToken,
      current_url: `${ORIGIN_BASE}/c/${refererChatID}`,
      pathname: `/c/${refererChatID}`,
      signature_timestamp: timestamp.toString(),
    });
    const fullURL = `${UPSTREAM_URL}?${params.toString()}`;

    const response = await fetch(fullURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "User-Agent": BROWSER_UA,
        Authorization: `Bearer ${authToken}`,
        "X-FE-Version": X_FE_VERSION,
        "X-Signature": signature,
        Origin: ORIGIN_BASE,
        Referer: `${ORIGIN_BASE}/c/${refererChatID}`,
      },
      body: reqBody,
    });

    debugLog("上游响应状态: %d %s", response.status, response.statusText);
    return response;
  } catch (error) {
    debugLog("调用上游失败: %v", error);
    throw error;
  }
}
```

## 3. 参考资料

此实现的技术选型和算法逻辑部分参考了以下资料：

- **参考链接**: [https://linux.do/t/topic/1014930](https://linux.do/t/topic/1014930)

---
