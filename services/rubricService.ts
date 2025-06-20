
import OpenAI from 'openai';
import { NewsroomMissionInputs, SourceEntry, RubricCriterion, RubricScore, RubricCriterionKey } from '../types';
import { OPENAI_MODEL_TEXT, RUBRIC_CRITERIA } from '../constants';

const API_KEY = process.env.OPENAI_API_KEY;

let ai: OpenAI | null = null;
if (API_KEY) {
  ai = new OpenAI({ apiKey: API_KEY });
} else {
  console.error("OPENAI_API_KEY is not configured for rubricService. Rubric evaluations will fail.");
}

const getCriterionById = (id: RubricCriterionKey): RubricCriterion | undefined => {
    return RUBRIC_CRITERIA.find(c => c.id === id);
};

const generateRubricPrompt = (criterion: RubricCriterion, studentText: string): string => {
    let levelsDescription = criterion.levels
        .map(level => `- ${level.marks} marks: ${level.descriptor}`)
        .join('\n');
    if (criterion.id === 'cstPrinciples' || criterion.id === 'useOfConscience') {
        levelsDescription += "\n(Note: This input is optional in the main task. If the student provides no text, award 0 marks and state 'No input provided for this optional section.')";
    }


    return `
You are an expert assessor evaluating a student's writing or work based on a specific rubric criterion.
The rubric criterion is: "${criterion.title}".
Maximum marks for this criterion: ${criterion.maxMarks}.

Marking levels:
${levelsDescription}

Student's text/content related to this criterion:
\`\`\`
${studentText.trim() === '' ? (criterion.id === 'cstPrinciples' || criterion.id === 'useOfConscience' ? "No input provided for this optional section." : "No input provided.") : studentText}
\`\`\`

Based on the rubric and the student's text/content:
1. Assign a score (integer from 0 to ${criterion.maxMarks}).
2. Provide brief, constructive feedback (1-2 sentences). If the student scores less than maximum, suggest one specific improvement they could make related to the rubric descriptors. If the student provides no text for an optional section, the feedback should reflect that.

Return your response as a JSON object with ONLY two keys: "score" (number) and "feedback" (string).
Example for full marks: {"score": ${criterion.maxMarks}, "feedback": "Excellent work. This fully meets the criteria for the highest marks."}
Example for partial marks: {"score": 2, "feedback": "Good start. To improve, try to add more specific details about X, as described in the higher mark bands."}
Example for no input on optional: {"score": 0, "feedback": "No input provided for this optional section."}
Example for no input on required: {"score": 0, "feedback": "No input provided. Please address this criterion to earn marks."}
`;
};

const evaluateWithOpenAI = async (criterion: RubricCriterion, studentText: string): Promise<RubricScore> => {
    if (!ai) {
        return { criterionId: criterion.id, marksAwarded: 0, feedback: "API Key not configured. Evaluation skipped.", isLoading: false };
    }
    if ((criterion.id === 'cstPrinciples' || criterion.id === 'useOfConscience') && studentText.trim() === '') {
        return { criterionId: criterion.id, marksAwarded: 0, feedback: "No input provided for this optional section.", isLoading: false };
    }
    if (studentText.trim() === '' && !(criterion.id === 'cstPrinciples' || criterion.id === 'useOfConscience')) {
        return { criterionId: criterion.id, marksAwarded: 0, feedback: "No input provided for this section.", isLoading: false };
    }

    const prompt = generateRubricPrompt(criterion, studentText);

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

        const parsed = JSON.parse(jsonStr);
        if (typeof parsed.score === 'number' && typeof parsed.feedback === 'string') {
            return {
                criterionId: criterion.id,
                marksAwarded: Math.max(0, Math.min(parsed.score, criterion.maxMarks)), // Clamp score
                feedback: parsed.feedback,
                isLoading: false,
            };
        }
        throw new Error("Invalid JSON response format from AI.");
    } catch (error) {
        console.error(`Error evaluating criterion ${criterion.id} with OpenAI:`, error);
        let message = "Failed to evaluate due to an error.";
        if (error instanceof Error) message = `Evaluation error: ${error.message}`;
        return { criterionId: criterion.id, marksAwarded: 0, feedback: message, isLoading: false };
    }
};

const evaluateBibliographyProgrammatically = (criterion: RubricCriterion, sources: SourceEntry[]): RubricScore => {
    const validSourcesCount = sources.filter(s => s.formattedOutput && !s.formattedOutput.startsWith("Error:")).length;
    let marks = 0;
    let feedback = "";

    if (validSourcesCount >= 5) {
        marks = 3;
        feedback = "Excellent: 5 or more relevant sources properly formatted.";
    } else if (validSourcesCount >= 3) {
        marks = 2;
        feedback = "Adequate: 3-4 relevant sources properly formatted.";
    } else if (validSourcesCount >= 1) {
        marks = 1;
        feedback = "Limited: 1-2 relevant sources properly formatted.";
    } else {
        marks = 0;
        feedback = "Needs Improvement: No valid sources provided or formatted. Aim for 1-5 sources.";
    }
    return { criterionId: criterion.id, marksAwarded: marks, feedback, isLoading: false };
};

export const calculateLiveRubricScores = async (
    newsroomInputs: NewsroomMissionInputs,
    bibliographySources: SourceEntry[],
    finalArticleContent: string // This is (userEditedProofContent ?? baseGeneratedProofContent)
): Promise<RubricScore[]> => {
    if (!ai && RUBRIC_CRITERIA.some(c => c.assessmentStrategy !== 'programmatic')) {
        console.warn("OpenAI client not initialized in rubricService. Some evaluations will be skipped.");
    }

    const scores: RubricScore[] = [];

    for (const criterion of RUBRIC_CRITERIA) {
        let currentScore: RubricScore = {
            criterionId: criterion.id,
            marksAwarded: 0,
            feedback: 'Evaluation pending.',
            isLoading: true,
        };
        scores.push(currentScore); // Add initial loading score

        try {
            if (criterion.assessmentStrategy === 'direct_input_gemini') {
                let combinedText = "";
                if (Array.isArray(criterion.assessmentTarget)) {
                    combinedText = (criterion.assessmentTarget as (keyof NewsroomMissionInputs)[])
                        .map(key => newsroomInputs[key] || "")
                        .join("\n\n---\n\n")
                        .trim();
                }
            currentScore = await evaluateWithOpenAI(criterion, combinedText);
            } else if (criterion.assessmentStrategy === 'full_article_gemini') {
                 currentScore = await evaluateWithOpenAI(criterion, finalArticleContent || "No article content available to assess.");
            } else if (criterion.assessmentStrategy === 'programmatic' && criterion.id === 'bibliography') {
                currentScore = evaluateBibliographyProgrammatically(criterion, bibliographySources);
            } else {
                 currentScore = { ...currentScore, feedback: 'Unsupported assessment strategy or criterion.', isLoading: false };
            }
        } catch (error) {
            console.error(`Error processing criterion ${criterion.id}:`, error);
            currentScore = {
                ...currentScore,
                feedback: error instanceof Error ? error.message : 'An unexpected error occurred during evaluation.',
                isLoading: false,
            };
        }
        
        // Update the score in the array
        const scoreIndex = scores.findIndex(s => s.criterionId === criterion.id);
        if (scoreIndex !== -1) {
            scores[scoreIndex] = currentScore;
        }
    }
    return scores;
};
