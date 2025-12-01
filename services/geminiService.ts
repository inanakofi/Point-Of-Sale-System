
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Transaction } from "../types";

// Safely access process.env.API_KEY to prevent crashes in browser environments where process is undefined
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to check if API key is present
export const isApiKeySet = () => !!apiKey;

export const analyzeSalesData = async (transactions: Transaction[], userQuery: string) => {
  if (!isApiKeySet()) throw new Error("API Key missing");

  // Summarize data to reduce token count
  const summary = transactions.slice(0, 50).map(t => ({
    id: t.id,
    date: t.date.split('T')[0],
    total: t.total.toFixed(2),
    items: t.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
  }));

  const prompt = `
    You are a helpful Data Analyst for a retail store. 
    Here is a summary of the last ${summary.length} transactions in JSON format:
    ${JSON.stringify(summary)}

    User Query: "${userQuery}"

    Please answer the user's question based strictly on the provided data. 
    If you need to calculate totals, please do so carefully.
    Keep the answer concise and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I couldn't analyze the sales data at this moment.";
  }
};

export const suggestProductDetails = async (productName: string): Promise<Partial<Product> | null> => {
  if (!isApiKeySet()) return null;

  const prompt = `
    I am adding a new product to my POS system. The product name is: "${productName}".
    Please suggest a category, a typical retail price (number only), a generated SKU, and a short marketing description.
    
    Return the response strictly as a JSON object with this schema:
    {
      "category": "string",
      "price": number,
      "sku": "string",
      "description": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            price: { type: Type.NUMBER },
            sku: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as Partial<Product>;
  } catch (error) {
    console.error("Gemini Product Suggestion Error:", error);
    return null;
  }
};

export const generateProductImage = async (productName: string, description: string): Promise<string | null> => {
  if (!isApiKeySet()) return null;

  try {
    const prompt = `Professional product photography of ${productName}. ${description}. 
    Clean white background, studio lighting, high resolution, photorealistic, commercial style.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Iterate through parts to find the image data
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Data = part.inlineData.data;
          // Assuming PNG as default from Gemini 2.5 Flash Image unless mimeType specifies otherwise
          const mimeType = part.inlineData.mimeType || 'image/png'; 
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    return null;
  }
};
