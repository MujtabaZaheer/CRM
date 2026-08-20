import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("EduCRM Uncaught React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          backgroundColor: "#09090b",
          color: "#f4f4f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "sans-serif"
        }}>
          <div style={{
            maxWidth: "500px",
            width: "100%",
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "rgba(244, 63, 94, 0.1)",
              color: "#fb7185",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              fontSize: "24px",
              fontWeight: "bold"
            }}>!</div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>Platform Startup Error</h2>
            <p style={{ color: "#a1a1aa", fontSize: "14px", marginBottom: "16px" }}>
              {this.state.error?.message || "An unexpected error occurred while initializing EduCRM."}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              style={{
                backgroundColor: "#10b981",
                color: "#09090b",
                fontWeight: "bold",
                padding: "10px 20px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Clear Cache & Go to Sign In
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

