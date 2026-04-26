import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { AppMode, AppUser } from '../types';
import { isAutonomousBuyerChatReachable, isBackendReachable } from '../lib/api';

interface DashboardProps {
  onSelectMode: (mode: AppMode) => void;
  user: AppUser;
}

const DOC_UNAVAILABLE_TOAST_MS = 4800;

export const Dashboard: React.FC<DashboardProps> = ({ onSelectMode, user }) => {
  const displayName = user.displayName;
  const email = user.email;
  const userInitials = displayName.slice(0, 2).toUpperCase();
  const [showDocUnavailableToast, setShowDocUnavailableToast] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [buyerChatOnline, setBuyerChatOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (!showDocUnavailableToast) return;
    const id = window.setTimeout(() => setShowDocUnavailableToast(false), DOC_UNAVAILABLE_TOAST_MS);
    return () => window.clearTimeout(id);
  }, [showDocUnavailableToast]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;
    const run = async () => {
      const [ok, buyerOk] = await Promise.all([isBackendReachable(), isAutonomousBuyerChatReachable()]);
      if (!cancelled) {
        setApiOnline(ok);
        setBuyerChatOnline(buyerOk);
      }
    };
    void run();
    const interval = window.setInterval(run, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center p-8 md:p-12 transition-all duration-700">
      {import.meta.env.DEV && apiOnline === false && (
        <div className="mb-6 w-full max-w-5xl rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm">
          <p className="font-semibold">Backend API is not reachable</p>
          <p className="mt-1 text-amber-900/90">
            Start FastAPI on port 8000. From the <code className="rounded bg-white/80 px-1 py-0.5 text-xs">new_frontend</code> folder run{' '}
            <code className="rounded bg-white/80 px-1 py-0.5 text-xs">npm run backend</code> in a second terminal, or run{' '}
            <code className="rounded bg-white/80 px-1 py-0.5 text-xs">npm run dev:full</code> to start the UI and API together.
          </p>
        </div>
      )}

      {import.meta.env.DEV && buyerChatOnline === false && (
        <div className="mb-6 w-full max-w-5xl rounded-xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 text-sm text-indigo-950 shadow-sm">
          <p className="font-semibold">Autonomous LLM buyer chat is not reachable</p>
          <p className="mt-1 text-indigo-900/90">
            Arc_Marketplace uses <code className="rounded bg-white/80 px-1 py-0.5 text-xs">POST …/demo/autonomous-llm-buyer/chat</code> on the example{' '}
            <code className="rounded bg-white/80 px-1 py-0.5 text-xs">chat_server.py</code> (default <code className="rounded bg-white/80 px-1 py-0.5 text-xs">http://127.0.0.1:9095</code>).
            Vite proxies <code className="rounded bg-white/80 px-1 py-0.5 text-xs">/autonomous-buyer-proxy</code> to that host unless you set{' '}
            <code className="rounded bg-white/80 px-1 py-0.5 text-xs">VITE_AUTONOMOUS_BUYER_CHAT_URL</code>. Override the proxy target with{' '}
            <code className="rounded bg-white/80 px-1 py-0.5 text-xs">VITE_AUTONOMOUS_BUYER_PROXY_TARGET</code> in <code className="rounded bg-white/80 px-1 py-0.5 text-xs">.env.local</code>.
          </p>
        </div>
      )}

      <div className="w-full max-w-5xl flex items-center justify-between mb-24">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Icons.Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-800 tracking-tight">Enterprises AI</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-white/40">
            <div className="w-7 h-7 bg-[#7c3aed] rounded-full flex items-center justify-center text-white text-xs font-medium">
              {userInitials}
            </div>
            <span className="text-sm text-gray-700 font-medium max-w-[160px] truncate">{email}</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mb-8">
        <h1 className="text-2xl font-medium text-gray-600">Welcome back, {displayName}!</h1>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => onSelectMode('hr')}
          className="group flex flex-col text-left p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-48"
        >
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-auto group-hover:scale-110 transition-transform">
            <Icons.Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">HR Assistant</h3>
            <p className="text-sm text-gray-500">Employee lookup, policies, and org charts.</p>
          </div>
        </button>

        <button
          onClick={() => onSelectMode('analytics')}
          className="group flex flex-col text-left p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-48"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-auto group-hover:scale-110 transition-transform">
            <Icons.BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Analytics Hub</h3>
            <p className="text-sm text-gray-500">Performance metrics and financial data.</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowDocUnavailableToast(true)}
          title="Doc Intelligence is currently unavailable"
          className="group flex flex-col text-left p-6 rounded-2xl bg-white border border-dashed border-amber-200/90 shadow-sm hover:shadow-md transition-all duration-300 h-48 opacity-90 hover:opacity-100"
        >
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-auto group-hover:scale-105 transition-transform">
            <Icons.Library className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Doc Intelligence</h3>
            <p className="text-sm text-gray-500">Search and summarize internal documents.</p>
            <p className="text-xs text-amber-700/90 font-medium mt-2">Currently unavailable</p>
          </div>
        </button>

        <button
          onClick={() => onSelectMode('arc_marketplace')}
          className="group flex flex-col text-left p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-48"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-auto group-hover:scale-110 transition-transform">
            <Icons.Store className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Arc_Marketplace</h3>
            <p className="text-sm text-gray-500">Discover agents, integrations, and curated templates.</p>
          </div>
        </button>
      </div>

      {showDocUnavailableToast && (
        <div
          className="fixed bottom-8 left-1/2 z-[100] flex max-w-md -translate-x-1/2 items-start gap-3 rounded-2xl border border-amber-200/80 bg-white px-4 py-3 shadow-lg shadow-amber-900/10 animate-in fade-in slide-in-from-bottom-4 duration-300"
          role="status"
        >
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-50">
            <Icons.AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-gray-900">Doc Intelligence</p>
            <p className="text-sm text-gray-600">This feature is currently not available.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDocUnavailableToast(false)}
            className="ml-1 flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Dismiss"
          >
            <Icons.X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
