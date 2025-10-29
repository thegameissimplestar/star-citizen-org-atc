import { GoogleGenAI, Type } from "@google/genai";
import type { DashboardData, Member, Ship, Operation, ServerStatus, ServerStatusValue, ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const generateContentWithSchema = async <T,>(prompt: string, schema: any): Promise<T | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};

export const fetchDashboardData = async (): Promise<DashboardData | null> => {
  const prompt = `Generate dashboard data for a Star Citizen gaming organization named 'ATC'. 
    - The announcement should be about a new capital ship acquisition.
    - Stats should be realistic for a medium-sized org.
    - The upcoming event should be a combat operation.
  `;
  const schema = {
    type: Type.OBJECT,
    properties: {
      announcement: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
        },
      },
      stats: {
        type: Type.OBJECT,
        properties: {
          totalMembers: { type: Type.INTEGER },
          totalShips: { type: Type.INTEGER },
          activeOperations: { type: Type.INTEGER },
        },
      },
      upcomingEvent: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          date: { type: Type.STRING, description: "Format as 'YYYY-MM-DD HH:MM UEE'" },
        },
      },
    },
  };
  return generateContentWithSchema<DashboardData>(prompt, schema);
};

export const fetchMembers = async (): Promise<Member[] | null> => {
  const prompt = "Generate a list of 15 diverse members for a Star Citizen organization. Include callsign, a realistic real name, a list of 1-3 primary roles (e.g., Pilot, Gunner, Medic, Engineer, Miner, Trader), status (Online/Offline), and a preferred contact method (like a Discord handle, e.g., 'User#1234').";
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        callsign: { type: Type.STRING },
        realName: { type: Type.STRING },
        primaryRoles: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        status: { type: Type.STRING, enum: ['Online', 'Offline'] },
        avatarUrl: { type: Type.STRING, description: `Use a placeholder from https://picsum.photos/seed/{callsign}/100/100` },
        preferredContact: { type: Type.STRING },
      },
      required: ['callsign', 'realName', 'primaryRoles', 'status', 'avatarUrl', 'preferredContact'],
    },
  };
  return generateContentWithSchema<Member[]>(prompt, schema);
};

export const fetchFleet = async (): Promise<Ship[] | null> => {
  const prompt = "Generate a list of 10 ships for a Star Citizen organization's fleet. Include ship name, model (e.g., Aegis Hammerhead, Anvil Carrack), role (Capital, Explorer, Fighter, Industrial, Support), status (In Service, Under Repair, On Mission), and a short, one-sentence description of its primary function or capabilities.";
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        model: { type: Type.STRING },
        role: { type: Type.STRING, enum: ['Capital', 'Explorer', 'Fighter', 'Industrial', 'Support'] },
        status: { type: Type.STRING, enum: ['In Service', 'Under Repair', 'On Mission'] },
        imageUrl: { type: Type.STRING, description: `Use a placeholder from https://picsum.photos/seed/{model}/400/200` },
        description: { type: Type.STRING, description: "A brief one-sentence description of the ship's capabilities." },
      },
      required: ['name', 'model', 'role', 'status', 'imageUrl', 'description'],
    },
  };
  return generateContentWithSchema<Ship[]>(prompt, schema);
};

export const fetchOperations = async (): Promise<Operation[] | null> => {
  const prompt = "Generate a list of 5 recent or current operations for a Star Citizen organization. Include operation name, a brief objective, status (Active, Completed, Planned), and a list of 3-4 key personnel callsigns.";
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        objective: { type: Type.STRING },
        status: { type: Type.STRING, enum: ['Active', 'Completed', 'Planned'] },
        keyPersonnel: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['name', 'objective', 'status', 'keyPersonnel'],
    },
  };
  return generateContentWithSchema<Operation[]>(prompt, schema);
};

export const generateShipDescription = async (model: string, role: string): Promise<string> => {
  const prompt = `Generate a brief, one-sentence marketing description for a Star Citizen ship with the model "${model}" intended for a "${role}" role.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating ship description:", error);
    return "A versatile vessel ready for a variety of tasks."; // Return a fallback
  }
};

export const fetchServerStatus = async (): Promise<ServerStatus | null> => {
  try {
    const prompt = `
      What is the current live server status for the game Star Citizen? 
      Use the official RSI status page as your source of truth. 
      The status will be one of the following keywords: 'operational', 'degraded_performance', 'partial_outage', 'major_outage', or 'under_maintenance'. 
      Please respond with only the single status keyword in lowercase. For example, if the servers are operational, your entire response should be "operational". Do not add any explanation or other text.
    `;

    const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: prompt,
       config: {
         tools: [{googleSearch: {}}],
       },
    });

    const statusText = response.text.trim().toLowerCase();

    const validStatuses: ServerStatusValue[] = ['operational', 'degraded_performance', 'partial_outage', 'major_outage', 'under_maintenance'];
    
    // Check for exact match first
    if (validStatuses.includes(statusText as ServerStatusValue)) {
      return {
        data: {
          status: statusText as ServerStatusValue,
        },
      };
    }

    // Fallback for cases where Gemini might add extra text
    for (const validStatus of validStatuses) {
      if (statusText.includes(validStatus)) {
        return {
          data: {
            status: validStatus,
          },
        };
      }
    }
      
    console.error("Could not parse server status from Gemini response:", response.text);
    return null;
  } catch (error) {
    console.error("Error fetching server status via Gemini:", error);
    return null;
  }
};

export const generateChatResponse = async (chatHistory: ChatMessage[], members: Member[], userCallsign: string): Promise<ChatMessage | null> => {
  const otherMembers = members.filter(m => m.callsign !== userCallsign);
  if (otherMembers.length === 0) return null;

  const randomMember = otherMembers[Math.floor(Math.random() * otherMembers.length)];

  const historyString = chatHistory
    .slice(-5) // Get last 5 messages for context
    .map(msg => {
      if (msg.gifUrl) {
        return `${msg.callsign}: [sent a GIF]`;
      }
      return `${msg.callsign}: ${msg.message}`;
    })
    .join('\n');

  const prompt = `
    You are a member of a Star Citizen gaming organization called ATC. Your callsign is "${randomMember.callsign}".
    The following is a chat conversation with another member, "${userCallsign}".
    Keep your response brief, in-character, and relevant to the conversation and the world of Star Citizen.
    If the last message was a GIF, react to it appropriately.
    Do not break character. Do not use your real name. Behave like a gamer talking to a friend in their org.

    Conversation History:
    ${historyString}
    
    ${randomMember.callsign}:
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const messageText = response.text.trim();
    if (!messageText) return null;

    // FIX: Add missing properties to conform to ChatMessage type
    return {
      callsign: randomMember.callsign,
      message: messageText,
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarUrl: randomMember.avatarUrl,
    };

  } catch (error) {
    console.error("Error generating chat response:", error);
    // FIX: Add missing properties to conform to ChatMessage type
    return {
        callsign: "System",
        message: "Sorry, comms are scrambled right now. Try again later.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatarUrl: `https://picsum.photos/seed/System/100/100`,
    };
  }
};

export const searchGifs = async (query: string): Promise<string[] | null> => {
  const prompt = `Generate a list of 12 diverse, high-quality GIF URLs from a public source like Giphy or Tenor related to the search term: "${query}". The URLs must be direct links to the GIF file (e.g., ending in .gif).`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.STRING,
      description: 'A direct URL to a .gif file'
    }
  };
  return generateContentWithSchema<string[]>(prompt, schema);
};
