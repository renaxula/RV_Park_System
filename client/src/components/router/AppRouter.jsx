import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { PageContent } from "./PageContent";

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageContent />
      </BrowserRouter>
    </AuthProvider>
  );
}