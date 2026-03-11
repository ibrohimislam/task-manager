'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Execution } from '@/lib/db';

interface ExecutionsListProps {
  refreshTrigger?: number;
}

export default function ExecutionsList({ refreshTrigger }: ExecutionsListProps) {
  const [isPolling, setIsPolling] = useState(false);

  // Query all executions from IndexedDB, sorted by newest first
  const executions = useLiveQuery(
    () => db.executions.orderBy('createdAt').reverse().toArray(),
    [refreshTrigger]
  );

  // Auto-polling for running executions
  useEffect(() => {
    const pollExecutions = async () => {
      if (!executions) return;

      const runningExecutions = executions.filter(
        (exec) => exec.status === 'running' || exec.status === 'waiting'
      );

      if (runningExecutions.length === 0) {
        setIsPolling(false);
        return;
      }

      setIsPolling(true);

      try {
        // Check status for all running executions
        await Promise.all(
          runningExecutions.map(async (exec) => {
            try {
              const response = await fetch(`/api/n8n/execution/${exec.executionId}`);
              
              if (response.ok) {
                const result = await response.json();
                
                // Update in IndexedDB if status changed
                if (result.status !== exec.status) {
                  await db.executions.update(exec.id!, {
                    status: result.status,
                    updatedAt: new Date(),
                  });
                }
              }
            } catch (error) {
              console.error(`Error polling execution ${exec.executionId}:`, error);
            }
          })
        );
      } finally {
        setIsPolling(false);
      }
    };

    // Poll immediately on mount or when executions change
    pollExecutions();

    // Set up fixed interval for polling (every 5 seconds)
    const interval = setInterval(pollExecutions, 5000);

    return () => clearInterval(interval);
  }, [executions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'running':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'waiting':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  if (!executions) {
    return (
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
        <p className="text-gray-600 dark:text-gray-400">Loading executions...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Executions History
        </h2>
        {isPolling && (
          <span className="flex items-center text-sm text-blue-600 dark:text-blue-400">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Polling...
          </span>
        )}
      </div>

      {executions.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No executions yet. Submit a file to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {execution.fileName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    ID: {execution.executionId}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                    execution.status
                  )}`}
                >
                  {execution.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Submitted: {formatDate(execution.createdAt)}</span>
                <span>Updated: {formatDate(execution.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


