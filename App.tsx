


import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TabId, NewsroomMissionInputs, ResearchBibliographyInputs, SocraticStep, SourceEntry, PhotoEntry, SourceEntryStructuredInput, SavedProgressState, CURRENT_SAVE_VERSION, RubricScore } from './types';
import { initialNewsroomMissionInputs, initialResearchBibliographyInputs, socraticSteps, initialPhotoEntries, INITIAL_RUBRIC_SCORES } from './constants';
import Button from './components/Button';
import ArticleDisplay from './components/ArticleDisplay';
// import BibliographyDisplay from './components/BibliographyDisplay'; // No longer used for list
import LoadingSpinner from './components/LoadingSpinner';
import SocraticStepper from './components/SocraticStepper';
import IndividualSourceFormatter from './components/IndividualSourceFormatter';
import FormattedSourceEntryDisplay from './components/FormattedSourceEntryDisplay'; // New component for right column
import TextAreaInput from './components/TextAreaInput';
import NewspaperConventionChecklist from './components/NewspaperConventionChecklist'; // Added import
import RealTimeRubric from './components/RealTimeRubric'; // Added import for Rubric
import { startNewsroomMission, formatSourceToAPA, checkApiKey, suggestImagePrompts, generateHalftoneImage } from './services/openaiService';
import { calculateLiveRubricScores } from './services/rubricService'; // Added import for Rubric Service

