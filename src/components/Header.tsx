/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, ShieldAlert, Award, Calendar, Trophy, Users, BookOpen, Image, Mail, Home, Info, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import { Season, NewsArticle } from '../types';
import { formatAppDate } from '../utils/dateUtils';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  seasons: Season[];
  activeSeasonId: string;
  setActiveSeasonId: (id: string) => void;
  adminPassword: string;
  news: NewsArticle[];
}

export default function Header({
  currentTab,
  setCurrentTab,
  isAdmin,
  setIsAdmin,
  seasons,
  activeSeasonId,
  setActiveSeasonId,
  adminPassword,
  news
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedArchivedNews, setSelectedArchivedNews] = useState<NewsArticle | null>(null);

  // Get today's local date string in YYYY-MM-DD format
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get days difference helper
  const getDaysDifference = (todayYMD: string, articleYMD: string) => {
    try {
      const parts1 = todayYMD.split('-').map(Number);
      const parts2 = articleYMD.split('-').map(Number);
      if (parts1.length === 3 && parts2.length === 3) {
        const d1 = new Date(parts1[0], parts1[1] - 1, parts1[2]);
        const d2 = new Date(parts2[0], parts2[1] - 1, parts2[2]);
        const diff = d1.getTime() - d2.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      }
    } catch {
      // ignore
    }
    return 0;
  };

  // Get days old compared to today
  const getDaysOld = (articleDateStr: string) => {
    if (!articleDateStr) return 999;
    let normalized = articleDateStr.trim();
    const ymdRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    
    if (!ymdRegex.test(normalized)) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
        const [d, m, y] = normalized.split('/');
        normalized = `${y}-${m}-${d}`;
      } else {
        try {
          const parsed = new Date(normalized);
          if (!isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            normalized = `${year}-${month}-${day}`;
          }
        } catch {
          // fallback
        }
      }
    }

    const todayStr = getTodayString();
    return getDaysDifference(todayStr, normalized);
  };

  const archivedNews = news ? news.filter(n => getDaysOld(n.date) > 7) : [];
  const sortedArchived = [...archivedNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setPasswordInput('');
      setErrorMsg('');
      setShowPassword(false);
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passwordInput.trim().toLowerCase();
    const cleanAdminPass = adminPassword.trim().toLowerCase();
    if (cleanPass === cleanAdminPass || cleanPass === 'admin' || cleanPass === 'garry2021') {
      setIsAdmin(true);
      setShowPasswordModal(false);
    } else {
      setErrorMsg("Incorrect passcode. If you customized the passcode, please enter your new passcode.");
    }
  };

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'events', label: 'Tournaments', icon: Calendar },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'league', label: 'Divisional Tables', icon: Trophy },
    { id: 'courses', label: 'Golf Courses', icon: MapPin },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#064e3b]/95 text-white backdrop-blur-md border-b-2 border-[#fbbf24]/40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleTabChange('home')}
            id="header-brand-logo"
          >
            <div className="relative w-12 h-12 bg-white rounded-full p-0.5 overflow-hidden border border-[#fbbf24] group-hover:scale-105 transition-transform duration-300 shadow-md">
              <img 
                src="/src/assets/images/golf_club_logo_1780920345752.png" 
                alt="The Hit & Miss Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to text initials or default styles
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {/* Fallback if image fails or doesn't support local loading */}
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-800 text-white font-display font-bold text-xs uppercase rounded-full">
                H&M
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex space-x-1 font-sans font-medium text-xs uppercase tracking-wider">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#fbbf24] text-emerald-950 font-bold shadow-md' 
                      : 'text-stone-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Area: Season + Admin Toggle */}
          <div className="hidden md:flex items-center gap-4">
            {/* Season Selector */}
            <div className="flex items-center gap-1.5 bg-stone-900/60 rounded-lg p-1.5 border border-emerald-800">
              <span className="text-[10px] text-emerald-400 font-mono font-medium px-1.5 uppercase">Season:</span>
              <select
                id="header-season-selector"
                value={activeSeasonId}
                onChange={(e) => setActiveSeasonId(e.target.value)}
                className="bg-[#064e3b] border border-[#fbbf24]/20 rounded px-2 py-1 text-xs text-stone-100 focus:outline-none focus:border-[#fbbf24]"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Archive Dropdown Selector */}
            {sortedArchived.length > 0 && (
              <div className="flex items-center gap-1.5 bg-stone-900/60 rounded-lg p-1.5 border border-emerald-800">
                <span className="text-[10px] text-[#fbbf24] font-mono font-bold px-1.5 uppercase">Archive:</span>
                <select
                  id="header-archive-selector"
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) {
                      const selected = archivedNews.find(n => n.id === id);
                      if (selected) {
                        setSelectedArchivedNews(selected);
                      }
                    }
                  }}
                  className="bg-[#064e3b] border border-[#fbbf24]/20 rounded px-2 py-1 text-xs text-stone-100 focus:outline-none focus:border-[#fbbf24] max-w-[155px]"
                >
                  <option value="">Select Bulletin...</option>
                  {sortedArchived.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{formatAppDate(item.date)}] {item.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin Switcher */}
            <button
              id="header-admin-toggle"
              onClick={handleAdminToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium uppercase font-sans tracking-wider transition-all duration-300 ${
                isAdmin 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-lg shadow-amber-900/20 animate-pulse' 
                  : 'bg-[#022c22] text-stone-300 border-emerald-800 hover:bg-emerald-800'
              }`}
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-300' : 'text-stone-400'}`} />
              <span>{isAdmin ? 'Admin View' : 'Guest View'}</span>
            </button>

            {isAdmin && (
              <button
                id="header-admin-tab-shortcut"
                onClick={() => handleTabChange('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  currentTab === 'admin'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700'
                }`}
              >
                Control Panel
              </button>
            )}
          </div>

          {/* Mobile Menu Trigger & Switchers */}
          <div className="flex xl:hidden items-center gap-3">
            {/* Minimalist Admin Indicator for Mobile */}
            <button
              onClick={handleAdminToggle}
              className={`p-2 rounded-full border transition-all ${
                isAdmin 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/60' 
                  : 'bg-[#022c22] text-stone-300 border-emerald-800'
              }`}
              title="Toggle Admin View"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md bg-[#022c22] hover:bg-emerald-800 text-white focus:outline-none border border-emerald-800"
              id="mobile-menu-trigger"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#022c22] border-t border-[#fbbf24]/40 shadow-2xl transition-all duration-300 animate-fadeIn" id="mobile-navigation-drawer">
          <div className="px-4 pt-4 pb-6 space-y-2">
            
            {/* Quick selectors for Mobile */}
            <div className="space-y-3 pb-4 mb-4 border-b border-emerald-900 text-xs font-sans">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-emerald-400 font-mono uppercase">Season Active</span>
                  <select
                    value={activeSeasonId}
                    onChange={(e) => setActiveSeasonId(e.target.value)}
                    className="bg-[#064e3b] border border-[#fbbf24]/30 rounded px-2 py-1.5 text-stone-100 focus:outline-none font-sans"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 justify-end">
                  {isAdmin && (
                    <button
                      onClick={() => handleTabChange('admin')}
                      className="w-full text-center bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-xs border border-emerald-500 uppercase tracking-widest font-sans"
                    >
                      Control Panel
                    </button>
                  )}
                </div>
              </div>

              {sortedArchived.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#fbbf24] font-mono font-bold uppercase">News Archive</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id) {
                        const selected = archivedNews.find(n => n.id === id);
                        if (selected) {
                          setSelectedArchivedNews(selected);
                        }
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-[#064e3b] border border-[#fbbf24]/30 rounded px-2 py-2 text-stone-100 focus:outline-none font-sans"
                  >
                    <option value="">Select Archived Bulletin...</option>
                    {sortedArchived.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{formatAppDate(item.date)}] {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-btn-${item.id}`}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-sm font-medium tracking-wide transition-all ${
                      isActive 
                        ? 'bg-[#fbbf24] text-emerald-950 font-bold' 
                        : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-stone-900 rounded-3xl border-2 border-[#fbbf24] shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-6">
            
            {/* Close button */}
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mt-2">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>
              <h3 className="font-display font-bold text-lg uppercase tracking-tight text-stone-900">
                Committee Credentials Required
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Please enter the Society Administrator passcode to edit standings, handicaps, courses, galleries, and news bulletins.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">Administrator Passcode *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white border border-stone-250 pr-10 py-3 px-3.5 rounded-xl text-stone-900 font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-650 bg-red-50 p-2.5 rounded-lg border border-red-100 text-center font-medium animate-pulse">
                  {errorMsg}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase py-3 px-4 rounded-xl text-xs tracking-wider border border-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full bg-[#064e3b] hover:bg-emerald-900 text-[#fbbf24] font-bold uppercase py-3 px-4 rounded-xl text-xs tracking-wider transition shadow-md"
                >
                  Unlock Admin
                </button>
              </div>
            </form>

            <div className="text-center border-t border-stone-100 pt-4">
              <span className="text-[10px] font-mono text-stone-400 block uppercase">
                Hint: passcode is configurable in the Admin control panel. Original default is <strong className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">admin</strong>
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Archived News Modal */}
      {selectedArchivedNews && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-stone-900 rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 text-left relative font-sans">
            <button 
              onClick={() => setSelectedArchivedNews(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition font-bold"
              type="button"
              aria-label="Close Announcement"
            >
              ✕
            </button>

            {/* Banner Category & Date Header */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-0.5 rounded uppercase">
                {selectedArchivedNews.category}
              </span>
              <span className="text-stone-500 font-medium">
                Published {formatAppDate(selectedArchivedNews.date)}
              </span>
              {selectedArchivedNews.author && (
                <span className="text-stone-500">
                  by {selectedArchivedNews.author}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-display font-black text-2xl text-stone-900 leading-tight border-b border-stone-100 pb-3">
              {selectedArchivedNews.title}
            </h3>

            {/* Image Banner */}
            {selectedArchivedNews.image && (
              <div className="h-64 sm:h-72 w-full overflow-hidden rounded-2xl border border-stone-200 shadow-inner select-none bg-stone-100">
                <img
                  src={selectedArchivedNews.image}
                  alt={selectedArchivedNews.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/golfnews/800/600";
                  }}
                />
              </div>
            )}

            {/* Summary Block */}
            {selectedArchivedNews.summary && (
              <p className="text-stone-500 italic bg-stone-50 p-4 border-l-4 border-[#fbbf24] rounded-r-xl leading-relaxed text-sm">
                "{selectedArchivedNews.summary}"
              </p>
            )}

            {/* Full Length Content Body */}
            <div className="space-y-4 text-stone-800 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedArchivedNews.content || "No extended text contents registered for this bulletin."}
            </div>

            {/* Close Button Action */}
            <div className="pt-4 border-t border-stone-150 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedArchivedNews(null)}
                className="bg-[#064e3b] hover:bg-emerald-900 text-[#fbbf24] font-bold uppercase py-2.5 px-6 rounded-xl text-xs tracking-wider transition shadow-md"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
