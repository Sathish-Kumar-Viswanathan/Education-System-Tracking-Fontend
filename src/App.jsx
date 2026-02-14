import Registration from "./pages/registration/registration";
import { Toaster } from "sonner";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Registration />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
