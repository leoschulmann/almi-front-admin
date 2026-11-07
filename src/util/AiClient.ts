import ky from "ky";
import type {
  GrammaticalGender,
  GrammaticalPerson,
  Plurality,
  Tense,
} from "@/model/VerbParameters.ts";

// almi-ai: stateless LLM service; this admin is its only orchestrator
const aiClient = ky.create({
  prefixUrl: "http://localhost:8080/api",
  // an LLM call with thinking can take a while
  timeout: 180_000,
  retry: 0,
});

export type AiUsage = "COMMON" | "RARE" | "UNUSED" | "SEMANTICALLY_ODD";

export interface AiTokenUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface AiFormCell {
  tense: Tense;
  person: GrammaticalPerson;
  plurality: Plurality;
  gender: GrammaticalGender;
  form: string;
}

export interface AiValidateFormsRequest {
  root: string;
  binyan: string;
  gizrot: string[];
  forms: AiFormCell[];
}

export interface AiFormResult {
  index: number;
  form: string;
  valid: boolean | null;
  correction: string | null;
  usage: AiUsage | null;
  note: string | null;
  error: string | null;
}

export interface AiValidateFormsResponse {
  results: AiFormResult[];
  tokens: AiTokenUsage | null;
}

export interface AiTransliterationItem {
  index: number;
  text: string;
  en: string | null;
  ru: string | null;
  error: string | null;
}

export interface AiTransliterateResponse {
  results: AiTransliterationItem[];
  tokens: AiTokenUsage | null;
}

export async function aiTransliterate(
  texts: string[],
): Promise<AiTransliterateResponse> {
  return await aiClient.post("transliterate", { json: { texts } }).json();
}

export interface AiTranslationsRequest {
  root: string;
  binyan: string;
  // the verb as typed by the user: niqqud may be missing or imprecise
  infinitive: string;
  languages?: string[];
}

export interface AiTranslationsResponse {
  infinitive: string;
  recognized: boolean;
  correction: string | null;
  // by lang code (EN, RU); empty when not recognized
  translations: Record<string, string[]>;
  prepositions: string[];
  note: string;
  tokens: AiTokenUsage | null;
}

export async function aiTranslations(
  request: AiTranslationsRequest,
): Promise<AiTranslationsResponse> {
  return await aiClient.post("verbs/translations", { json: request }).json();
}

export interface AiExampleSentence {
  sentence: string;
  // by lang code (EN, RU)
  translations: Record<string, string>;
}

export interface AiExampleResult {
  index: number;
  form: string;
  examples: AiExampleSentence[] | null;
  error: string | null;
}

export interface AiExamplesRequest {
  root: string;
  binyan: string;
  gizrot: string[];
  forms: AiFormCell[];
  languages?: string[];
  perForm?: number;
  // accepted translations of the verb by language code
  translations?: Record<string, string[]>;
}

export interface AiExamplesResponse {
  results: AiExampleResult[];
  tokens: AiTokenUsage | null;
}

export async function aiExamples(
  request: AiExamplesRequest,
): Promise<AiExamplesResponse> {
  return await aiClient.post("verbs/examples", { json: request }).json();
}

export async function aiValidateForms(
  request: AiValidateFormsRequest,
): Promise<AiValidateFormsResponse> {
  return await aiClient.post("verbs/validate-forms", { json: request }).json();
}
