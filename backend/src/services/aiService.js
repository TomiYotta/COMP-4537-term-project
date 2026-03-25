import path from "path";
import { fileURLToPath } from "url";
import { pipeline, env } from "@huggingface/transformers";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../");
const CACHE_DIR = path.join(PROJECT_ROOT, ".cache");

// Store downloaded model files here
env.cacheDir = CACHE_DIR;

class EmbeddingPipeline {
  static task = "feature-extraction";
  static model = "Xenova/all-MiniLM-L6-v2";
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model);
    }
    return this.instance;
  }

  static isReady() {
    return this.instance !== null;
  }
}

function cleanText(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function buildVerdict(similarity) {
  if (similarity >= 0.82) {
    return {
      verdict: "correct",
      feedback: "The student answer is semantically very close to the reference answer."
    };
  }

  if (similarity >= 0.65) {
    return {
      verdict: "partially_correct",
      feedback: "The student answer is related, but it appears to miss some important details."
    };
  }

  return {
    verdict: "incorrect",
    feedback: "The student answer is not close enough to the reference answer."
  };
}

export function getModelInfo() {
  return {
    model: EmbeddingPipeline.model,
    task: EmbeddingPipeline.task,
    ready: EmbeddingPipeline.isReady()
  };
}

export async function warmupModel() {
  await EmbeddingPipeline.getInstance();
  return getModelInfo();
}

export async function evaluateAnswer({ question, referenceAnswer, studentAnswer }) {
  const cleanedQuestion = question ? cleanText(question) : null;
  const cleanedReference = cleanText(referenceAnswer);
  const cleanedStudent = cleanText(studentAnswer);

  const extractor = await EmbeddingPipeline.getInstance();

  // Get 2 sentence embeddings at once
  const output = await extractor(
    [cleanedReference, cleanedStudent],
    {
      pooling: "mean",
      normalize: true
    }
  );

  const [referenceEmbedding, studentEmbedding] = output.tolist();

  const similarity = cosineSimilarity(referenceEmbedding, studentEmbedding);
  const roundedSimilarity = Number(similarity.toFixed(4));
  const verdictData = buildVerdict(roundedSimilarity);

  return {
    question: cleanedQuestion,
    referenceAnswer: cleanedReference,
    studentAnswer: cleanedStudent,
    similarity: roundedSimilarity,
    verdict: verdictData.verdict,
    feedback: verdictData.feedback,
    model: EmbeddingPipeline.model
  };
}
