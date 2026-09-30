import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Plus,
  Shield,
  LogOut,
  ChevronDown,
  Sparkles,
  Radio,
  Layers,
  Code2,
  LogIn,
  User as UserIcon,
  Check,
  Bot
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'faqs' | 'ai' | 'chat' | 'activity' | 'architecture';
  setActiveTab: (tab: 'faqs' | 'ai' | 'chat' | 'activity' | 'architecture') => void;
  openAuthModal: () => void;
  openCreateModal: () => void;
  liveFaqCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openCreateModal,
  liveFaqCount,
}) => {
  const { currentUser, userProfile, signOut, loginAsDemoUser, isGuest } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = async (role: UserRole) => {
    setShowRoleDropdown(false);
    await loginAsDemoUser(role);
  };

  const getRoleShortLabel = (role?: UserRole | 'guest') => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'creator':
        return 'Creator';
      case 'user':
        return 'User';
      default:
        return 'Guest';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#003E54] text-white shadow-md border-b border-[#002838]">
      {/* Tier 1: Main Brand & Action Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Brand: Full text, never truncated on mobile */}
          <button
            onClick={() => setActiveTab('faqs')}
            className="flex items-center gap-2 text-left cursor-pointer group focus:outline-hidden shrink-0"
            aria-label="AI FAQ Assistant Home"
          >
            {/* Devpost Geometric Logo */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-[#00EAA6] flex items-center justify-center text-[#003E54] font-black text-base sm:text-xl tracking-tighter shadow-xs group-hover:bg-[#00c78d] transition shrink-0">
              &lt;&gt;
            </div>
            <div>
              <span className="font-extrabold text-sm xs:text-base sm:text-lg tracking-tight text-white block leading-tight whitespace-nowrap">
                AI FAQ Assistant
              </span>
              <span className="hidden sm:block text-[11px] text-teal-200/90 font-medium tracking-normal leading-none mt-0.5 truncate">
                Customer Support Automation
              </span>
            </div>
          </button>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Sync Status (Desktop only) */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-teal-200 bg-[#002B3A] px-2.5 py-1 rounded border border-teal-500/20">
              <span className="w-2 h-2 rounded-full bg-[#00EAA6] animate-pulse"></span>
              <span className="font-mono text-[11px]">Live Sync</span>
            </div>

            {/* Role & Account Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1 text-xs bg-[#002C3D] hover:bg-[#002432] text-teal-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded border border-teal-500/30 transition focus:outline-hidden cursor-pointer"
                title="Account & Role options"
              >
                <Shield className="w-3.5 h-3.5 text-[#00EAA6] shrink-0" />
                <span className="font-semibold whitespace-nowrap">
                  {getRoleShortLabel(userProfile?.role || (isGuest ? 'guest' : undefined))}
                </span>
                <ChevronDown className="w-3 h-3 text-teal-300 shrink-0" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white text-zinc-900 rounded-md shadow-2xl border border-zinc-200 p-2.5 z-50 animate-in fade-in-50 duration-150">
                  {/* Account state info on mobile */}
                  <div className="px-2 py-1.5 border-b border-zinc-100 mb-2">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Current User
                    </p>
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {currentUser ? (userProfile?.name || currentUser.email) : 'Public Guest (Read-Only)'}
                    </p>
                    {!currentUser && (
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          openAuthModal();
                        }}
                        className="mt-1.5 w-full py-1 text-xs font-bold text-[#003E54] bg-[#00EAA6] hover:bg-[#00c78d] rounded transition flex items-center justify-center gap-1"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In / Register</span>
                      </button>
                    )}
                  </div>

                  <div className="px-2 py-1 mb-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      Role-Based Access Control
                    </p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => handleRoleSelect('admin')}
                      className="w-full text-left p-2 rounded hover:bg-zinc-100 flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-zinc-900">Admin</p>
                        <p className="text-[11px] text-zinc-500">Full CRUD administrative access</p>
                      </div>
                      {userProfile?.role === 'admin' && <Check className="w-4 h-4 text-[#008272] stroke-[3]" />}
                    </button>

                    <button
                      onClick={() => handleRoleSelect('creator')}
                      className="w-full text-left p-2 rounded hover:bg-zinc-100 flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-zinc-900">Content Creator</p>
                        <p className="text-[11px] text-zinc-500">AI Draft & Edit owned FAQs</p>
                      </div>
                      {userProfile?.role === 'creator' && <Check className="w-4 h-4 text-[#008272] stroke-[3]" />}
                    </button>

                    <button
                      onClick={() => handleRoleSelect('user')}
                      className="w-full text-left p-2 rounded hover:bg-zinc-100 flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-zinc-900">Authenticated User</p>
                        <p className="text-[11px] text-zinc-500">Search, View, and Vote Helpful</p>
                      </div>
                      {userProfile?.role === 'user' && <Check className="w-4 h-4 text-[#008272] stroke-[3]" />}
                    </button>

                    <button
                      onClick={() => handleRoleSelect('public')}
                      className="w-full text-left p-2 rounded hover:bg-zinc-100 flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-zinc-900">Public User</p>
                        <p className="text-[11px] text-zinc-500">Unauthenticated · Read-Only</p>
                      </div>
                      {(!currentUser || isGuest) && <Check className="w-4 h-4 text-[#008272] stroke-[3]" />}
                    </button>
                  </div>

                  {currentUser && (
                    <div className="pt-2 mt-2 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          signOut();
                        }}
                        className="w-full text-left p-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Button (+ Add FAQ) */}
            <button
              onClick={openCreateModal}
              className="bg-[#00EAA6] hover:bg-[#00c78d] text-[#003E54] text-xs sm:text-sm font-bold h-7.5 sm:h-9 px-2.5 sm:px-3.5 rounded shadow-xs transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
              title="Create new FAQ"
            >
              <Plus className="w-4 h-4 text-[#003E54] stroke-[3]" />
              <span className="hidden sm:inline">Add FAQ</span>
            </button>

            {/* Desktop-only Auth Button / Avatar (Hidden on mobile to protect header breathing room) */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-teal-700/60 shrink-0">
                <div
                  className="w-8 h-8 rounded bg-[#00EAA6]/20 border border-[#00EAA6]/40 flex items-center justify-center text-teal-200 text-xs font-bold shrink-0"
                  title={userProfile?.name || currentUser.email || 'User'}
                >
                  {(userProfile?.name || currentUser.displayName || 'U').charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 text-teal-200 hover:text-white hover:bg-[#002C3D] rounded transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="hidden sm:inline-block text-xs sm:text-sm font-semibold text-teal-100 hover:text-white px-2 py-1 transition cursor-pointer shrink-0"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier 2: Sub-Navigation Bar with Compact Mobile Labels */}
      <div className="bg-[#002B3A] border-t border-[#00222F]">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1 text-xs sm:text-sm font-semibold">
            {/* Tab 1: FAQs */}
            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded transition cursor-pointer whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                activeTab === 'faqs'
                  ? 'bg-[#00EAA6] text-[#003E54] font-bold shadow-xs'
                  : 'text-teal-100/90 hover:text-white hover:bg-[#003749]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">FAQs</span>
              <span className="hidden sm:inline">Explore FAQs</span>
              <span className={`text-[10px] sm:text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'faqs' ? 'bg-[#003E54]/20 text-[#003E54]' : 'bg-[#001D28] text-teal-300'
              }`}>
                {liveFaqCount}
              </span>
            </button>

            {/* Tab 2: AI Support Chatbot */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded transition cursor-pointer whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                activeTab === 'chat'
                  ? 'bg-[#00EAA6] text-[#003E54] font-bold shadow-xs'
                  : 'text-teal-100/90 hover:text-white hover:bg-[#003749]'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[#00EAA6] group-data-[active=true]:text-[#003E54] shrink-0" />
              <span className="sm:hidden">AI Chat</span>
              <span className="hidden sm:inline">Gemini Support Chat</span>
            </button>

            {/* Tab 3: AI Generator */}
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded transition cursor-pointer whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                activeTab === 'ai'
                  ? 'bg-[#00EAA6] text-[#003E54] font-bold shadow-xs'
                  : 'text-teal-100/90 hover:text-white hover:bg-[#003749]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00EAA6] shrink-0" />
              <span className="sm:hidden">AI Generator</span>
              <span className="hidden sm:inline">AI FAQ Generator</span>
            </button>

            {/* Tab 3: Workbench */}
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded transition cursor-pointer whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                activeTab === 'architecture'
                  ? 'bg-[#00EAA6] text-[#003E54] font-bold shadow-xs'
                  : 'text-teal-100/90 hover:text-white hover:bg-[#003749]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Workbench</span>
              <span className="hidden sm:inline">API & Architecture</span>
            </button>

            {/* Tab 4: Live Feed */}
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded transition cursor-pointer whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                activeTab === 'activity'
                  ? 'bg-[#00EAA6] text-[#003E54] font-bold shadow-xs'
                  : 'text-teal-100/90 hover:text-white hover:bg-[#003749]'
              }`}
            >
              <Radio className="w-3 h-3 text-[#00EAA6] shrink-0" />
              <span className="sm:hidden">Live Feed</span>
              <span className="hidden sm:inline">Live Sync Feed</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00EAA6] animate-pulse"></span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
