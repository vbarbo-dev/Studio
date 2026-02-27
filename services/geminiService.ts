import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize only if key is present to avoid immediate errors, though functionality will check later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateNoticeDraft = async (topic: string, tone: 'polite' | 'strict' | 'urgent'): Promise<string> => {
  if (!ai) return "Erro: Chave de API não configurada.";

  const prompt = `
    Atue como um síndico profissional e experiente de um pequeno condomínio.
    Escreva um comunicado/aviso para os moradores.
    Tópico: ${topic}
    Tom de voz: ${tone === 'polite' ? 'Educado e colaborativo' : tone === 'strict' ? 'Firme e baseado nas regras' : 'Urgente e direto'}.
    Formato: Título claro seguido de corpo da mensagem. Mantenha conciso (máximo 3 parágrafos).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o rascunho.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a IA. Tente novamente.";
  }
};

export const analyzeIncident = async (incidentDescription: string): Promise<string> => {
  if (!ai) return "Erro: Chave de API não configurada.";

  const prompt = `
    Você é um assistente de gestão condominial. Analise a seguinte ocorrência reportada:
    "${incidentDescription}"

    Forneça 3 passos práticos e objetivos que o síndico deve tomar para resolver este problema,
    considerando a boa convivência e manutenção predial.
    Responda em formato de lista (markdown).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Sem sugestões disponíveis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao analisar ocorrência.";
  }
};