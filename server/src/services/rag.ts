import { OpenAI } from 'openai';
import { KNOWLEDGE_BASE } from '../db/knowledge.js';
import { env } from '../config/env.js';

let openai: OpenAI | null = null;
if (env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

// Simple dot product (cosine similarity since embeddings are normalized)
function cosineSimilarity(A: number[], B: number[]): number {
  let dotProduct = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
  }
  return dotProduct;
}

// Fallback search when API Key is absent (Keyword match)
function fallbackSearch(query: string, topK: number): string {
  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  const scored = KNOWLEDGE_BASE.map(doc => {
    let score = 0;
    const docText = (doc.topic + ' ' + doc.content).toLowerCase();
    queryWords.forEach(w => {
      if (docText.includes(w)) score++;
    });
    return { doc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(r => `* [${r.doc.id}] ${r.doc.topic}:\n${r.doc.content}`)
    .join('\n\n');
}

/**
 * Initializes the RAG Engine, computing embeddings for all documents
 */
export async function compileRAG() {
  if (!openai) {
    console.log('[RAG Engine] OpenAI credentials missing. Defaulting to Keyword-Search.');
    return;
  }
  
  console.log('[RAG Engine] Compilando Base de Conhecimento Vetorial...');
  for (const doc of KNOWLEDGE_BASE) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: doc.topic + '\n' + doc.content,
      });
      doc.embedding = response.data[0].embedding;
    } catch (err: any) {
      console.warn(`[RAG Engine] Falha ao embeddar ${doc.id}: ${err.message}. RAG cairá para fallback.`);
    }
  }
  console.log('[RAG Engine] Vetores carregados com sucesso.');
}

/**
 * Executes a Semantic Search against the Knowledge Base
 */
export async function searchKnowledge(query: string, topK: number = 2): Promise<string> {
  const isEmbeddingsReady = KNOWLEDGE_BASE.every(d => d.embedding && d.embedding.length > 0);
  
  if (!openai || !isEmbeddingsReady) {
    return fallbackSearch(query, topK);
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryVector = response.data[0].embedding;

    const scored = KNOWLEDGE_BASE.map(doc => {
        return {
          doc,
          similarity: cosineSimilarity(queryVector, doc.embedding!)
        };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(r => `[EVIDÊNCIA: ${r.doc.topic}]\n${r.doc.content}`)
      .join('\n\n');
      
  } catch (err) {
    console.error('[RAG Engine] Erro na busca com OpenAI. Usando fallback de palavras.', err);
    return fallbackSearch(query, topK);
  }
}
