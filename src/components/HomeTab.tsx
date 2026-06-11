/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Trophy, ChevronRight, Users, Eye, HelpCircle, ArrowRight } from 'lucide-react';
import { Event, NewsArticle, Member, StandingsRow } from '../types';

interface HomeTabProps {
  setCurrentTab: (tab: string) => void;
  events: Event[];
  news: NewsArticle[];
  members: Member[];
  standings: StandingsRow[];
  courses: any[];
  isAdmin: boolean;
  siteContent: Record<string, string>;
  updateSiteContent: (key: string, val: string) => void;
}

export default function HomeTab({
  setCurrentTab,
  events,
  news,
  members,
  standings,
  courses,
  isAdmin,
  siteContent,
  updateSiteContent
}: HomeTabProps) {
  // Find closest upcoming event
  const upcomingEvents = events
    .filter(e => e.status === 'Upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const spotlightEvent = upcomingEvents[0];
  const spotlightCourse = spotlightEvent
    ? courses.find(c => c.id === spotlightEvent.courseId)
    : null;

  // Standings leader
  const leaderRow = standings.find(s => s.ranking === 1);

  // Featured news
  const mainNews = news.find(n => n.isFeatured) || news[0];
  const secondaryNews = news.filter(n => n.id !== mainNews?.id).slice(0, 2);

  // State for editor
  const [isEditingTexts, setIsEditingTexts] = React.useState(false);
  const [draftWelcomeTitle, setDraftWelcomeTitle] = React.useState('');
  const [draftHeroTitle, setDraftHeroTitle] = React.useState('');
  const [draftHeroSubtitle, setDraftHeroSubtitle] = React.useState('');
  const [draftSpotlightTitle, setDraftSpotlightTitle] = React.useState('');
  const [draftCtaTitle, setDraftCtaTitle] = React.useState('');
  const [draftCtaBody, setDraftCtaBody] = React.useState('');

  // Sync draft states when siteContent loads
  React.useEffect(() => {
    if (siteContent) {
      setDraftWelcomeTitle(siteContent.home_welcome_title || "⛳ Welcome to the Society");
      setDraftHeroTitle(siteContent.home_hero_title || "The Hit & Miss Club");
      setDraftHeroSubtitle(siteContent.home_hero_subtitle || "Serving our community of amateur golfers since 2026. Designed to organize, compile scores, and review handicaps fairly, because we might hit it but we usually miss it.");
      setDraftSpotlightTitle(siteContent.home_fixture_card_title || "★ Spotlight Fixture");
      setDraftCtaTitle(siteContent.home_cta_title || "Interested in Joining the Society?");
      setDraftCtaBody(siteContent.home_cta_body || "The Hit & Miss Club is always delighted to welcome prospective golfers, whether you play off single figures or are just finding your way back to 28+. Enjoy balanced tournaments, friendly reviews, and structured handicapping.");
    }
  }, [siteContent]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent('home_welcome_title', draftWelcomeTitle);
    updateSiteContent('home_hero_title', draftHeroTitle);
    updateSiteContent('home_hero_subtitle', draftHeroSubtitle);
    updateSiteContent('home_fixture_card_title', draftSpotlightTitle);
    updateSiteContent('home_cta_title', draftCtaTitle);
    updateSiteContent('home_cta_body', draftCtaBody);
    setIsEditingTexts(false);
  };

  return (
    <div className="space-y-12 pb-12 animate-fadeIn">

      {/* Editor Trigger for admin */}
      {isAdmin && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-850 bg-amber-500/15 px-2 py-0.5 rounded uppercase tracking-wider block w-fit mb-1">
              🔧 ADMIN EDIT PERMISSION ACTIVE
            </span>
            <p className="text-xs text-stone-700">You have unlock authorization. Edit all titles, slogans, card headers, and buttons on this tab.</p>
          </div>
          <button
            onClick={() => setIsEditingTexts(true)}
            className="bg-stone-900 hover:bg-stone-850 text-[#fbbf24] font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 shrink-0"
          >
            <span>Edit Home Texts</span>
          </button>
        </div>
      )}
      
      {/* 1. Hero Banner */}
      <section className="relative h-[480px] lg:h-[580px] overflow-hidden rounded-2xl shadow-2xl border border-emerald-950">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 select-none">
          <img 
            src="/src/assets/images/golf_course_hero_1780920330072.png" 
            alt="Scenic Golf Fairway" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/golfhero/1920/1080?blur=1";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-[#064e3b]/50" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-10 lg:p-16 max-w-4xl text-left">
          <div className="inline-flex items-center gap-2 bg-[#fbbf24] text-emerald-950 font-mono text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full mb-4 w-fit shadow-md">
            {siteContent?.home_welcome_title || "⛳ Welcome to the Society"}
          </div>
          
          <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-4 uppercase drop-shadow-lg">
            {siteContent?.home_hero_title || "The Hit & Miss Club"}
          </h1>
          
          <p className="font-sans text-stone-200 text-sm sm:text-lg mb-6 leading-relaxed font-light drop-shadow-md">
            {siteContent?.home_hero_subtitle || "Serving our community of amateur golfers since 2026. Designed to organize, compile scores, and review handicaps fairly, because we might hit it but we usually miss it."}
          </p>

          <div className="flex flex-wrap gap-4 font-sans text-xs sm:text-sm font-medium">
            <button
              onClick={() => setCurrentTab('events')}
              className="px-6 py-3 bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 hover:scale-105 rounded-xl transition-all duration-200 uppercase tracking-widest font-bold shadow-lg"
            >
              Fixtures & Tee Times
            </button>
            <button
              onClick={() => setCurrentTab('about')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-200 uppercase tracking-widest"
            >
              Discover Our History
            </button>
          </div>
        </div>
      </section>

      {/* 2. Quick Highlights Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Total Members */}
        <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-emerald-700 flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-stone-400 text-xs font-mono tracking-wider uppercase block">Reg. Members</span>
            <span className="text-3xl font-display font-bold text-stone-900 font-mono">{members.length} Players</span>
            <p className="text-stone-500 text-xs font-normal">Premier, Championship & Club</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-800">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Season Leader */}
        <div 
          onClick={() => setCurrentTab('league')}
          className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-[#fbbf24] flex items-center justify-between cursor-pointer hover:border-amber-450 transition-all text-left"
        >
          <div className="space-y-1">
            <span className="text-stone-400 text-xs font-mono tracking-wider uppercase block">Standings Leader</span>
            <span className="text-2xl font-display font-bold text-stone-900">
              {leaderRow ? leaderRow.playerName : 'No games'}
            </span>
            <p className="text-amber-600 text-xs font-bold font-mono">
              ★ {leaderRow ? `${leaderRow.totalPoints} PTS (${leaderRow.wins} Wins)` : 'Pending Results'}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Active Season */}
        <div className="bg-stone-900 p-6 rounded-2xl shadow-md border-t-4 border-stone-800 text-white flex items-center justify-between text-left">
          <div className="space-y-1">
            <span className="text-emerald-400 text-xs font-mono tracking-wider uppercase block">Current Season</span>
            <span className="text-3xl font-display font-bold text-stone-100 uppercase">2026 Season</span>
            <p className="text-stone-400 text-xs">5 Major Tournaments Scheduled</p>
          </div>
          <div className="p-4 bg-stone-800 rounded-xl text-indigo-400">
            <Calendar className="w-6 h-6 text-[#fbbf24]" />
          </div>
        </div>

      </section>

      {/* 3. Upcoming Event Spotlight & Side-by-Side announcements */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Spotlight Fixture */}
        <div className="lg:col-span-4 bg-stone-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-[#fbbf24]/40 shadow-xl relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Calendar className="w-64 h-64 text-white" />
          </div>
          
          <div className="space-y-6">
            <div className="inline-block bg-[#fbbf24]/20 border border-[#fbbf24]/50 text-[#fbbf24] px-3 py-1 rounded text-[10px] font-mono uppercase tracking-widest font-bold">
              {siteContent?.home_fixture_card_title || "★ Spotlight Fixture"}
            </div>
            
            {spotlightEvent ? (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-2xl text-stone-100 tracking-tight">
                  {spotlightEvent.title}
                </h3>
                
                <div className="space-y-2 text-sm text-stone-300 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-[#fbbf24] font-mono text-xs w-16 uppercase">Course:</span>
                    <span className="font-medium text-white">{spotlightCourse?.name || 'Loading details...'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#fbbf24] font-mono text-xs w-16 uppercase">Date:</span>
                    <span>{new Date(spotlightEvent.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#fbbf24] font-mono text-xs w-16 uppercase">Tee Time:</span>
                    <span className="bg-stone-800 border border-stone-700 px-2 py-0.5 rounded text-xs font-mono text-yellow-400">
                      ⏱️ {spotlightEvent.time}
                    </span>
                  </div>
                </div>
                
                <p className="text-stone-400 text-xs leading-relaxed italic border-l-2 border-emerald-800 pl-3">
                  {spotlightEvent.notes || 'No general notes for this event.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <p className="text-stone-400 text-sm">No upcoming fixtures scheduled.</p>
                <p className="text-stone-500 text-xs">Stay tuned for future tournament scheduling announcements.</p>
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-stone-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentTab('events')}
              className="text-white hover:text-[#fbbf24] font-display font-medium text-xs uppercase tracking-wider flex items-center gap-1 group transition-colors"
            >
              <span>View Tournament Details</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Featured News & Society Announcements */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-stone-200 text-left">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900 uppercase tracking-tight">
                Society News & Announcements
              </h2>
              <button
                onClick={() => setCurrentTab('about')} // Or keep simple
                className="text-stone-400 hover:text-stone-600 text-xs font-mono font-medium"
              >
                Category Highlights
              </button>
            </div>

            {/* Main Featured Article */}
            {mainNews && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 h-44 overflow-hidden rounded-xl border border-stone-200 shadow-inner">
                  <img 
                    src={mainNews.image} 
                    alt={mainNews.title} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://picsum.photos/seed/golfnews/600/400";
                    }}
                  />
                </div>
                <div className="md:col-span-7 space-y-3">
                  <span className="inline-block bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                    {mainNews.category}
                  </span>
                  <span className="text-stone-400 text-xs block font-mono">Published {mainNews.date}</span>
                  <h3 className="font-display font-bold text-lg text-stone-900 hover:text-emerald-800 transition-colors cursor-pointer leading-tight">
                    {mainNews.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">
                    {mainNews.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Secondary Articles list */}
            {secondaryNews.length > 0 && (
              <div className="pt-6 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                {secondaryNews.map(item => (
                  <div key={item.id} className="p-3 hover:bg-stone-50 rounded-xl transition-all border border-transparent hover:border-stone-100 space-y-1.5 text-left">
                    <span className="bg-yellow-50 border border-yellow-250 text-amber-800 text-[9px] font-mono px-2 py-0.5 rounded font-medium uppercase">
                      {item.category}
                    </span>
                    <span className="text-stone-400 text-[10px] block font-mono">{item.date}</span>
                    <h4 className="font-display font-bold text-sm text-stone-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-stone-550 text-xs line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-stone-100 text-right">
            <span className="text-[11px] text-stone-400 block font-mono italic">
              Latest news registered by the Committee Secretary.
            </span>
          </div>

        </div>

      </section>

      {/* 4. Contact / Join CTA banner */}
      <section className="bg-[#022c22] text-white p-8 sm:p-12 rounded-2xl relative overflow-hidden border border-[#fbbf24]/30 shadow-xl text-left">
        <div className="absolute right-0 bottom-0 top-0 left-0 opacity-[0.03] bg-[radial-gradient(#fbbf24_1px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-stone-100 uppercase tracking-tight">
            {siteContent?.home_cta_title || "Interested in Joining the Society?"}
          </h2>
          <p className="font-sans text-stone-300 text-sm sm:text-base leading-relaxed">
            {siteContent?.home_cta_body || "The Hit & Miss Club is always delighted to welcome prospective golfers, whether you play off single figures or are just finding your way back to 28+. Enjoy balanced tournaments, friendly reviews, and structured handicapping."}
          </p>
          <div className="flex flex-wrap gap-4 pt-2 font-mono text-xs">
            <button
              onClick={() => setCurrentTab('contact')}
              className="px-6 py-3 bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 rounded-xl font-bold uppercase transition-all duration-200 flex items-center gap-1.5 shadow"
            >
              <span>Get In Touch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentTab('about')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all duration-200 uppercase"
            >
              Join Society
            </button>
          </div>
        </div>
      </section>

      {/* Admin Editor Modal popup portal */}
      {isEditingTexts && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-stone-900 rounded-3xl border-2 border-[#fbbf24] shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 text-left relative">
            <button 
              onClick={() => setIsEditingTexts(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-150 transition"
              type="button"
            >
              ✕
            </button>

            <div className="border-b border-stone-200 pb-3">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight text-emerald-950">
                ✏️ Edit Home Section Texts
              </h3>
              <p className="text-xs text-stone-500">
                You are modifying the frontend text values of the home landing section. Changes persist immediately across sessions.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">Hero Welcome Badge</label>
                <input
                  type="text"
                  required
                  value={draftWelcomeTitle}
                  onChange={e => setDraftWelcomeTitle(e.target.value)}
                  className="w-full bg-white border border-stone-250 py-2.5 px-3.5 rounded-xl text-stone-900 font-sans text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">Hero Society Title</label>
                <input
                  type="text"
                  required
                  value={draftHeroTitle}
                  onChange={e => setDraftHeroTitle(e.target.value)}
                  className="w-full bg-white border border-stone-250 py-2.5 px-3.5 rounded-xl text-stone-900 font-sans text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">Hero Society Subtitle</label>
                <textarea
                  required
                  value={draftHeroSubtitle}
                  onChange={e => setDraftHeroSubtitle(e.target.value)}
                  rows={4}
                  className="w-full bg-white border border-stone-250 p-3 rounded-xl text-stone-900 font-sans text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">Spotlight Card Heading</label>
                <input
                  type="text"
                  required
                  value={draftSpotlightTitle}
                  onChange={e => setDraftSpotlightTitle(e.target.value)}
                  className="w-full bg-white border border-stone-250 py-2.5 px-3.5 rounded-xl text-stone-900 font-sans text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">Membership CTA Button Banner Header</label>
                <input
                  type="text"
                  required
                  value={draftCtaTitle}
                  onChange={e => setDraftCtaTitle(e.target.value)}
                  className="w-full bg-white border border-stone-250 py-2.5 px-3.5 rounded-xl text-stone-900 font-sans text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">Membership CTA Button Banner Detail Paragraph</label>
                <textarea
                  required
                  value={draftCtaBody}
                  onChange={e => setDraftCtaBody(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-stone-250 p-3 rounded-xl text-stone-900 font-sans text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-150">
                <button
                  type="button"
                  onClick={() => setIsEditingTexts(false)}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase py-3 px-4 rounded-xl text-xs tracking-wider border border-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full bg-[#064e3b] hover:bg-emerald-900 text-[#fbbf24] font-bold uppercase py-3 px-4 rounded-xl text-xs tracking-wider transition shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
