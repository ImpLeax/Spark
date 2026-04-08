import { ThemeProvider, Navbar } from '@/components/index';
import LandingPage from "@/pages/LandingPage.jsx";
import { Route, Routes } from 'react-router-dom';

function App() {

  return (
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <div className="relative">
          <Navbar />
          <div className="flex">
            <main className="flex-1">
              <Routes>
                <Route
                  path="/"
                  element={<LandingPage  />}
                />
              </Routes>
            </main>
          </div>
        </div>
      </ThemeProvider>
    );
}

export default App
