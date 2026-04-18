import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <GoogleOAuthProvider clientId="74432426884-096ougegask5p8529sbk2ptfbnsj2u1k.apps.googleusercontent.com">
            <BrowserRouter>
              <App />
            </BrowserRouter>
        </GoogleOAuthProvider>
    </StrictMode>
)
