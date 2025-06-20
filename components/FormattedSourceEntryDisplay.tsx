
import React, { useState, useEffect } from 'react';
import { SourceEntry } from '../types';
import TextAreaInput from './TextAreaInput';
import Button from './Button'; // Import Button component

interface FormattedSourceEntryDisplayProps {
  source: SourceEntry;
  index: number;
  onInsideScoopChange: (index: number, value: string) => void;
}

const FormattedSourceEntryDisplay: React.FC<FormattedSourceEntryDisplayProps> = ({
  source,
  index,
  onInsideScoopChange,
}) => {
  const { formattedOutput, insideScoop } = source;
  const [showScoopAppliedMessage, setShowScoopAppliedMessage] = useState(false);

  const handleInsideScoopInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInsideScoopChange(index, e.target.value);
    if (showScoopAppliedMessage) {
        setShowScoopAppliedMessage(false); // Hide message if user types again
    }
  };

  const handleApplyToStoryClick = () => {
    // The insideScoop is already updated in App.tsx via onInsideScoopChange.
    // This button primarily serves as a UX confirmation.
    if (insideScoop.trim()) {
        setShowScoopAppliedMessage(true);
    }
  };

  useEffect(() => {
    let timer: number; // Changed NodeJS.Timeout to number
    if (showScoopAppliedMessage) {
      timer = window.setTimeout(() => { // Used window.setTimeout for clarity
        setShowScoopAppliedMessage(false);
      }, 3000); // Message disappears after 3 seconds
    }
    return () => window.clearTimeout(timer); // Used window.clearTimeout
  }, [showScoopAppliedMessage]);

  // This component should only be rendered if formattedOutput is valid
  if (!formattedOutput || formattedOutput.startsWith("Error:")) {
    return null;
  }

  const placeholderText = `E.g., “This source highlights the pressure to conform…”
or
‘Quote: “Students must act according to conscience…”’
How does this inform your article?`;

  return (
    <div className="p-3 border border-neutral-200 bg-neutral-50/30 shadow-sm rounded-md">
      <p className="text-sm text-neutral-700 whitespace-pre-wrap mb-2.5">
        {formattedOutput}
      </p>
      <div className="mt-2 pt-2 border-t border-neutral-200/80">
        <TextAreaInput
          label={<strong className="font-merriweather">Inside Scoop: What key insight or message from this source can help support your story?</strong>}
          name={`insideScoop-${index}`}
          value={insideScoop}
          onChange={handleInsideScoopInputChange}
          placeholder={placeholderText}
          rows={4}
        />
        <Button
          onClick={handleApplyToStoryClick}
          disabled={!insideScoop.trim()}
          className="mt-2 text-xs"
          variant="secondary"
        >
          📝 Apply to Story
        </Button>
        {showScoopAppliedMessage && (
          <p className="text-xs text-green-600 mt-1 italic">
            Note saved. It will be considered for your article.
          </p>
        )}
      </div>
    </div>
  );
};

export default FormattedSourceEntryDisplay;