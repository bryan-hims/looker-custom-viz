import React, { KeyboardEvent } from 'react';
import { CollapsibleHeaderProps } from '../types/visualization';

/**
 * A reusable collapsible header component that can wrap any visualization content.
 * Provides expand/collapse functionality with configurable title and subtitle styling.
 */
export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  isLoading,
  isExpanded,
  setIsExpanded,
  enableExpandCollapse,
  chartTitle,
  subtitle,
  titleAlignment,
  titleSize,
  titleWeight,
  titleColor,
  titlePadding,
  subtitlePosition,
  subtitleSize,
  subtitleColor,
  subtitleWeight,
  children
}) => {
  // Handle keyboard interactions for accessibility
  const handleHeaderKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isLoading && enableExpandCollapse) {
        setIsExpanded(!isExpanded);
      }
    }
  };

  // Handle click events for the header
  const handleClick = () => {
    if (!isLoading && enableExpandCollapse) {
      setIsExpanded(!isExpanded);
    }
  };

  // Generate title classes based on configuration
  const getTitleClasses = () => {
    const classes = ['transition-all duration-200'];
    classes.push(`text-${titleAlignment}`);
    classes.push(`py-${titlePadding === 'compact' ? '2' : titlePadding === 'relaxed' ? '4' : '3'}`);
    return classes.join(' ');
  };

  // Generate title styles based on configuration
  const getTitleStyles = () => ({
    fontSize: `${titleSize}px`,
    fontWeight: titleWeight,
    color: titleColor,
  });

  // Generate subtitle styles based on configuration
  const getSubtitleStyles = () => ({
    fontSize: `${subtitleSize}px`,
    fontWeight: subtitleWeight,
    color: subtitleColor,
  });

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header section */}
      <div 
        onClick={handleClick}
        onKeyDown={handleHeaderKeyDown}
        className={`bg-gray-50 px-6 rounded-t-lg transition-colors duration-200 flex items-center justify-between border-b border-gray-200 ${
          isLoading ? 'opacity-50' : enableExpandCollapse ? 'cursor-pointer hover:bg-gray-100' : ''
        }`}
        role={enableExpandCollapse ? "button" : "banner"}
        tabIndex={!enableExpandCollapse || isLoading ? -1 : 0}
        aria-expanded={enableExpandCollapse ? isExpanded : undefined}
        aria-controls={enableExpandCollapse ? "collapsible-content" : undefined}
      >
        <div className={`${getTitleClasses()} flex-grow`}>
          <div className={`flex ${subtitlePosition === 'below' ? 'flex-col' : 'flex-row items-center'} ${
            titleAlignment === 'center' ? 'justify-center' : 
            titleAlignment === 'right' ? 'justify-end' : 'justify-start'
          }`}>
            <div style={getTitleStyles()}>
              {chartTitle || ''}
            </div>
            {subtitle && (
              <div 
                className={subtitlePosition === 'right' ? 'ml-4' : 'mt-2'}
                style={getSubtitleStyles()}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {/* Expand/collapse icon */}
        {enableExpandCollapse && (
          <svg 
            className={`w-5 h-5 transform transition-transform duration-200 text-gray-500 ml-4 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Content section */}
      {(isExpanded || !enableExpandCollapse) && (
        <div id="collapsible-content" className="px-3 py-2">
          {children}
        </div>
      )}
    </div>
  );
};
