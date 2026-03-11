'use client';

import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useAppConfig } from '@/components/AuthProvider';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Execution } from '@/lib/db';

interface ExecutionsListProps {
  refreshTrigger?: number;
}

export default function ExecutionsList({ refreshTrigger }: ExecutionsListProps) {
  const auth = useAuth();
  const { basePath } = useAppConfig();
  const [isPolling, setIsPolling] = useState(false);

  const executions = useLiveQuery(
    () => db.executions.orderBy('createdAt').reverse().toArray(),
    [refreshTrigger]
  );

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
        await Promise.all(
          runningExecutions.map(async (exec) => {
            try {
              const response = await fetch(`${basePath}/api/n8n/execution/${exec.executionId}`, {
                headers: {
                  Authorization: `Bearer ${auth.user?.access_token}`,
                },
              });
              
              if (response.ok) {
                const result = await response.json();
                
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

    pollExecutions();

    const interval = setInterval(pollExecutions, 5000);

    return () => clearInterval(interval);
  }, [executions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'waiting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  if (!executions) {
    return (
      <div className="w-full p-6 rounded-lg shadow-sm border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <p className="text-gray-500">Loading executions...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 rounded-lg shadow-sm border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Executions History
        </h2>
        {isPolling && (
          <span className="flex items-center text-sm text-blue-600">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Polling...
          </span>
        )}
      </div>

      {executions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No executions yet. Submit a file to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {execution.fileName}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
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
              <div className="flex items-center justify-between text-xs text-gray-500">
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
