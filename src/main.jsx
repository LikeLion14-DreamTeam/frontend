import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import router from './App.jsx'
import { RouterProvider } from 'react-router-dom'
import { APIProvider } from '@vis.gl/react-google-maps'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''}>
      <GoogleOAuthProvider
        clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''}
      >
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </APIProvider>
  </StrictMode>,
)
