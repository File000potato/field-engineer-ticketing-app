import React from 'react';
import AppRouter from '@/components/AppRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import OfflineQueueProvider from '@/components/OfflineQueueProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineQueueProvider>
        <AppRouter />
        <Toaster />
      </OfflineQueueProvider>
    </QueryClientProvider>
  );
}

export default App;
