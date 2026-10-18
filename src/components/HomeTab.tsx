/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Trophy, ChevronRight, Users, Eye, HelpCircle, ArrowRight, Timer, Archive, BookOpen, Sparkles, Search, Check, X, Star } from 'lucide-react';
import { Event, NewsArticle, Member, StandingsRow, Division, StandingEntry, TournamentResult } from '../types';
import { formatAppDate, isEventLive, isEventEnded, getBaseEventId } from '../utils/dateUtils';
import LiveLeaderboardModal from './LiveLeaderboardModal';

// Countdown Timer Component
interface CountdownTimerProps {
  eventDate: string;
  eventTime?: string;
}

function CountdownTimer({ eventDate, eventTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  } | null>(null);

  React.useEffect(() => {
    const parseTargetDate = () => {
      let normalizedDate = eventDate.trim();
      
      // Strip any time part if it is an ISO string to avoid timezone shifting
      if (normalizedDate.includes('T')) {
        normalizedDate = normalizedDate.split('T')[0];
      }

      // Handle DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalizedDate)) {
        const [d, m, y] = normalizedDate.split('/');
        normalizedDate = `${y}-${m}-${d}`;
      }

      const parts = normalizedDate.split('-').map(Number);
      if (parts.length === 3) {
        // Return date parsed in UTC at midnight GMT (00:00:00)
        return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
      }
      return new Date(eventDate);
    };

    const targetDate = parseTargetDate();

    const calculateTimeLeft = () => {
      if (isNaN(targetDate.getTime())) {
        return null;
      }
      
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return { days, hours, minutes, seconds, isOver: false };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [eventDate, eventTime]);

  if (!timeLeft) return null;

  if (timeLeft.isOver) {
    return (
      <div className="mt-4 bg-emerald-950/40 border border-emerald-500/20 px-3 py-2 rounded-lg text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
        ⛳ Tee off is live!
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-2.5 border-t border-stone-800 pt-4">
      <div className="flex items-center gap-1.5 text-stone-400">
        <Timer className="w-3.5 h-3.5 text-[#fbbf24]" />
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Tee Off Countdown</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-2 shadow-sm">
          <div className="text-xl font-mono font-bold tracking-tight text-white select-none">
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div className="text-[8px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">Days</div>
        </div>
        
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-2 shadow-sm">
          <div className="text-xl font-mono font-bold tracking-tight text-[#fbbf24] select-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-[8px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">Hours</div>
        </div>
        
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-2 shadow-sm">
          <div className="text-xl font-mono font-bold tracking-tight text-stone-100 select-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-[8px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">Mins</div>
        </div>
        
        <div className="bg-stone-850 border border-stone-800 rounded-xl p-2 shadow-sm relative overflow-hidden">
          <div className="text-xl font-mono font-bold tracking-tight text-emerald-400 select-none animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-[8px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">Secs</div>
        </div>
      </div>
    </div>
  );
}

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
  manualEntries: Record<string, StandingEntry[]>;
  results?: TournamentResult[];
  setEventResults?: (eventId: string, newResults: Omit<TournamentResult, 'id' | 'eventId'>[]) => Promise<void>;
  updateEvent?: (updated: Event) => Promise<void> | void;
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
  activeSeasonId,
  manualEntries,
  results = [],
  setEventResults,
  updateEvent
}: HomeTabProps) {
  const [liveLeaderboardModalOpen, setLiveLeaderboardModalOpen] = React.useState(false);
  const [liveModalDivision, setLiveModalDivision] = React.useState<'main' | 'alternate'>('main');

  // Get today's local date string in YYYY-MM-DD format
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if an event has already ended based on its endDate or date
  const hasEventEnded = (e: Event) => {
    const targetDateStr = e.endDate || e.date;
    if (!targetDateStr) return false;

    let dateToCompare = targetDateStr.trim();
    
    // Strip time portion if it's an ISO string to avoid timezone shifting
    if (dateToCompare.includes('T')) {
      dateToCompare = dateToCompare.split('T')[0];
    }

    const ymdRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    
    if (!ymdRegex.test(dateToCompare)) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateToCompare)) {
        const [d, m, y] = dateToCompare.split('/');
        dateToCompare = `${y}-${m}-${d}`;
      } else {
        try {
          const parsed = new Date(dateToCompare);
          if (!isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            dateToCompare = `${year}-${month}-${day}`;
          }
        } catch {
          // fallback
        }
      }
    }

    const todayStr = getTodayString();
    return dateToCompare < todayStr;
  };

  // Live tournament detection (prioritizes active season, then any season)
  const liveEvent = React.useMemo(() => {
    const activeSeasonLive = events.filter(e => (!activeSeasonId || e.seasonId === activeSeasonId) && isEventLive(e));
    if (activeSeasonLive.length > 0) {
      return activeSeasonLive.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    }
    const anyLive = events.filter(e => isEventLive(e));
    return anyLive[0] || null;
  }, [events, activeSeasonId]);

  // Find closest upcoming event that has not ended yet for the active season
  const upcomingEvents = React.useMemo(() => {
    return events
      .filter(e => (!activeSeasonId || e.seasonId === activeSeasonId) && e.status !== 'Completed' && !isEventEnded(e))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, activeSeasonId]);

  // Spotlight fixture resolution:
  // 1. TOP PRIORITY: If a tournament is live, prioritise that tournament as the spotlight fixture!
  // 2. Manually selected fixture from siteContent.spotlight_event_id (if not 'auto')
  // 3. Fixture flagged with isSpotlight === true
  // 4. Fallback: closest upcoming event for the active season
  // 5. Any upcoming event or any event
  const spotlightEvent = React.useMemo(() => {
    // Top Priority: If a tournament is live, prioritize that tournament as the spotlight fixture
    if (liveEvent) {
      return liveEvent;
    }

    const configuredId = siteContent?.spotlight_event_id;
    if (configuredId && configuredId !== 'auto') {
      const match = events.find(e => e.id === configuredId);
      if (match) return match;
    }
    const markedEvent = events.find(e => (e as any).isSpotlight);
    if (markedEvent) return markedEvent;

    return upcomingEvents[0] || events.find(e => e.status !== 'Completed' && !isEventEnded(e)) || events[0] || null;
  }, [liveEvent, events, siteContent?.spotlight_event_id, upcomingEvents]);

  const isLiveSpotlight = Boolean(spotlightEvent && isEventLive(spotlightEvent));

  const isManuallySpotlighted = Boolean(
    !isLiveSpotlight &&
    siteContent?.spotlight_event_id &&
    siteContent.spotlight_event_id !== 'auto' &&
    events.some(e => e.id === siteContent.spotlight_event_id)
  );

  const spotlightCourse = spotlightEvent
    ? courses.find(c => c.id === spotlightEvent.courseId)
    : null;

  const coursePar = spotlightCourse?.par || 72;
  const isQualifier = Boolean(
    spotlightEvent &&
    (spotlightEvent.classification === 'Qualifier' ||
     spotlightEvent.title.includes('Qualifier') ||
     spotlightEvent.title.includes('(Q)'))
  );

  const getScoreVsPar = (score: number) => {
    if (score === undefined || score === null) return 0;
    if (score > 30 || score < -30) {
      return score - coursePar;
    }
    return score;
  };

  const formatScoreVsPar = (score: number) => {
    const vsPar = getScoreVsPar(score);
    if (vsPar > 0) return `+${vsPar}`;
    if (vsPar < 0) return `${vsPar}`;
    return 'E';
  };

  // Top 3 live leaderboard entries for spotlight event (Main Division)
  const spotlightMainLiveResults = React.useMemo(() => {
    if (!isLiveSpotlight || !spotlightEvent) return [];
    const isQual = spotlightEvent.classification === 'Qualifier' || spotlightEvent.title.includes('Qualifier');
    const targetId = isQual ? spotlightEvent.id : `${spotlightEvent.id}-main`;
    let res = results.filter(r => r.eventId === targetId);
    if (res.length === 0 && !isQual) {
      res = results.filter(r => r.eventId === spotlightEvent.id);
    }
    const formats = spotlightEvent.scoreDisplayFormats || ['net'];
    return res
      .sort((a, b) => {
        if (a.position !== b.position && a.position > 0 && b.position > 0) {
          return a.position - b.position;
        }
        const hasGross = formats.includes('gross');
        const hasNet = formats.includes('net');
        const hasPoints = formats.includes('points');

        const grossA = getScoreVsPar(a.grossScore);
        const grossB = getScoreVsPar(b.grossScore);
        const netA = getScoreVsPar(a.netScore);
        const netB = getScoreVsPar(b.netScore);
        const ptsA = a.points || 0;
        const ptsB = b.points || 0;

        if (hasPoints && (spotlightEvent.format === 'Stableford' || (!hasNet && !hasGross))) {
          return ptsB - ptsA || grossA - grossB;
        } else if (hasGross && !hasNet && !hasPoints) {
          return grossA - grossB || netA - netB;
        } else if (hasNet && !hasGross && !hasPoints) {
          return netA - netB || grossA - grossB;
        } else if (hasGross && hasNet) {
          return grossA - grossB || netA - netB;
        } else {
          return netA - netB || grossA - grossB;
        }
      })
      .slice(0, 3);
  }, [isLiveSpotlight, spotlightEvent, results, coursePar]);

  // Top 3 live leaderboard entries for spotlight event (Alternate Division)
  const spotlightAlternateLiveResults = React.useMemo(() => {
    if (!isLiveSpotlight || !spotlightEvent) return [];
    const isQual = spotlightEvent.classification === 'Qualifier' || spotlightEvent.title.includes('Qualifier');
    if (isQual) return [];
    const targetId = `${spotlightEvent.id}-alternate`;
    const res = results.filter(r => r.eventId === targetId);
    const formats = spotlightEvent.scoreDisplayFormats || ['net'];
    return res
      .sort((a, b) => {
        if (a.position !== b.position && a.position > 0 && b.position > 0) {
          return a.position - b.position;
        }
        const hasGross = formats.includes('gross');
        const hasNet = formats.includes('net');
        const hasPoints = formats.includes('points');

        const grossA = getScoreVsPar(a.grossScore);
        const grossB = getScoreVsPar(b.grossScore);
        const netA = getScoreVsPar(a.netScore);
        const netB = getScoreVsPar(b.netScore);
        const ptsA = a.points || 0;
        const ptsB = b.points || 0;

        if (hasPoints && (spotlightEvent.format === 'Stableford' || (!hasNet && !hasGross))) {
          return ptsB - ptsA || grossA - grossB;
        } else if (hasGross && !hasNet && !hasPoints) {
          return grossA - grossB || netA - netB;
        } else if (hasNet && !hasGross && !hasPoints) {
          return netA - netB || grossA - grossB;
        } else if (hasGross && hasNet) {
          return grossA - grossB || netA - netB;
        } else {
          return netA - netB || grossA - grossB;
        }
      })
      .slice(0, 3);
  }, [isLiveSpotlight, spotlightEvent, results, coursePar]);

  const spotlightFormats = spotlightEvent?.scoreDisplayFormats || ['net'];
  const hasGross = spotlightFormats.includes('gross');
  const hasNet = spotlightFormats.includes('net');
  const hasPoints = spotlightFormats.includes('points');

  let scoreLabel = 'Net Score';
  let scoreValueFn = (r: TournamentResult) => formatScoreVsPar(r.netScore);
  let scoreColor = 'text-emerald-400';

  if (hasGross && !hasNet && !hasPoints) {
    scoreLabel = 'Gross Score';
    scoreValueFn = (r: TournamentResult) => formatScoreVsPar(r.grossScore);
    scoreColor = 'text-indigo-300';
  } else if (hasPoints && !hasNet && !hasGross) {
    scoreLabel = 'Stableford Points';
    scoreValueFn = (r: TournamentResult) => `${r.points} PTS`;
    scoreColor = 'text-amber-300';
  } else if (hasGross) {
    scoreLabel = 'Gross Score';
    scoreValueFn = (r: TournamentResult) => formatScoreVsPar(r.grossScore);
    scoreColor = 'text-indigo-300';
  } else if (hasNet) {
    scoreLabel = 'Net Score';
    scoreValueFn = (r: TournamentResult) => formatScoreVsPar(r.netScore);
    scoreColor = 'text-emerald-400';
  }

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

  // Standings leader per division from manually managed divisional tables
  const getLeaderForDivision = (divName: string) => {
    try {
      const entries = manualEntries[divName] || [];
      if (entries.length > 0) {
        const sorted = [...entries].sort((a, b) => {
          if (a.rank && b.rank) return Number(a.rank) - Number(b.rank);
          if (b.totalPoints !== a.totalPoints) return Number(b.totalPoints) - Number(a.totalPoints);
          return Number(b.wins) - Number(a.wins);
        });
        const top = sorted[0];
        if (top) {
          return {
            playerName: top.playerName,
            totalPoints: top.totalPoints
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
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

  // Archive filtering: news over 7 days old goes to archive, rest remains active on home screen
  const activeNews = news.filter(n => getDaysOld(n.date) <= 7);
  const archivedNews = news.filter(n => getDaysOld(n.date) > 7);

  const sortedActive = [...activeNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedArchived = [...archivedNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Featured news from active list
  const mainNews = sortedActive.find(n => n.isFeatured) || sortedActive[0];
  const secondaryNews = sortedActive.filter(n => n.id !== mainNews?.id).slice(0, 2);

  const [selectedNews, setSelectedNews] = React.useState<NewsArticle | null>(null);

  // State for editor
  const [isEditingTexts, setIsEditingTexts] = React.useState(false);
  const [draftWelcomeTitle, setDraftWelcomeTitle] = React.useState('');
  const [draftHeroTitle, setDraftHeroTitle] = React.useState('');
  const [draftHeroSubtitle, setDraftHeroSubtitle] = React.useState('');
  const [draftSpotlightTitle, setDraftSpotlightTitle] = React.useState('');
  const [draftSpotlightEventId, setDraftSpotlightEventId] = React.useState('auto');
  const [showSpotlightPickerModal, setShowSpotlightPickerModal] = React.useState(false);
  const [spotlightPickerSearch, setSpotlightPickerSearch] = React.useState('');
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
          time: '12:00 AM GMT'
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
      setDraftSpotlightEventId(siteContent.spotlight_event_id || 'auto');
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
    updateSiteContent('spotlight_event_id', draftSpotlightEventId);
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-block bg-[#fbbf24]/20 border border-[#fbbf24]/50 text-[#fbbf24] px-3 py-1 rounded text-[10px] font-mono uppercase tracking-widest font-bold">
                {siteContent?.home_fixture_card_title || "★ Spotlight Fixture"}
              </div>

              {isLiveSpotlight ? (
                <span className="bg-red-500/20 text-red-300 border border-red-500/50 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold shadow-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block animate-ping"></span>
                  🔴 LIVE NOW
                </span>
              ) : isManuallySpotlighted ? (
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 font-semibold">
                  📌 Pinned Fixture
                </span>
              ) : (
                <span className="bg-stone-800 text-stone-400 border border-stone-700 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider">
                  ⚡ Auto
                </span>
              )}
            </div>
            
            {spotlightEvent ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-2xl text-stone-100 tracking-tight">
                    {spotlightEvent.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isLiveSpotlight && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                        LIVE
                      </span>
                    )}
                    {spotlightEvent.classification && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        {spotlightEvent.classification}
                      </span>
                    )}
                  </div>
                </div>
                
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
                      ⏱️ 12:00 AM GMT
                    </span>
                  </div>
                </div>
                
                <p className="text-stone-400 text-xs leading-relaxed italic border-l-2 border-emerald-800 pl-3">
                  {spotlightEvent.notes || 'No general notes for this event.'}
                </p>

                {isLiveSpotlight ? (
                  <div className="bg-red-950/40 border border-red-500/30 p-3.5 rounded-xl space-y-3 mt-4 text-xs">
                    <div className="flex items-center justify-between text-red-200 font-bold uppercase text-[11px] tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block animate-ping"></span>
                        ⛳ Tournament Live In Progress
                      </span>
                      <span className="text-[10px] font-mono text-red-300">Scoring Active ({scoreLabel})</span>
                    </div>

                    {isQualifier ? (
                      <div className="space-y-1.5 py-1">
                        <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Live Standings</span>
                          <span>{scoreLabel}</span>
                        </div>
                        <div className="space-y-1">
                          {spotlightMainLiveResults.length > 0 ? (
                            spotlightMainLiveResults.map((r, idx) => {
                              const mem = members.find(m => m.id === r.playerId);
                              return (
                                <div key={r.id || idx} className="flex items-center justify-between bg-stone-900/90 px-2.5 py-1.5 rounded-lg border border-red-500/20 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold text-[9px] ${
                                      r.position === 1 ? 'bg-amber-400 text-stone-950' : r.position === 2 ? 'bg-stone-300 text-stone-900' : 'bg-amber-700 text-white'
                                    }`}>
                                      {r.position}
                                    </span>
                                    <span className="font-semibold text-stone-200">{mem?.name || 'Member'}</span>
                                    {r.thru && (
                                      <span className="text-[9px] font-mono text-red-300 bg-red-950/80 px-1 py-0.2 rounded border border-red-800/80">
                                        {r.thru === 'F' ? 'F' : `Thru ${r.thru}`}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`font-mono font-bold ${scoreColor}`}>
                                    {scoreValueFn(r)}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-stone-300 text-xs py-2">No scores recorded yet for this qualifier.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Main Division Standings Board */}
                        <div className="bg-stone-900/90 p-2.5 rounded-xl border border-emerald-500/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-emerald-300 uppercase flex items-center gap-1">
                              🏆 Main Division Standings
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLiveModalDivision('main');
                                setLiveLeaderboardModalOpen(true);
                              }}
                              className="text-[10px] text-stone-300 hover:text-white underline cursor-pointer"
                            >
                              Open Main Board →
                            </button>
                          </div>
                          {spotlightMainLiveResults.length > 0 ? (
                            <div className="space-y-1">
                              {spotlightMainLiveResults.map((r, idx) => {
                                const mem = members.find(m => m.id === r.playerId);
                                return (
                                  <div key={r.id || idx} className="flex items-center justify-between bg-stone-950 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[9px]">
                                        {r.position}
                                      </span>
                                      <span className="font-semibold text-stone-200">{mem?.name || 'Member'}</span>
                                      {r.thru && (
                                        <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950/80 px-1 py-0.2 rounded">
                                          {r.thru === 'F' ? 'F' : `Thru ${r.thru}`}
                                        </span>
                                      )}
                                    </div>
                                    <span className={`font-mono font-bold ${scoreColor}`}>
                                      {scoreValueFn(r)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-stone-400 text-[11px] italic py-1">No main division live scores posted yet.</p>
                          )}
                        </div>

                        {/* Alternate Division Standings Board */}
                        <div className="bg-stone-900/90 p-2.5 rounded-xl border border-amber-500/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-amber-300 uppercase flex items-center gap-1">
                              ⛳ Alternate Division Standings
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLiveModalDivision('alternate');
                                setLiveLeaderboardModalOpen(true);
                              }}
                              className="text-[10px] text-stone-300 hover:text-white underline cursor-pointer"
                            >
                              Open Alternate Board →
                            </button>
                          </div>
                          {spotlightAlternateLiveResults.length > 0 ? (
                            <div className="space-y-1">
                              {spotlightAlternateLiveResults.map((r, idx) => {
                                const mem = members.find(m => m.id === r.playerId);
                                return (
                                  <div key={r.id || idx} className="flex items-center justify-between bg-stone-950 px-2.5 py-1.5 rounded-lg border border-amber-500/20 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-mono font-bold text-[9px]">
                                        {r.position}
                                      </span>
                                      <span className="font-semibold text-stone-200">{mem?.name || 'Member'}</span>
                                      {r.thru && (
                                        <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded">
                                          {r.thru === 'F' ? 'F' : `Thru ${r.thru}`}
                                        </span>
                                      )}
                                    </div>
                                    <span className={`font-mono font-bold ${scoreColor}`}>
                                      {scoreValueFn(r)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-stone-400 text-[11px] italic py-1">No alternate division live scores posted yet.</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setLiveModalDivision('main');
                          setLiveLeaderboardModalOpen(true);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-sm"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-300" />
                        <span>🏆 Main Live Board</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLiveModalDivision('alternate');
                          setLiveLeaderboardModalOpen(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-sm"
                      >
                        <Trophy className="w-3.5 h-3.5 text-stone-950" />
                        <span>⛳ Alternate Live Board</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <CountdownTimer eventDate={spotlightEvent.date} eventTime={spotlightEvent.time} />
                )}
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <p className="text-stone-400 text-sm">No upcoming fixtures scheduled.</p>
                <p className="text-stone-500 text-xs">Stay tuned for future tournament scheduling announcements.</p>
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              onClick={() => setCurrentTab('events')}
              className="text-white hover:text-[#fbbf24] font-display font-medium text-xs uppercase tracking-wider flex items-center gap-1 group transition-colors"
            >
              <span>View Tournament Details</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSpotlightPickerModal(true)}
                  className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/50 hover:border-amber-400 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Choose which tournament fixture to highlight here"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Spotlight</span>
                </button>

                {isManuallySpotlighted && (
                  <button
                    type="button"
                    onClick={() => updateSiteContent('spotlight_event_id', 'auto')}
                    className="text-stone-400 hover:text-white text-[11px] underline font-mono cursor-pointer transition-colors"
                    title="Revert to closest upcoming fixture"
                  >
                    Reset Auto
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Featured News & Society Announcements */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-stone-200 text-left">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-100 pb-5 gap-4">
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900 uppercase tracking-tight flex items-center gap-2">
                  <span>Society News & Announcements</span>
                </h2>
                <p className="text-xs text-stone-400 mt-0.5 font-mono">
                  Recent updates within the last 7 days
                </p>
              </div>
              
              {/* Option to select and view any archived news - PERMANENTLY VISIBLE */}
              <div className={`flex items-center gap-2 self-start md:self-center bg-[#064e3b] px-3.5 py-1.5 rounded-xl border border-[#fbbf24] shadow-md transition-all select-none ${archivedNews.length === 0 ? 'opacity-65 cursor-not-allowed' : 'hover:bg-emerald-900 cursor-pointer'}`}>
                <Archive className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#fbbf24] whitespace-nowrap">Archive Lookup:</span>
                <div className="relative flex items-center">
                  <select
                    id="card-archive-selector-dropdown"
                    disabled={archivedNews.length === 0}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id) {
                        const selected = archivedNews.find(n => n.id === id);
                        if (selected) {
                          setSelectedNews(selected);
                        }
                        e.target.value = ''; // Reset select
                      }
                    }}
                    className="bg-transparent text-white text-xs font-bold rounded pl-1 pr-6 py-0.5 focus:outline-none focus:ring-0 font-sans cursor-pointer appearance-none outline-none max-w-[140px] sm:max-w-[200px] truncate disabled:cursor-not-allowed"
                  >
                    {archivedNews.length === 0 ? (
                      <option value="" className="bg-[#064e3b] text-white font-bold">No Archived Bulletins</option>
                    ) : (
                      <>
                        <option value="" className="bg-[#064e3b] text-white font-bold">Select Bulletin...</option>
                        {sortedArchived.map(item => (
                          <option key={item.id} value={item.id} className="bg-[#064e3b] text-white">
                            [{formatAppDate(item.date)}] {item.title}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <span className="absolute right-1 text-[#fbbf24] text-[9px] pointer-events-none select-none">▼</span>
                </div>
              </div>
            </div>

            {/* Empty state if no news or announcements in the last 7 days */}
            {!mainNews && (
              <div className="text-center py-10 px-5 sm:px-8 bg-stone-50/60 rounded-3xl border border-dashed border-stone-205 space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                  <Archive className="w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-stone-800 text-base">No Bulletins in the Last 7 Days</h3>
                  <p className="text-stone-500 text-xs max-w-md mx-auto leading-relaxed">
                    There are no dynamic announcements published within this past week. However, the Society's entire historic bulletins catalog remains archived and accessible:
                  </p>
                </div>

                {archivedNews.length > 0 ? (
                  <div className="max-w-xs sm:max-w-md mx-auto bg-white p-4 rounded-2xl border border-emerald-800/15 shadow-sm space-y-2">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#064e3b]">
                      Open an Archived Society Bulletin / Wrap-up:
                    </label>
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id) {
                            const selected = archivedNews.find(n => n.id === id);
                            if (selected) {
                              setSelectedNews(selected);
                            }
                            e.target.value = ''; // Reset select
                          }
                        }}
                        className="w-full bg-stone-50 border-2 border-emerald-800 hover:border-emerald-920 text-stone-900 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 shadow-inner transition-all focus:outline-none focus:ring-1 focus:ring-emerald-800 outline-none appearance-none cursor-pointer text-left animate-pulse"
                      >
                        <option value="">Choose and read archived bulletin...</option>
                        {sortedArchived.map(item => (
                          <option key={item.id} value={item.id}>
                            [{formatAppDate(item.date)}] {item.title}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                      </div>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto bg-stone-50 p-4 rounded-2xl border border-stone-200/65 text-center text-xs text-stone-500 space-y-1">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-500">System Registry Status</p>
                    <p>No archived bulletins are currently available in the database registry.</p>
                  </div>
                )}
              </div>
            )}

            {/* Main Featured Article (only if active) */}
            {mainNews && (
              <div 
                onClick={() => setSelectedNews(mainNews)}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center cursor-pointer group hover:bg-stone-50/50 p-4 rounded-2xl transition"
              >
                <div className="md:col-span-5 h-44 overflow-hidden rounded-xl border border-stone-200 shadow-inner">
                  <img 
                    src={mainNews.image} 
                    alt={mainNews.title} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
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
                  <span className="text-stone-400 text-xs block font-mono">Published {formatAppDate(mainNews.date)}</span>
                  <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-emerald-800 transition-colors leading-tight">
                    {mainNews.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">
                    {mainNews.summary}
                  </p>
                  <span className="text-xs text-emerald-800 font-bold group-hover:underline flex items-center gap-1 font-mono">
                    Read Announcement &rarr;
                  </span>
                </div>
              </div>
            )}

            {/* Secondary Articles list (only if active) */}
            {secondaryNews.length > 0 && (
              <div className="pt-6 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                {secondaryNews.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedNews(item)}
                    className="p-3 hover:bg-stone-50 rounded-xl transition-all border border-transparent hover:border-stone-100 space-y-1.5 text-left cursor-pointer group"
                  >
                    <span className="bg-yellow-50 border border-yellow-250 text-amber-800 text-[9px] font-mono px-2 py-0.5 rounded font-medium uppercase">
                      {item.category}
                    </span>
                    <span className="text-stone-400 text-[10px] block font-mono">{formatAppDate(item.date)}</span>
                    <h4 className="font-display font-bold text-sm text-stone-900 leading-snug group-hover:text-emerald-800 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-stone-550 text-xs line-clamp-2">
                      {item.summary}
                    </p>
                    <span className="text-[10px] text-emerald-800 font-bold group-hover:underline flex items-center gap-0.5 font-mono pt-1">
                      Read announcement &rarr;
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Archived News List */}
            {archivedNews.length > 0 && (
              <div className="mt-8 pt-6 border-t border-stone-150">
                <h3 className="font-display font-bold text-stone-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span>📁 Historical Bulletins Archive ({archivedNews.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {sortedArchived.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedNews(item)}
                      className="flex items-start gap-3 p-3 bg-stone-50/70 hover:bg-stone-100/90 border border-stone-150 rounded-xl cursor-pointer hover:shadow-sm transition group"
                    >
                      <div className="flex-1 min-w-0 space-y-1 text-left">
                        <span className="text-[9px] font-mono text-stone-400 block font-bold">
                          {formatAppDate(item.date)} • {item.category}
                        </span>
                        <h4 className="font-display font-bold text-xs text-stone-800 truncate group-hover:text-emerald-800 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 line-clamp-1">
                          {item.summary}
                        </p>
                      </div>
                      <span className="text-stone-400 group-hover:text-amber-600 text-[10px] font-mono font-bold self-center">&rarr;</span>
                    </div>
                  ))}
                </div>
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">Featured Spotlight Fixture</label>
                  <span className="text-[10px] text-stone-500 font-mono">Homepage Card Fixture</span>
                </div>
                <select
                  value={draftSpotlightEventId}
                  onChange={e => setDraftSpotlightEventId(e.target.value)}
                  className="w-full bg-white border border-stone-250 py-2.5 px-3.5 rounded-xl text-stone-900 font-sans text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="auto">⚡ Auto (Prioritizes Live Tournament, then Closest Upcoming)</option>
                  {events.map(ev => {
                    const c = courses.find(course => course.id === ev.courseId);
                    const isLive = isEventLive(ev);
                    return (
                      <option key={ev.id} value={ev.id}>
                        {isLive ? '🔴 [LIVE NOW] ' : ''}{formatAppDate(ev.date)} — {ev.title} ({c?.name || 'Unknown Course'}) [{ev.classification || 'Standard'} &middot; {isLive ? 'Live' : ev.status}]
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-stone-500 italic">
                  Select a specific tournament fixture to pin to the spotlight card, or choose Auto to dynamically prioritize active live tournaments or nearest upcoming fixtures.
                </p>
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

      {/* Dedicated Spotlight Fixture Selection Modal */}
      {showSpotlightPickerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-stone-900 rounded-3xl border-2 border-amber-400/80 shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col text-left relative">
            <button
              onClick={() => {
                setShowSpotlightPickerModal(false);
                setSpotlightPickerSearch('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-stone-200 pb-4 pr-8">
              <div className="inline-block bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest font-bold mb-1.5">
                ★ Admin Spotlight Controls
              </div>
              <h3 className="font-display font-black text-xl uppercase tracking-tight text-stone-900 flex items-center gap-2">
                <span>Select Spotlight Fixture</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Choose which tournament fixture is prominently featured on the society homepage. Changes update in real-time across all devices.
              </p>
            </div>

            {/* Quick Auto Option */}
            <div className="pt-4 pb-2">
              <div 
                onClick={() => {
                  updateSiteContent('spotlight_event_id', 'auto');
                  setShowSpotlightPickerModal(false);
                  setSpotlightPickerSearch('');
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  !isManuallySpotlighted
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20'
                    : 'bg-stone-50 border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase text-stone-900 flex items-center gap-1.5">
                      <span>⚡ Auto (Prioritizes Live Tournament, then Closest Upcoming)</span>
                    </span>
                    {!isManuallySpotlighted && (
                      <span className="bg-amber-400 text-stone-900 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                        Active Mode
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Prioritizes any tournament currently in progress today. If no tournament is live, dynamically highlights the nearest upcoming fixture.
                  </p>
                </div>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    !isManuallySpotlighted
                      ? 'bg-amber-400 text-stone-900 shadow-xs'
                      : 'bg-stone-200 text-stone-700 hover:bg-amber-400 hover:text-stone-900'
                  }`}
                >
                  {!isManuallySpotlighted ? 'Selected' : 'Use Auto'}
                </button>
              </div>
            </div>

            {/* Search filter for fixtures */}
            <div className="relative my-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search fixtures by tournament name or venue..."
                value={spotlightPickerSearch}
                onChange={e => setSpotlightPickerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:bg-white"
              />
            </div>

            {/* Fixture List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {events
                .filter(ev => {
                  if (!spotlightPickerSearch.trim()) return true;
                  const q = spotlightPickerSearch.toLowerCase();
                  const c = courses.find(course => course.id === ev.courseId);
                  return ev.title.toLowerCase().includes(q) || (c && c.name.toLowerCase().includes(q));
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(ev => {
                  const c = courses.find(course => course.id === ev.courseId);
                  const isCurrentActive = spotlightEvent?.id === ev.id;
                  const isExplicitlyPinned = siteContent?.spotlight_event_id === ev.id;
                  const isLive = isEventLive(ev);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        updateSiteContent('spotlight_event_id', ev.id);
                        setShowSpotlightPickerModal(false);
                        setSpotlightPickerSearch('');
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isExplicitlyPinned
                          ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-400/40'
                          : isLive
                            ? 'bg-red-50/60 border-red-300 ring-1 ring-red-400/30'
                            : isCurrentActive
                              ? 'bg-stone-50 border-amber-300'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs uppercase text-stone-900 truncate">
                            {ev.title}
                          </span>
                          {isLive && (
                            <span className="bg-red-500/15 text-red-700 border border-red-300 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-ping"></span>
                              🔴 Live Now
                            </span>
                          )}
                          {ev.classification === 'Major' ? (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-amber-200">
                              🏆 Major
                            </span>
                          ) : ev.classification === 'Qualifier' ? (
                            <span className="bg-purple-100 text-purple-800 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-purple-200">
                              ⭐ Qualifier
                            </span>
                          ) : (
                            <span className="bg-stone-100 text-stone-600 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded">
                              {ev.classification || 'Standard'}
                            </span>
                          )}
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            ev.status === 'Completed' ? 'bg-stone-100 text-stone-500' : isLive ? 'bg-red-100 text-red-800 font-bold' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isLive ? 'Live' : ev.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-stone-500 font-sans">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            {formatAppDate(ev.date)}
                          </span>
                          <span className="truncate">
                            ⛳ {c?.name || 'Unknown Course'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isExplicitlyPinned ? (
                          <span className="bg-amber-400 text-stone-900 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                            Pinned
                          </span>
                        ) : isCurrentActive ? (
                          <span className={`${isLive ? 'bg-red-500 text-white font-black' : 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'} text-[10px] uppercase px-2 py-1 rounded-lg shadow-xs`}>
                            {isLive ? '🔴 Live Spotlight' : 'Auto Pick'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="bg-stone-100 hover:bg-amber-400 hover:text-stone-900 text-stone-700 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            Spotlight
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              {events.length === 0 && (
                <p className="text-xs text-stone-400 italic py-6 text-center">
                  No tournament fixtures found. Create one in the Events tab first.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSpotlightPickerModal(false);
                  setSpotlightPickerSearch('');
                }}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase py-2 px-4 rounded-xl text-xs tracking-wider border border-stone-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
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

      {/* Selected Announcement Reader Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-stone-900 rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 text-left relative font-sans">
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              type="button"
              aria-label="Close Announcement"
            >
              ✕
            </button>

            {/* Banner Category & Date Header */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-0.5 rounded uppercase">
                {selectedNews.category}
              </span>
              <span className="text-stone-400">
                Published {formatAppDate(selectedNews.date)}
              </span>
              {selectedNews.author && (
                <span className="text-stone-500">
                  by {selectedNews.author}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-display font-black text-2xl text-stone-900 leading-tight border-b border-stone-100 pb-3">
              {selectedNews.title}
            </h3>

            {/* Image Banner */}
            {selectedNews.image && (
              <div className="h-64 sm:h-72 w-full overflow-hidden rounded-2xl border border-stone-200 shadow-inner select-none">
                <img
                  src={selectedNews.image}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/golfnews/800/600";
                  }}
                />
              </div>
            )}

            {/* Summary Block */}
            {selectedNews.summary && (
              <p className="text-stone-550 italic bg-stone-50 p-4 border-l-4 border-[#fbbf24] rounded-r-xl leading-relaxed text-sm">
                "{selectedNews.summary}"
              </p>
            )}

            {/* Full Length Content Body */}
            <div className="space-y-4 text-stone-800 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedNews.content || "No extended text contents registered for this bulletin."}
            </div>

            {/* Close Button Action */}
            <div className="pt-4 border-t border-stone-150 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="bg-[#064e3b] hover:bg-[#022c22] text-[#fbbf24] font-bold uppercase py-2.5 px-6 rounded-xl text-xs tracking-wider transition shadow-md focus:outline-none"
              >
                Close Bulletin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Tournament Leaderboard Modal from Spotlight Card */}
      {liveLeaderboardModalOpen && spotlightEvent && (
        <LiveLeaderboardModal
          isOpen={liveLeaderboardModalOpen}
          onClose={() => setLiveLeaderboardModalOpen(false)}
          event={spotlightEvent}
          course={spotlightCourse}
          members={members}
          results={results}
          isAdmin={isAdmin}
          defaultDivision={liveModalDivision}
          onSaveResults={async (targetId, newRes) => {
            if (setEventResults) {
              await setEventResults(targetId, newRes);
            }
          }}
          onUpdateEvent={async (updated) => {
            if (updateEvent) {
              await updateEvent(updated);
            }
          }}
        />
      )}

    </div>
  );
}
