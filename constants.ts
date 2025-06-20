

import { SocraticStep, SourceEntry, PhotoEntry, NewsroomMissionInputs, ResearchBibliographyInputs, RubricCriterion, RubricSectionDefinition, RubricCriterionKey } from './types';

export const OPENAI_MODEL_TEXT = 'gpt-4o';
export const OPENAI_MODEL_IMAGE = 'dall-e-3';

export const initialNewsroomMissionInputs: NewsroomMissionInputs = {
  headline: "",
  studentName: "",
  moralIssue: "",
  challenges: "",
  studentDecision: "",
  catholicTeachings: "",
  conscience: "",
  quotes: "",
  date: "",
};

const createInitialSourceEntries = (count: number): SourceEntry[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `source-${i}`,
    author: "",
    year: "",
    title: "",
    publisherOrUrl: "",
    formattedOutput: null,
    isLoading: false,
    isAttempted: false,
    error: null,
    insideScoop: "", // Initialize insideScoop
  }));
};

export const initialResearchBibliographyInputs: ResearchBibliographyInputs = {
  sources: createInitialSourceEntries(5), // Initialize with 5 blank source entries using new structure
};

// Initial state for photo entries
export const initialPhotoEntries: PhotoEntry[] = Array.from({ length: 3 }, (_, i) => ({
  id: `photo-${i}`,
  suggestedPrompt: '',
  currentPrompt: '',
  userEditableCaption: '', // Initialize editable caption
  imageUrl: null,
  isLoading: false,
  isApproved: false,
  error: null,
}));


export const socraticSteps: SocraticStep[] = [
  {
    id: 'issueAndStudent',
    title: '❗ Defining the Core Story', // Updated
    colorScheme: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800', accentText: 'text-blue-600' },
    questions: [
      { key: 'moralIssue', label: 'Moral/Ethical Issue', text: "What is the central moral or ethical issue the student faced? Think about the core dilemma. Why is this issue significant, especially in a school or community context?", placeholder: "Describe the core ethical dilemma...", inputType: 'textarea', required: true, rows: 4 },
      { key: 'studentName', label: "🖋️ Character Name", text: "What is the name of the fictional student featured in your article? This character should represent a Year 11 student facing a moral or ethical issue.", placeholder: "E.g., Jamie Lee", inputType: 'text', required: true },
    ],
  },
  {
    id: 'challenges',
    title: '🧗 Overcoming Obstacles', // Updated
    colorScheme: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', accentText: 'text-yellow-600' },
    questions: [
      { key: 'challenges', label: 'Challenges Faced', text: "What specific difficulties or pressures did the student encounter while dealing with this issue? Consider internal struggles (e.g., fear, doubt) and external pressures (e.g., peer influence, potential consequences). What made this situation particularly complex or tough for them?", placeholder: "What internal/external struggles did they face?", inputType: 'textarea', required: true, rows: 4 },
    ],
  },
  {
    id: 'moralChoice',
    title: '⚖️ Making the Moral Choice', // Updated
    colorScheme: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-800', accentText: 'text-orange-600' },
    questions: [
      { key: 'studentDecision', label: "Student's Decision & Moral Reasoning", text: "What specific action or decision did the student make to address the ethical issue? Describe their choice and explain why you believe this was a morally sound (or perhaps challenging) decision. What was the reasoning behind their action?", placeholder: "What action did they take and why was it the moral choice?", inputType: 'textarea', required: true, rows: 4 },
    ],
  },
  {
    id: 'cst',
    title: '✝️ Anchoring in Values', // Updated
    colorScheme: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', accentText: 'text-green-600' },
    questions: [
      { key: 'catholicTeachings', label: 'Guiding Catholic Social Teachings', text: "Can you identify any Catholic Social Teachings (e.g., Dignity of the Human Person, Solidarity, Care for Creation, Preferential Option for the Poor) that might relate to this situation or the student's choice? How might these teachings have implicitly or explicitly guided their actions or perspective?", placeholder: "E.g., Dignity of the Human Person, Solidarity", inputType: 'textarea', required: false, rows: 3 },
    ],
  },
  {
    id: 'conscience',
    title: '🧠 Guided by Conscience', // Updated
    colorScheme: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', accentText: 'text-red-600' },
    questions: [
      { key: 'conscience', label: 'Role of Conscience', text: "How did the student's conscience—their inner sense of right and wrong—play a part in their decision-making process? Describe any internal reflection, feelings, or moral reasoning that their conscience might have prompted before, during, or after making their choice.", placeholder: "How did their inner voice guide their actions?", inputType: 'textarea', required: false, rows: 3 },
    ],
  },
  {
    id: 'quotes',
    title: '🗣️ Voices from the Scene', // Updated
    colorScheme: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-800', accentText: 'text-purple-600' },
    questions: [
      { key: 'quotes', label: 'Key Quotes/Ideas (2-3)', text: "To make the story more engaging, think of 2-3 insightful quotes. These could be what the student might have said, or reflections from a teacher, friend, or parent who observed the situation. Aim for quotes that add depth or emotion. (e.g., Student: 'It was hard, but I knew what I had to do.' Teacher: 'Their courage was inspiring.')", placeholder: "Student: 'I felt I had to speak up...'; Teacher: 'A true example...'", inputType: 'textarea', required: false, rows: 3 },
    ],
  },
  {
    id: 'presentation',
    title: '📰🖋️ Headline & Byline Builder', // Updated (Note: Byline is not directly input here but headline and date are)
    colorScheme: { bg: 'bg-stone-50', border: 'border-stone-500', text: 'text-stone-800', accentText: 'text-stone-600' },
    questions: [
      { key: 'headline', label: 'Punchy Headline Idea', text: "Now, let's craft a compelling headline for your article. It should be punchy, summarize the story's essence, and grab the reader's attention. What's your headline idea?", placeholder: "E.g., Student's Courageous Stand for Truth", inputType: 'text', required: true },
      { key: 'date', label: 'Date of Publication', text: "Finally, what is the 'publication date' for this article?", placeholder: "", inputType: 'date', required: true },
    ],
  },
];


