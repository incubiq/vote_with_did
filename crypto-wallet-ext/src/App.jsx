// src/app.jsx

import React from 'react';
//import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './state/WalletContext';
import { SettingsProvider } from './state/SettingsContext';
import Onboarding from "./pages/Onboard_Main";
import EnterPassphrase from "./pages/Onboard_EnterPassphrase";
import GeneratePassphrase from "./pages/Onboard_GeneratePassphrase";
import WalletDashboard from "./pages/DashboardPage";
import VotesPage from "./pages/VotesPage";
import BallotsPage from "./pages/BallotsPage";
import QuestionsPage from "./pages/QuestionsPage";
import VCsPage from "./pages/VCsPage";
import ProfilePage from "./pages/ProfilePage";

import './styles/base.css';

function App() {

  return (
    <SettingsProvider>
      <WalletProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/enter-passphrase" element={<EnterPassphrase />} />
            <Route path="/generate-passphrase" element={<GeneratePassphrase />} />
            <Route path="/dashboard" element={<WalletDashboard />} />
            <Route path="/votes" element={<VotesPage />} />
            <Route path="/ballots" element={<BallotsPage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/vcs" element={<VCsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Router>
      </WalletProvider>
    </SettingsProvider>
  );
}

export default App
