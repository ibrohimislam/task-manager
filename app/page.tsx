'use client';

import { useState } from 'react';
import UploadForm from '@/components/UploadForm';
import ExecutionsList from '@/components/ExecutionsList';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSubmitSuccess = () => {
    // Trigger a refresh of the executions list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black py-8 px-4">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Task Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Submit jobs to n8n and track execution status
          </p>
        </div>
        
        <UploadForm onSubmitSuccess={handleSubmitSuccess} />
        <ExecutionsList refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
}
