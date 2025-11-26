import { GoogleGenAI, Type, Schema } from "@google/genai";
import { IncidentAnalysis } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    incidentType: {
      type: Type.STRING,
      description: "Type of incident (e.g., Car Accident, Earthquake, Building Fire, Flood).",
    },
    briefSummary: {
      type: Type.STRING,
      description: "A concise 1-2 sentence summary of what is depicted in the image.",
    },
    estimatedAffectedCount: {
      type: Type.INTEGER,
      description: "Approximate number of people visibly injured or affected.",
    },
    likelyCause: {
      type: Type.STRING,
      description: "What likely caused the injury or situation based on visual evidence.",
    },
    criticalResponseTime: {
        type: Type.STRING,
        description: "Predicted maximum time before which emergency services must arrive based on injury severity (e.g., 'Immediate', 'Within 10 mins', 'Within 1 hour').",
    },
    injuries: {
      type: Type.ARRAY,
      description: "List of specific injuries identified.",
      items: {
        type: Type.OBJECT,
        properties: {
          bodyPart: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['Minor', 'Moderate', 'Severe', 'Critical', 'Unknown'] },
          description: { type: Type.STRING },
        },
        required: ["bodyPart", "severity", "description"],
      },
    },
    isEnvironmentalContextRelevant: {
        type: Type.BOOLEAN,
        description: "Set to TRUE if this is a disaster scenario (earthquake, flood, large fire, collapse) where infrastructure status (water/power) is relevant. Set to FALSE for isolated accidents (e.g., single car crash, individual injury)."
    },
    environment: {
      type: Type.OBJECT,
      description: "Status of the surrounding environment.",
      properties: {
        electricityAvailable: { type: Type.STRING, enum: ['Likely', 'Unlikely', 'Unknown'] },
        waterAvailable: { type: Type.STRING, enum: ['Likely', 'Unlikely', 'Unknown'] },
        infrastructureDamage: { type: Type.STRING, enum: ['None', 'Minor', 'Major', 'Catastrophic'] },
        firePresence: { type: Type.BOOLEAN },
        floodPresence: { type: Type.BOOLEAN },
      },
      required: ["electricityAvailable", "waterAvailable", "infrastructureDamage", "firePresence", "floodPresence"],
    },
    immediateHazards: {
      type: Type.ARRAY,
      description: "List of immediate dangers visible (e.g., live wires, falling debris, smoke).",
      items: { type: Type.STRING },
    },
  },
  required: [
    "incidentType",
    "briefSummary",
    "estimatedAffectedCount",
    "likelyCause",
    "criticalResponseTime",
    "injuries",
    "isEnvironmentalContextRelevant",
    "environment",
    "immediateHazards",
  ],
};

export const analyzeIncidentImage = async (base64Image: string, mimeType: string): Promise<IncidentAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: `Analyze this image for emergency response purposes. 
            Identify the type of incident, injuries, and critical timeline for assistance.
            Determine if environmental infrastructure context is relevant (only for disasters/calamities).
            Be objective and analytical. Focus on visual facts useful for first responders.
            Provide estimates for numbers.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Low temperature for more factual observation
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    try {
      const data = JSON.parse(text) as IncidentAnalysis;
      return data;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error("Failed to parse analysis results.");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the Data-URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
