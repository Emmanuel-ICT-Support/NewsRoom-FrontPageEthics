
import OpenAI from 'openai';
import { NewsroomMissionInputs, SourceEntry } from '../types';
import { OPENAI_MODEL_TEXT, OPENAI_MODEL_IMAGE } from '../constants';

const OPENAI_API_KEY = process.env.OPENAI_OPENAI_API_KEY;

let ai: OpenAI | null = null;
if (OPENAI_API_KEY) {
  ai = new OpenAI({ apiKey: OPENAI_API_KEY });
} else {
  console.error("OPENAI_OPENAI_API_KEY is not configured. Please set it in your environment.");
}

export const checkApiKey = (): boolean => {
  return !!OPENAI_API_KEY;
};

interface SourceInsight {
  formattedReference: string;
  insideScoop: string;
}

export const startNewsroomMission = async (
  inputs: NewsroomMissionInputs,
  sourceInsights: SourceInsight[] = [] // Optional parameter for source insights
): Promise<string> => {
  if (!ai) {
    throw new Error("OpenAI client is not initialized. OPENAI_API_KEY might be missing.");
  }

  const {
    headline,
    studentName,
    moralIssue,
    challenges,
    studentDecision,
    catholicTeachings,
    conscience,
    quotes,
    date
  } = inputs;

  let insightsPromptSection = "";
  if (sourceInsights.length > 0) {
    insightsPromptSection = "\n\n**Incorporate Research Insights:**\n" +
      "The following insights, quotes, or statistics have been noted from research sources. Weave them naturally into the article where they best support the narrative:\n";
    sourceInsights.forEach(insight => {
      insightsPromptSection += `- From source "${insight.formattedReference}": ${insight.insideScoop}\n`;
    });
  }

  const prompt = `
You are the lead journalist at 'The Ethics Chronicle'! Your mission is to write a compelling Pressroom Proof newspaper article.
The article must focus on a Year 11 student named ${studentName || 'a student'} who faced and resolved a significant moral or ethical issue.
The article must be written in the third person with an objective, professional tone suitable for a school newspaper or local broadsheet.

Adhere to the following structure and content guidelines:
1.  **Headline:** Based on the theme "${headline}", create a punchy, short, powerful, and engaging headline. Think like a pro editor!
2.  **Byline:** Include a suitable byline, for example, 'By a Student Reporter' or 'Special to The Ethics Chronicle'.
3.  **Date of Publication:** Use the date: ${date}.
4.  **Lead Paragraph:** Write a concise lead paragraph (30-50 words) summarizing the core story: who, what, when, where, and why it's significant.
5.  **Body Paragraphs with Subheadings:**
    *   Detail the moral/ethical issue (your scoop!) faced by ${studentName || 'the student'}: "${moralIssue}".
    *   Explain the challenges that made this issue tough for ${studentName || 'the student'}: "${challenges}". What did they struggle with?
    *   Describe the decision ${studentName || 'the student'} made and why it was the moral thing to do: "${studentDecision}".
    *   Incorporate how Catholic Social Teachings (pick one or two like "${catholicTeachings}") guided their choice.
    *   Describe how ${studentName || 'the student'}'s conscience ("${conscience}") helped them make the decision.
    *   Use clear subheadings (e.g., 'The Dilemma', 'A Moral Compass', 'Finding a Path Forward') to structure these sections.
6.  **Quotes:** Integrate 2-3 quote ideas like these "${quotes}" naturally into the article. If specific quotes are not detailed enough, create plausible and relevant quotes from ${studentName || 'the student'}, teachers, or friends, reflecting the provided themes.
7.  **Conclusion:** End with a strong concluding paragraph that summarizes the impact of ${studentName || 'the student'}'s actions or offers a reflective thought.
${insightsPromptSection}
Format your output clearly. Use ONLY the following markers for structure:
\`## HEADLINE: [Your Generated Headline]\`
\`**BYLINE:** [Your Generated Byline]\`
\`**DATE:** ${date}\`
For subheadings, use: \`### [Your Generated Subheading Text]\`
For quotes, use: \`**QUOTE:** "[Quote text]" - Speaker **END QUOTE**\` (If you generate a speaker, make it contextually appropriate like 'a teacher' or 'a friend').

Ensure the entire article flows well and is engaging for a Year 11 readership.
  `;

  try {
    const response = await ai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error("Error generating newsroom mission article:", error);
    if (error instanceof Error) {
        return `Error generating article: ${error.message}`;
    }
    return "An unknown error occurred while generating the article.";
  }
};

