import { Component, type ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#fff', minHeight: '100vh', color: '#1f2937' }}>
          <h2 style={{ color: '#dc2626', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>⚠️ เกิดข้อผิดพลาดในการโหลดแอป</h2>
          <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>รายละเอียดข้อผิดพลาด:</p>
          <pre style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', border: '1px solid #e5e7eb', color: '#b91c1c' }}>
            {this.state.error?.toString() || 'Unknown error'}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '16px', padding: '10px 18px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🔄 รีโหลดแอปใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

