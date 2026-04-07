import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const HomePage = lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const DetailsPage = lazy(() => import("./pages/DetailsPage").then(m => ({ default: m.DetailsPage })));

const LoadingScreen = () => (
  <div className="min-h-screen bg-blue-50/30 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news/:id" element={<DetailsPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