export const formatSourceToAPA = async (rawSourceText: string): Promise<string> => {
  if (!ai) {
    throw new Error("OpenAI client is not initialized. OPENAI_API_KEY might be missing.");
  }

  if (!rawSourceText || rawSourceText.trim() === "") {
    return "Error: Source input cannot be empty.";
  }

  const prompt = `
You are a meticulous research assistant. Your task is to take the following single source text provided by a user and format it into a complete bibliography entry in APA 7th style.
The user's input might be partially formatted, contain typos, or be a simple description of a source (e.g., "a book by Smith on ethics from 2020"). Do your best to interpret it and produce a valid APA 7th edition entry.
Pay close attention to punctuation, capitalization, and italicization as required by APA 7th style.
If the input is too vague, clearly not a source reference, or lacks essential information that cannot be reasonably inferred for APA formatting (e.g., just a single word like "website"), return a message clearly starting with "Error: Could not format source: Input is too vague or does not appear to be a valid reference."
Otherwise, return ONLY the single, formatted APA entry. Do not add any conversational text before or after the formatted entry.

User-provided source text:
"${rawSourceText}"
  `;

  try {
    const response = await ai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.choices[0]?.message?.content || '';
    if (text.startsWith('Error: Could not format source:')) {
      return text;
    }
    return text.trim();
  } catch (error) {
    console.error("Error formatting source to APA:", error);
    if (error instanceof Error) {
        return `Error: API call failed while formatting source: ${error.message}`;
    }
    return "Error: An unknown error occurred while formatting the source.";
  }
};


export const suggestImagePrompts = async (articleInputs: NewsroomMissionInputs): Promise<string[]> => {
  if (!ai) {
    throw new Error("OpenAI client is not initialized. OPENAI_API_KEY might be missing.");
  }

  const { headline, studentName, moralIssue, challenges, studentDecision, catholicTeachings, conscience, quotes } = articleInputs;

  // Construct a summary of the article for context
  let articleContext = `Headline: "${headline || 'Not specified'}"\n`;
  articleContext += `Student: "${studentName || 'A student'}"\n`;
  articleContext += `Moral Issue: "${moralIssue || 'Not specified'}"\n`;
  articleContext += `Challenges Faced: "${challenges || 'Not specified'}"\n`;
  articleContext += `Student's Decision: "${studentDecision || 'Not specified'}"\n`;
  if (catholicTeachings) articleContext += `Relevant Catholic Teachings: "${catholicTeachings}"\n`;
  if (conscience) articleContext += `Role of Conscience: "${conscience}"\n`;
  if (quotes) articleContext += `Key Quotes/Ideas: "${quotes}"\n`;


  const prompt = `
Based on the following news article content:
${articleContext}
Suggest exactly three concise, visually descriptive prompts for generating black and white halftone style newspaper images that would be suitable for this article. The prompts should focus on key moments, themes, or emotional highlights.
Return the prompts as a JSON array of strings. For example: ["A student looking thoughtfully at a dilemma", "Symbolic representation of a moral choice", "Close up of a hand writing a reflective journal entry"].
Ensure the output is ONLY the JSON array of three strings.
  `;

  try {
    const response = await ai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [{ role: 'user', content: prompt }],
    });

    let jsonStr = response.choices[0]?.message?.content?.trim() || '';
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedPrompts = JSON.parse(jsonStr);
    if (Array.isArray(parsedPrompts) && parsedPrompts.length === 3 && parsedPrompts.every(p => typeof p === 'string')) {
      return parsedPrompts;
    }
    throw new Error("Invalid prompt format received from AI. Expected an array of 3 strings.");
  } catch (error) {
    console.error("Error suggesting image prompts:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to suggest image prompts: ${error.message}`);
    }
    throw new Error("An unknown error occurred while suggesting image prompts.");
  }
};

export const generateHalftoneImage = async (prompt: string): Promise<string> => {
  if (!ai) {
    throw new Error("OpenAI client is not initialized. OPENAI_API_KEY might be missing.");
  }

  const fullPrompt = `"${prompt}". Style: black and white halftone, newspaper photojournalism style, high contrast, grainy, dramatic lighting.`;

  try {
    const response = await ai.images.generate({
      model: OPENAI_MODEL_IMAGE,
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });

    const base64ImageBytes = response.data[0]?.b64_json;
    if (base64ImageBytes) {
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error("No image data received from API.");
  } catch (error) {
    console.error("Error generating halftone image:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
};