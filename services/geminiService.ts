import { GoogleGenAI, Type } from "@google/genai";
import { Profile } from '../types';

// FIX: Per coding guidelines, the API key must be retrieved from `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateClonedProfile = async (
  sourceProfile: Profile
): Promise<Omit<Profile, 'avatarUrl'>> => {
  const prompt = `
    You are a creative profile generator. Based on the following user profile, create a new, distinct but related profile.
    - Generate a new, creative username or full name.
    - Write a new, short and punchy bio (max 1-2 sentences).
    - Create a new email address by appending "+cloned" to the local-part of the original email (before the "@" symbol).

    Source Profile:
    - Name: ${sourceProfile.name}
    - Email: ${sourceProfile.email}
    - Bio: ${sourceProfile.bio}

    Generate the new profile based on these instructions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'A new, creative full name or username.'
            },
            email: {
              type: Type.STRING,
              description: 'The original email with "+cloned" appended before the @ symbol.'
            },
            bio: {
              type: Type.STRING,
              description: 'A new, short, and creative bio, maximum of 160 characters.'
            }
          },
          required: ['name', 'email', 'bio']
        }
      }
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
      throw new Error("AI returned an empty response.");
    }

    const newProfileData = JSON.parse(jsonString);
    return newProfileData;

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    if (error instanceof Error) {
       throw new Error(`Could not generate a new profile. AI Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the profile.");
  }
};