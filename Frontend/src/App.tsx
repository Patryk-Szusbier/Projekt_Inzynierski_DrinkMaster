import { BrowserRouter } from "react-router-dom";
import RoutesConfig from "./Routes";

function App() {
  return (
    <BrowserRouter>
      <div className="relative w-[800px] h-[480px] text-contrast border border-white overflow-hidden">
        <RoutesConfig />
      </div>
    </BrowserRouter>
  );
}

export default App;
