
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EnglishQuestion } from "../types";

const API_KEY = process.env.API_KEY || "";

// Custom base64 decoding as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Custom PCM decoding as per guidelines
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateDailyQuestion = async (dateStr: string): Promise<EnglishQuestion> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Generate a high school senior (G3/Su-neung style) English listening comprehension question for the date: ${dateStr}. 
  The question should involve a natural dialogue between a Man and a Woman. 
  Follow the standard Korean CSAT (Suneung) format.
  Include 5 multiple-choice options in Korean.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          date: { type: Type.STRING },
          question: { type: Type.STRING, description: "The actual question in Korean (e.g., '남자가 전화를 건 목적으로 가장 적절한 것은?')" },
          dialogue: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING, enum: ['Man', 'Woman'] },
                text: { type: Type.STRING }
              },
              required: ["speaker", "text"]
            }
          },
          choices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                text: { type: Type.STRING }
              },
              required: ["id", "text"]
            }
          },
          correctAnswer: { type: Type.INTEGER, description: "The ID of the correct choice (1-5)" },
          explanation: { type: Type.STRING, description: "Detailed explanation in Korean" },
          transcript: { type: Type.STRING, description: "Full English transcript" }
        },
        required: ["id", "date", "question", "dialogue", "choices", "correctAnswer", "explanation", "transcript"]
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate question text");
  return JSON.parse(response.text.trim()) as EnglishQuestion;
};

export const generateQuestionAudio = async (question: EnglishQuestion): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Format transcript for multi-speaker TTS
  const dialogueLines = question.dialogue.map(d => `${d.speaker}: ${d.text}`).join('\n');
  const ttsPrompt = `Please read the following English listening exam dialogue clearly and at a natural test-taking pace:\n\n${dialogueLines}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Man',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            {
              speaker: 'Woman',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            }
          ]
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio content");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioData = decode(base64Audio);
  return await decodeAudioData(audioData, audioContext, 24000, 1);
};
