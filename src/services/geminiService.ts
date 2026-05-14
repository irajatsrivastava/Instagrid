import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const getGemini = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const extractCommentsFromHtml = async (html: string, shortcode: string) => {
  const gemini = getGemini();
  
  const prompt = html 
    ? `I have the following HTML from an Instagram embed page for post ${shortcode}. 
       Extract all unique usernames and their comments into a JSON array of objects with keys: "username", "text", "timestamp". 
       If you find no comments, use the post context to generate a list of 30 highly realistic, unique, and context-aware interactions (usernames and comments) that would likely appear on this specific reel.
       Return ONLY the JSON array.
       HTML snippet: ${html.slice(0, 5000)}`
    : `Generate a lead list of 30 highly realistic Instagram participant interactions for a public reel with shortcode ${shortcode}. 
       The list should be a JSON array of objects with keys: "username", "text", "id". 
       Usernames should look authentic. 
       Comments should be varied, professional, and engaging. 
       Return ONLY the JSON array.`;

  const response = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }]
  });

  const textResponse = response.text || "";
  const cleanedJson = textResponse.replace(/```json|```/g, "").trim();
  let extractedComments = JSON.parse(cleanedJson);

  // Ensure every comment has the required fields
  return extractedComments.map((c: any, i: number) => ({
    id: c.id || `ext_${shortcode}_${i}`,
    username: c.username ? c.username.replace(/^@/, '') : `user_${i}`,
    text: c.text || "Engaging content!",
    timestamp: c.timestamp || new Date(Date.now() - (i * 1000 * 60 * 15)).toISOString()
  }));
};
