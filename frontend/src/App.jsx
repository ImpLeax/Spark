import './App.css'
import {useState} from "react";
import {Navbar,Sidebar,ThemeProvider,MainUnregistered,SignUp} from '@/components/index';
import { Route, Routes , useLocation} from 'react-router-dom';

function App() {
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);
  
  const toggleSidebar = () => setMenu(!menu);
  const toggleLogin = () => setLogin(!login);

  const location = useLocation();

  const isLandingPage = location.pathname === "/" || location.pathname === "/signup";

  return (
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <div className="relative">  
          <Navbar onMenuClick={toggleSidebar} onLoginClick={toggleLogin} state={menu} state2={login} render={isLandingPage} />
          
          <div className="flex">
            <Sidebar isOpen={menu} render={!isLandingPage} />
            
            <main className="flex-1">
              <Routes>
                
                <Route 
                  path="/" 
                  element={<MainUnregistered state={login} onClose={toggleLogin} />} 
                />

                <Route 
                  path="/signup" 
                  element={<SignUp/>} 
                />

                <Route 
                  path="/main" 
                  element={<SignUp/>} 
                />
                
              </Routes>
            </main>
          </div>
        </div>
      </ThemeProvider>
    );
}

export default App
