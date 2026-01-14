import React, { useState } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { AppMode, User } from './types';

function App() {
  const { isLoaded, user } = useUser();
  const [currentMode, setCurrentMode] = useState<AppMode>('dashboard');
  const [authView, setAuthView] = useState<'sign-in' | 'sign-up'>('sign-in');

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="relative w-full min-h-screen flex items-center justify-center bg-[#f3f4f6] font-sans overflow-hidden p-6">
          <div className="absolute -top-24 -right-32 w-[420px] h-[420px] rounded-full bg-purple-100 blur-[120px]" />
          <div className="absolute -bottom-20 -left-24 w-[360px] h-[360px] rounded-full bg-blue-100 blur-[120px]" />
          <div className="relative z-10 w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl p-8 flex flex-col gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#7c3aed] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to Enterprise AI</h2>
              <p className="text-sm text-gray-500 mt-1">
                Sign in to access your AI workspace.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <button
                onClick={() => setAuthView('sign-in')}
                className={`px-3 py-1.5 rounded-full transition-all ${authView === 'sign-in' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign in
              </button>
              <button
                onClick={() => setAuthView('sign-up')}
                className={`px-3 py-1.5 rounded-full transition-all ${authView === 'sign-up' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Create account
              </button>
            </div>

            <div className="flex justify-center">
              {authView === 'sign-in' ? (
                <SignIn routing="virtual" />
              ) : (
                <SignUp routing="virtual" />
              )}
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="relative w-full h-screen overflow-hidden bg-[#f3f4f6] font-sans">
          <div
            className={`
              absolute inset-0 z-0 flex items-center justify-center
              transition-all duration-500 ease-in-out
              ${currentMode !== 'dashboard'
                ? 'scale-95 opacity-50 blur-[5px] pointer-events-none'
                : 'scale-100 opacity-100 blur-0'
              }
            `}
          >
            <Dashboard
              onSelectMode={setCurrentMode}
              user={user as User | null}
            />
          </div>

          {currentMode !== 'dashboard' && (
            <div className="absolute inset-0 z-20 flex justify-center bg-slate-900/15 animate-in fade-in duration-300">
              <ChatInterface
                mode={currentMode}
                onBack={() => setCurrentMode('dashboard')}
                user={user as User | null}
              />
            </div>
          )}
        </div>
      </SignedIn>
    </>
  );
}

export default App;
