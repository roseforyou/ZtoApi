/**
 * Evaluation script for ZtoApi server
 * Makes both streaming and non-streaming requests to test the API
 */

const API_BASE_URL = "http://localhost:9090";
const API_KEY = "sk-your-key"; // Default key from main.ts

// A simple question to test the API
const SIMPLE_QUESTION = "What is 2 + 2";

/**
 * Make a non-streaming request to the API
 */
async function makeNonStreamingRequest() {
  console.log("\n=== Making Non-Streaming Request ===");
  
  const requestBody = {
    model: "0727-360B-API",
    messages: [
      {
        role: "user",
        content: SIMPLE_QUESTION
      }
    ],
    stream: false,
    temperature: 0.7,
    max_tokens: 2000
  };

  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "X-Feature-Thinking": "true"  // Enable reasoning/thinking feature
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error Response: ${errorText}`);
      return;
    }

    const responseText = await response.text();
    
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log("\n--- AI Response (Non-Streaming) ---");
      if (jsonResponse.choices && jsonResponse.choices[0] && jsonResponse.choices[0].message) {
        console.log(jsonResponse.choices[0].message.content);
      } else {
        console.log("No response content found");
      }
      
      if (jsonResponse.usage) {
        console.log("\n--- Usage Information ---");
        console.log(`Prompt tokens: ${jsonResponse.usage.prompt_tokens}`);
        console.log(`Completion tokens: ${jsonResponse.usage.completion_tokens}`);
        console.log(`Total tokens: ${jsonResponse.usage.total_tokens}`);
      }
    } catch (parseError) {
      console.log("Failed to parse JSON response:", parseError.message);
      console.log("\n--- Raw Response ---");
      console.log(responseText);
    }
    
  } catch (error) {
    console.error("Non-streaming request failed:", error);
  }
}

/**
 * Make a streaming request to the API
 */
async function makeStreamingRequest() {
  console.log("\n=== Making Streaming Request ===");
  
  const requestBody = {
    model: "0727-360B-API",
    messages: [
      {
        role: "user",
        content: SIMPLE_QUESTION
      }
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 2000
  };

  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "X-Feature-Thinking": "true"  // Enable reasoning/thinking feature
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error Response: ${errorText}`);
      return;
    }

    console.log("\n--- AI Response (Streaming) ---");
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let usageInfo = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // Keep last partial line

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6);
            
            if (data === "[DONE]") {
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                fullContent += content;
                // Print content as it streams in
                process.stdout.write(content);
              }
              if (parsed.usage) {
                usageInfo = parsed.usage;
              }
            } catch (parseError) {
              // Silently ignore parse errors for cleaner output
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log("\n\n--- Usage Information ---");
    if (usageInfo) {
      console.log(`Prompt tokens: ${usageInfo.prompt_tokens}`);
      console.log(`Completion tokens: ${usageInfo.completion_tokens}`);
      console.log(`Total tokens: ${usageInfo.total_tokens}`);
    } else {
      console.log("No usage information available");
    }
    
  } catch (error) {
    console.error("Streaming request failed:", error);
  }
}

/**
 * Test the models endpoint
 */
async function testModelsEndpoint() {
  console.log("\n=== Testing Models Endpoint ===");
  
  try {
    const response = await fetch(`${API_BASE_URL}/v1/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error Response: ${errorText}`);
      return;
    }

    const responseText = await response.text();
    
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log("\n--- Available Models ---");
      if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
        jsonResponse.data.forEach(model => {
          console.log(`- ${model.id} (${model.owned_by})`);
        });
      } else {
        console.log("No models found");
      }
    } catch (parseError) {
      console.log("Failed to parse models response:", parseError.message);
      console.log("\n--- Raw Response ---");
      console.log(responseText);
    }
    
  } catch (error) {
    console.error("Models endpoint request failed:", error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("ZtoApi Evaluation Script");
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Simple Question: ${SIMPLE_QUESTION}`);
  
  // Test models endpoint first
  await testModelsEndpoint();
  
  // Make non-streaming request
  await makeNonStreamingRequest();
  
  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Make streaming request
  await makeStreamingRequest();
  
  console.log("\n=== Evaluation Complete ===");
}

// Run the evaluation
main().catch(console.error);