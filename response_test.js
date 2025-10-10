/**
 * GLM-4.6 API Test Suite
 * Tests both streaming and non-streaming responses with thinking enabled
 * Question: "What's 2+2?"
 *
 * For personal use or educational use only
 */

const BASE_URL = 'http://localhost:9090/v1';
const API_KEY = 'sk-your-key'; // Update with your actual API key
const MODEL = 'GLM-4.6'; // Using GLM-4.6 model
const QUESTION = "What's 2+2?";

/**
 * Test configuration
 */
const TEST_CONFIG = {
    // Enable thinking mode to see the reasoning process
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-Feature-Thinking': 'true', // Enable thinking mode
        'X-Think-Tags-Mode': 'separate' // Separate reasoning from content
    },
    requestBody: {
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: QUESTION
            }
        ],
        temperature: 0.6,
        max_tokens: 1000
    }
};

/**
 * Utility function to pretty print JSON
 */
function prettyPrintJson(obj, title = '') {
    if (title) {
        console.log(`\n${title}`);
        console.log('='.repeat(title.length));
    }
    console.log(JSON.stringify(obj, null, 2));
}

/**
 * Test 1: Non-streaming response with thinking enabled
 */
async function testNonStreamingResponse() {
    console.log('\n🧪 TEST 1: Non-Streaming Response with Thinking Enabled');
    console.log('=' .repeat(60));
    
    try {
        const requestBody = {
            ...TEST_CONFIG.requestBody,
            stream: false
        };

        console.log(`📤 Sending request to: ${BASE_URL}/chat/completions`);
        console.log(`🤖 Model: ${MODEL}`);
        console.log(`❓ Question: "${QUESTION}"`);
        console.log(`🧠 Thinking: Enabled (separate mode)`);
        
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: TEST_CONFIG.headers,
            body: JSON.stringify(requestBody)
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log(`⏱️  Response time: ${responseTime}ms`);
        console.log(`📊 Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error response:`, errorText);
            return;
        }

        const data = await response.json();
        
        prettyPrintJson(data, '📋 Non-Streaming Response:');
        
        // Extract and display key information
        const choice = data.choices?.[0];
        if (choice) {
            const message = choice.message;
            
            console.log('\n🎯 Key Information:');
            console.log(`📝 Content: ${message.content || 'No content'}`);
            
            if (message.reasoning_content) {
                console.log(`🧠 Reasoning: ${message.reasoning_content}`);
            } else {
                console.log('🧠 Reasoning: No reasoning content found');
            }
            
            console.log(`🏁 Finish reason: ${choice.finish_reason || 'Unknown'}`);
        }

        // Display usage information if available
        if (data.usage) {
            console.log('\n📊 Token Usage:');
            console.log(`   Prompt tokens: ${data.usage.prompt_tokens}`);
            console.log(`   Completion tokens: ${data.usage.completion_tokens}`);
            console.log(`   Total tokens: ${data.usage.total_tokens}`);
        }

    } catch (error) {
        console.error('❌ Non-streaming test failed:', error.message);
    }
}

/**
 * Test 2: Streaming response with thinking enabled
 */
