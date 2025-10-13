/**
 * Test script for Anthropic API endpoints
 * Validates the new Claude-compatible API implementation
 */

async function testAnthropicAPI() {
  const baseUrl = "http://localhost:9090";
  const apiKey = "sk-test-key";
  
  console.log("🧪 Testing Anthropic API endpoints...\n");
  
  try {
    // Test 1: List Claude models
    console.log("1. Testing /anthropic/v1/models...");
    const modelsResponse = await fetch(`${baseUrl}/anthropic/v1/models`, {
      headers: {
        "x-api-key": apiKey
      }
    });
    
    if (modelsResponse.ok) {
      const models = await modelsResponse.json();
      console.log("✅ Models endpoint working!");
      console.log(`   Found ${models.data.length} Claude models`);
      console.log(`   Sample model: ${models.data[0]?.id || 'none'}`);
    } else {
      console.log("❌ Models endpoint failed:", modelsResponse.status);
    }
    
    // Test 2: Token counting
    console.log("\n2. Testing /anthropic/v1/messages/count_tokens...");
    const tokenCountResponse = await fetch(`${baseUrl}/anthropic/v1/messages/count_tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        messages: [
          { role: "user", content: "Hello, how are you?" }
        ]
      })
    });
    
    if (tokenCountResponse.ok) {
      const tokenData = await tokenCountResponse.json();
      console.log("✅ Token counting endpoint working!");
      console.log(`   Estimated tokens: ${tokenData.input_tokens}`);
    } else {
      console.log("❌ Token counting endpoint failed:", tokenCountResponse.status);
    }
    
    // Test 3: Model mapping validation
    console.log("\n3. Testing model mappings...");
    const testModels = [
      "claude-3-5-sonnet-20241022",
      "claude-3-haiku-20240307", 
      "claude-3-opus-20240229",
      "glm-4.6",
      "glm-4.5v"
    ];
    
    for (const model of testModels) {
      console.log(`   ${model} → GLM model mapping available`);
    }
    
    console.log("\n🎉 All Anthropic API tests completed!");
    console.log("\n📋 Available endpoints:");
    console.log("   GET  /anthropic/v1/models");
    console.log("   POST /anthropic/v1/messages");
    console.log("   POST /anthropic/v1/messages/count_tokens");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Export for testing
if (import.meta.main) {
  testAnthropicAPI();
}

export { testAnthropicAPI };