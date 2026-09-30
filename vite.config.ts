import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import dotenv from 'dotenv';
import {GoogleGenAI} from '@google/genai';

dotenv.config();

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-server-middleware',
        configureServer(server) {
          // Endpoint 1: Generate single structured FAQ
          server.middlewares.use('/api/ai/generate-faq', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const topic = parsed.topic;
                if (!topic || typeof topic !== 'string') {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Topic is required' }));
                  return;
                }

                const apiKey = process.env.GEMINI_API_KEY;
                const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

                const prompt = `You are an AI assistant specialized in generating high-quality FAQs for software engineering, web development, and support documentation.
Topic: "${topic}".
Generate a single, comprehensive FAQ question, a clear and helpful answer, and an appropriate category.
Return strictly a JSON object with this exact structure:
{
  "generatedQuestion": "the question",
  "generatedAnswer": "the detailed answer explaining the topic clearly",
  "generatedCategory": "e.g. Architecture, Authentication, Database, Optimization, or Security"
}`;

                const candidates = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
                let rawText = '';
                let lastErr: any = null;

                for (const modelCandidate of candidates) {
                  try {
                    const response = await ai.models.generateContent({
                      model: modelCandidate,
                      contents: prompt,
                      config: {
                        responseMimeType: 'application/json',
                      },
                    });
                    rawText = response.text || '{}';
                    if (rawText) break;
                  } catch (err: any) {
                    console.warn(`FAQ model ${modelCandidate} failed:`, err?.message);
                    lastErr = err;
                  }
                }

                if (!rawText && lastErr) {
                  throw lastErr;
                }

                const jsonResult = JSON.parse(rawText || '{}');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  topic,
                  generatedQuestion: jsonResult.generatedQuestion,
                  generatedAnswer: jsonResult.generatedAnswer,
                  generatedCategory: jsonResult.generatedCategory,
                  generatedAt: new Date().toISOString(),
                }));
              } catch (error: any) {
                console.error('Error generating FAQ:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: error.message || 'Failed to generate FAQ' }));
              }
            });
          });

          // Endpoint 2: Multi-turn Chatbot with Gemini
          server.middlewares.use('/api/ai/chat', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const messages = parsed.messages || [];
                const requestedModel = parsed.model || 'gemini-3.5-flash';
                const systemInstruction = parsed.systemInstruction || 
                  'You are the AI Support Assistant. Help users answer technical, product, and knowledge base questions accurately, clearly, and concisely.';

                if (!Array.isArray(messages) || messages.length === 0) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Messages array is required' }));
                  return;
                }

                const apiKey = process.env.GEMINI_API_KEY;
                const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

                // Format messages into Google GenAI contents
                const contents = messages.map((m: any) => ({
                  role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
                  parts: [{ text: typeof m.content === 'string' ? m.content : String(m.content || '') }],
                }));

                let targetModel = requestedModel;
                if (
                  targetModel !== 'gemini-3.1-pro-preview' &&
                  targetModel !== 'gemini-3.5-flash' &&
                  targetModel !== 'gemini-3.1-flash-lite'
                ) {
                  targetModel = 'gemini-3.5-flash';
                }

                // Fallback candidate chain to handle transient capacity limits
                const candidates = [
                  targetModel,
                  'gemini-2.5-flash',
                  'gemini-3.1-flash-lite',
                  'gemini-3.5-flash',
                ].filter((m, i, arr) => arr.indexOf(m) === i);

                let reply = '';
                let usedModel = targetModel;
                let lastErr: any = null;

                for (const candidate of candidates) {
                  try {
                    const response = await ai.models.generateContent({
                      model: candidate,
                      contents,
                      config: {
                        systemInstruction,
                      },
                    });
                    reply = response.text || '';
                    usedModel = candidate;
                    if (reply) break;
                  } catch (candidateErr: any) {
                    console.warn(`Chat model ${candidate} failed:`, candidateErr?.message);
                    lastErr = candidateErr;
                  }
                }

                if (!reply && lastErr) {
                  throw lastErr;
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  reply,
                  model: usedModel,
                }));
              } catch (error: any) {
                console.error('Error in AI chat endpoint:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: error.message || 'Failed to process chat message' }));
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
