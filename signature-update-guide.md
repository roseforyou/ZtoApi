# 技术文档：Z.ai API 请求签名机制更新

**日期**: 2025-10-13 (由哈雷酱更新)

---

## 1. 背景与目标

为了与上游 Z.ai API 最新的安全规范保持一致，原有的请求签名算法已进行升级。本次更新旨在增强请求的安全性，确保数据在传输过程中的完整性和真实性。

核心目标是将 `ZtoApi` 服务中的签名生成逻辑更新为采用 **请求体Base64编码** 的新版双层 HMAC-SHA256 算法。

## 2. 技术实现方案

### 2.1 核心变更：`generateSignature` 函数

本次更新的核心在于 `generateSignature` 函数的逻辑调整。新算法在构造待签名字符串时，对用户消息内容 `t` 进行了 **Base64 编码**，这是与旧版最主要的区别。

**新版函数实现:**

```typescript
/**
 * 生成Z.ai API请求签名 (新版双层HMAC算法)
 * @param e "requestId,request_id,timestamp,timestamp,user_id,user_id"
 * @param t 用户最新消息 (原始文本)
 * @param timestamp 时间戳 (毫秒)
 * @returns { signature: string, timestamp: string }
 */
async function generateSignature(e: string, t: string, timestamp: number): Promise<{ signature: string, timestamp: string }> {
  const timestampStr = String(timestamp);

  // 1. 对消息内容进行Base64编码 (核心变更)
  const bodyEncoded = new TextEncoder().encode(t);
  const bodyBase64 = btoa(String.fromCharCode(...bodyEncoded));

  // 2. 构造新的待签名字符串
  const stringToSign = `${e}|${bodyBase64}|${timestampStr}`;

  // 3. 计算5分钟时间窗口
  const timeWindow = Math.floor(timestamp / (5 * 60 * 1000));

  // 4. 第一层 HMAC，生成中间密钥
  const firstKeyMaterial = new TextEncoder().encode("junjie");
  const firstHmacKey = await crypto.subtle.importKey(
    "raw",
    firstKeyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const firstSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    firstHmacKey,
    new TextEncoder().encode(String(timeWindow))
  );
  const intermediateKey = Array.from(new Uint8Array(firstSignatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 5. 第二层 HMAC，生成最终签名
  const secondKeyMaterial = new TextEncoder().encode(intermediateKey);
  const secondHmacKey = await crypto.subtle.importKey(
    "raw",
    secondKeyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const finalSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    secondHmacKey,
    new TextEncoder().encode(stringToSign)
  );
  const signature = Array.from(new Uint8Array(finalSignatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  debugLog("新版签名生成成功: %s", signature);
  return {
      signature,
      timestamp: timestampStr
  };
}
```

### 2.2 集成逻辑

签名逻辑的集成点依然在 `callUpstreamWithHeaders` 函数中。该函数现在调用更新后的 `generateSignature`，确保所有出站请求都使用新版签名进行验证。其他集成流程（如参数准备、请求构建）保持不变。

---
