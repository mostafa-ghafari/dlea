import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="dark flex min-h-[400px] items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h2 className="mt-5 text-xl font-bold">مشکلی پیش آمد</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              بخشی از صفحه به درستی بارگذاری نشد. می‌توانید دوباره تلاش کنید.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={this.reset}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                تلاش دوباره
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                بازگشت به خانه
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
