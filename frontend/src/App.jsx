import './App.css'
import {useState, useEffect} from "react";
import {Navbar,Sidebar,ThemeProvider,MainUnregistered,SignUp, SettingsPage} from '@/components/index';
import { Route, Routes , useLocation} from 'react-router-dom';
import MainContent from './pages/MainContent';
import { Button } from './components/ui/button';

function App() {
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);
  const [globalUserData, setGlobalUserData] = useState(null);

  const toggleSidebar = () => setMenu(!menu);
  const toggleLogin = () => setLogin(!login);
  const loadData = (data) => setGlobalUserData(data);
  useEffect(() => {

      const refreshSelf = async () => {
        try {
          const response = await api.post('user/token/refresh/', {});
          setAccessToken(response.data.access);
        } catch (e) {
          console.log("Сесія застаріла, треба логінитись");
        } finally {
          setIsRefreshing(false);
        }
      };

      refreshSelf();
    }, []);

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
                  element={<MainUnregistered state={login} onClose={toggleLogin} loadData={loadData} />}
                />

                <Route 
                  path="/signup" 
                  element={<SignUp onSaveData={loadData}/>}
                />

                <Route 
                  path="/main" 
                  element={<MainContent/>} 
                />

                <Route
                    path="/settings"
                    element={
                      <SettingsPage
                          userData={globalUserData}
                          onUpdateData={loadData}
                      />
                    }
                />
                
              </Routes>
            </main>
          </div>
        </div>
      </ThemeProvider>
    );
}

export default App
