import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { DetailsPage } from "./pages/DetailsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news/:id" element={<DetailsPage />} />
      </Routes>
    </Router>
  );
}
