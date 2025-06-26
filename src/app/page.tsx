"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '@/lib/ApiService';
import { Citation, ChartDataPoint, SimilaritySearchResult } from '@/lib/types';
import QueryForm from './components/QueryForm';
import ResultsDisplay from './components/ResultsDisplay';
import CitationsChart from './components/CitationsChart';
import UploadForm from './components/UploadForm';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import toast, { Toaster } from 'react-hot-toast';
import Logo from './components/Logo';

const exampleQuestions = [
  {
    group: 'Velvet Bean (Mucuna) Chunks',
    questions: [
      'What are the main uses of the velvet bean in agriculture?',
      'How does the velvet bean improve soil fertility?',
      'What are the recommended conditions for planting velvet bean?',
      'Describe the process of harvesting and conserving velvet bean seeds.',
      'What are the common pests and diseases affecting velvet bean, and how can they be managed?',
      'How should velvet bean be intercropped with maize or sorghum?',
      'What is the typical protein content of mucuna seeds?',
      'What fertilizer and lime recommendations are given for optimal velvet bean growth?',
      'How does velvet bean adapt to different soil and climate conditions?',
      'What are the benefits of using velvet bean as a cover crop?'
    ]
  },
  {
    group: 'Transformer (AI Paper) Chunks',
    questions: [
      'What is the main innovation introduced by the Transformer model compared to previous neural network architectures?',
      'How does the Transformer model differ from RNNs in terms of sequence modeling?',
      'What are the advantages of attention mechanisms in sequence transduction tasks?',
      'Summarize the results achieved by the Transformer model on machine translation tasks.',
      'What are the limitations of convolutional sequence models compared to the Transformer?',
      'How does the Transformer enable more parallelization during training?',
      'What is the significance of multi-head attention in the Transformer architecture?',
      'How does the Transformer handle long-range dependencies in input sequences?',
      'What are the main challenges with sequential computation in RNNs?',
      'What are some other models mentioned that aim to reduce sequential computation, and how do they compare to the Transformer?'
    ]
  },
  {
    group: 'General/Comparative',
    questions: [
      'Compare the use of attention mechanisms in the Transformer model to their use in RNNs.',
      'Why is the velvet bean considered a valuable crop for semi-arid regions?',
      'What are the key differences between the agricultural and AI research articles in this dataset?'
    ]
  }
];

const accentColor = '#FF6A00';

