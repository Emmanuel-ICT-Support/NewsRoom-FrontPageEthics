
import React from 'react';
import Tooltip from './Tooltip'; // Import the new Tooltip component

interface ConventionItemData {
  name: string;
  emoji: string;
  tooltip: string;
}

const conventions: ConventionItemData[] = [
  { name: "Headline", emoji: "📰", tooltip: "A bold, attention-grabbing title that summarises the story." },
  { name: "Byline", emoji: "🖋️", tooltip: "The author’s name, shown just below the headline." },
  { name: "Lead Paragraph", emoji: "📍", tooltip: "The opening paragraph answering who, what, when, where, why, and how." },
  { name: "Subheadings", emoji: "🗂️", tooltip: "Titles that organize your article into clear sections." },
  { name: "Inverted Pyramid", emoji: "🔻", tooltip: "Most important info first, then supporting details." },
  { name: "Quote", emoji: "🗣️", tooltip: "A line of speech from someone, with attribution." },
  { name: "Publish Date", emoji: "📅", tooltip: "The date the article was published." },
  { name: "Facts", emoji: "🧾", tooltip: "Check that names, dates, and details are accurate." },
  { name: "Tone", emoji: "🎯", tooltip: "Write in third-person and stay objective." },
  { name: "Visuals", emoji: "🖼️", tooltip: "Include a photo or illustration to support your story." },
  { name: "Conclusion", emoji: "🧠", tooltip: "Wrap up the article with a clear and thoughtful end." },
];

interface NewspaperConventionChecklistProps {
  onHoverConvention: (conventionName: string | null) => void;
}

const NewspaperConventionChecklist: React.FC<NewspaperConventionChecklistProps> = ({ onHoverConvention }) => {
  return (
    <div className="h-full">
      <h3 className="font-playfair text-lg sm:text-xl font-semibold text-neutral-800 mb-4 pb-2 border-b border-neutral-300">
        Newspaper Conventions
      </h3>
      <ul className="space-y-1" aria-label="Newspaper Conventions Checklist">
        {conventions.map((convention) => (
          <li 
            key={convention.name}
            onMouseEnter={() => onHoverConvention(convention.name)}
            onMouseLeave={() => onHoverConvention(null)}
            onFocusCapture={() => onHoverConvention(convention.name)} // Using FocusCapture for child Tooltip focus
            onBlurCapture={() => onHoverConvention(null)}    // Using BlurCapture for child Tooltip blur
          >
            <Tooltip text={convention.tooltip} position="right">
              <div 
                className="flex items-center py-2 px-2 rounded hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 cursor-default"
                tabIndex={0} // Makes this div focusable
                aria-label={`${convention.name}. Hover or focus to see definition.`}
              >
                <span className="text-2xl mr-3 w-7 text-center flex-shrink-0" aria-hidden="true">{convention.emoji}</span>
                <span className="font-merriweather text-sm text-neutral-700">
                  {convention.name}
                </span>
              </div>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewspaperConventionChecklist;
