
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Uygulama genelinde oluşabilecek render hatalarını yakalayan ve kullanıcıya dostça bir arayüz sunan bileşen.
 */
export class ErrorBoundary extends Component<Props, State> {
  // Use class property for state initialization to avoid potential 'this' context issues in constructor
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Kritik Uygulama Hatası:", error, errorInfo);
    // Properly access inherited setState
    this.setState({ errorInfo });
  }

  public render() {
    // Correctly accessing state inherited from Component
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-100 p-6 rounded-full mb-6">
            <AlertTriangle size={48} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Sistem Bir Hata İle Karşılaştı</h1>
          <p className="text-slate-600 mb-6 font-medium">Uygulama yüklenirken teknik bir sorun oluştu. Verileriniz güvendedir.</p>
          
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100 text-left max-w-2xl w-full overflow-auto max-h-96">
            <p className="font-mono text-red-600 font-bold mb-3 pb-2 border-b border-red-50">
              {error && error.toString()}
            </p>
            <details className="text-xs text-slate-400 font-mono whitespace-pre-wrap mt-2">
              <summary className="cursor-pointer mb-2 hover:text-slate-600 font-bold uppercase tracking-widest">Hata Detaylarını Gör</summary>
              {errorInfo && errorInfo.componentStack}
            </details>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            Sistemi Yeniden Başlat
          </button>
        </div>
      );
    }

    // Correctly accessing props inherited from Component
    return this.props.children;
  }
}
