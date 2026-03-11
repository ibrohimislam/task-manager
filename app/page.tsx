'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import UploadForm from '@/components/UploadForm';
import ExecutionsList from '@/components/ExecutionsList';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSubmitSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AuthGuard>
      <div className="app-shell">
        <Navbar />
        <main className="app-content">
          <div className="content-container">
            <UploadForm onSubmitSuccess={handleSubmitSuccess} />
            <ExecutionsList refreshTrigger={refreshTrigger} />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
