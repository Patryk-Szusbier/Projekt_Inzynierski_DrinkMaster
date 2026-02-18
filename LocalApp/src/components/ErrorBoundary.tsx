import React from "react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("ErrorBoundary caught an error:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-linear-to-br from-back to-main text-contrast">
          <div className="max-w-lg text-center space-y-4 bg-back/80 border border-acent rounded-2xl p-6 shadow-xl">
            <div className="text-2xl font-semibold">Wystapil blad</div>
            <div className="text-sm text-contrast/80">
              Aplikacja napotkala nieoczekiwany problem. Sprobuj odswiezyc
              ekran.
            </div>
            <div className="flex justify-center">
              <Button className="bg-contrast" onClick={this.handleReload}>
                Odswiez
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
