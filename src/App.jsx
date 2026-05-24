import { CssVarsProvider, CssBaseline } from "@mui/joy";
import Home from "./pages/Home";

export default function App() {
  return (
    <CssVarsProvider defaultMode="dark">
      <CssBaseline />
      <Home />
    </CssVarsProvider>
  );
}
