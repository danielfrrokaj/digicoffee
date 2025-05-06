import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

// Create a client and configure default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable refetching on window focus globally
      refetchOnWindowFocus: false, 
      // You might also want to adjust staleTime if needed
      // staleTime: 1000 * 60 * 5, // Example: Data considered fresh for 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
