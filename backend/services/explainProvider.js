/**
 * AI-based explanation provider with caching and fallback
 * Supports HuggingFace and OpenAI APIs with graceful degradation
 */

// In-memory cache for generated explanations (survives process lifetime)
const explanationCache = new Map();

/**
 * Get explanation for a question (AI-powered or canned fallback)
 * @param {string} questionId - Unique question identifier
 * @param {string} question - The question text
 * @param {string} correctAnswer - The correct answer text
 * @param {string} cannedExplanation - Fallback explanation from question bank
 * @returns {Promise<string>} - The explanation text
 */
async function getExplanation(questionId, question, correctAnswer, cannedExplanation) {
  // Check cache first
  if (explanationCache.has(questionId)) {
    console.log(`✓ Explanation cache hit for ${questionId}`);
    return explanationCache.get(questionId);
  }

  // Try AI providers if keys are available
  const hfKey = process.env.HF_KEY;
  const openaiKey = process.env.OPENAI_KEY;

  let aiExplanation = null;

  // Try OpenAI first (if available)
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
      aiExplanation = await getOpenAIExplanation(question, correctAnswer, openaiKey);
      if (aiExplanation) {
        console.log(`✓ Generated OpenAI explanation for ${questionId}`);
      }
    } catch (error) {
      console.log(`⚠ OpenAI failed for ${questionId}: ${error.message}`);
    }
  }

  // Try HuggingFace as fallback (if OpenAI failed and HF key available)
  if (!aiExplanation && hfKey && hfKey !== 'your_huggingface_api_key_here') {
    try {
      aiExplanation = await getHuggingFaceExplanation(question, correctAnswer, hfKey);
      if (aiExplanation) {
        console.log(`✓ Generated HuggingFace explanation for ${questionId}`);
      }
    } catch (error) {
      console.log(`⚠ HuggingFace failed for ${questionId}: ${error.message}`);
    }
  }

  // Use AI explanation or fall back to canned
  const finalExplanation = aiExplanation || cannedExplanation;
  
  // Cache the result
  explanationCache.set(questionId, finalExplanation);
  
  if (!aiExplanation) {
    console.log(`✓ Using canned explanation for ${questionId}`);
  }

  return finalExplanation;
}

/**
 * Get explanation from OpenAI API
 */
async function getOpenAIExplanation(question, correctAnswer, apiKey) {
  const fetch = require('node-fetch');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful educational assistant. Provide clear, concise explanations for quiz questions.'
        },
        {
          role: 'user',
          content: `Question: ${question}\nCorrect Answer: ${correctAnswer}\n\nProvide a brief explanation (2-3 sentences) why this is the correct answer.`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    }),
    timeout: 5000
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

/**
 * Get explanation from HuggingFace Inference API
 */
async function getHuggingFaceExplanation(question, correctAnswer, apiKey) {
  const fetch = require('node-fetch');
  
  const prompt = `Question: ${question}\nCorrect Answer: ${correctAnswer}\n\nExplanation:`;
  
  const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-base', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7
      }
    }),
    timeout: 5000
  });

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.[0]?.generated_text?.trim() || null;
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: explanationCache.size,
    keys: Array.from(explanationCache.keys())
  };
}

/**
 * Clear the cache (useful for testing)
 */
function clearCache() {
  explanationCache.clear();
  console.log('✓ Explanation cache cleared');
}

module.exports = {
  getExplanation,
  getCacheStats,
  clearCache
};
