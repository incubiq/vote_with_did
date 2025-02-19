// src/app.jsx

import React from 'react';
//import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './state/WalletContext';
import Onboarding from "./pages/Onboard_Main";
import EnterPassphrase from "./pages/Onboard_EnterPassphrase";
import GeneratePassphrase from "./pages/Onboard_GeneratePassphrase";
import WalletDashboard from "./pages/DashboardPage";
import VotesPage from "./pages/VotesPage";
import VCsPage from "./pages/VCsPage";
import SettingsPage from "./pages/SettingsPage";

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
          <Route path="/votes" element={<VotesPage />} />
          <Route path="/vcs" element={<VCsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App
