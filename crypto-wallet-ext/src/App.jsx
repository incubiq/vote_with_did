import React from 'react';

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from './state/WalletContext';
import Onboarding from "./pages/Onboard_Main";
import EnterPassphrase from "./pages/Onboard_EnterPassphrase";
import GeneratePassphrase from "./pages/Onboard_GeneratePassphrase";
import WalletDashboard from "./pages/Wallet_dashboard";
import './styles/base.css';

function App() {

  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/enter-passphrase" element={<EnterPassphrase />} />
          <Route path="/generate-passphrase" element={<GeneratePassphrase />} />
          <Route path="/dashboard" element={<WalletDashboard />} />
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App
