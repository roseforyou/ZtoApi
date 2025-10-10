# Technical Documentation: Z.ai API Request Signature Mechanism Refactoring

**Date**: 2025-10-07

---

## 1. Background and Objectives

### 1.1 Problem Statement

The current communication protocol with the upstream Z.ai API service has insufficient request verification mechanisms. To prevent potential data tampering and unauthorized access risks, we must upgrade the signature algorithm to meet the latest security standards.

### 1.2 Project Objectives

The core objective of this project is to design and implement a new request signature mechanism based on a double-layer HMAC-SHA256 algorithm. This mechanism needs to be seamlessly integrated into the existing `ZtoApi` service, ensuring the integrity, authenticity, and non-repudiation of all outbound requests.

## 2. Technical Implementation

### 2.1 Solution Overview

By utilizing Deno's native `crypto.subtle` API in TypeScript, we implemented an asynchronous signature function `generateSignature` that is fully consistent with Z.ai's signature specifications. Subsequently, we refactored the core upstream API calling function `callUpstreamWithHeaders` to embed the signature generation logic as a pre-processing step.

### 2.2 Core Module: `generateSignature` Function

This function is the core of the new signature mechanism. It performs a double-layer HMAC-SHA256 hash calculation to enhance signature collision resistance and security.

**Function Definition and Implementation:**

```typescript
/**
 * Generate encrypted signature for Z.ai API requests.
 * @param e - Metadata string containing requestId, timestamp, and user_id.
 * @param t - Original user message content for signature calculation.
 * @param timestamp - Millisecond-level timestamp when request is initiated.
 * @returns Returns a Promise object containing { signature: string, timestamp: number }.
 */
async function generateSignature(
  e: string,
  t: string,
  timestamp: number
): Promise<{ signature: string; timestamp: number }> {
  const r = String(timestamp);
  const i = `${e}|${t}|${r}`;
  // Calculate first layer HMAC input based on time window
  const n = Math.floor(timestamp / (5 * 60 * 1000));
  const key = new TextEncoder().encode("junjie"); // Secret key

  // First layer HMAC-SHA256
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
  // Use first layer hash result as second layer HMAC key
  const o = Array.from(new Uint8Array(firstSignatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Second layer HMAC-SHA256
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

  debugLog("Signature generated successfully: %s", signature);
  return {
    signature,
    timestamp,
  };
}
```

### 2.3 Integration Logic: `callUpstreamWithHeaders` Function Refactoring

To ensure the signature mechanism is enforced on every API call, we refactored the `callUpstreamWithHeaders` function. This function now handles the complete signature process before sending requests.

**Execution Flow:**

1.  **User Identity Resolution**: Safely decode `user_id` from the incoming `authToken` (JWT).
2.  **Signature Parameter Construction**: Dynamically generate `requestId` and `timestamp`, and extract the user's last message from the request body as part of the signature content.
3.  **Signature Generation**: Call the `generateSignature` function to generate the final signature.
4.  **Request Construction**: Attach the signature and related metadata (`requestId`, `timestamp`, etc.) to the request URL query parameters and `X-Signature` HTTP header.
5.  **Request Sending**: Initiate the `fetch` request to the upstream service.

**Refactored Function Implementation:**

```typescript
async function callUpstreamWithHeaders(
  upstreamReq: UpstreamRequest,
  refererChatID: string,
  authToken: string
): Promise<Response> {
  try {
    debugLog("Calling upstream API: %s", UPSTREAM_URL);

    // 1. Decode JWT to get user_id
    let userId = "unknown";
    try {
      const tokenParts = authToken.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(
          new TextDecoder().decode(decodeBase64(tokenParts[1]))
        );
        userId = payload.id || userId;
        debugLog("Parsed user_id from JWT: %s", userId);
      }
    } catch (e) {
      debugLog("JWT parsing failed: %v", e);
    }

    // 2. Prepare signature parameters
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
      throw new Error("Unable to get user message content for signature");
    }

    const e = `requestId,${requestId},timestamp,${timestamp},user_id,${userId}`;

    // 3. Generate new signature
    const { signature } = await generateSignature(
      e,
      lastMessageContent,
      timestamp
    );
    debugLog("Generated new signature: %s", signature);

    const reqBody = JSON.stringify(upstreamReq);
    debugLog("Upstream request body: %s", reqBody);

    // 4. Build URL and Headers with new parameters
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

    debugLog("Upstream response status: %d %s", response.status, response.statusText);
    return response;
  } catch (error) {
    debugLog("Upstream call failed: %v", error);
    throw error;
  }
}
```

## 3. References

The technical choices and algorithm logic for this implementation partially reference the following materials:

- **Reference Link**: [https://linux.do/t/topic/1014930](https://linux.do/t/topic/1014930)

---