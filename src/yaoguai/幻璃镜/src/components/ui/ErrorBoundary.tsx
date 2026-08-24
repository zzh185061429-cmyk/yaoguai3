import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertOctagon } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[幻璃镜] 捕获运行时错误:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-[#0e0b08] text-paper-100 flex flex-col items-center justify-center p-6 select-none font-serif">
          <div className="max-w-md w-full bg-[#181410] border border-[#6b583e] p-8 rounded-xs shadow-2xl text-center flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#26100c] border border-vermilion-700 flex items-center justify-center text-vermilion-400">
              <AlertOctagon size={28} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-[0.2em] text-paper-50">灵 境 偶 滞 · 卷 宗 稍 歇</h2>
              <p className="text-xs text-paper-400 leading-relaxed">
                幻璃镜运转中遇偶发灵力扰动，已安全固化当前状态。点击下方令印即可重新唤醒幻境。
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="mt-2 px-6 py-2.5 bg-vermilion-700 hover:bg-vermilion-600 border border-vermilion-400 text-white text-xs tracking-[0.3em] font-bold rounded-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <RefreshCw size={14} />
              <span>重 启 幻 境</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
