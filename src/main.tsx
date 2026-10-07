import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'
import { App } from './App'
import { StoreProvider } from './state/store'
import { ToastProvider } from './components/ui/Toast'
import { UiProvider } from './layouts/UiContext'
import { AssistantProvider } from './ai/AssistantContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <ToastProvider>
          <UiProvider>
            <AssistantProvider>
              <App />
            </AssistantProvider>
          </UiProvider>
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
)
