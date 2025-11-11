import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64 } from "../utils/audioUtils";
import { VoiceName, PauseStrength } from "../types";

// FIX: Per coding guidelines, the API key must be retrieved from `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const applyPauseStyle = (text: string, strength: PauseStrength): string => {
  if (strength === PauseStrength.None) {
     return text
      .replace(/[,;:\-]/g, " ") 
      .replace(/[\n\r]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  if (strength === PauseStrength.Strong) {
     return text
        .replace(/([,;])\s*/g, "$1 ... ") 
        .replace(/([.?!])\s*/g, "$1 \n\n");
  }

  return text;
}

export const generateSpeech = async (
  text: string,
  voiceName: VoiceName,
  pauseStrength: PauseStrength = PauseStrength.Normal
): Promise<Uint8Array> => {
  const processedText = applyPauseStyle(text, pauseStrength);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: processedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    if (!response) {
      throw new Error("Empty response received from Gemini API.");
    }

    const candidate = response.candidates?.[0];

    if (!candidate) {
      console.warn("Gemini API returned no candidates. Full Response:", response);
      throw new Error("The model could not generate audio. The text may have been blocked by safety settings.");
    }

    if (candidate.finishReason && candidate.finishReason !== "STOP") {
       console.warn(`Gemini generation stopped. Reason: ${candidate.finishReason}`);
       if (candidate.finishReason === "SAFETY") {
         throw new Error("Audio generation was blocked due to safety policies regarding the text content.");
       }
       if (candidate.finishReason === "RECITATION") {
         throw new Error("Audio generation blocked: The text appears to match copyrighted content.");
       }
       throw new Error(`Generation stopped unexpectedly: ${candidate.finishReason}`);
    }

    const base64Audio = candidate.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      console.error("Audio data missing in response structure:", JSON.stringify(candidate, null, 2));
      throw new Error("The model generated a response, but no audio data was found.");
    }

    return decodeBase64(base64Audio);

  } catch (error: any) {
    console.group("TTS Service Error Details");
    console.error("Original Input Length:", text.length);
    console.error("Processed Text Length:", processedText.length);
    console.error("Pause Style:", pauseStrength);
    console.error("Selected Voice:", voiceName);
    console.error("Raw Error Object:", error);
    console.groupEnd();

    let userMessage = "Failed to generate audio.";

    if (error instanceof Error) {
        userMessage = error.message;
        if (userMessage.includes("429")) {
            userMessage = "Quota exceeded (429). Please wait a moment before generating again.";
        } else if (userMessage.includes("403")) {
            userMessage = "Access denied (403). Please check your API Key permissions.";
        } else if (userMessage.includes("401")) {
            userMessage = "Unauthorized (401). Invalid API Key.";
        } else if (userMessage.includes("500") || userMessage.includes("503")) {
            userMessage = "Google AI service is temporarily unavailable. Please try again later.";
        } else if (userMessage.includes("fetch failed")) {
            userMessage = "Network connection failed. Please check your internet.";
        }
    }

    throw new Error(userMessage);
  }
};