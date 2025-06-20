
import React from 'react';
import { SocraticStep, NewsroomMissionInputs, SocraticQuestion } from '../types';
import TextInput from './TextInput';
import TextAreaInput from './TextAreaInput';
import Button from './Button';

interface SocraticStepperProps {
  steps: SocraticStep[];
  currentStepIndex: number;
  inputs: NewsroomMissionInputs;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onStepChange: (newStepIndex: number) => void;
  onComplete: () => void; // Called when 'Next' on the last step is clicked
  isApiKeyMissing: boolean;
}

const SocraticStepper: React.FC<SocraticStepperProps> = ({
  steps,
  currentStepIndex,
  inputs,
  onInputChange,
  onStepChange,
  onComplete,
  isApiKeyMissing,
}) => {
  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    // Validate required fields for the current step
    for (const q of currentStep.questions) {
      if (q.required && !inputs[q.key]?.trim()) {
        alert(`Please answer the required question: "${q.label}"`);
        return;
      }
    }
    if (currentStepIndex < steps.length - 1) {
      onStepChange(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const renderInput = (question: SocraticQuestion) => {
    const value = inputs[question.key] || '';
    if (question.inputType === 'textarea') {
      return (
        <TextAreaInput
          label={question.label}
          name={question.key}
          value={value}
          onChange={onInputChange}
          placeholder={question.placeholder}
          rows={question.rows || 3}
          required={question.required}
        />
      );
    }
    if (question.inputType === 'date') {
      // Ensure date value is in YYYY-MM-DD format for the input
      const dateValue = value && value.split('T')[0];
      return (
         <TextInput
          label={question.label}
          name={question.key}
          type="date"
          value={dateValue}
          onChange={onInputChange}
          placeholder={question.placeholder}
          required={question.required}
        />
      );
    }
    return (
      <TextInput
        label={question.label}
        name={question.key}
        value={value}
        onChange={onInputChange}
        placeholder={question.placeholder}
        required={question.required}
      />
    );
  };

  return (
    <div className={`p-4 md:p-5 border ${currentStep.colorScheme.border} ${currentStep.colorScheme.bg} shadow-md`}>
      <div className="mb-4 p-2 border-b-2 ${currentStep.colorScheme.border}">
        <h2 className={`font-playfair text-xl font-semibold ${currentStep.colorScheme.text}`}>
          {currentStep.title}
        </h2>
        <p className={`text-sm ${currentStep.colorScheme.accentText} font-merriweather`}>Step {currentStepIndex + 1} of {steps.length}</p>
      </div>

      <div className="space-y-4">
        {currentStep.questions.map((q) => (
          <div key={q.key}>
            <p className={`font-merriweather mb-1 text-neutral-700 ${currentStep.colorScheme.text}`}>{q.text}</p>
            {renderInput(q)}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <Button
          onClick={handlePrevious}
          disabled={currentStepIndex === 0 || isApiKeyMissing}
          variant="secondary"
        >
          Previous
        </Button>
        <div className="text-sm text-neutral-600">
          {currentStepIndex + 1} / {steps.length}
        </div>
        <Button
          onClick={handleNext}
          disabled={isApiKeyMissing}
          variant="primary"
        >
          {currentStepIndex === steps.length - 1 ? 'Finish Questions' : 'Next Step'}
        </Button>
      </div>
    </div>
  );
};

export default SocraticStepper;
