import { BrowserRouter } from "react-router-dom";
import RoutesConfig from "./Routes";
import ErrorBoundary from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RoutesConfig />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
