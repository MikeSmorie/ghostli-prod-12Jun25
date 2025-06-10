// Direct test of humanization functions without API authentication
import { generateContent } from './server/services/openai.js';

const testHumanizationDirect = async () => {
  console.log('Testing GhostliAI Humanization Pipeline - Direct Function Call');
  console.log('='.repeat(60));
  
  const testInput = "The quick brown fox jumps over the lazy dog.";
  console.log(`Input: "${testInput}"`);
  console.log('');
  
  try {
    const params = {
      prompt: testInput,
      tone: "neutral",
      brandArchetype: "The Everyman", 
      wordCount: 50,
      antiAIDetection: true,
      prioritizeUndetectable: true,
      typosPercentage: 2.0,
      grammarMistakesPercentage: 1.5,
      humanMisErrorsPercentage: 1.0
    };
    
    console.log('Testing humanization with parameters:');
    console.log(`- Anti-AI Detection: ${params.antiAIDetection}`);
    console.log(`- Prioritize Undetectable: ${params.prioritizeUndetectable}`);
    console.log(`- Typos: ${params.typosPercentage}%`);
    console.log(`- Grammar Mistakes: ${params.grammarMistakesPercentage}%`);
    console.log(`- Human Errors: ${params.humanMisErrorsPercentage}%`);
    console.log('');
    
    const result = await generateContent(params);
    
    console.log('Humanization Pipeline Results:');
    console.log('-'.repeat(40));
    console.log(`Humanized Output: "${result.content}"`);
    console.log('');
    console.log('Processing Metadata:');
    console.log(`- Iterations: ${result.metadata.iterations}`);
    console.log(`- Word Count: ${result.metadata.wordCount}`);
    console.log(`- Total Tokens: ${result.metadata.totalTokens}`);
    console.log(`- Processing Time: ${result.metadata.endTime - result.metadata.startTime}ms`);
    
    if (result.metadata.refinementSteps) {
      console.log('');
      console.log('Refinement Steps:');
      result.metadata.refinementSteps.forEach(step => {
        console.log(`  Step ${step.step}: ${step.action}`);
        console.log(`    Result: ${step.result}`);
      });
    }
    
    console.log('');
    console.log('PIPELINE STATUS: ACTIVE AND FUNCTIONAL');
    
  } catch (error) {
    console.error('Pipeline Test Failed:', error.message);
    if (error.message.includes('API key')) {
      console.log('Note: OpenAI API key required for full testing');
    }
  }
};

testHumanizationDirect();