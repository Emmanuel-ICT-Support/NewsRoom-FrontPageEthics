

import React from 'react';
import { SourceEntry, SourceEntryStructuredInput } from '../types';
import TextInput from './TextInput';
// TextAreaInput no longer needed here for Inside Scoop
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface IndividualSourceFormatterProps {
  source: SourceEntry;
  index: number;
  onInputChange: (index: number, field: keyof SourceEntryStructuredInput, value: string) => void;
  onFormatRequest: (index: number) => void;
  // onInsideScoopChange prop removed
  isApiKeyMissing: boolean;
}

const IndividualSourceFormatter: React.FC<IndividualSourceFormatterProps> = ({
  source,
  index,
  onInputChange,
  onFormatRequest,
  // onInsideScoopChange removed
  isApiKeyMissing,
}) => {
  const { author, year, title, publisherOrUrl, formattedOutput, isLoading, error, isAttempted } = source;

  const handleInputChange = (field: keyof SourceEntryStructuredInput, value: string) => {
    onInputChange(index, field, value);
  };

  const handleFormatClick = () => {
    onFormatRequest(index);
  };

  const areRequiredFieldsFilled = author.trim() !== '' && year.trim() !== '' && title.trim() !== '';
  // const isSuccessfullyFormatted = formattedOutput && !error && !formattedOutput.startsWith("Error:"); // No longer needed here

  return (
    <div className="p-4 border border-neutral-300 bg-neutral-50 shadow-sm rounded-md space-y-3">
      <h4 className="font-oswald text-md font-semibold text-neutral-700 mb-1">Source {index + 1}</h4>
      
      <TextInput
        label="Author(s)"
        name={`author-${index}`}
        value={author}
        onChange={(e) => handleInputChange('author', e.target.value)}
        placeholder="e.g., Smith, J. A., & Doe, B."
        required={true}
      />
      <TextInput
        label="Year"
        name={`year-${index}`}
        value={year}
        onChange={(e) => handleInputChange('year', e.target.value)}
        placeholder="e.g., 2021"
        required={true}
      />
      <TextInput
        label="Title of Work"
        name={`title-${index}`}
        value={title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        placeholder="e.g., Ethical Thinking in Schools"
        required={true}
      />
      <TextInput
        label="Publisher / Journal / URL"
        name={`publisherOrUrl-${index}`}
        value={publisherOrUrl}
        onChange={(e) => handleInputChange('publisherOrUrl', e.target.value)}
        placeholder="e.g., Ethics Press OR Journal of Ed. Psych., 12(3) OR https://..."
        required={false} 
      />

      <Button
        onClick={handleFormatClick}
        isLoading={isLoading}
        disabled={isApiKeyMissing || isLoading || !areRequiredFieldsFilled}
        className="mt-2"
        variant="secondary"
      >
        {isLoading ? 'Formatting...' : 'Generate APA Format'}
      </Button>

      {isLoading && (
        <div className="mt-2 flex items-center text-sm text-neutral-600">
          <LoadingSpinner size="w-4 h-4 mr-2" />
          <span>Processing source...</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="mt-2 p-2 text-sm text-red-700 bg-red-50 border border-red-300 rounded">
          <p><strong>Formatting Error:</strong> {error.replace(/^Error: /i, '')}</p>
        </div>
      )}

      {!isLoading && !error && formattedOutput && !formattedOutput.startsWith("Error:") && (
        <div className="mt-2 p-2 text-sm text-green-700 bg-green-50 border border-green-300 rounded">
          {/* Keep showing formatted output confirmation here if desired, or rely on right column */}
          <p className="whitespace-pre-wrap"><strong>Formatting successful.</strong> See details on the right.</p>
        </div>
      )}
      {!isLoading && !error && !formattedOutput && isAttempted && !areRequiredFieldsFilled && (
         <div className="mt-2 p-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-300 rounded">
          <p>Please fill in Author, Year, and Title, then click "Generate APA Format".</p>
        </div>
      )}

      {/* "Inside Scoop" TextAreaInput removed from here */}
    </div>
  );
};

export default IndividualSourceFormatter;
