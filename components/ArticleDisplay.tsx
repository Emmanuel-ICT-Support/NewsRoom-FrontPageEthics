

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ArticleDisplayProps {
  articleContent: string;
  approvedImage?: { 
    id: string; // PhotoEntry ID
    url: string; 
    altText: string; // Original prompt for img alt attribute
    caption: string; // User-editable caption for figcaption
  } | null;
  activeHighlightKey?: string | null;
  isEditable?: boolean;
  onContentChange?: (newContent: string) => void;
  onImageCaptionChange?: (imageId: string, newCaption: string) => void; // Callback to update App state
}

// Define Part Types
type PartType =
  | 'headline'
  | 'byline'
  | 'date'
  | 'subheading'
  | 'paragraph'
  | 'leadParagraph' // Special handling for drop cap
  | 'quote'
  | 'image'
  | 'referenceHeader'
  | 'referenceItem'
  | 'emptyLine';

interface BasePart {
  id: string;
  type: PartType;
}

interface TextPart extends BasePart { text: string; }
interface HeadlinePart extends TextPart { type: 'headline'; }
interface BylinePart extends TextPart { type: 'byline'; }
interface DatePart extends TextPart { type: 'date'; }
interface SubheadingPart extends TextPart { type: 'subheading'; }
interface ParagraphPart extends TextPart { type: 'paragraph'; }
interface LeadParagraphPart extends TextPart { type: 'leadParagraph'; }
interface QuotePart extends BasePart { type: 'quote'; text: string; speaker: string; }
interface ImagePart extends BasePart { 
  type: 'image'; 
  imageUrl: string; 
  altText: string; // Original prompt, for img alt attribute
  caption: string; // User-editable caption for display in figcaption
}
interface ReferenceHeaderPart extends TextPart { type: 'referenceHeader'; }
interface ReferenceItemPart extends TextPart { type: 'referenceItem'; }
interface EmptyLinePart extends BasePart { type: 'emptyLine'; }

export type ArticlePart =
  | HeadlinePart | BylinePart | DatePart | SubheadingPart | ParagraphPart | LeadParagraphPart
  | QuotePart | ImagePart | ReferenceHeaderPart | ReferenceItemPart | EmptyLinePart;


const conventionEmojis: { [key: string]: string } = {
  "Headline": "📰",
  "Byline": "🖋️",
  "Lead Paragraph": "📍",
  "Subheadings": "🗂️",
  "Quote": "🗣️",
  "Publish Date": "📅",
  "Visuals": "🖼️",
};

const HighlightWrapper: React.FC<{
  conventionKey: string;
  activeHighlightKey: string | null;
  children: React.ReactNode;
  isBlock?: boolean;
  className?: string;
}> = ({ conventionKey, activeHighlightKey, children, isBlock = false, className = '' }) => {
  const emoji = conventionEmojis[conventionKey];
  const isActive = activeHighlightKey === conventionKey && emoji;

  const baseClass = isBlock ? "relative" : "";

  if (isBlock) {
    return (
      <div className={`${baseClass} ${className}`}>
        {isActive && (
          <span aria-hidden="true" className="absolute -left-7 top-1/2 -translate-y-1/2 text-xl lg:-left-8 print:hidden">
            {emoji}
          </span>
        )}
        {children}
      </div>
    );
  }

  return (
    <span className={`${baseClass} ${className}`}>
      {isActive && <span aria-hidden="true" className="mr-1 print:hidden">{emoji}</span>}
      {children}
    </span>
  );
};

const autoGrow = (element: HTMLTextAreaElement | HTMLInputElement) => {
  if (element instanceof HTMLTextAreaElement) {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  }
};