// --- Real-Time Rubric Definitions ---
export const RUBRIC_CRITERIA: RubricCriterion[] = [
  // Content Section (max 4 marks each, total 16)
  {
    id: 'issueChallenges',
    title: 'The Issue; Challenges',
    maxMarks: 4,
    assessmentTarget: ['moralIssue', 'challenges'],
    assessmentStrategy: 'direct_input_gemini',
    section: 'Content',
    levels: [
      { marks: 4, descriptor: 'Discusses the issue; how and why it is a challenge in detail and with sophistication.' },
      { marks: 3, descriptor: 'Explains the issue; how and why it is a challenge.' },
      { marks: 2, descriptor: 'Outlines the issue; how and why it is a challenge.' },
      { marks: 1, descriptor: 'Makes general comments about the issue; how and why it is a challenge.' },
      { marks: 0, descriptor: 'No relevant content or content does not meet the 1-mark criteria.' },
    ],
  },
  {
    id: 'moralChoice',
    title: 'The Decision Undertaken; Moral Choice',
    maxMarks: 4,
    assessmentTarget: ['studentDecision'],
    assessmentStrategy: 'direct_input_gemini',
    section: 'Content',
    levels: [
      { marks: 4, descriptor: 'Discusses the decision undertaken by the teenager to overcome the issue and why this is a moral choice in detail and with sophistication.' },
      { marks: 3, descriptor: 'Explains the decision undertaken by the teenager to overcome the issue and why this is a moral choice.' },
      { marks: 2, descriptor: 'Outlines the decision undertaken by the teenager to overcome the issue and why this is a moral choice.' },
      { marks: 1, descriptor: 'Makes general comments about the decision undertaken by the teenager to overcome the issue and why this is a moral choice.' },
      { marks: 0, descriptor: 'No relevant content or content does not meet the 1-mark criteria.' },
    ],
  },
  {
    id: 'cstPrinciples',
    title: 'Principles of Catholic Social Teachings',
    maxMarks: 4,
    assessmentTarget: ['catholicTeachings'],
    assessmentStrategy: 'direct_input_gemini',
    section: 'Content',
    levels: [
      { marks: 4, descriptor: 'Discusses Catholic Social Teachings and how the teenager used these principles in detail and with sophistication.' },
      { marks: 3, descriptor: 'Explains Catholic Social Teachings and how the teenager used these principles.' },
      { marks: 2, descriptor: 'Outlines Catholic Social Teachings and how the teenager used these principles.' },
      { marks: 1, descriptor: 'Makes general comments about Catholic Social Teachings and how the teenager used these principles.' },
      { marks: 0, descriptor: 'No relevant content or content does not meet the 1-mark criteria. (Note: This input is optional, so 0 if blank is fine).' },
    ],
  },
  {
    id: 'useOfConscience',
    title: 'Use of Conscience',
    maxMarks: 4,
    assessmentTarget: ['conscience'],
    assessmentStrategy: 'direct_input_gemini',
    section: 'Content',
    levels: [
      { marks: 4, descriptor: 'Discusses conscience and how the teenager is led by this in detail and with sophistication.' },
      { marks: 3, descriptor: 'Explains conscience and how the teenager is led by this.' },
      { marks: 2, descriptor: 'Outlines conscience and how the teenager is led by this.' },
      { marks: 1, descriptor: 'Makes general comments about conscience and how the teenager is led by this.' },
      { marks: 0, descriptor: 'No relevant content or content does not meet the 1-mark criteria. (Note: This input is optional, so 0 if blank is fine).' },
    ],
  },
  // Research and Layout Section (max 3 marks each, total 12)
  {
    id: 'frontPage',
    title: 'Front Page Layout/Impression',
    maxMarks: 3,
    assessmentTarget: 'full_article_content',
    assessmentStrategy: 'full_article_gemini',
    section: 'ResearchAndLayout',
    levels: [
      { marks: 3, descriptor: 'Layout is highly polished, largely based on traditional newspaper editorial styles; demonstrates high level of effort, thought and planning as well as is artistically creative.' },
      { marks: 2, descriptor: 'Layout is competent, based on traditional newspaper editorial styles; demonstrates effort, thought, planning and creativity.' },
      { marks: 1, descriptor: 'Layout is inadequate, rarely based on traditional newspaper editorial styles; demonstrates very little effort, thought, planning and creativity.' },
      { marks: 0, descriptor: 'No article content to assess or layout is fundamentally flawed.' },
    ],
  },
  {
    id: 'research',
    title: 'Research Integration & Insight',
    maxMarks: 3,
    assessmentTarget: 'full_article_content', // Also considers quotes and insideScoops
    assessmentStrategy: 'full_article_gemini',
    section: 'ResearchAndLayout',
    levels: [
      { marks: 3, descriptor: 'Article shows highly commendable evidence of research; highly effective use of quotes; demonstrating admirable insight into the issue/dilemma.' },
      { marks: 2, descriptor: 'Article shows competent evidence of research; minimal use of quotes; demonstrating some insight into the issue/dilemma.' },
      { marks: 1, descriptor: 'Article shows inadequate evidence of research; very little or no use of quotes; demonstrating a lack of insight into the issue/dilemma.' },
      { marks: 0, descriptor: 'No evidence of research or integration.' },
    ],
  },
  {
    id: 'bibliography',
    title: 'Bibliography',
    maxMarks: 3,
    assessmentTarget: 'bibliography_count',
    assessmentStrategy: 'programmatic',
    section: 'ResearchAndLayout',
    levels: [
      { marks: 3, descriptor: '5 or more highly relevant sources; excellent range. (Assumes sources are correctly formatted APA style)' },
      { marks: 2, descriptor: '3-4 relevant sources; adequate range. (Assumes sources are correctly formatted APA style)' },
      { marks: 1, descriptor: '1-2 sources; limited range. (Assumes sources are correctly formatted APA style)' },
      { marks: 0, descriptor: 'No sources provided or fewer than 1.' },
    ],
  },
  {
    id: 'effort',
    title: 'Effort and Care',
    maxMarks: 3,
    assessmentTarget: 'full_article_content', // Holistic assessment
    assessmentStrategy: 'full_article_gemini',
    section: 'ResearchAndLayout',
    levels: [
      { marks: 3, descriptor: 'Exceeds the requirements of the assignment and have put care and effort into the process.' },
      { marks: 2, descriptor: 'Fulfills most of the requirements of the assignment.' },
      { marks: 1, descriptor: 'Fulfills few of the requirements of the assignment.' },
      { marks: 0, descriptor: 'Little to no effort evident.' },
    ],
  },
];

export const RUBRIC_SECTIONS: RubricSectionDefinition[] = [
    {
        title: 'Content',
        criteriaIds: ['issueChallenges', 'moralChoice', 'cstPrinciples', 'useOfConscience'],
        totalPossibleMarks: 16, // 4 criteria * 4 marks
    },
    {
        title: 'Research and Layout',
        criteriaIds: ['frontPage', 'research', 'bibliography', 'effort'],
        totalPossibleMarks: 12, // 4 criteria * 3 marks
    }
];

export const INITIAL_RUBRIC_SCORES = RUBRIC_CRITERIA.map(criterion => ({
  criterionId: criterion.id,
  marksAwarded: 0,
  feedback: 'Not yet assessed.',
  isLoading: false,
}));

// --- End Real-Time Rubric Definitions ---
