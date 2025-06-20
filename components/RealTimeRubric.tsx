
import React from 'react';
import { RubricScore, RubricCriterionKey, RubricSectionDefinition } from '../types';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface RealTimeRubricProps {
  scores: RubricScore[];
  isLoadingOverall: boolean; // True if any score is still loading / overall calculation in progress
}

const getCriterionById = (id: RubricCriterionKey) => RUBRIC_CRITERIA.find(c => c.id === id);

const RealTimeRubric: React.FC<RealTimeRubricProps> = ({ scores, isLoadingOverall }) => {
  if (isLoadingOverall && scores.every(s => s.isLoading)) {
    return (
      <div className="mt-8 p-6 bg-white border border-neutral-300 shadow-lg rounded-lg">
        <h3 className="font-playfair text-2xl font-bold text-neutral-800 mb-4 text-center">Real-Time Rubric</h3>
        <div className="flex flex-col items-center justify-center min-h-[200px] text-neutral-600">
          <LoadingSpinner size="w-12 h-12" />
          <p className="mt-3 text-lg">Calculating your scores...</p>
        </div>
      </div>
    );
  }
  
  const renderCriterionScore = (criterionId: RubricCriterionKey) => {
    const criterion = getCriterionById(criterionId);
    const scoreData = scores.find(s => s.criterionId === criterionId);

    if (!criterion) return <div key={criterionId} className="text-red-500">Error: Rubric criterion '{criterionId}' not found.</div>;
    
    // Default to a loading/pending state if specific scoreData isn't found or is still loading
    const marksAwarded = scoreData ? scoreData.marksAwarded : 0;
    const feedback = scoreData ? scoreData.feedback : 'Awaiting assessment...';
    const isLoadingCriterion = scoreData ? scoreData.isLoading : isLoadingOverall;


    return (
      <div key={criterion.id} className="py-3 px-1 border-b border-neutral-200 last:border-b-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-oswald text-md font-semibold text-neutral-700">{criterion.title}</h4>
          {isLoadingCriterion ? (
            <div className="flex items-center text-sm text-neutral-500">
              <LoadingSpinner size="w-4 h-4 mr-1.5" />
              <span>Assessing...</span>
            </div>
          ) : (
            <p className="font-oswald text-md font-bold text-neutral-800">
              {marksAwarded} / {criterion.maxMarks}
            </p>
          )}
        </div>
        {!isLoadingCriterion && (
           <p className="text-xs font-merriweather text-neutral-600 italic leading-relaxed">{feedback}</p>
        )}
      </div>
    );
  };

  const calculateTotalScore = (currentScores: RubricScore[]): { awarded: number; possible: number } => {
    let totalAwarded = 0;
    let totalPossible = 0;
    RUBRIC_SECTIONS.forEach(section => {
        totalPossible += section.totalPossibleMarks;
        section.criteriaIds.forEach(criterionId => {
            const scoreData = currentScores.find(s => s.criterionId === criterionId);
            if (scoreData && !scoreData.isLoading) { // Only count if not loading
                totalAwarded += scoreData.marksAwarded;
            }
        });
    });
    return { awarded: totalAwarded, possible: totalPossible };
  };
  
  const { awarded: totalAwardedScore, possible: totalPossibleScore } = calculateTotalScore(scores);

  return (
    <div className="mt-8 p-4 md:p-6 bg-white border border-neutral-300 shadow-lg rounded-lg">
      <h3 className="font-playfair text-xl sm:text-2xl font-bold text-neutral-800 mb-4 pb-3 border-b border-neutral-300 text-center">
        Your Rubric Score So Far
      </h3>
      
      {RUBRIC_SECTIONS.map(section => (
        <div key={section.title} className="mb-6 last:mb-0">
          <h4 className="font-playfair text-lg font-semibold text-neutral-700 mb-2 mt-3 p-2 bg-neutral-100 border-t border-b border-neutral-200">
            {section.title} (Section total: / {section.totalPossibleMarks})
          </h4>
          <div className="divide-y divide-neutral-200">
             {section.criteriaIds.map(criterionId => renderCriterionScore(criterionId))}
          </div>
        </div>
      ))}

      <div className="mt-6 pt-4 border-t-2 border-neutral-400 text-center">
        <p className="font-playfair text-xl font-bold text-neutral-900">
          Overall Total: {totalAwardedScore} / {totalPossibleScore}
        </p>
         {isLoadingOverall && scores.some(s => s.isLoading) && (
            <p className="text-sm text-neutral-500 mt-1">Some scores are still being calculated...</p>
        )}
      </div>
    </div>
  );
};

export default RealTimeRubric;
