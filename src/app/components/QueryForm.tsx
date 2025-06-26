import React from 'react';

interface QueryFormProps {
  query: string;
  setQuery: (query: string) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  publishYear: string;
  setPublishYear: (year: string) => void;
  journal: string;
  setJournal: (journal: string) => void;
  attributes: string;
  setAttributes: (attributes: string) => void;
  yearOptions: string[];
  journalOptions: string[];
  attributeOptions: string[];
  inputRef?: React.RefObject<HTMLInputElement>;
}

const infoIcon = (title: string) => (
  <span
    className="ml-1 text-gray-400 cursor-help align-middle"
    title={title}
    aria-label={title}
    tabIndex={0}
    role="img"
    style={{ fontSize: '1em' }}
  >
    ℹ️
  </span>
);

const QueryForm: React.FC<QueryFormProps> = ({ query, setQuery, handleSubmit, isLoading, publishYear, setPublishYear, journal, setJournal, attributes, setAttributes, yearOptions, journalOptions, attributeOptions, inputRef }) => {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask a research question..."
        value={query}
          onChange={e => setQuery(e.target.value)}
        disabled={isLoading}
        aria-label="Research question"
        ref={inputRef}
      />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2" disabled={isLoading} aria-label="Ask">
          {isLoading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-blue-400 rounded-full"></span> : null}
        {isLoading ? 'Searching...' : 'Ask'}
      </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <label className="flex items-center gap-1">
          <select className="border rounded px-2 py-1" value={publishYear} onChange={e => setPublishYear(e.target.value)} aria-label="Filter by year">
            <option value="">Year</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {infoIcon('Filter results by publication year.')}
        </label>
        <label className="flex items-center gap-1">
          <select className="border rounded px-2 py-1" value={journal} onChange={e => setJournal(e.target.value)} aria-label="Filter by journal">
            <option value="">Journal</option>
            {journalOptions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          {infoIcon('Filter results by journal name.')}
        </label>
        <label className="flex items-center gap-1">
          <select className="border rounded px-2 py-1" value={attributes} onChange={e => setAttributes(e.target.value)} aria-label="Filter by attribute">
            <option value="">Attribute</option>
            {attributeOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {infoIcon('Filter results by document attribute (e.g., topic, method, etc.).')}
        </label>
      </div>
    </form>
  );
};

export default QueryForm;