const Home: React.FC = () => {
  const [mainState, setMainState] = useState({
    query: '',
    answer: '',
    citations: [] as Citation[],
    selectedChunkIds: [] as string[],
    summaryResult: '',
    compareResult: '',
  });

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    filtersLoading: true,
    summaryLoading: false,
    compareLoading: false,
  });

  const [errorState, setErrorState] = useState({
    error: '',
    uploadError: '',
    summaryError: '',
    compareError: '',
  });

  const [filterState, setFilterState] = useState({
    publishYear: '',
    journal: '',
    attributes: '',
    yearOptions: [] as string[],
    journalOptions: [] as string[],
    attributeOptions: [] as string[],
  });

  const [uploadMessage, setUploadMessage] = useState<string>('');

  const [showExamplesModal, setShowExamplesModal] = useState(false);

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchFilterOptions() {
      setLoadingState(prev => ({ ...prev, filtersLoading: true }));
      try {
        const [years, journals, attrs] = await Promise.all([
          apiService.getAllYears(),
          apiService.getAllJournals(),
          apiService.getAllAttributes()
        ]);
        setFilterState(prev => ({ ...prev, yearOptions: years, journalOptions: journals, attributeOptions: attrs }));
      } catch {
        setFilterState(prev => ({ ...prev, yearOptions: [], journalOptions: [], attributeOptions: [] }));
      } finally {
        setLoadingState(prev => ({ ...prev, filtersLoading: false }));
      }
    }
    fetchFilterOptions();
  }, [uploadMessage]);

  // Clear upload messages after 5 seconds
  useEffect(() => {
    if (uploadMessage || errorState.uploadError) {
      const timer = setTimeout(() => {
        setUploadMessage('');
        setErrorState(prev => ({ ...prev, uploadError: '' }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadMessage, errorState.uploadError]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mainState.query.trim()) {
      setErrorState(prev => ({ ...prev, error: "Please enter a question." }));
      return;
    }

    setLoadingState(prev => ({ ...prev, isLoading: true }));
    setErrorState(prev => ({ ...prev, error: '' }));
    setMainState(prev => ({ ...prev, answer: '', citations: [] }));

    try {
      // 1. Get similar chunks using vector search API with filters
      const filterPayload: Record<string, unknown> = {
        query: mainState.query,
        k: 10,
        min_score: 0.0
      };
      if (filterState.publishYear && filterState.publishYear.trim()) filterPayload.publish_year = filterState.publishYear;
      if (filterState.journal && filterState.journal.trim()) filterPayload.journal = filterState.journal;
      if (filterState.attributes && filterState.attributes.trim()) {
        const attributeList = filterState.attributes.split(',').map(a => a.trim()).filter(Boolean);
        if (attributeList.length > 0) filterPayload.attributes = attributeList;
      }

      const responseSearch = await fetch('/api/similarity_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterPayload)
      });
      const searchData = await responseSearch.json();
      const contextChunks: SimilaritySearchResult[] = searchData.results || [];
      
      if (contextChunks.length === 0) {
        setErrorState(prev => ({ ...prev, error: "Couldn't find any relevant documents to answer that question based on your query and filters." }));
        setMainState(prev => ({ ...prev, answer: "I'm sorry, but I couldn't find any relevant information in the knowledge base to answer your question. Please try rephrasing or adjusting your filters." }));
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // 2. Get LLM answer via API route (server-side)
      const response = await fetch('/api/llm_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: mainState.query, contextChunks })
      });
      if (!response.ok) {
        throw new Error('Failed to get LLM answer from server.');
      }
      const data = await response.json();
      setMainState(prev => ({ ...prev, answer: data.answer }));

      // 3. Set citations and update chartData for the last answer only
      const newCitations = contextChunks.map(chunk => chunk.metadata);
      setMainState(prev => ({ ...prev, citations: newCitations }));

      // Only show chartData if the answer is not a fallback
      const isNoInfo = (data.answer || '').trim().toLowerCase().includes('no relevant information found in the provided context');
      if (isNoInfo) {
        setChartData([]);
      } else {
        const docCounts: Record<string, number> = {};
        newCitations.forEach(citation => {
          const docId = citation.source_doc_id;
          if (typeof docId === 'string' && docId.trim()) {
            docCounts[docId] = (docCounts[docId] || 0) + 1;
          }
        });
        setChartData(
          Object.entries(docCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
        );
      }

    } catch (err) {
      console.error("Error during handleSubmit:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setErrorState(prev => ({ ...prev, error: errorMessage }));
      if (mainState.answer === '') {
        setMainState(prev => ({ ...prev, answer: "I encountered an issue while trying to generate an answer. Please check the error message or try again later." }));
      }
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [mainState.query, filterState.publishYear, filterState.journal, filterState.attributes, mainState.answer, setErrorState, setLoadingState, setMainState]);

  const handleUploadSuccess = (message: string) => {
    setUploadMessage(message);
    setErrorState(prev => ({ ...prev, uploadError: '' }));
    toast.success(message);
  };

  const handleUploadError = (error: string) => {
    setErrorState(prev => ({ ...prev, uploadError: error }));
    setUploadMessage('');
    toast.error(error);
  };

  const handleCitationSelect = (id: string, checked: boolean) => {
    setMainState(prev => ({
      ...prev,
      selectedChunkIds: checked ? [...prev.selectedChunkIds, id] : prev.selectedChunkIds.filter(cid => cid !== id)
    }));
  };

  const handleSummary = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    setLoadingState(prev => ({ ...prev, summaryLoading: true }));
    setErrorState(prev => ({ ...prev, summaryError: '' }));
    setMainState(prev => ({ ...prev, summaryResult: '' }));
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkIds: mainState.selectedChunkIds })
      });
      const data: { summary: string } = await res.json();
      if (!res.ok) throw new Error(data.summary || 'Failed to get summary');
      setMainState(prev => ({ ...prev, summaryResult: data.summary }));
      toast.success('Summary generated!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get summary';
      setErrorState(prev => ({ ...prev, summaryError: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setLoadingState(prev => ({ ...prev, summaryLoading: false }));
    }
  };

  const handleCompare = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    setLoadingState(prev => ({ ...prev, compareLoading: true }));
    setErrorState(prev => ({ ...prev, compareError: '' }));
    setMainState(prev => ({ ...prev, compareResult: '' }));
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkIdsA: [mainState.selectedChunkIds[0]], chunkIdsB: [mainState.selectedChunkIds[1]] })
      });
      const data: { comparison: string } = await res.json();
      if (!res.ok) throw new Error(data.comparison || 'Failed to get comparison');
      setMainState(prev => ({ ...prev, compareResult: data.comparison }));
      toast.success('Comparison generated!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get comparison';
      setErrorState(prev => ({ ...prev, compareError: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setLoadingState(prev => ({ ...prev, compareLoading: false }));
    }
  };

  const showMoreExamples = () => {
    setShowExamplesModal(true);
  };

  const closeExamplesModal = () => {
    setShowExamplesModal(false);
  };

  // Helper: handle clicking an example question
  const handleExampleClick = (q: string) => {
    setMainState(prev => ({ ...prev, query: q }));
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-orange-50 to-sky-100 text-gray-800 font-sans">
      <Toaster position="top-right" />
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white shadow-lg pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col items-center">
          <span className="inline-block align-middle mb-2">
            <Logo />
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-center mb-2">CITER: GenAI Research Assistant</h1>
          <p className="text-lg text-gray-200 text-center max-w-2xl mb-6">Upload your research data, ask questions, and get instant, cited answers powered by AI. Perfect for literature review, research, and knowledge discovery.</p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
            <button
              className="bg-[var(--accentColor,#FF6A00)] hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow transition text-lg"
              style={{ background: accentColor }}
              onClick={() => {
                if (inputRef.current) inputRef.current.focus();
                window.scrollTo({ top: 320, behavior: 'smooth' });
              }}
            >
              Get Started
            </button>
            <a
              href="#how-it-works"
              className="text-orange-200 hover:text-white underline text-lg font-medium"
            >
              How it works
            </a>
          </div>
          {/* Onboarding Steps */}
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center mt-2">
            <div className="flex flex-col items-center">
              <div className="bg-white/10 rounded-full p-3 mb-2"><span className="text-2xl">📤</span></div>
              <span className="text-sm text-gray-200">1. Upload Data</span>
            </div>
            <div className="h-8 w-1 border-l-2 border-orange-400 hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <div className="bg-white/10 rounded-full p-3 mb-2"><span className="text-2xl">💬</span></div>
              <span className="text-sm text-gray-200">2. Ask a Question</span>
            </div>
            <div className="h-8 w-1 border-l-2 border-orange-400 hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <div className="bg-white/10 rounded-full p-3 mb-2"><span className="text-2xl">📊</span></div>
              <span className="text-sm text-gray-200">3. Analyze Results</span>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 bg-white/90 p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-200">
            <QueryForm 
              query={mainState.query}
              setQuery={(value) => setMainState(prev => ({ ...prev, query: value }))}
              handleSubmit={handleSubmit}
              isLoading={loadingState.isLoading}
              publishYear={filterState.publishYear}
              setPublishYear={(value) => setFilterState(prev => ({ ...prev, publishYear: value }))}
              journal={filterState.journal}
              setJournal={(value) => setFilterState(prev => ({ ...prev, journal: value }))}
              attributes={filterState.attributes}
              setAttributes={(value) => setFilterState(prev => ({ ...prev, attributes: value }))}
              yearOptions={filterState.yearOptions}
              journalOptions={filterState.journalOptions}
              attributeOptions={filterState.attributeOptions}
              inputRef={inputRef as React.RefObject<HTMLInputElement>}
            />
            {loadingState.filtersLoading && <div className="text-blue-500 text-sm mb-2">Loading filter options...</div>}
            <ErrorMessage message={errorState.error} />
            {loadingState.isLoading && <Loader />}
            {!loadingState.isLoading && mainState.answer && (
              <ResultsDisplay 
                answer={mainState.answer} 
                citations={mainState.citations} 
                onSelect={handleCitationSelect} 
                selectedChunkIds={mainState.selectedChunkIds} 
              />
            )}
            {mainState.citations.length > 0 && (
              <div className="mt-8 flex flex-col gap-4">
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 active:bg-sky-800 transition disabled:opacity-50" 
                    onClick={handleSummary} 
                    disabled={loadingState.summaryLoading || mainState.selectedChunkIds.length === 0}
                  >
                    {loadingState.summaryLoading ? 'Summarizing...' : 'Summarize Selected'}
                  </button>
                  <button 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-50" 
                    onClick={handleCompare} 
                    disabled={loadingState.compareLoading || mainState.selectedChunkIds.length < 2}
                  >
                    {loadingState.compareLoading ? 'Comparing...' : 'Compare First 2 Selected'}
                  </button>
                </div>
                {errorState.summaryError && <div className="text-red-600 text-sm">{errorState.summaryError}</div>}
                {mainState.summaryResult && <div className="bg-slate-50 p-4 rounded shadow text-gray-800"><strong>Summary:</strong><br />{mainState.summaryResult}</div>}
                {errorState.compareError && <div className="text-red-600 text-sm">{errorState.compareError}</div>}
                {mainState.compareResult && <div className="bg-slate-50 p-4 rounded shadow text-gray-800"><strong>Comparison:</strong><br />{mainState.compareResult}</div>}
              </div>
            )}
            {/* Interactive Example Questions */}
            {!loadingState.isLoading && !mainState.answer && !errorState.error && (
              <div className="text-center py-10 text-gray-500">
                <p className="text-lg">Ask a question to get started!</p>
                <div className="flex flex-wrap gap-2 justify-center mt-3 mb-2">
                  {exampleQuestions.flatMap(g => g.questions.slice(0, 2)).slice(0, 6).map((q, i) => (
                    <button
                      key={i}
                      className="bg-sky-50 hover:bg-orange-100 border border-orange-200 text-gray-800 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-colors"
                      onClick={() => handleExampleClick(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <button className="text-sky-600 underline text-xs mt-1" onClick={showMoreExamples}>See more examples</button>
                {showExamplesModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative border border-gray-200 animate-scaleIn">
                      <button
                        className="absolute top-4 right-4 text-gray-400 hover:text-sky-600 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-full transition-colors"
                        onClick={closeExamplesModal}
                        aria-label="Close"
                        tabIndex={0}
                      >
                        <span aria-hidden="true">&times;</span>
                      </button>
                      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center tracking-tight">Example Questions</h2>
                      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
                        {exampleQuestions.map((group) => (
                          <div key={group.group}>
                            <h3 className="text-base font-semibold text-sky-700 mb-2 tracking-wide uppercase opacity-80 pl-1">{group.group}</h3>
                            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-2">
                              {group.questions.map((q, i) => (
                                <li
                                  key={i}
                                  className="bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-lg px-4 py-2 text-gray-800 text-[15px] transition-colors cursor-pointer select-text shadow-sm"
                                  tabIndex={0}
                                  onClick={() => handleExampleClick(q)}
                                >
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-8">
            <CitationsChart chartData={chartData} />
            <UploadForm 
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        </div>
      </main>

      {/* How it works section */}
      <section id="how-it-works" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-8">
        <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-200 p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">How CITER Works</h2>
          <ol className="list-decimal list-inside text-gray-700 text-lg space-y-2">
            <li><span className="font-semibold text-[var(--accentColor,#FF6A00)]" style={{ color: accentColor }}>Upload</span> your research data (JSON chunks) using the upload panel.</li>
            <li><span className="font-semibold text-[var(--accentColor,#FF6A00)]" style={{ color: accentColor }}>Ask</span> a research question in natural language.</li>
            <li><span className="font-semibold text-[var(--accentColor,#FF6A00)]" style={{ color: accentColor }}>Analyze</span> the AI-generated answer, citations, and charts. Download or compare results as needed.</li>
          </ol>
        </div>
      </section>

      <footer className="text-center py-8 mt-12 border-t border-slate-300 bg-white/80">
        <div className="max-w-2xl mx-auto">
          <p className="text-md text-slate-700 mb-2">CITER helps you discover, summarize, and compare research findings with AI-powered answers and real citations.</p>
          <p className="text-xs text-slate-500">GenAI Research Assistant &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
