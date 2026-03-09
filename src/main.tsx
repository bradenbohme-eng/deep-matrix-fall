import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { seedContextSyncAtom } from './lib/kernel'

createRoot(document.getElementById("root")!).render(<App />);

// Boot-time seeding (fire-and-forget)
seedContextSyncAtom().catch(() => {});
