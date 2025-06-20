


export enum TabId {
  NewsroomMission = 'newsroomMission',
  ResearchBibliography = 'researchBibliography',
  PhotoJournalist = 'photoJournalist', 
  PressroomProof = 'pressroomProof', 
  RealTimeRubric = 'realTimeRubric', // Added new tab for Rubric
}

export interface NewsroomMissionInputs {
  headline: string;
  studentName: string; 
  moralIssue: string;
  challenges: string;
  studentDecision: string;
  catholicTeachings: string;
  conscience: string;
  quotes: string;
  date: string;
}

// Structured input fields for a single source
export interface SourceEntryStructuredInput {
  author: string;
  year: string;
  title: string;
  publisherOrUrl: string;
}

// Updated SourceEntry for individual formatting with structured inputs
export interface SourceEntry extends SourceEntryStructuredInput {
  id: string; // Unique ID for React key prop, e.g., 'source-0'
  formattedOutput: string | null; // APA formatted string from AI, or error message starting with "Error:"
  isLoading: boolean; // True when this specific source is being formatted
  isAttempted: boolean; // True if user has tried to format this source
  error: string | null; // Error message for this source's formatting attempt
  insideScoop: string; // User notes, quotes, or insights from the source
}

export interface ResearchBibliographyInputs {
  sources: SourceEntry[];
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}

export interface SocraticQuestion {
  key: keyof NewsroomMissionInputs;
  text: string;
  placeholder: string;
  inputType: 'text' | 'textarea' | 'date';
  required: boolean;
  rows?: number;
  label: string;
}

export interface SocraticStep {
  id: string;
  title: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    accentText: string;
  };
  questions: SocraticQuestion[];
}

// New interface for photo entries
export interface PhotoEntry {
  id: string;
  suggestedPrompt: string;
  currentPrompt: string;
  userEditableCaption: string; // Added field for editable caption
  imageUrl: string | null;
  isLoading: boolean;
  isApproved: boolean;
  error: string | null;
}

export const CURRENT_SAVE_VERSION = "1.0.0";

// Interface for the overall saved state of the application
export interface SavedProgressState {
  newsroomInputs: NewsroomMissionInputs;
  bibliographySources: SourceEntry[];
  photoEntries: PhotoEntry[];
  generatedArticle: string; // The raw AI-generated article text
  currentStepIndex: number;
  isJourneyCompleted: boolean;
  activeTab: TabId; // Save the active tab as well
  saveFormatVersion: string; // To handle future format changes
  finalArticleContent?: string | null; // Stores the content of PressroomProof after potential user edits
  rubricScores?: RubricScore[]; // Added for saving rubric scores
}

// --- Real-Time Rubric Types ---
export interface RubricCriterionLevel {
  marks: number;
  descriptor: string;
  feedbackSuggestion?: string; // Optional suggestion for achieving this level or next
}

export type RubricCriterionKey =
  | 'issueChallenges'
  | 'moralChoice'
  | 'cstPrinciples'
  | 'useOfConscience'
  | 'frontPage'
  | 'research'
  | 'bibliography'
  | 'effort';

export interface RubricCriterion {
  id: RubricCriterionKey;
  title: string;
  maxMarks: number;
  levels: RubricCriterionLevel[];
  // Specifies which NewsroomMissionInputs field(s) are primarily assessed for this criterion.
  // For 'bibliography', 'frontPage', 'research', 'effort', assessment is different.
  assessmentTarget: (keyof NewsroomMissionInputs)[] | 'bibliography_count' | 'full_article_content';
  assessmentStrategy: 'direct_input_gemini' | 'programmatic' | 'full_article_gemini';
  section: 'Content' | 'ResearchAndLayout';
}

export interface RubricScore {
  criterionId: RubricCriterionKey;
  marksAwarded: number;
  feedback: string;
  isLoading: boolean; // Added to indicate if this specific criterion is being evaluated
}

export interface RubricSectionDefinition {
  title: string;
  criteriaIds: RubricCriterionKey[];
  totalPossibleMarks: number;
}
// --- End Real-Time Rubric Types ---