const EditableField: React.FC<{
  part: ArticlePart; // Keep for general context, may not be fully used for image caption's specialized onChange
  value: string;
  onChange: (newValue: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}> = ({ part, value, onChange, multiline = false, className = '', placeholder, ariaLabel }) => {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      autoGrow(ref.current);
    }
  }, [value]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
  
  const inputBaseClass = `editable-field w-full bg-transparent border border-transparent hover:border-neutral-400 focus:border-neutral-600 focus:bg-white/70 focus:shadow-inner outline-none p-0.5 -m-0.5 rounded transition-colors duration-150`;

  if (multiline) {
    return (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={handleChange}
        className={`${inputBaseClass} ${className} resize-none overflow-hidden`} // Removed specific font/text styles here to be set by parent
        placeholder={placeholder}
        rows={1}
        aria-label={ariaLabel || `Edit ${part.type}`}
      />
    );
  }
  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      type="text"
      value={value}
      onChange={handleChange}
      className={`${inputBaseClass} ${className}`}
      placeholder={placeholder}
      aria-label={ariaLabel || `Edit ${part.type}`}
    />
  );
};


const parseArticleToParts = (
    content: string, 
    approvedImageForParsing?: { id: string; url: string; altText: string; caption: string; } | null
  ): ArticlePart[] => {
  const parts: ArticlePart[] = [];
  if (!content || content.trim() === "" || content.startsWith("Start building your article")) {
      return parts;
  }

  const lines = content.split(/\r?\n/);
  let partIdCounter = 0;

  let inQuoteBlock = false;
  let currentQuoteText = "";
  let currentQuoteSpeaker = "";
  
  let leadParagraphCaptured = false;
  let imageInserted = !approvedImageForParsing; 

  const commitQuote = () => {
    if (currentQuoteText) {
      parts.push({
        id: `part-${partIdCounter++}`,
        type: 'quote',
        text: currentQuoteText.replace(/^["']|["']$/g, '').trim(), 
        speaker: currentQuoteSpeaker.trim() 
      });
      currentQuoteText = "";
      currentQuoteSpeaker = "";
    }
    inQuoteBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim(); 

    if (trimmedLine.startsWith('## HEADLINE:')) {
      commitQuote();
      parts.push({ id: `part-${partIdCounter++}`, type: 'headline', text: trimmedLine.replace('## HEADLINE:', '').trim() });
      continue;
    }
    if (trimmedLine.startsWith('**BYLINE:**')) {
      commitQuote();
      parts.push({ id: `part-${partIdCounter++}`, type: 'byline', text: trimmedLine.replace('**BYLINE:**', '').trim() });
      continue;
    }
    if (trimmedLine.startsWith('**DATE:**')) {
      commitQuote();
      parts.push({ id: `part-${partIdCounter++}`, type: 'date', text: trimmedLine.replace('**DATE:**', '').trim() });
      continue;
    }

    if (trimmedLine.startsWith('### References')) {
      commitQuote();
      parts.push({ id: `part-${partIdCounter++}`, type: 'referenceHeader', text: 'References' }); 
      continue;
    }
    
    if (trimmedLine.startsWith('### ')) {
      commitQuote();
      parts.push({ id: `part-${partIdCounter++}`, type: 'subheading', text: trimmedLine.replace(/###\s*/, '').trim() });
      continue;
    }

    if (trimmedLine.startsWith('**QUOTE:**')) {
      commitQuote();
      inQuoteBlock = true;
      currentQuoteText = trimmedLine.substring('**QUOTE:**'.length).replace(/^["']|["']$/g, '').trim();
      
      if (trimmedLine.includes('**END QUOTE**')) {
        const endQuoteIndex = trimmedLine.indexOf('**END QUOTE**');
        currentQuoteText = trimmedLine.substring('**QUOTE:**'.length, endQuoteIndex).replace(/^["']|["']$/g, '').trim();
        const speakerMatch = trimmedLine.substring(endQuoteIndex + '**END QUOTE**'.length).match(/-\s*(.*)$/);
        currentQuoteSpeaker = speakerMatch ? speakerMatch[1].trim() : '';
        commitQuote(); 
      }
      continue;
    }

    if (inQuoteBlock) {
      if (trimmedLine.includes('**END QUOTE**')) {
        const endQuoteIndex = trimmedLine.indexOf('**END QUOTE**');
        currentQuoteText += (currentQuoteText ? " " : "") + trimmedLine.substring(0, endQuoteIndex).trim();
        currentQuoteText = currentQuoteText.trim(); 
        
        const speakerMatch = trimmedLine.substring(endQuoteIndex + '**END QUOTE**'.length).match(/-\s*(.*)$/);
        currentQuoteSpeaker = speakerMatch ? speakerMatch[1].trim() : '';
        commitQuote();
      } else {
        currentQuoteText += (currentQuoteText ? " " : "") + trimmedLine;
      }
      continue;
    }

    if (trimmedLine === '') { 
      commitQuote();
      if (parts.length === 0 || parts[parts.length - 1].type !== 'emptyLine') {
         parts.push({ id: `part-${partIdCounter++}`, type: 'emptyLine' });
      }
    } else { 
      commitQuote();
      const originalLineContent = line; 

      if (!leadParagraphCaptured && parts.some(p => p.type === 'date') && !parts.some(p => p.type === 'leadParagraph' || p.type === 'paragraph' || p.type === 'subheading' || p.type === 'image')) {
        parts.push({ id: `part-${partIdCounter++}`, type: 'leadParagraph', text: originalLineContent });
        leadParagraphCaptured = true;
        if (approvedImageForParsing && !imageInserted) {
          parts.push({ 
            id: `part-${partIdCounter++}`, // Use a generated ID for parsing context
            type: 'image', 
            imageUrl: approvedImageForParsing.url, 
            altText: approvedImageForParsing.altText,
            caption: approvedImageForParsing.caption 
          });
          imageInserted = true;
        }
      } else {
        const lastPart = parts.length > 0 ? parts[parts.length -1] : null;
        if (lastPart && (lastPart.type === 'referenceHeader' || lastPart.type === 'referenceItem')) {
            parts.push({ id: `part-${partIdCounter++}`, type: 'referenceItem', text: originalLineContent });
        } else {
            parts.push({ id: `part-${partIdCounter++}`, type: 'paragraph', text: originalLineContent });
        }
      }
    }
  }
  commitQuote(); 

  if (approvedImageForParsing && !imageInserted) {
    const dateIndex = parts.findIndex(p => p.type === 'date');
    const targetId = `part-${partIdCounter++}`; // Use a generated ID
    const imagePartToAdd: ImagePart = { 
        id: targetId, 
        type: 'image', 
        imageUrl: approvedImageForParsing.url, 
        altText: approvedImageForParsing.altText,
        caption: approvedImageForParsing.caption
    };
    if (dateIndex !== -1) {
      let insertAtIndex = dateIndex + 1;
      while(insertAtIndex < parts.length && (parts[insertAtIndex].type === 'byline' || parts[insertAtIndex].type === 'date')){
        insertAtIndex++;
      }
      parts.splice(insertAtIndex, 0, imagePartToAdd);
    } else { 
      parts.unshift(imagePartToAdd);
    }
  }
  return parts;
};

const reconstructPartsToArticle = (parts: ArticlePart[]): string => {
  let content = "";
  parts.forEach(part => {
    switch (part.type) {
      case 'headline':
        content += `## HEADLINE: ${part.text}\n`;
        break;
      case 'byline':
        content += `**BYLINE:** ${part.text}\n`;
        break;
      case 'date':
        content += `**DATE:** ${part.text}\n`;
        break;
      case 'subheading':
        content += `### ${part.text}\n`;
        break;
      case 'leadParagraph': 
      case 'paragraph':
        content += `${part.text}\n`; 
        break;
      case 'quote':
        content += `**QUOTE:** "${part.text}"${part.speaker ? ` - ${part.speaker}` : ''} **END QUOTE**\n`;
        break;
      case 'referenceHeader':
        content += `### References\n`;
        break;
      case 'referenceItem':
        content += `${part.text}\n`; 
        break;
      case 'emptyLine':
        content += `\n`;
        break;
      case 'image': // Image parts (including their captions) are not part of the reconstructed text article.
                  // They are managed by App.tsx's photoEntries and injected via the approvedImage prop.
        break;
    }
  });
  return content.replace(/\n\n\n+/g, '\n\n').trim(); 
};


const ArticleDisplay: React.FC<ArticleDisplayProps> = ({
  articleContent,
  approvedImage,
  activeHighlightKey,
  isEditable = false,
  onContentChange,
  onImageCaptionChange, // New prop
}) => {
  const [internalParts, setInternalParts] = useState<ArticlePart[]>([]);

  useEffect(() => {
    setInternalParts(parseArticleToParts(articleContent, approvedImage));
  }, [articleContent, approvedImage]);

  const handlePartChange = useCallback((partId: string, newText: string, field: 'text' | 'speaker' = 'text') => {
    const partToUpdate = internalParts.find(p => p.id === partId);
    if (!partToUpdate) return;

    // Image captions are handled separately, not through this general path
    if (partToUpdate.type === 'image' && field === 'text') { // 'text' here implies we mean caption for an image.
        // This case should ideally not be hit if image captions use the specialized handler.
        // For safety, log or handle, but primary update path is direct.
        console.warn("Image caption change attempted through generic handlePartChange. This should be handled by the specialized image caption editor.");
        return;
    }


    const newParts = internalParts.map(p => {
      if (p.id === partId) {
        if (field === 'text') {
          return { ...p, text: newText };
        } else if (p.type === 'quote' && field === 'speaker') {
          return { ...p, speaker: newText }; 
        }
      }
      return p;
    }) as ArticlePart[]; 
    setInternalParts(newParts);

    // Only call onContentChange if the change affects the text content of the article
    if (onContentChange) {
      onContentChange(reconstructPartsToArticle(newParts));
    }
  }, [internalParts, onContentChange]);


  if (internalParts.length === 0) {
    return (
      <div className="bg-white p-6 md:p-8 border border-neutral-300 shadow-lg font-merriweather text-neutral-600 text-center italic min-h-[400px] flex flex-col justify-center">
        <p className="text-lg">Your article preview will appear here.</p>
        <p className="text-sm mt-2">Complete the steps in the 'Article Writer' or check the 'Pressroom Proof' tab for the live assembled view.</p>
      </div>
    );
  }

  const headerElements: JSX.Element[] = [];
  const bodyElements: JSX.Element[] = []; 
  const referenceSectionElements: JSX.Element[] = [];
  let inReferencesSection = false;

  internalParts.forEach((part) => {
    const currentTargetArray = inReferencesSection ? referenceSectionElements : bodyElements;

    switch (part.type) {
      case 'headline':
        headerElements.push(
          <HighlightWrapper key={part.id} conventionKey="Headline" activeHighlightKey={activeHighlightKey} isBlock>
            {isEditable ? (
              <EditableField
                part={part}
                value={(part as HeadlinePart).text}
                onChange={(newText) => handlePartChange(part.id, newText)}
                className="font-playfair text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase !mb-0.5 text-neutral-900 text-left tracking-tight leading-tight"
                ariaLabel="Edit headline"
              />
            ) : (
              <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase !mb-0.5 text-neutral-900 text-left tracking-tight leading-tight">{(part as HeadlinePart).text}</h1>
            )}
          </HighlightWrapper>
        );
        break;
      case 'byline':
        headerElements.push(
          <HighlightWrapper key={part.id} conventionKey="Byline" activeHighlightKey={activeHighlightKey}>
            {isEditable ? (
               <EditableField
                part={part}
                value={(part as BylinePart).text}
                onChange={(newText) => handlePartChange(part.id, newText)}
                className="font-oswald text-xs sm:text-sm small-caps !my-0 text-neutral-700 tracking-wider"
                ariaLabel="Edit byline"
              />
            ) : (
              <p className="font-oswald text-xs sm:text-sm small-caps !my-0 text-neutral-700 tracking-wider">{(part as BylinePart).text}</p>
            )}
          </HighlightWrapper>
        );
        break;
      case 'date':
        headerElements.push(
          <HighlightWrapper key={part.id} conventionKey="Publish Date" activeHighlightKey={activeHighlightKey}>
             {isEditable ? (
               <EditableField
                part={part}
                value={(part as DatePart).text}
                onChange={(newText) => handlePartChange(part.id, newText)}
                className="font-oswald text-xs !my-0 !mb-0.5 text-neutral-600 small-caps tracking-wider"
                ariaLabel="Edit publication date"
              />
            ) : (
              <p className="font-oswald text-xs !my-0 !mb-0.5 text-neutral-600 small-caps tracking-wider">{(part as DatePart).text}</p>
            )}
          </HighlightWrapper>
        );
        headerElements.push(<hr key={`${part.id}-hr`} className="newspaper-section-divider !my-0.5" />);
        break;
      case 'leadParagraph':
        const leadPart = part as LeadParagraphPart;
        const displayLeadText = leadPart.text; 
        currentTargetArray.push(
          <HighlightWrapper key={part.id} conventionKey="Lead Paragraph" activeHighlightKey={activeHighlightKey} isBlock>
            {isEditable ? (
              <EditableField
                part={leadPart}
                value={displayLeadText} 
                onChange={(newText) => handlePartChange(leadPart.id, newText)}
                multiline
                className="font-merriweather text-sm text-neutral-800 text-justify !mb-1 leading-snug"
                ariaLabel="Edit lead paragraph"
              />
            ) : (
              <p className="font-merriweather text-sm text-neutral-800 text-justify !mb-1 leading-snug">
                <span className="font-playfair float-left text-5xl sm:text-6xl font-bold mr-1.5 !mt-0 leading-[0.85em] text-neutral-900">
                  {displayLeadText.trim().charAt(0)}
                </span>
                {displayLeadText.trim().substring(1)}
              </p>
            )}
          </HighlightWrapper>
        );
        break;
      case 'paragraph':
        const paragraphPart = part as ParagraphPart;
        currentTargetArray.push(
          isEditable ? (
            <EditableField
              key={part.id}
              part={paragraphPart}
              value={paragraphPart.text} 
              onChange={(newText) => handlePartChange(part.id, newText)}
              multiline
              className="!mb-1 font-merriweather text-sm text-neutral-800 text-justify leading-snug"
              ariaLabel="Edit paragraph"
            />
          ) : (
            <p key={part.id} className="!mb-1 font-merriweather text-sm text-neutral-800 text-justify leading-snug">{paragraphPart.text.trim()}</p>
          )
        );
        break;
      case 'subheading':
        currentTargetArray.push(
          <HighlightWrapper key={part.id} conventionKey="Subheadings" activeHighlightKey={activeHighlightKey} isBlock>
            {isEditable ? (
              <EditableField
                part={part}
                value={(part as SubheadingPart).text}
                onChange={(newText) => handlePartChange(part.id, newText)}
                className="font-oswald text-lg md:text-xl font-bold uppercase !mt-2.5 !mb-0.5 text-neutral-800 border-b border-neutral-500 pb-px tracking-wider"
                ariaLabel="Edit subheading"
              />
            ) : (
              <h2 className="font-oswald text-lg md:text-xl font-bold uppercase !mt-2.5 !mb-0.5 text-neutral-800 border-b border-neutral-500 pb-px tracking-wider">{(part as SubheadingPart).text}</h2>
            )}
          </HighlightWrapper>
        );
        break;
      case 'quote':
        const quotePart = part as QuotePart;
        currentTargetArray.push(
          <HighlightWrapper key={part.id} conventionKey="Quote" activeHighlightKey={activeHighlightKey} isBlock>
            <blockquote className="my-1.5 py-1.5 px-2.5 border-l-4 border-neutral-500 bg-neutral-100/70 italic shadow-sm">
              {isEditable ? (
                <>
                  <EditableField
                    part={quotePart}
                    value={quotePart.text} 
                    onChange={(newText) => handlePartChange(quotePart.id, newText, 'text')}
                    multiline
                    className="text-neutral-700 leading-snug font-merriweather text-sm"
                    placeholder="Quote text"
                    ariaLabel="Edit quote text"
                  />
                  <EditableField
                    part={quotePart}
                    value={quotePart.speaker} 
                    onChange={(newText) => handlePartChange(quotePart.id, newText, 'speaker')}
                    className="text-xs not-italic text-neutral-600 mt-0.5 text-right block font-oswald small-caps tracking-wide"
                    placeholder="Speaker"
                    ariaLabel="Edit quote speaker"
                  />
                </>
              ) : (
                <>
                  <p className="text-neutral-700 leading-snug font-merriweather text-sm">"{quotePart.text}"</p>
                  {quotePart.speaker && <footer className="text-xs not-italic text-neutral-600 mt-0.5 text-right block font-oswald small-caps tracking-wide">- {quotePart.speaker}</footer>}
                </>
              )}
            </blockquote>
          </HighlightWrapper>
        );
        break;
      case 'image':
        const imageP = part as ImagePart;
        currentTargetArray.push(
          <HighlightWrapper key={part.id} conventionKey="Visuals" activeHighlightKey={activeHighlightKey} isBlock>
            <figure className="my-1.5 clear-both"> 
              <img 
                src={imageP.imageUrl} 
                alt={imageP.altText || "Generated article image"} 
                className="w-full max-w-md mx-auto border border-neutral-400 shadow-sm filter grayscale contrast-125 brightness-100" 
              />
              {isEditable && approvedImage ? ( 
                <EditableField
                  part={imageP} 
                  value={imageP.caption}
                  onChange={(newCaptionValue) => {
                    const newInternalParts = internalParts.map(ip => 
                      ip.id === imageP.id && ip.type === 'image' ? { ...ip, caption: newCaptionValue } : ip
                    );
                    setInternalParts(newInternalParts as ArticlePart[]);
              
                    if (onImageCaptionChange && approvedImage.id) { 
                      onImageCaptionChange(approvedImage.id, newCaptionValue);
                    }
                  }}
                  multiline
                  className="text-xs text-center text-neutral-600 italic mt-0.25 px-2 w-full font-merriweather leading-snug"
                  placeholder="Image caption..."
                  ariaLabel="Edit image caption"
                />
              ) : (
                <figcaption className="text-xs text-center text-neutral-600 italic mt-0.25 px-2 font-merriweather leading-snug">
                  {imageP.caption}
                </figcaption>
              )}
            </figure>
          </HighlightWrapper>
        );
        break;
      case 'referenceHeader':
        inReferencesSection = true; 
        referenceSectionElements.push(
            <h2 key={part.id} className="font-oswald text-xl md:text-2xl font-bold uppercase !mt-3 !mb-1 text-neutral-800 border-b-2 border-neutral-600 pb-0.5 tracking-wide col-span-1 md:col-span-2">
              {(part as ReferenceHeaderPart).text}
            </h2>
        );
        break;
      case 'referenceItem':
         const referencePart = part as ReferenceItemPart;
         referenceSectionElements.push(
          isEditable ? (
            <EditableField
              key={part.id}
              part={referencePart}
              value={referencePart.text} 
              onChange={(newText) => handlePartChange(part.id, newText)}
              multiline
              className="!mb-1 font-merriweather text-sm text-neutral-800 text-justify leading-snug"
              ariaLabel="Edit reference item"
            />
          ) : (
            <p key={part.id} className="!mb-1 font-merriweather text-sm text-neutral-800 text-justify leading-snug">{referencePart.text.trim()}</p>
          )
        );
        break;
      case 'emptyLine':
        currentTargetArray.push(<div key={part.id} className="h-1 col-span-1 md:col-span-2">&nbsp;</div>); 
        break;
    }
  });

  const groupedBodyElements = bodyElements.length > 0 ? (
    <div className="md:columns-2 md:gap-x-3 lg:gap-x-3">
      {bodyElements.map((el, index) => (
        <div key={`body-item-${index}`} className="break-inside-avoid-column mb-1"> 
            {el}
        </div>
      ))}
    </div>
  ) : null;


  return (
    <div className="bg-white pt-2 sm:pt-3 md:pt-4 px-3 sm:px-4 md:px-5 border border-neutral-400 shadow-lg max-w-4xl mx-auto">
      <header className="mb-1">
        {headerElements}
      </header>
      
      {groupedBodyElements}

      {referenceSectionElements.length > 0 && (
        <footer className="mt-3 pt-2 border-t-2 border-neutral-500">
          {referenceSectionElements}
        </footer>
      )}
    </div>
  );
};

export default ArticleDisplay;
