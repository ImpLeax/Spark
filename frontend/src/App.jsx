import './App.css'
import {useState} from "react";
import {Navbar,Sidebar,ThemeProvider,MainUnregistered,SignupForm} from '@/components/index';
import { Route, Routes } from 'react-router-dom';
import { SignUp } from '@/components/index';

function App() {
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);

  const toggleSidebar = () => setMenu(!menu);
  const toggleLogin = () => setLogin(!login);

  return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="relative">  
          <Navbar onMenuClick={toggleSidebar} onLoginClick={toggleLogin} state={menu} state2={login} />
          
          <div className="flex">
            <Sidebar isOpen={menu} />
            
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
                
              </Routes>
            </main>
          </div>
        </div>
      </ThemeProvider>
    );
}

export default App
