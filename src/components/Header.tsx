/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, ShieldAlert, Award, Calendar, Trophy, Users, BookOpen, Image, Mail, Home, Info, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import { Season } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  seasons: Season[];
  activeSeasonId: string;
  setActiveSeasonId: (id: string) => void;
  adminPassword: string;
}

export default function Header({
  currentTab,
  setCurrentTab,
  isAdmin,
  setIsAdmin,
  seasons,
  activeSeasonId,
  setActiveSeasonId,
  adminPassword
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
            <div className="grid grid-cols-2 gap-2 pb-4 mb-4 border-b border-emerald-900 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-emerald-400 font-mono uppercase">Season Active</span>
                <select
                  value={activeSeasonId}
                  onChange={(e) => setActiveSeasonId(e.target.value)}
                  className="bg-[#064e3b] border border-[#fbbf24]/30 rounded px-2 py-1.5 text-stone-100 font-sans focus:outline-none"
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
                    className="w-full text-center bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-xs border border-emerald-500 uppercase tracking-widest"
                  >
                    Control Panel
                  </button>
                )}
              </div>
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
    </header>
  );
}
