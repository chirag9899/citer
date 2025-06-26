import React from 'react';
import { Citation } from '@/lib/types';

interface ResultsDisplayProps {
  answer: string;
  citations: Citation[];
  onSelect?: (id: string, checked: boolean) => void;
  selectedChunkIds?: string[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ answer, citations, onSelect, selectedChunkIds = [] }) => {
  if (!answer) return null;

  // Only show citations if the answer is not a fallback/no-info message
  const isNoInfo = answer.trim().toLowerCase().includes('no relevant information found in the provided context');

  return (
    <div className="mt-6 animate-fadeIn">
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Answer</h2>
      <div className="bg-slate-50 p-4 rounded-lg shadow whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
        {answer}
      </div>

      {citations.length > 0 && !isNoInfo && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Citations</h3>
          <ul className="space-y-3">
            {citations.map((citation, index) => (
              <li key={citation.id || index} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-4">
                {onSelect && (
                  <input
                    type="checkbox"
                    checked={selectedChunkIds.includes(citation.id || '')}
                    onChange={e => onSelect(citation.id || '', e.target.checked)}
                    title="Select for summary/compare"
                    className="mr-2"
                  />
                )}
                <div className="flex-1">
                <p className="font-medium text-gray-700">
                  <strong>Source Document:</strong> {citation.source_doc_id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Section:</strong> {citation.section_heading}
                </p>
                {citation.journal && <p className="text-sm text-gray-500"><strong>Journal:</strong> {citation.journal}</p>}
                {citation.publish_year && <p className="text-sm text-gray-500"><strong>Year:</strong> {citation.publish_year}</p>}
                <a 
                  href={citation.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-sky-600 hover:text-sky-700 hover:underline mt-1 inline-block"
                >
                  Read Content &rarr;
                </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
