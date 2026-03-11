'use client';

import { useState } from 'react';
import { db } from '@/lib/db';

interface UploadFormProps {
  onSubmitSuccess?: () => void;
}

export default function UploadForm({ onSubmitSuccess }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [progress, setProgress] = useState<{ fileName: string; status: 'pending' | 'uploading' | 'success' | 'error'; message?: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setMessage(null);
      setProgress([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one file' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // Initialize progress tracking
    const initialProgress = files.map(file => ({
      fileName: file.name,
      status: 'pending' as const,
    }));
    setProgress(initialProgress);

    let successCount = 0;
    let errorCount = 0;

    try {
      // Submit files sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update status to uploading
        setProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'uploading' } : p
        ));

        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/n8n/submit', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to submit');
          }

          // Save to IndexedDB
          await db.executions.add({
            executionId: result.executionId,
            fileName: result.fileName,
            status: 'running',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Update status to success
          setProgress(prev => prev.map((p, idx) => 
            idx === i ? { ...p, status: 'success', message: `Execution ID: ${result.executionId}` } : p
          ));
          
          successCount++;
        } catch (error) {
          // Update status to error
          setProgress(prev => prev.map((p, idx) => 
            idx === i ? { 
              ...p, 
              status: 'error', 
              message: error instanceof Error ? error.message : 'Failed to submit'
            } : p
          ));
          
          errorCount++;
        }
      }

      // Show summary message
      if (errorCount === 0) {
        setMessage({ type: 'success', text: `All ${successCount} file(s) submitted successfully!` });
      } else if (successCount === 0) {
        setMessage({ type: 'error', text: `Failed to submit all ${errorCount} file(s)` });
      } else {
        setMessage({ type: 'success', text: `Submitted ${successCount} file(s) successfully, ${errorCount} failed` });
      }
      
      // Reset file input
      setFiles([]);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Notify parent component
      if (successCount > 0) {
        onSubmitSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Submit Job to n8n</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="file-input" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Select Files
          </label>
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={isSubmitting}
            className="block w-full text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-zinc-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed p-2"
          />
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected {files.length} file(s):
              </p>
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={files.length === 0 || isSubmitting}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Submitting...' : `Submit ${files.length > 0 ? `(${files.length})` : ''}`}
        </button>
      </form>

      {progress.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Progress:</p>
          <ul className="space-y-2">
            {progress.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5">
                  {item.status === 'pending' && (
                    <span className="inline-block w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full"></span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                  )}
                  {item.status === 'success' && (
                    <span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 rounded-full text-white text-xs">✓</span>
                  )}
                  {item.status === 'error' && (
                    <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-white text-xs">✕</span>
                  )}
                </span>
                <div className="flex-1">
                  <p className={`${
                    item.status === 'success' ? 'text-green-700 dark:text-green-400' :
                    item.status === 'error' ? 'text-red-700 dark:text-red-400' :
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.fileName}
                  </p>
                  {item.message && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.message}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  );
}
























