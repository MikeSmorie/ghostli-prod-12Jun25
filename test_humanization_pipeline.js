// Test script for GhostliAI humanization pipeline
import axios from 'axios';

const testHumanizationPipeline = async () => {
  console.log('🔍 Testing GhostliAI Humanization Pipeline');
  console.log('=' .repeat(50));
  
  const testInput = "The quick brown fox jumps over the lazy dog.";
  console.log(`Input: "${testInput}"`);
  console.log('');
  
  try {
    // First, authenticate to get a token
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'testuser_humanization',
      password: 'test123'
    });
    
    const token = authResponse.data.token;
    console.log('✅ Authentication successful');
    
    // Test content generation with anti-AI detection enabled
    const response = await axios.post('http://localhost:5000/api/content/generate', {
      prompt: testInput,
      tone: "neutral",
      brandArchetype: "The Everyman",
      wordCount: 50,
      antiAIDetection: true,
      prioritizeUndetectable: true,
      typosPercentage: 2.0,
      grammarMistakesPercentage: 1.5,
      humanMisErrorsPercentage: 1.0
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });
    
    console.log('✅ Humanization Pipeline Test Results:');
    console.log('-'.repeat(40));
    console.log('Humanized Output:');
    console.log(`"${response.data.content}"`);
    console.log('');
    console.log('Metadata:');
    console.log(`- Iterations: ${response.data.metadata.iterations}`);
    console.log(`- Word Count: ${response.data.metadata.wordCount}`);
    console.log(`- Total Tokens: ${response.data.metadata.totalTokens}`);
    
    if (response.data.metadata.refinementSteps) {
      console.log('');
      console.log('Refinement Steps:');
      response.data.metadata.refinementSteps.forEach(step => {
        console.log(`  ${step.step}: ${step.action} - ${step.result}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Pipeline Test Failed:', error.response?.data || error.message);
  }
};

// Run the test
testHumanizationPipeline();