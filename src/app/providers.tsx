import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './queryClient';
import { AuthProvider } from './auth';
import { ProjectProvider } from './project';
import { DataProvider } from './data';
import { ToastProvider } from './toast';

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <DataProvider>{children}</DataProvider>
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
