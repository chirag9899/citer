"use client";
import React, { useState, useRef } from 'react';
import apiService from '@/lib/ApiService';

interface UploadFormProps {
  onUploadSuccess: (message: string) => void;
  onUploadError: (error: string) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess, onUploadError }) => {
  const [state, setState] = useState({
    isUploading: false,
    dragActive: false,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      onUploadError('Please upload a JSON file containing document chunks.');
      return;
    }

    setState((s) => ({ ...s, isUploading: true }));

    try {
      // Read file content
      const fileContent = await file.text();
      const chunks = JSON.parse(fileContent);

      // Validate it's an array
      if (!Array.isArray(chunks)) {
        throw new Error('File must contain an array of document chunks.');
      }

      // Upload to backend
      const response = await apiService.uploadChunks(chunks) as { chunks_added?: number; skipped_ids?: string[] };
      const skipped = Array.isArray(response.skipped_ids) ? response.skipped_ids : [];
      onUploadSuccess(
        `Added: ${response.chunks_added || 0}, Skipped: ${skipped.length}`
      );
      // Reset file input value after successful upload
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      onUploadError(errorMessage);
    } finally {
      setState((s) => ({ ...s, isUploading: false }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setState((s) => ({ ...s, dragActive: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
      // File input reset handled in handleFileUpload
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setState((s) => ({ ...s, dragActive: true }));
    } else if (e.type === "dragleave") {
      setState((s) => ({ ...s, dragActive: false }));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
      // File input reset handled in handleFileUpload
    }
  };

  return (
    <div className="bg-gradient-to-br from-sky-50 to-white p-8 rounded-2xl shadow-xl border border-gray-200 max-w-xl mx-auto animate-fadeIn">
      <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <svg className="h-7 w-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload Document Chunks
      </h3>
      <p className="text-gray-600 mb-6 text-sm">Upload a JSON file containing your document chunks for analysis. Drag & drop or click below.</p>
      <div
        className={`relative flex flex-col items-center justify-center border-4 border-dashed rounded-xl transition-all duration-300 cursor-pointer w-full min-h-[180px] mb-4 ${
          state.dragActive
            ? 'border-sky-400 bg-sky-50 shadow-lg scale-105'
            : 'border-gray-300 bg-white hover:bg-sky-50 hover:border-sky-400'
        } ${state.isUploading ? 'opacity-60 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        tabIndex={0}
        aria-label="Upload document chunks by dropping or clicking"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileInput}
          disabled={state.isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Upload JSON file"
        />
        {state.isUploading ? (
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <svg className="animate-spin h-10 w-10 text-sky-600 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sky-700 font-medium">Uploading and processing chunks...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <svg className="h-10 w-10 text-sky-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-8m0 0l-3 3m3-3l3 3" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-md text-gray-700 font-medium">Drop JSON file here or <span className="text-sky-600 underline">click to browse</span></span>
            <span className="text-xs text-gray-500">Only .json files are accepted</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 mb-4">
        <div className="text-xs text-gray-500">
          <strong>Expected format:</strong> Array of objects with fields:<br />
          <span className="font-mono text-[11px]">source_doc_id, section_heading, journal, publish_year, text, link</span>
        </div>
        <a
          href="/sample_diverse_chunks.json"
          download
          className="text-sky-600 text-xs underline hover:text-sky-800 ml-2"
        >
          Download sample
        </a>
      </div>
      <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 font-mono mb-2 border border-gray-100">
        [
        {'{'}&quot;source_doc_id&quot;: &quot;doc1.pdf&quot;, &quot;section_heading&quot;: &quot;Intro&quot;, &quot;journal&quot;: &quot;Nature&quot;, &quot;publish_year&quot;: 2022, &quot;text&quot;: &quot;...&quot;, &quot;link&quot;: &quot;https://...&quot;{'}'},<br />
        {'{'}...{'}'}<br />
        ]
      </div>
    </div>
  );
};

export default UploadForm; 