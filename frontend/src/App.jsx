import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import DashboardPage, { ViewState as ViewStatePage } from './pages/Dashboard';
import HRAssistantPage from './pages/HRAssistant';
import AnalyticsHubPage from './pages/AnalyticsHub';
import DocumentIntelligencePage from './pages/DocumentIntelligence';
import UnifiedChatWidget from './components/UnifiedChat';
import { IMessage, IChevronLeft } from './components/icons';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isDashboard = location.pathname === '/';

  return (
    <div>
      <div className="min-h-screen bg-gray-50 font-sans relative flex flex-col">
        <header className="bg-blue-600 text-white shadow-md flex-shrink-0 z-30 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isDashboard && (
                <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors" aria-label="Back to Dashboard"><IChevronLeft className="w-6 h-6" /></button>
              )}
              <Link to="/" className="flex items-center gap-3 cursor-pointer">
                <div className="size-9 rounded-xl bg-white text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm">AI</div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Enterprise Platform</h1>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={<DashboardPage onNavigate={(view) => {
              if (view === ViewStatePage.HR_ASSISTANT) navigate('/hr');
              else if (view === ViewStatePage.ANALYTICS_HUB) navigate('/analytics');
              else if (view === ViewStatePage.DOCUMENT_INTELLIGENCE) navigate('/documents');
            }} />} />
            <Route path="/hr" element={<div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-9rem)] overflow-hidden relative"><div className="h-full w-full text-gray-900"><HRAssistantPage /></div></div>} />
            <Route path="/analytics" element={<div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-9rem)] overflow-hidden relative"><div className="h-full w-full text-gray-900"><AnalyticsHubPage /></div></div>} />
            <Route path="/documents" element={<div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-9rem)] overflow-hidden relative"><div className="h-full w-full text-gray-900"><DocumentIntelligencePage /></div></div>} />
          </Routes>
        </main>
        <div className="fixed z-[100] bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-end gap-4 pointer-events-none">
          {isChatOpen && (
            <div className="pointer-events-auto w-[90vw] sm:w-[400px] h-[60vh] sm:h-[600px] max-h-[calc(100vh-8rem)] shadow-2xl rounded-2xl overflow-hidden animate-fade-in origin-bottom-right border border-gray-200 bg-white flex flex-col">
              <UnifiedChatWidget onClose={() => setIsChatOpen(false)} />
            </div>
          )}
          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full shadow-xl shadow-blue-900/20 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-200 ${isChatOpen ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`} aria-label="Toggle Chat">
            {isChatOpen ? <IMessage className="w-6 h-6" /> : <IMessage className="w-7 h-7" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;