async function testStreamingResponse() {
    console.log('\n🧪 TEST 2: Streaming Response with Thinking Enabled');
    console.log('=' .repeat(60));
    
    try {
        const requestBody = {
            ...TEST_CONFIG.requestBody,
            stream: true
        };

        console.log(`📤 Sending streaming request to: ${BASE_URL}/chat/completions`);
        console.log(`🤖 Model: ${MODEL}`);
        console.log(`❓ Question: "${QUESTION}"`);
        console.log(`🧠 Thinking: Enabled (separate mode)`);
        
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: TEST_CONFIG.headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error response:`, errorText);
            return;
        }

        console.log('📡 Streaming started...');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let reasoningContent = '';
        let chunkCount = 0;
        let firstChunkTime = null;
        let lastChunkTime = null;

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('\n🏁 Stream completed');
                break;
            }

            if (!firstChunkTime) {
                firstChunkTime = Date.now();
            }
            lastChunkTime = Date.now();

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ""; // Keep last partial line

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    if (data === '[DONE]') {
                        console.log('\n📡 Stream finished');
                        break;
                    }

                    try {
                        const chunk = JSON.parse(data);
                        chunkCount++;
                        
                        const choice = chunk.choices?.[0];
                        if (choice) {
                            const delta = choice.delta;
                            
                            // Handle reasoning content (thinking)
                            if (delta.reasoning_content) {
                                reasoningContent += delta.reasoning_content;
                                Deno.stdout.writeSync(new TextEncoder().encode(`🧠 [Thinking] ${delta.reasoning_content}`));
                            }
                            
                            // Handle regular content
                            if (delta.content) {
                                fullContent += delta.content;
                                Deno.stdout.writeSync(new TextEncoder().encode(delta.content));
                            }
                            
                            // Log finish reason
                            if (choice.finish_reason) {
                                console.log(`\n🏁 Finish reason: ${choice.finish_reason}`);
                            }
                        }

                        // Log usage information if available in the final chunk
                        if (chunk.usage) {
                            console.log('\n📊 Token Usage:');
                            console.log(`   Prompt tokens: ${chunk.usage.prompt_tokens}`);
                            console.log(`   Completion tokens: ${chunk.usage.completion_tokens}`);
                            console.log(`   Total tokens: ${chunk.usage.total_tokens}`);
                        }

                    } catch (parseError) {
                        console.error(`❌ Failed to parse chunk: ${data}`, parseError.message);
                    }
                }
            }
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const firstChunkDelay = firstChunkTime - startTime;
        const streamingDuration = lastChunkTime - firstChunkTime;

        console.log('\n📊 Streaming Statistics:');
        console.log(`⏱️  Total time: ${totalTime}ms`);
        console.log(`⚡ First chunk delay: ${firstChunkDelay}ms`);
        console.log(`🌊 Streaming duration: ${streamingDuration}ms`);
        console.log(`📦 Total chunks: ${chunkCount}`);
        console.log(`📝 Content length: ${fullContent.length} chars`);
        console.log(`🧠 Reasoning length: ${reasoningContent.length} chars`);

        console.log('\n📋 Final Results:');
        console.log(`💬 Content: "${fullContent}"`);
        if (reasoningContent) {
            console.log(`🧠 Reasoning: "${reasoningContent}"`);
        }

    } catch (error) {
        console.error('❌ Streaming test failed:', error.message);
    }
}

/**
 * Test 3: Compare different thinking modes
 */
async function testDifferentThinkingModes() {
    console.log('\n🧪 TEST 3: Different Thinking Modes Comparison');
    console.log('=' .repeat(60));
    
    const modes = ['strip', 'thinking', 'raw', 'separate'];
    
    for (const mode of modes) {
        console.log(`\n🔧 Testing mode: ${mode}`);
        console.log('-'.repeat(30));
        
        try {
            const headers = {
                ...TEST_CONFIG.headers,
                'X-Think-Tags-Mode': mode
            };
            
            const requestBody = {
                ...TEST_CONFIG.requestBody,
                stream: false
            };

            const response = await fetch(`${BASE_URL}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                console.error(`❌ Error for mode ${mode}: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const message = data.choices?.[0]?.message;
            
            console.log(`📝 Content: ${message?.content || 'No content'}`);
            console.log(`🧠 Reasoning: ${message?.reasoning_content || 'No separate reasoning'}`);
            
        } catch (error) {
            console.error(`❌ Mode ${mode} failed:`, error.message);
        }
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('🚀 GLM-4.6 API Test Suite Starting...');
    console.log(`🎯 Question: "${QUESTION}"`);
    console.log(`🤖 Model: ${MODEL}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    
    // Run all tests
    // await testNonStreamingResponse();
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between tests
    
    // await testStreamingResponse();
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between tests
    
    await testDifferentThinkingModes();
    
    console.log('\n✅ All tests completed!');
}

/**
 * Check if server is running
 */
async function checkServerHealth() {
    try {
        const response = await fetch(`${BASE_URL}/models`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server is running and accessible');
            console.log('🤖 Available models:', data.data?.map(m => m.id).join(', ') || 'None');
            return true;
        } else {
            console.error(`❌ Server responded with status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Cannot connect to server:', error.message);
        console.log('💡 Make sure the ZtoApi server is running on http://localhost:9090');
        return false;
    }
}

// Run tests if server is available
if (import.meta.main) {
    checkServerHealth().then(isHealthy => {
        if (isHealthy) {
            runTests().catch(console.error);
        } else {
            console.log('❌ Cannot run tests - server is not accessible');
            Deno.exit(1);
        }
    });
}

export {
    testNonStreamingResponse,
    testStreamingResponse,
    testDifferentThinkingModes,
    checkServerHealth,
    runTests
};