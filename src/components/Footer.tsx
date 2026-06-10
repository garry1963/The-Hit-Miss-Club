/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, Phone, MapPin, Youtube, Facebook, MessageSquare, ShieldCheck } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  siteContent?: Record<string, string>;
}

export default function Footer({ setCurrentTab, isAdmin, siteContent }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-950 text-stone-300 border-t-4 border-[#fbbf24] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Brand/Slogan column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#064e3b] border border-[#fbbf24]/80 p-0.5 overflow-hidden flex items-center justify-center">
                <img 
                  src="/src/assets/images/golf_club_logo_1780920345752.png" 
                  alt="Tiny Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[10px] text-white font-bold font-display">H&M</span>
              </div>
              <span className="font-display font-bold text-stone-100 tracking-wider text-base uppercase">
                THE HIT & MISS CLUB
              </span>
            </div>
            
            <p className="text-stone-400 text-sm leading-relaxed">
              Serving our community of amateur golfers since 2026. Designed to organize, compile scores, and review handicaps fairly, because we might hit it but we usually miss it.
            </p>
            
            <span className="text-xs italic text-[#fbbf24] font-serif">
              "We are hit and miss, but we keep it fair!"
            </span>
          </div>

          {/* Quick links columns */}
          <div>
            <h3 className="font-display font-medium text-stone-100 uppercase tracking-widest text-sm mb-4 border-b border-stone-850 pb-2">
              Society Operations
            </h3>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <button onClick={() => setCurrentTab('events')} className="hover:text-amber-400 transition-colors">
                  Upcoming Tournaments
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('results')} className="hover:text-amber-400 transition-colors">
                  Latest Results
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('league')} className="hover:text-amber-400 transition-colors">
                  League Rankings & Standings
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('courses')} className="hover:text-amber-400 transition-colors">
                  Approved Course Directory
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('members')} className="hover:text-amber-400 transition-colors">
                  Member Directory & Stats
                </button>
              </li>
            </ul>
          </div>

          {/* Society info / Committee */}
          <div>
            <h3 className="font-display font-medium text-stone-100 uppercase tracking-widest text-sm mb-4 border-b border-stone-850 pb-2">
              Society Contacts
            </h3>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#fbbf24]" />
                <a href={`mailto:${siteContent?.contact_hq_email_val || "garrydavies1963@gmail.com"}`} className="hover:text-white transition-colors">
                  {siteContent?.contact_hq_email_val || "garrydavies1963@gmail.com"}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#fbbf24]" />
                <span>{siteContent?.contact_hq_phone_val || "+353 (0) 86 123 4567"}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#fbbf24] mt-0.5" />
                <span>{siteContent?.contact_hq_fields_val || "County Dublin & County Kerry links, Ireland, EU"}</span>
              </li>
            </ul>
          </div>

          {/* Social Presence */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display font-medium text-stone-100 uppercase tracking-widest text-sm mb-4 border-b border-stone-850 pb-2">
              Connect & Follow
            </h3>
            
            <div className="flex gap-3">
              <a href={siteContent?.social_facebook || "https://facebook.com/golf"} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-stone-900 border border-stone-800 hover:border-[#fbbf24] hover:text-[#fbbf24] transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={siteContent?.social_discord || "https://discord.gg/golf"} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-stone-900 border border-stone-800 hover:border-[#fbbf24] hover:text-[#fbbf24] transition-all" title="Join our Discord Server">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href={siteContent?.social_youtube || "https://youtube.com/golf"} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-stone-900 border border-stone-800 hover:border-[#fbbf24] hover:text-[#fbbf24] transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-2 text-xs text-stone-500">
              <span className="block font-mono">Platform Admin Access</span>
              <span className="text-stone-400">
                {isAdmin ? '🛡️ Administrator mode loaded' : '👥 Browsing in standard Member mode'}
              </span>
            </div>
          </div>

        </div>

        {/* Copy guidelines and credit */}
        <div className="border-t border-stone-905 pt-8 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; {currentYear} The Hit & Miss Club - All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secured locally via Browser Local Storage.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
