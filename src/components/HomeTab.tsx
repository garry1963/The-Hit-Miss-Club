/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Trophy, ChevronRight, Users, Eye, HelpCircle, ArrowRight } from 'lucide-react';
import { Event, NewsArticle, Member, StandingsRow, Division } from '../types';
import { formatAppDate } from '../utils/dateUtils';

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
  divisions: Division[];
  addEvent: (e: Omit<Event, 'id'>) => Promise<any>;
  activeSeasonId: string;
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
  updateSiteContent,
  divisions,
  addEvent,
  activeSeasonId
}: HomeTabProps) {
  // Find closest upcoming event
  const upcomingEvents = events
    .filter(e => e.status === 'Upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const spotlightEvent = upcomingEvents[0];
  const spotlightCourse = spotlightEvent
    ? courses.find(c => c.id === spotlightEvent.courseId)
    : null;

  // Resolve all unique divisions active or configured
  const allDivisions = React.useMemo(() => {
    const divNames = new Set<string>();
    // Start with default/configured divisions
    divNames.add('Premier Division');
    divNames.add('Championship Division');
    if (divisions) {
      divisions.forEach(d => {
        if (d.name) divNames.add(d.name);
      });
    }
    // Fallback: search members in case of other legacy names
    members.forEach(m => {
      if (m.division) divNames.add(m.division);
    });
    return Array.from(divNames);
  }, [divisions, members]);

  // Standings leader per division
  const getLeaderForDivision = (divName: string) => {
    const list = standings.filter(row => {
      const member = members.find(m => m.id === row.playerId);
      const mDiv = member?.division || 'Premier Division';
      return mDiv === divName;
    });
    // Sort logic exactly matches useSocietyState standings calculation:
    // sorting by totalPoints descending, wins descending, eventsPlayed descending, handicap ascending
    list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.eventsPlayed !== a.eventsPlayed) return b.eventsPlayed - a.eventsPlayed;
      return a.handicap - b.handicap;
    });
    return list[0] || null;
  };

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

  // Scheduler Tool states
  const [showScheduleModal, setShowScheduleModal] = React.useState(false);
  const [isPublishingSchedule, setIsPublishingSchedule] = React.useState(false);
  const [scheduleError, setScheduleError] = React.useState('');
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = React.useState('');
  const [scheduleRows, setScheduleRows] = React.useState<Array<{
    name: string;
    type: 'Qualifier' | 'Standard' | 'Major';
    startDate: string;
    endDate: string;
    courseId: string;
    notes: string;
  }>>([]);

  const addScheduleRow = () => {
    const initialCourseId = courses && courses.length > 0 ? courses[0].id : '';
    setScheduleRows([
      ...scheduleRows,
      { name: '', type: 'Standard', startDate: '', endDate: '', courseId: initialCourseId, notes: '' }
    ]);
  };

  const removeScheduleRow = (idx: number) => {
    setScheduleRows(scheduleRows.filter((_, i) => i !== idx));
  };

  const handlePublishSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSuccessMsg('');

    if (scheduleRows.length === 0) {
      setScheduleError('Please add at least one tournament event row.');
      return;
    }

    const invalidRow = scheduleRows.find(
      (r) => !r.name.trim() || !r.startDate || !r.courseId
    );
    if (invalidRow) {
      setScheduleError('Please fill in Name, Start Date, and Course for all scheduled tournament rows.');
      return;
    }

    setIsPublishingSchedule(true);
    try {
      for (const row of scheduleRows) {
        const payload = {
          seasonId: activeSeasonId,
          title: row.name.trim(),
          courseId: row.courseId,
          date: row.startDate,
          endDate: row.endDate || row.startDate,
          roundsCount: 1,
          format: 'Stableford' as const,
          classification: row.type,
          status: 'Upcoming' as const,
          notes: row.notes.trim() || '',
          time: '09:00 AM'
        };
        await addEvent(payload);
      }
      setScheduleSuccessMsg(`${scheduleRows.length} tournament events successfully published to the club calendar!`);
      setTimeout(() => {
        setShowScheduleModal(false);
        setScheduleSuccessMsg('');
        setScheduleRows([]);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setScheduleError(err?.message || 'Underlying database write error. Confirm you are authenticated as active administrator.');
    } finally {
      setIsPublishingSchedule(false);
    }
  };

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

      {/* Home Screen Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 border border-stone-200 p-6 rounded-2xl shadow-sm text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <span className="text-emerald-700">⛳</span> Club House Hub
          </h2>
          <p className="text-xs text-stone-500">
            {isAdmin 
              ? "Configure league fixtures, manage handicaps, and deploy real-time tournament schedules." 
              : "Explore current league fixtures, check handicaps, and view real-time tournament schedules."}
          </p>
        </div>
        <button
          onClick={() => {
            if (isAdmin) {
              const initialCourseId = courses && courses.length > 0 ? courses[0].id : '';
              setScheduleRows([
                { name: 'Spring Cup Opening', type: 'Standard', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], courseId: initialCourseId, notes: 'Opening event selection' },
                { name: 'Midsummer Showcase', type: 'Major', startDate: '', endDate: '', courseId: initialCourseId, notes: 'Society summer showcase' }
              ]);
            }
            setScheduleError('');
            setScheduleSuccessMsg('');
            setShowScheduleModal(true);
          }}
          className="bg-[#064e3b] hover:bg-[#022c22] text-[#fbbf24] font-bold text-xs uppercase px-5 py-3 rounded-xl border border-emerald-950/20 shadow-md flex items-center gap-2 transition"
        >
          <Calendar className="w-4 h-4 shrink-0 text-[#fbbf24]" />
          <span>{isAdmin ? "Tournament Schedule Tool" : "View Tournament Schedule"}</span>
        </button>
      </div>

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
          className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-[#fbbf24] flex flex-col justify-between cursor-pointer hover:border-amber-500 transition-all text-left"
        >
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 text-xs font-mono tracking-wider uppercase block">Standings Leaders</span>
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            </div>
            
            <div className="space-y-2.5">
              {allDivisions.map((divName) => {
                const leader = getLeaderForDivision(divName);
                const shortDivName = divName.replace(' Division', '');
                return (
                  <div key={divName} className="flex items-center justify-between gap-2 border-b border-stone-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-display font-bold text-stone-900 text-sm truncate">
                        {leader ? leader.playerName : 'Pending...'}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold whitespace-nowrap shrink-0">
                        {shortDivName}
                      </span>
                    </div>
                    <span className="text-amber-600 text-[10px] sm:text-xs font-extrabold font-mono whitespace-nowrap shrink-0 bg-amber-50 px-1.5 py-0.5 rounded-md">
                      {leader ? `${leader.totalPoints} PTS` : '0 PTS'}
                    </span>
                  </div>
                );
              })}
            </div>
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
                    <span>{formatAppDate(spotlightEvent.date)}</span>
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

      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-stone-900 rounded-3xl border-2 border-emerald-800 shadow-2xl p-6 sm:p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto space-y-6 text-left relative">
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              type="button"
            >
              ✕
            </button>

            <div className="border-b border-stone-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#064e3b]">
                  {isAdmin ? "🗓️ Quick Tournament Scheduler" : "🗓️ View Club Tournament Schedule"}
                </h3>
                <p className="text-xs text-stone-500">
                  {isAdmin 
                    ? "Compile multiple event fixtures at once using this simple table editor. Add rows, adjust details, and deploy." 
                    : "Explore officially scheduled tournament fixtures, event classifications, and hosting venues."}
                </p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={addScheduleRow}
                  className="bg-[#064e3b]/5 hover:bg-[#064e3b]/10 text-[#064e3b] font-bold text-xs uppercase px-4 py-2 rounded-lg border border-emerald-850/20 transition self-start sm:self-center"
                >
                  + Add Tournament Row
                </button>
              )}
            </div>

            {isAdmin && scheduleError && (
              <div className="text-xs text-red-650 bg-red-50 p-3 rounded-xl border border-red-100 font-medium animate-pulse">
                ⚠️ {scheduleError}
              </div>
            )}

            {isAdmin && scheduleSuccessMsg && (
              <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-250 font-bold shrink-0">
                ✓ {scheduleSuccessMsg}
              </div>
            )}

            <form onSubmit={handlePublishSchedule} className="space-y-6">
              <div className="overflow-x-auto border border-stone-200 rounded-xl shadow-inner bg-stone-50">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-stone-100 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                      <th className="p-3">Event Name</th>
                      <th className="p-3 w-32">Event Type</th>
                      <th className="p-3 w-36">Start Date</th>
                      <th className="p-3 w-36">End Date</th>
                      <th className="p-3 w-48">Course</th>
                      <th className="p-3 min-w-[120px]">Notes</th>
                      {isAdmin && <th className="p-3 w-12 text-center"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {!isAdmin ? (
                      events.filter(e => !activeSeasonId || e.seasonId === activeSeasonId).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                            No tournament events have been officially scheduled for this campaign yet.
                          </td>
                        </tr>
                      ) : (
                        events
                          .filter(e => !activeSeasonId || e.seasonId === activeSeasonId)
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((ev) => {
                            const course = courses.find(c => c.id === ev.courseId);
                            let typeBadgeStyle = "bg-stone-100 text-stone-800 border-stone-200";
                            if (ev.classification === "Major") {
                              typeBadgeStyle = "bg-amber-50 text-amber-800 border-amber-250/30";
                            } else if (ev.classification === "Qualifier") {
                              typeBadgeStyle = "bg-indigo-50 text-indigo-805 border-indigo-250/30";
                            } else if (ev.classification === "Standard") {
                              typeBadgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                            }
                            return (
                              <tr key={ev.id} className="border-b border-stone-150 last:border-0 hover:bg-stone-55 bg-white">
                                <td className="p-3 font-semibold text-stone-900">{ev.title}</td>
                                <td className="p-3">
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeBadgeStyle}`}>
                                    {ev.classification || 'Standard'}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-stone-500">{formatAppDate(ev.date)}</td>
                                <td className="p-3 font-mono text-stone-500">{formatAppDate(ev.endDate || ev.date)}</td>
                                <td className="p-3 font-medium text-stone-800">
                                  {course ? `${course.name} (${course.location})` : 'TBD Golf Course'}
                                </td>
                                <td className="p-3 text-stone-605 italic">{ev.notes || 'No custom notes provided.'}</td>
                              </tr>
                            );
                          })
                      )
                    ) : (
                      scheduleRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                            No tournament events added yet. Click "+ Add Tournament Row" above to begin.
                          </td>
                        </tr>
                      ) : (
                        scheduleRows.map((row, index) => (
                          <tr key={index} className="border-b border-stone-150 last:border-0 hover:bg-stone-50/50 bg-white">
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                placeholder="e.g. Autumn Stableford Cup"
                                value={row.name}
                                onChange={(e) => {
                                  const draft = [...scheduleRows];
                                  draft[index].name = e.target.value;
                                  setScheduleRows(draft);
                                }}
                                className="w-full p-2 bg-white border border-stone-200 rounded focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] text-xs font-semibold text-stone-900 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.type}
                                onChange={(e) => {
                                  const draft = [...scheduleRows];
                                  draft[index].type = e.target.value as any;
                                  setScheduleRows(draft);
                                }}
                                className="w-full p-2 bg-white border border-stone-200 rounded focus:border-[#064e3b] text-xs font-medium focus:ring-1 focus:ring-[#064e3b] text-stone-850 focus:outline-none"
                              >
                                <option value="Standard">Standard</option>
                                <option value="Major">Major</option>
                                <option value="Qualifier">Qualifier</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                required
                                value={row.startDate}
                                onChange={(e) => {
                                  const draft = [...scheduleRows];
                                  draft[index].startDate = e.target.value;
                                  if (!draft[index].endDate || draft[index].endDate < e.target.value) {
                                    draft[index].endDate = e.target.value;
                                  }
                                  setScheduleRows(draft);
                                }}
                                className="w-full p-2 bg-white border border-stone-200 rounded focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] text-xs font-mono focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={row.endDate}
                                onChange={(e) => {
                                  const draft = [...scheduleRows];
                                  draft[index].endDate = e.target.value;
                                  setScheduleRows(draft);
                                }}
                                className="w-full p-2 bg-white border border-stone-200 rounded focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] text-xs font-mono focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.courseId}
                                required
                                onChange={(e) => {
                                  const draft = [...scheduleRows];
                                  draft[index].courseId = e.target.value;
                                  setScheduleRows(draft);
                                }}
                                className="w-full p-2 bg-white border border-stone-200 rounded focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] text-xs focus:outline-none"
                              >
                                <option value="">-- Choose Golf Course --</option>
                                {courses && courses.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.location})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="e.g. Tee off at 9am, max handicap limit 28"
                                value={row.notes}
                                onChange={(e) => {
                                  const draft = [...scheduleRows];
                                  draft[index].notes = e.target.value;
                                  setScheduleRows(draft);
                                }}
                                className="w-full p-2 bg-white border border-stone-200 rounded focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b] text-xs text-stone-700 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeScheduleRow(index)}
                                className="p-1 px-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition font-bold"
                                title="Delete Row"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {isAdmin ? (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-150">
                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setScheduleRows([]);
                    }}
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase py-3 px-4 rounded-xl text-xs tracking-wider border border-stone-200 transition focus:outline-none"
                    disabled={isPublishingSchedule}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full bg-[#064e3b] disabled:bg-stone-300 disabled:text-stone-500 hover:bg-[#022c22] text-[#fbbf24] font-bold uppercase py-3 px-4 rounded-xl text-xs tracking-wider transition shadow-md flex items-center justify-center gap-2 focus:outline-none"
                    disabled={isPublishingSchedule || scheduleRows.length === 0}
                  >
                    {isPublishingSchedule ? (
                      <span>Publishing Schedule...</span>
                    ) : (
                      <span>Publish Schedule</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex justify-end pt-3 border-t border-stone-150">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="bg-[#064e3b] hover:bg-[#022c22] text-[#fbbf24] font-bold uppercase py-3 px-6 rounded-xl text-xs tracking-wider transition shadow-md focus:outline-none"
                  >
                    Close Schedule
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
