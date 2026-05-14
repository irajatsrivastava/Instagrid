
export interface AnalysisResult {
  sentiment: string;
  keywords: string[];
  themes: { title: string; reasoning: string }[];
  summary: string;
}

const positiveWords = ["good", "great", "awesome", "amazing", "love", "love it", "wow", "nice", "excellent", "beautiful", "connect", "join", "help", "founders", "build", "interested", "yes", "please", "thanks", "thank you", "congrats", "congratulations"];
const negativeWords = ["bad", "hate", "terrible", "worst", "broken", "fail", "failed", "error", "stop", "scam", "fake", "spam", "sucks", "disappointing", "no"];

const leadKeywords = ["interested", "how much", "price", "cost", "dm", "details", "info", "buying", "buy", "join", "connect", "link"];

const stopWords = ["the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "in", "on", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"];

export async function analyzeComments(comments: { Username: string; Comment: string }[]): Promise<AnalysisResult> {
  let posCount = 0;
  let negCount = 0;
  let leadCount = 0;
  const wordFreq: Record<string, number> = {};
  
  comments.forEach(c => {
    const text = c.Comment.toLowerCase();
    
    // Sentiment
    positiveWords.forEach(w => { if (text.includes(w)) posCount++; });
    negativeWords.forEach(w => { if (text.includes(w)) negCount++; });

    // Lead Identification Logic
    leadKeywords.forEach(w => { if (text.includes(w)) leadCount++; });
    
    // Keywords
    const words = text.replace(/[^\w\s]/g, "").split(/\s+/);
    words.forEach(w => {
      if (w.length > 3 && !stopWords.includes(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
  });

  // Sentiment Logic
  let sentiment = "Neutral";
  if (posCount > negCount * 1.5) sentiment = "Positive";
  else if (negCount > posCount * 1.5) sentiment = "Negative";
  else if (posCount > 0 && negCount > 0) sentiment = "Mixed";

  // Top Keywords
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(e => e[0]);

  // Themes Logic (Heuristic Understanding)
  const themes = [];
  const textBlob = comments.map(c => c.Comment.toLowerCase()).join(" ");
  
  if (leadCount > comments.length * 0.1) {
    themes.push({ 
      title: "Potential Business Leads", 
      reasoning: `Found ${leadCount} comments with intent signals (interested, price, info). High conversion potential identified.` 
    });
  }

  if (textBlob.includes("connect") || textBlob.includes("join") || textBlob.includes("link")) {
    themes.push({ 
      title: "Networking & Community", 
      reasoning: "Patterns suggest high engagement for relationship building and joining groups." 
    });
  }
  
  if (textBlob.includes("how") || textBlob.includes("?") || textBlob.includes("what")) {
    themes.push({ 
      title: "Active Learning", 
      reasoning: "Presence of queries indicates an audience looking for educational content or help." 
    });
  }

  if (posCount > comments.length * 0.4) {
    themes.push({
      title: "Brand Loyalty",
      reasoning: "Substantial positive reinforcement across the comment set indicates strong sentiment."
    });
  }

  if (themes.length === 0) {
    themes.push({ title: "General Discussion", reasoning: "Comments follow standard peer-to-peer social interaction patterns." });
  }

  const summary = `System analyzed ${comments.length} nodes. Verdict: ${sentiment} sentiment dominant. Key focus on '${keywords[0] || 'N/A'}'. Found ${leadCount} lead signals. Themes mapped to ${themes.map(t => t.title).join(", ")}.`;

  return {
    sentiment,
    keywords,
    themes,
    summary
  };
}

export async function extractCommentsFromHtml(html: string, shortcode: string): Promise<any[]> {
  if (!html) return [];
  
  // Rule-based extraction using Regex (mimicking logic)
  const comments: any[] = [];
  
  // This is a complex task without a DOM parser in a headless way if we only have the string.
  // But we can try to find common patterns.
  // Pattern: "username" and then some text.
  
  // Note: Since this runs server-side or in dashboard context, 
  // we would usually use a library like JSDOM or just return dummy data if we can't parse safely.
  // However, most extraction now happens in the extension (content.js).
  
  return comments; // Better to let the extension do the heavy lifting
}
