import React from 'react';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white p-10 rounded-[32px] shadow-xl border border-rose-100 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-xl font-black text-rose-900 uppercase tracking-tight mb-2">Portal Error</h2>
            <p className="text-sm text-slate-500 mb-6">Something went wrong while rendering this page. This is usually caused by a missing configuration or corrupted data.</p>
            <div className="text-[10px] bg-slate-50 p-4 rounded-xl text-left font-mono text-slate-400 overflow-auto max-h-[150px] mb-8">
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.href = '#/'}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
