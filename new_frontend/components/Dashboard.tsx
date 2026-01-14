import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Icons } from './Icons';
import { AppMode, User } from '../types';

interface DashboardProps {
  onSelectMode: (mode: AppMode) => void;
  user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectMode, user }) => {
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
  const displayName = user?.fullName || user?.firstName || email.split('@')[0] || 'User';
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="w-full h-full flex flex-col items-center p-8 md:p-12 transition-all duration-700">

      {/* Header */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-24">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
             <Icons.Sparkles className="w-4 h-4 text-white" />
           </div>
           <span className="font-bold text-xl text-gray-800 tracking-tight">Enterprises AI</span>
        </div>

        {/* User / Auth Section */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-white/40">
                <div className="w-7 h-7 bg-[#7c3aed] rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {userInitials}
                </div>
                <span className="text-sm text-gray-700 font-medium max-w-[120px] truncate">
                  {email}
                </span>
              </div>
              <UserButton userProfileMode="modal" afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </div>

      {/* Hero Text */}
      <div className="w-full max-w-5xl mb-8">
        <h1 className="text-2xl font-medium text-gray-600">
          {user ? `Welcome back, ${displayName}!` : 'Who would you like to work with today?'}
        </h1>
      </div>

      {/* Cards Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* HR Card */}
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

          {/* Analytics Card */}
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

          {/* Docs Card */}
          <button
            onClick={() => onSelectMode('docs')}
            className="group flex flex-col text-left p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-48"
          >
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-auto group-hover:scale-110 transition-transform">
              <Icons.Library className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Doc Intelligence</h3>
              <p className="text-sm text-gray-500">Search and summarize internal documents.</p>
            </div>
          </button>

      </div>
    </div>
  );
};