const generateLivePreviewText = (
    inputs: NewsroomMissionInputs,
    steps: SocraticStep[],
    currentStepIndex: number,
    isJourneyCompleted: boolean,
    bibliographySources: SourceEntry[] // Added bibliography sources
  ): string => {
    let preview = "";
    const today = inputs.date || new Date().toISOString().split('T')[0];
    let formattedDate = "Publication Date Pending";
    try {
        const dateParts = today.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const dateObj = new Date(year, month, day);

        if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() === year && dateObj.getMonth() === month && dateObj.getDate() === day) {
             formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        } else if (inputs.date) {
            formattedDate = inputs.date + " (Review Date)";
        } else {
            formattedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        }
    } catch (e) {
        formattedDate = inputs.date ? inputs.date + " (Review Date)" : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const finalHeadlineProvided = inputs.headline?.trim();
    const studentNameDisplay = inputs.studentName || 'A Student';
    const workingHeadline = inputs.studentName && inputs.moralIssue
        ? `${studentNameDisplay} and the ${inputs.moralIssue.split(' ').slice(0,3).join(' ')}...`
        : "Article Headline Being Developed";

    preview += `## HEADLINE: ${finalHeadlineProvided || workingHeadline}\n`; // No extra \n\n after headline
    preview += `**BYLINE:** By a Student Reporter\n`;
    preview += `**DATE:** ${formattedDate}\n`; // No extra \n\n

    const issueStep = steps.find(s => s.id === 'issueAndStudent');
    const issueStepIndex = issueStep ? steps.indexOf(issueStep) : 0;
    if (inputs.moralIssue && inputs.studentName) {
        preview += `### The Core Issue\n`;
        preview += `In our school community, ${studentNameDisplay} recently faced a significant moral challenge related to: ${inputs.moralIssue.toLowerCase()}.\n`;
    } else if (currentStepIndex >= issueStepIndex || isJourneyCompleted) {
        preview += `[Details about ${studentNameDisplay} and the moral issue ("${inputs.moralIssue || 'Issue TBD'}") will appear here once entered in Step ${issueStepIndex + 1}.]\n`;
    }

    const challengesStep = steps.find(s => s.id === 'challenges');
    const challengesStepIndex = challengesStep ? steps.indexOf(challengesStep) : 1;
    if (inputs.challenges) {
        preview += `### Navigating the Hurdles\n`;
        preview += `${inputs.challenges}\n`;
    } else if (currentStepIndex >= challengesStepIndex || isJourneyCompleted) {
        preview += `[Specific challenges encountered by ${studentNameDisplay} will be detailed here (Step ${challengesStepIndex + 1}).]\n`;
    }

    const decisionStep = steps.find(s => s.id === 'moralChoice');
    const decisionStepIndex = decisionStep ? steps.indexOf(decisionStep) : 2;
    if (inputs.studentDecision) {
        preview += `### A Principled Decision\n`;
        preview += `${inputs.studentDecision}\n`;
    } else if (currentStepIndex >= decisionStepIndex || isJourneyCompleted) {
        preview += `[The student's decision and moral reasoning will be described here (Step ${decisionStepIndex + 1}).]\n`;
    }

    const cstStep = steps.find(s => s.id === 'cst');
    const cstStepIndex = cstStep ? steps.indexOf(cstStep) : 3;
    if (cstStep?.questions.find(q=>q.key === 'catholicTeachings')) {
        if (inputs.catholicTeachings) {
            preview += `### Guided by Values\n`;
            preview += `Catholic Social Teachings, such as ${inputs.catholicTeachings}, may have informed this situation.\n`;
        } else if (currentStepIndex >= cstStepIndex || isJourneyCompleted) {
            preview += `[Relevant Catholic Social Teachings will be discussed here (Step ${cstStepIndex + 1}) if applicable and entered.]\n`;
        }
    }

    const conscienceStep = steps.find(s => s.id === 'conscience');
    const conscienceStepIndex = conscienceStep ? steps.indexOf(conscienceStep) : 4;
     if (conscienceStep?.questions.find(q=>q.key === 'conscience')) {
        if (inputs.conscience) {
            preview += `### The Inner Compass\n`;
            preview += `The student's conscience played a role: ${inputs.conscience}\n`;
        } else if (currentStepIndex >= conscienceStepIndex || isJourneyCompleted) {
            preview += `[The role of conscience in the decision-making process will be explored here (Step ${conscienceStepIndex + 1}) if applicable and entered.]\n`;
        }
    }

    const quotesStep = steps.find(s => s.id === 'quotes');
    const quotesStepIndex = quotesStep ? steps.indexOf(quotesStep) : 5;
    if (quotesStep?.questions.find(q=>q.key === 'quotes')) {
        if (inputs.quotes) {
            preview += `### Story Voices\n`;
            const quotesArray = inputs.quotes.split('\n').map(q => q.trim()).filter(q => q.length > 0);
            quotesArray.forEach(q => {
                const parts = q.split(/-(?=[^-]*$)/);
                const quoteText = parts[0]?.trim().replace(/^["']|["']$/g, '');
                const speaker = parts[1]?.trim() || "Source";
                if (quoteText) {
                    preview += `**QUOTE:** "${quoteText}" - ${speaker} **END QUOTE**\n`;
                }
            });
        } else if (currentStepIndex >= quotesStepIndex || isJourneyCompleted) {
            preview += `[Supporting quotes will be added here (Step ${quotesStepIndex + 1}) if applicable and entered.]\n`;
        }
    }

    const insights = bibliographySources
        .filter(s => s.formattedOutput && !s.formattedOutput.startsWith("Error:") && s.insideScoop.trim())
        .map(s => `From source "${s.formattedOutput}":\n${s.insideScoop.trim()}`);

    if (insights.length > 0) {
        preview += `### Key Insights From Research\n`;
        insights.forEach(insight => {
            preview += `${insight}\n`;
        });
    }


    if (isJourneyCompleted) {
        preview += `### Drawing it Together\n`;
        preview += `[A concluding paragraph summarizing the impact of ${studentNameDisplay}'s actions or offering a reflective thought will be drafted here by the AI in the final article.]\n`;
        if (!finalHeadlineProvided && steps.find(s => s.id === 'presentation')?.questions.find(q => q.key === 'headline')) {
             preview += `\n[Remember to craft and enter your final headline in the last step!]\n`;
        }
    } else if (currentStepIndex < steps.length - 1) {
        preview += `\n[More sections will appear as you complete subsequent steps...]\n`;
    }
    
    const initialMessage = "Start building your article by filling in the details on the left. Each section will be previewed here with an emoji guide and its title. Your live preview will appear here.";
    const finalPreview = preview.replace(/\n\n\n+/g, '\n\n').trim(); // Normalize multiple blank lines
    return finalPreview ? finalPreview : initialMessage;
  };

const compileLivePressroomProof = (
  articleInputs: NewsroomMissionInputs,
  aiGeneratedArticle: string,
  sourceInsights: Array<{ formattedReference: string; insideScoop: string }>,
  formattedBibliographyEntries: string[]
): string => {
  if (aiGeneratedArticle && !aiGeneratedArticle.startsWith("Error")) {
    let fullArticle = aiGeneratedArticle;

    if (sourceInsights.length > 0) {
      let insightsSection = "\n\n### Key Insights from Research\n";
      sourceInsights.forEach(insight => {
        insightsSection += `From source "${insight.formattedReference}":\n${insight.insideScoop.trim()}\n\n`;
      });
      const referencesIndex = fullArticle.lastIndexOf("\n\n### References");
      if (referencesIndex !== -1) {
        fullArticle = fullArticle.substring(0, referencesIndex) + insightsSection + fullArticle.substring(referencesIndex);
      } else {
         // Check if insights are already there (e.g. from user editing)
        if (!fullArticle.includes("### Key Insights from Research")){
            fullArticle += insightsSection;
        }
      }
    }

    if (formattedBibliographyEntries.length > 0) {
        if (!fullArticle.includes("\n\n### References")) {
             fullArticle += `\n\n### References\n${formattedBibliographyEntries.join('\n\n')}\n`;
        }
    }
    return fullArticle.replace(/\n\n\n+/g, '\n\n').trim();
  }

  // Placeholder content generation if AI article not available
  let content = "";
  const dateInput = articleInputs.date;
  let formattedDate = "Date Not Set";

  if (dateInput) {
    try {
        const dateParts = dateInput.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const dateObj = new Date(Date.UTC(year, month, day));

        if (!isNaN(dateObj.getTime()) && dateObj.getUTCFullYear() === year && dateObj.getUTCMonth() === month && dateObj.getUTCDate() === day) {
             formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        } else {
            formattedDate = dateInput + " (Review Date)";
        }
    } catch (e) {
        formattedDate = dateInput + " (Review Date)";
    }
  } else {
     const todayObj = new Date();
     formattedDate = todayObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }
  const studentNameDisplay = articleInputs.studentName || 'A Student';
  const finalHeadlineProvided = articleInputs.headline?.trim();
  const workingHeadline = articleInputs.studentName && articleInputs.moralIssue
      ? `${studentNameDisplay} Faces Ethical Questions Regarding ${articleInputs.moralIssue.split(' ').slice(0,3).join(' ')}... (Working Title)`
      : "Crafting the Story: Headline in Progress";

  content += `## HEADLINE: ${finalHeadlineProvided || workingHeadline}\n`;
  content += `**BYLINE:** By a Student Reporter\n`;
  content += `**DATE:** ${formattedDate}\n`;

   if (articleInputs.studentName && articleInputs.moralIssue) {
    content += `This story explores the ethical journey of ${studentNameDisplay}, a student from our community, who recently confronted a challenging moral issue related to ${articleInputs.moralIssue.toLowerCase()}.\n`;
  }

  if (articleInputs.moralIssue && articleInputs.studentName) {
      content += `### The Core Issue\n`;
      content += `At the heart of the matter, ${studentNameDisplay} was faced with a significant moral or ethical question concerning: ${articleInputs.moralIssue.toLowerCase()}.\n`;
  }

  if (articleInputs.challenges) {
      content += `### Navigating the Hurdles\n`;
      content += `The situation presented several challenges for ${studentNameDisplay}, including: ${articleInputs.challenges}\n`;
  }

  if (articleInputs.studentDecision) {
      content += `### A Principled Decision\n`;
      content += `After careful consideration, ${studentNameDisplay} decided to: ${articleInputs.studentDecision}\n`;
  }

  if (articleInputs.catholicTeachings) {
      content += `### Guided by Values\n`;
      content += `The student's approach may have been informed by Catholic Social Teachings, such as ${articleInputs.catholicTeachings}.\n`;
  }

  if (articleInputs.conscience) {
      content += `### The Inner Compass\n`;
      content += `The role of conscience was pivotal, as ${studentNameDisplay} described: ${articleInputs.conscience}\n`;
  }

  if (articleInputs.quotes) {
      content += `### Voices from the Story\n`;
      const quotesArray = articleInputs.quotes.split('\n').map(q => q.trim()).filter(q => q.length > 0);
      quotesArray.forEach(q => {
          const parts = q.split(/-(?=[^-]*$)/);
          const quoteText = parts[0]?.trim().replace(/^["']|["']$/g, '');
          const speaker = parts[1]?.trim() || "Source";
          if (quoteText) {
              content += `**QUOTE:** "${quoteText}" - ${speaker} **END QUOTE**\n`;
          }
      });
  }
  
  if (sourceInsights.length > 0) {
    content += `### Key Insights From Research\n`;
    sourceInsights.forEach(insight => {
        content += `From source "${insight.formattedReference}":\n${insight.insideScoop.trim()}\n`;
    });
  }

  content += `### Looking Forward\n`;
  content += `[The final article, once drafted by the AI assistant via the 'Article Writer' tab, will include a thoughtfully composed lead paragraph and a concluding summary reflecting on the significance of ${studentNameDisplay}'s actions.]\n`;

  if (formattedBibliographyEntries.length > 0) {
    content += `\n### References\n${formattedBibliographyEntries.join('\n\n')}\n`;
  }
  return content.replace(/\n\n\n+/g, '\n\n').trim();
};


const App: React.FC = () => {
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(TabId.NewsroomMission);

  const [newsroomInputs, setNewsroomInputs] = useState<NewsroomMissionInputs>(initialNewsroomMissionInputs);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isJourneyCompleted, setIsJourneyCompleted] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<string>(''); // Raw AI output
  const [liveArticlePreview, setLiveArticlePreview] = useState<string>('');
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  const [bibliographyInputs, setBibliographyInputs] = useState<ResearchBibliographyInputs>(initialResearchBibliographyInputs);
  
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>(initialPhotoEntries);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  const [userEditedProofContent, setUserEditedProofContent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [hoveredConventionKey, setHoveredConventionKey] = useState<string | null>(null);

  // --- Real-Time Rubric State ---
  const [rubricScores, setRubricScores] = useState<RubricScore[]>(INITIAL_RUBRIC_SCORES);
  const [isLoadingRubric, setIsLoadingRubric] = useState<boolean>(false);
  // --- End Real-Time Rubric State ---


  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsApiKeyMissing(!checkApiKey());
  }, []);

  // For live preview in Article Writer Tab
  useEffect(() => {
    const preview = generateLivePreviewText(newsroomInputs, socraticSteps, currentStepIndex, isJourneyCompleted, bibliographyInputs.sources);
    setLiveArticlePreview(preview);
  }, [newsroomInputs, currentStepIndex, isJourneyCompleted, bibliographyInputs.sources]);

  // This is the "base" content for Pressroom Proof, compiled from all inputs
  const baseGeneratedProofContent = useMemo(() => {
    const successfullyFormattedEntries = bibliographyInputs.sources
        .map(s => s.formattedOutput)
        .filter((output): output is string => output !== null && !output.startsWith("Error:"));
    
    const currentSourceInsights = bibliographyInputs.sources
        .filter(source => source.formattedOutput && !source.formattedOutput.startsWith("Error:") && source.insideScoop.trim())
        .map(source => ({
            formattedReference: source.formattedOutput!,
            insideScoop: source.insideScoop,
        }));
    return compileLivePressroomProof(newsroomInputs, generatedArticle, currentSourceInsights, successfullyFormattedEntries);
  }, [newsroomInputs, generatedArticle, bibliographyInputs.sources]);
  
  // Reset user-edited content if the base content changes significantly (e.g. new AI generation)
  useEffect(() => {
      setUserEditedProofContent(null); 
  }, [baseGeneratedProofContent]);

  // --- Real-Time Rubric Evaluation Effect ---
  const finalArticleForRubric = useMemo(() => userEditedProofContent ?? baseGeneratedProofContent, [userEditedProofContent, baseGeneratedProofContent]);

  useEffect(() => {
    const updateRubric = async () => {
      if (isApiKeyMissing) {
        setRubricScores(INITIAL_RUBRIC_SCORES.map(s => ({...s, feedback: "API Key missing. Evaluation skipped.", isLoading: false})));
        setIsLoadingRubric(false);
        return;
      }
      
      setIsLoadingRubric(true);
      setRubricScores(prevScores => prevScores.map(s => ({ ...s, isLoading: true, feedback: 'Assessing...' })));

      try {
        const newScores = await calculateLiveRubricScores(
          newsroomInputs,
          bibliographyInputs.sources,
          finalArticleForRubric
        );
        setRubricScores(newScores);
      } catch (error) {
        console.error("Error calculating rubric scores:", error);
        setRubricScores(INITIAL_RUBRIC_SCORES.map(s => ({...s, feedback: "Error during rubric evaluation.", isLoading: false})));
      } finally {
        setIsLoadingRubric(false);
      }
    };

    // Debounce to avoid rapid re-calculations during typing or frequent data changes
    const timerId = setTimeout(() => {
        updateRubric();
    }, 1500); 

    return () => clearTimeout(timerId);

  }, [newsroomInputs, bibliographyInputs.sources, finalArticleForRubric, isApiKeyMissing]); // Removed activeTab from dependencies
  // --- End Real-Time Rubric Evaluation Effect ---


  const displaySuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleNewsroomInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewsroomInputs(prev => ({ ...prev, [name]: value }));
    setGeneratedArticle(''); 
    setUserEditedProofContent(null); 
    setErrorMessage(null);
  }, []);

  const handleStepChange = useCallback((newStepIndex: number) => {
    setCurrentStepIndex(newStepIndex);
    if (newStepIndex === socraticSteps.length -1 && newsroomInputs.date === "") {
        setNewsroomInputs(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    }
  }, [newsroomInputs.date]);

  const handleSocraticJourneyComplete = useCallback(async () => {
    setIsJourneyCompleted(true);
    setErrorMessage(null);
    setIsLoadingArticle(true);
    setUserEditedProofContent(null); 
    let allRequiredFilled = true;
    for (const step of socraticSteps) {
        for (const q of step.questions) {
            if (q.required && !newsroomInputs[q.key as keyof NewsroomMissionInputs]?.trim()) { 
                allRequiredFilled = false;
                break;
            }
        }
        if (!allRequiredFilled) break;
    }

    if (!allRequiredFilled) {
        setErrorMessage("Please ensure all required fields in the 'Article Writer' steps are completed before generating the article.");
        setIsLoadingArticle(false);
        return;
    }

    const sourceInsights = bibliographyInputs.sources
        .filter(source => source.formattedOutput && !source.formattedOutput.startsWith("Error:") && source.insideScoop.trim())
        .map(source => ({
            formattedReference: source.formattedOutput!,
            insideScoop: source.insideScoop,
        }));

    try {
      const result = await startNewsroomMission(newsroomInputs, sourceInsights);
      setGeneratedArticle(result); 
      if (result.startsWith("Error")) {
        setErrorMessage(result);
      } else {
        displaySuccessMessage("Article drafted successfully!");
      }
    } catch (error: any) {
      console.error("Newsroom mission error:", error);
      setErrorMessage(error.message || "Failed to generate article.");
      setGeneratedArticle(`Error: ${error.message || "Failed to generate article."}`);
    } finally {
      setIsLoadingArticle(false);
    }
  }, [newsroomInputs, bibliographyInputs]);

  const handleStructuredSourceInputChange = useCallback((index: number, field: keyof SourceEntryStructuredInput, value: string) => {
    setBibliographyInputs(prev => {
      const newSources = prev.sources.map((source, i) =>
        i === index ? { ...source, [field]: value, formattedOutput: null, error: null, isAttempted: false } : source
      );
      return { ...prev, sources: newSources };
    });
    setUserEditedProofContent(null); 
    setErrorMessage(null);
  }, []);

  const handleInsideScoopChange = useCallback((index: number, value: string) => {
    setBibliographyInputs(prev => {
        const newSources = prev.sources.map((source, i) =>
            i === index ? { ...source, insideScoop: value } : source
        );
        return { ...prev, sources: newSources };
    });
    setUserEditedProofContent(null); 
  }, []);


  const handleFormatSingleSource = useCallback(async (index: number) => {
    const sourceToFormat = bibliographyInputs.sources[index];
    
    if (!sourceToFormat.author.trim() || !sourceToFormat.year.trim() || !sourceToFormat.title.trim()) {
      setBibliographyInputs(prev => ({
        ...prev,
        sources: prev.sources.map((s, i) => i === index ? { ...s, error: "Author, Year, and Title are required.", formattedOutput: null, isLoading: false, isAttempted: true } : s)
      }));
      return;
    }

    setBibliographyInputs(prev => ({
      ...prev,
      sources: prev.sources.map((s, i) => i === index ? { ...s, isLoading: true, error: null, formattedOutput: null, isAttempted: true } : s)
    }));
    setErrorMessage(null);

    let compiledSourceText = `Author(s): ${sourceToFormat.author}. Year: ${sourceToFormat.year}. Title: ${sourceToFormat.title}.`;
    if (sourceToFormat.publisherOrUrl.trim()) {
      compiledSourceText += ` Publisher/Journal/URL: ${sourceToFormat.publisherOrUrl}.`;
    }

    try {
      const result = await formatSourceToAPA(compiledSourceText);
      setBibliographyInputs(prev => ({
        ...prev,
        sources: prev.sources.map((s, i) => i === index ? { ...s, formattedOutput: result, isLoading: false, error: result.startsWith("Error:") ? result : null } : s)
      }));
      setUserEditedProofContent(null); 
    } catch (error: any) {
      console.error(`Error formatting source ${index + 1}:`, error);
      const message = error.message || `Failed to format source ${index + 1}.`;
      setBibliographyInputs(prev => ({
        ...prev,
        sources: prev.sources.map((s, i) => i === index ? { ...s, error: message, formattedOutput: null, isLoading: false } : s)
      }));
    }
  }, [bibliographyInputs]);


  const handleSuggestImagePrompts = useCallback(async () => {
    if (!newsroomInputs.moralIssue || !newsroomInputs.studentName) {
        setErrorMessage("Please complete the 'Moral/Ethical Issue' and 'Student Name' in the Article Writer tab first to provide context for image prompts.");
        return;
    }
    setIsLoadingPrompts(true);
    setErrorMessage(null);
    setPhotoEntries(initialPhotoEntries.map(p => ({...p, isLoading: true}))); 
    try {
        const prompts = await suggestImagePrompts(newsroomInputs);
        setPhotoEntries(prevEntries => prevEntries.map((entry, index) => ({
            ...entry,
            suggestedPrompt: prompts[index] || '',
            currentPrompt: prompts[index] || '',
            userEditableCaption: prompts[index] ? `Photo prompt: "${prompts[index]}"` : `Photo prompt: Describe your image.`,
            isLoading: false,
            error: null,
        })));
    } catch (error: any) {
        console.error("Suggest image prompts error:", error);
        setErrorMessage(error.message || "Failed to suggest image prompts.");
        setPhotoEntries(initialPhotoEntries.map(p => ({...p, error: error.message || "Failed to suggest prompts.", isLoading: false, userEditableCaption: "Error suggesting caption."})));
    } finally {
        setIsLoadingPrompts(false);
    }
  }, [newsroomInputs]);

  const handlePhotoPromptChange = useCallback((index: number, newPrompt: string) => {
    setPhotoEntries(prevEntries => prevEntries.map((entry, i) =>
        i === index ? { 
            ...entry, 
            currentPrompt: newPrompt, 
            userEditableCaption: newPrompt ? `Photo prompt: "${newPrompt}"` : "Photo prompt: Describe your image.",
            imageUrl: null, 
            isApproved: false, 
            error: null 
        } : entry
    ));
    setErrorMessage(null);
  }, []);

  const handleImageCaptionChange = useCallback((photoId: string, newCaption: string) => {
    setPhotoEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === photoId ? { ...entry, userEditableCaption: newCaption } : entry
      )
    );
    // Note: We don't call setUserEditedProofContent(null) here because the ArticleDisplay handles
    // its own internal state for the image part, and the approvedImage prop will re-render it.
    // The overall article text content (userEditedProofContent) is separate.
  }, []);

  const handleGenerateImage = useCallback(async (index: number) => {
    const entry = photoEntries[index];
    if (!entry.currentPrompt.trim()) {
        setPhotoEntries(prevEntries => prevEntries.map((e, i) =>
            i === index ? { ...e, error: "Prompt cannot be empty." } : e
        ));
        return;
    }
    setPhotoEntries(prevEntries => prevEntries.map((e, i) =>
        i === index ? { ...e, isLoading: true, imageUrl: null, isApproved: false, error: null } : e
    ));
    setErrorMessage(null);
    try {
        const imageUrl = await generateHalftoneImage(entry.currentPrompt);
        setPhotoEntries(prevEntries => prevEntries.map((e, i) =>
            i === index ? { 
                ...e, 
                imageUrl, 
                isLoading: false,
                 // Ensure caption is based on the prompt used for generation if it was empty or default
                userEditableCaption: e.userEditableCaption.startsWith("Photo prompt: Describe your image.") || !e.userEditableCaption 
                                      ? `Photo prompt: "${e.currentPrompt}"` 
                                      : e.userEditableCaption,
            } : e
        ));
    } catch (error: any) {
        console.error(`Error generating image for prompt ${index}:`, error);
        setPhotoEntries(prevEntries => prevEntries.map((e, i) =>
            i === index ? { ...e, error: error.message || "Failed to generate image.", isLoading: false } : e
        ));
    }
  }, [photoEntries]);

  const handleApproveImage = useCallback((index: number, isApproved: boolean) => {
    setPhotoEntries(prevEntries => prevEntries.map((entry, i) => {
        if (i === index) return { ...entry, isApproved };
        if (isApproved) return { ...entry, isApproved: false }; 
        return entry;
    }));
    // When an image is approved/unapproved, the PressroomProof content might change if user has edited it.
    // However, the baseGeneratedProofContent itself doesn't include the image directly in its string.
    // The approvedImage prop to ArticleDisplay handles the image.
    // No explicit reset of userEditedProofContent here, ArticleDisplay will re-parse with new image.
  }, []);

  const handleSaveProgress = () => {
    setErrorMessage(null);
    const stateToSave: SavedProgressState = {
      newsroomInputs,
      bibliographySources: bibliographyInputs.sources,
      photoEntries,
      generatedArticle, 
      currentStepIndex,
      isJourneyCompleted,
      activeTab,
      saveFormatVersion: CURRENT_SAVE_VERSION,
      finalArticleContent: userEditedProofContent ?? baseGeneratedProofContent,
      rubricScores: rubricScores, // Save rubric scores
    };

    try {
      const jsonString = JSON.stringify(stateToSave, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const now = new Date();
      const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeString = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `ethics_chronicle_save_${dateString}_${timeString}.json`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      displaySuccessMessage("Progress saved successfully!");
    } catch (error) {
      console.error("Error saving progress:", error);
      setErrorMessage("Failed to save progress. See console for details.");
    }
  };

  const handleLoadProgress = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        if (!jsonString) {
          throw new Error("File content is empty.");
        }
        const parsedData = JSON.parse(jsonString) as SavedProgressState;

        if (!parsedData.saveFormatVersion || parsedData.saveFormatVersion !== CURRENT_SAVE_VERSION) {
          setErrorMessage(`Invalid or unsupported save file version. Expected version ${CURRENT_SAVE_VERSION}.`);
          return;
        }
        if (!parsedData.newsroomInputs || !parsedData.bibliographySources || !parsedData.photoEntries ||
            typeof parsedData.generatedArticle === 'undefined' || typeof parsedData.currentStepIndex === 'undefined' ||
            typeof parsedData.isJourneyCompleted === 'undefined' || typeof parsedData.activeTab === 'undefined') {
          throw new Error("Save file is missing essential data or is corrupted.");
        }
        
        setNewsroomInputs(parsedData.newsroomInputs || initialNewsroomMissionInputs);
        setBibliographyInputs({ sources: parsedData.bibliographySources || initialResearchBibliographyInputs.sources });
        setPhotoEntries(parsedData.photoEntries.map(p => ({ // Ensure all fields, including new ones, are present
            ...initialPhotoEntries[0], // spread default to ensure all keys exist
            ...p,
            userEditableCaption: p.userEditableCaption || (p.currentPrompt ? `Photo prompt: "${p.currentPrompt}"` : '') // ensure caption
        })) || initialPhotoEntries);
        setGeneratedArticle(parsedData.generatedArticle || '');
        setCurrentStepIndex(parsedData.currentStepIndex || 0);
        setIsJourneyCompleted(parsedData.isJourneyCompleted || false);
        setActiveTab(parsedData.activeTab || TabId.NewsroomMission);
        setUserEditedProofContent(parsedData.finalArticleContent || null); 
        setRubricScores(parsedData.rubricScores || INITIAL_RUBRIC_SCORES); // Load rubric scores

        displaySuccessMessage("Progress loaded successfully!");

      } catch (error: any) {
        console.error("Error loading progress:", error);
        setErrorMessage(`Failed to load progress: ${error.message || "Invalid file format."}`);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Error reading file.");
    };
    reader.readAsText(file);
  };

  const handleLoadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].type !== "application/json" && !event.target.files[0].name.endsWith('.json')) {
        setErrorMessage("Invalid file type. Please upload a .json file.");
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      handleLoadProgress(event.target.files[0]);
      if(fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };


  const TabButton: React.FC<{ tabId: TabId; label: string }> = ({ tabId, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      disabled={isApiKeyMissing}
      aria-pressed={activeTab === tabId}
      className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-oswald uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-1 ${
        activeTab === tabId
          ? 'bg-neutral-800 text-white'
          : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
      } ${isApiKeyMissing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );

  const renderCurrentTab = () => {
    if (isApiKeyMissing) {
        return (
            <div className="p-6 bg-red-50 border border-red-500 text-red-700 rounded-md shadow text-center" role="alert">
                <h2 className="text-xl font-bold font-playfair mb-2">API Key Error</h2>
                <p className="font-merriweather">The Gemini API key is missing or not configured correctly. Please ensure the <code>API_KEY</code> environment variable is set.</p>
                <p className="font-merriweather mt-1">The application functionality will be limited until the API key is available.</p>
            </div>
        );
    }

    switch (activeTab) {
      case TabId.NewsroomMission:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white p-4 md:p-6 shadow-lg border border-neutral-300">
              <h2 className="font-playfair text-2xl font-bold text-neutral-800 mb-1">Article Writer</h2>
              <p className="font-merriweather text-sm text-neutral-600 mb-4">Follow the steps to provide details for your news article.</p>
              <SocraticStepper
                steps={socraticSteps}
                currentStepIndex={currentStepIndex}
                inputs={newsroomInputs}
                onInputChange={handleNewsroomInputChange}
                onStepChange={handleStepChange}
                onComplete={handleSocraticJourneyComplete}
                isApiKeyMissing={isApiKeyMissing}
              />
              {isJourneyCompleted && !isLoadingArticle && generatedArticle && !generatedArticle.startsWith("Error") && (
                <div className="mt-4 p-3 bg-green-50 border border-green-500 text-green-700 rounded" role="status">
                    All questions answered! The AI has drafted your article. Check the preview or the 'Pressroom Proof' tab.
                </div>
              )}
              {isLoadingArticle && (
                <div className="mt-4 flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded" role="status">
                  <LoadingSpinner size="w-5 h-5 mr-2"/> Generating Article...
                </div>
              )}
            </div>
            <div className="sticky top-6 self-start">
              <h3 className="font-playfair text-xl font-semibold text-neutral-800 mb-2">Live Article Preview</h3>
              <ArticleDisplay 
                articleContent={generatedArticle || liveArticlePreview} 
                activeHighlightKey={null} 
              />
            </div>
          </div>
        );
      case TabId.ResearchBibliography:
        const successfullyFormattedSources = bibliographyInputs.sources
            .filter(s => s.formattedOutput && !s.error && !s.formattedOutput.startsWith("Error:"));
        const completedSourcesCount = successfullyFormattedSources.length;

        return (
          <div className="bg-white p-4 md:p-6 shadow-lg border border-neutral-300">
            <h2 className="font-playfair text-2xl font-bold text-neutral-800 mb-1">Bibliography Builder</h2>
            <p className="font-merriweather text-sm text-neutral-600 mb-4">Enter each source below using the provided fields and click "Generate APA Format" for that source. Author, Year, and Title are required. All five sources must be completed.</p>
            
            <div className="mb-4 p-3 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-300">
              {completedSourcesCount < 5
                ? `${completedSourcesCount}/5 sources formatted. Please complete and format all 5 source entries.`
                : "All 5 sources formatted! Bibliography complete."}
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-x-6 lg:gap-x-8">
              <div className="space-y-6">
                {bibliographyInputs.sources.map((source, index) => (
                  <IndividualSourceFormatter
                    key={`input-${source.id}`}
                    source={source}
                    index={index}
                    onInputChange={handleStructuredSourceInputChange}
                    onFormatRequest={handleFormatSingleSource}
                    isApiKeyMissing={isApiKeyMissing}
                  />
                ))}
              </div>
              
              <div className="mt-6 md:mt-0 md:sticky md:top-6 self-start space-y-6 bg-white p-4 border border-neutral-200 shadow-inner">
                <h3 className="font-playfair !text-xl font-semibold text-neutral-800 mb-3 border-b border-neutral-300 pb-2">
                    Formatted Bibliography & Insights
                </h3>
                {successfullyFormattedSources.length === 0 && (
                    <div className="p-6 border border-neutral-300/70 bg-neutral-50/50 font-merriweather text-neutral-600 text-center italic min-h-[100px] flex flex-col justify-center rounded-md">
                        <p className="text-md">Your formatted bibliography entries and "Inside Scoop" fields will appear here once sources are processed.</p>
                    </div>
                )}
                {bibliographyInputs.sources.map((source, index) => {
                  if (source.formattedOutput && !source.error && !source.formattedOutput.startsWith("Error:")) {
                    return (
                      <FormattedSourceEntryDisplay
                        key={`display-${source.id}`}
                        source={source}
                        index={index}
                        onInsideScoopChange={handleInsideScoopChange}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        );
      case TabId.PhotoJournalist:
        const canSuggestPrompts = newsroomInputs.moralIssue?.trim() && newsroomInputs.studentName?.trim();
        return (
          <div className="bg-white p-4 md:p-6 shadow-lg border border-neutral-300">
            <h2 className="font-playfair text-2xl font-bold text-neutral-800 mb-1">Photo-Journalist</h2>
            <p className="font-merriweather text-sm text-neutral-600 mb-4">Generate black & white, halftone-style images for your article. First, suggest prompts based on your article content.</p>
            <Button onClick={handleSuggestImagePrompts} isLoading={isLoadingPrompts} disabled={isApiKeyMissing || isLoadingPrompts || !canSuggestPrompts} className="mb-6">
              {isLoadingPrompts ? 'Suggesting Prompts...' : 'Suggest Photo Prompts'}
            </Button>
            {!canSuggestPrompts && !isLoadingPrompts && (
                 <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-4">
                    Please complete the 'Moral/Ethical Issue' and 'Student Name' in the 'Article Writer' tab to enable prompt suggestions.
                </p>
            )}

            <div className="space-y-6">
              {photoEntries.map((entry, index) => (
                <div key={entry.id} className="p-4 border border-neutral-200 rounded-md shadow-sm bg-neutral-50">
                  <h4 className="font-oswald text-lg font-medium text-neutral-700 mb-2">Image Option {index + 1}</h4>
                  {entry.suggestedPrompt && !entry.isLoading && (
                    <p className="text-sm text-neutral-600 mb-1 italic">Suggested Prompt: "{entry.suggestedPrompt}"</p>
                  )}
                  <TextAreaInput
                    label="Image Prompt (edit as needed)"
                    name={`photoPrompt-${index}`}
                    value={entry.currentPrompt}
                    onChange={(e) => handlePhotoPromptChange(index, e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    rows={2}
                    required
                  />
                  <Button
                    onClick={() => handleGenerateImage(index)}
                    isLoading={entry.isLoading && !isLoadingPrompts} 
                    disabled={isApiKeyMissing || !entry.currentPrompt.trim() || entry.isLoading}
                    className="mt-2"
                  >
                    {entry.isLoading && !isLoadingPrompts ? 'Generating...' : 'Generate Image'}
                  </Button>

                  {entry.isLoading && !isLoadingPrompts && (
                     <div className="mt-3 flex justify-center items-center h-32 bg-neutral-100 border border-dashed border-neutral-300 rounded">
                        <LoadingSpinner/>
                        <span className="ml-2 text-neutral-500">Generating image...</span>
                     </div>
                  )}

                  {entry.imageUrl && !entry.isLoading && (
                    <div className="mt-3">
                      <img src={entry.imageUrl} alt={`Generated image for: ${entry.currentPrompt}`} className="max-w-xs w-full mx-auto border border-neutral-400 shadow-md filter grayscale contrast-125" />
                       <p className="text-xs text-center text-neutral-600 italic mt-1 px-2 font-merriweather">
                           {entry.userEditableCaption || `Photo prompt: "${entry.currentPrompt}"`}
                       </p>
                      <div className="mt-2 text-center">
                        <label className="flex items-center justify-center space-x-2 text-sm text-neutral-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.isApproved}
                            onChange={(e) => handleApproveImage(index, e.target.checked)}
                            className="form-checkbox h-4 w-4 text-neutral-600 border-neutral-400 focus:ring-neutral-500"
                            aria-labelledby={`approve-label-${index}`}
                          />
                          <span id={`approve-label-${index}`}>Approve for Pressroom Proof</span>
                        </label>
                      </div>
                    </div>
                  )}
                  {entry.error && <p className="text-xs text-red-600 mt-1">{entry.error}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      case TabId.PressroomProof:
        const approvedPhoto = photoEntries.find(p => p.isApproved && p.imageUrl);
        const displayProofContent = userEditedProofContent ?? baseGeneratedProofContent;

        return (
          <div className="bg-white shadow-lg border border-neutral-300">
            <div className="p-4 md:p-6 text-center border-b border-neutral-300">
              <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-neutral-900 mb-3 uppercase tracking-wide">The Ethics Chronicle</h2>
              <p className="font-merriweather text-md text-neutral-600 italic">Assembled Pressroom Proof View</p>
            </div>
          
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[300px] flex-shrink-0 p-4 md:p-6 border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50 md:sticky md:top-6 md:self-start">
                <NewspaperConventionChecklist onHoverConvention={setHoveredConventionKey} />
              </div>
          
              <div className="flex-1 min-w-0 p-2 md:p-4"> 
                <ArticleDisplay
                  articleContent={displayProofContent}
                  approvedImage={approvedPhoto ? { 
                    id: approvedPhoto.id, 
                    url: approvedPhoto.imageUrl!, 
                    altText: approvedPhoto.currentPrompt, // Original prompt for alt
                    caption: approvedPhoto.userEditableCaption // Editable caption for display
                  } : null}
                  activeHighlightKey={hoveredConventionKey}
                  isEditable={true}
                  onContentChange={(newContent) => {
                    setUserEditedProofContent(newContent);
                  }}
                  onImageCaptionChange={handleImageCaptionChange} 
                />
              </div>
            </div>
          </div>
        );
      case TabId.RealTimeRubric:
        return (
            <div className="max-w-4xl mx-auto"> {/* Added container for centering */}
                <RealTimeRubric scores={rubricScores} isLoadingOverall={isLoadingRubric} />
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 p-4 md:p-6 lg:p-8">
      <header className="mb-6 md:mb-8 text-center border-b-2 border-neutral-700 pb-4">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-neutral-900">Newsroom Mission: Front Page Ethics</h1>
        <p className="font-merriweather text-lg text-neutral-700 mt-1">Craft a compelling news story from start to finish.</p>
      </header>

      <nav className="mb-6 md:mb-8 flex flex-wrap justify-center space-x-1 sm:space-x-2 shadow-md rounded overflow-hidden" role="tablist" aria-label="Main Navigation">
        <TabButton tabId={TabId.NewsroomMission} label="📝 Article Writer" />
        <TabButton tabId={TabId.ResearchBibliography} label="📚 Bibliography" />
        <TabButton tabId={TabId.PhotoJournalist} label="🖼️ Photo-Journalist" />
        <TabButton tabId={TabId.PressroomProof} label="📰 Pressroom Proof" />
        <TabButton tabId={TabId.RealTimeRubric} label="📊 Rubric" />
      </nav>

      <div className="mb-6 flex flex-wrap justify-center gap-3 items-center">
        <Button 
            onClick={handleSaveProgress} 
            variant="secondary" 
            disabled={isApiKeyMissing}
            aria-label="Save current progress"
        >
            💾 Save Progress
        </Button>
        
        <label
            htmlFor="load-progress-input"
            className={`inline-flex items-center justify-center px-4 py-2 border text-sm font-oswald uppercase tracking-wider shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-500
            ${isApiKeyMissing ? 'opacity-60 cursor-not-allowed bg-neutral-400 border-neutral-400' : 'text-neutral-800 bg-neutral-200 hover:bg-neutral-300 border-neutral-400 cursor-pointer'}`}
            aria-disabled={isApiKeyMissing}
          >
           📥 Load Progress
        </label>
        <input
          id="load-progress-input"
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleLoadFileChange}
          disabled={isApiKeyMissing}
          ref={fileInputRef}
          aria-label="Load saved progress from a JSON file"
        />
      </div>

      {errorMessage && ( 
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md shadow text-sm" role="alert">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md shadow text-sm" role="status">
          {successMessage}
        </div>
      )}

      <main>
        {renderCurrentTab()}
      </main>

      <footer className="mt-10 pt-6 border-t border-neutral-300 text-center text-sm text-neutral-600">
        <p>&copy; {new Date().getFullYear()} The Ethics Chronicle Newsroom Simulator. For educational purposes.</p>
      </footer>
    </div>
  );
};

export default App;