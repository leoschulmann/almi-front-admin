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

export async function aiValidateForms(
  request: AiValidateFormsRequest,
): Promise<AiValidateFormsResponse> {
  return await aiClient.post("verbs/validate-forms", { json: request }).json();
}
