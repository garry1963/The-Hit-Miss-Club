/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Member, Season, Division, GolfCourse, Event, TournamentResult, NewsArticle, GalleryImage, StandingsRow, StandingEntry, VisitorLog, VisitorStats } from './types';
import { DEFAULT_SITE_CONTENT } from './defaultContent';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreError';
import { getBaseEventId } from './utils/dateUtils';

const STORAGE_KEY_PREFIX = 'hit_and_miss_club_v1_';

function cleanUndefined<T extends object>(obj: T): T {
  const cleaned = { ...obj } as any;
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

export function useSocietyState() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'isAdmin');
    return saved ? JSON.parse(saved) : false;
  });

  const [activeSeasonId, setActiveSeasonId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'activeSeasonId');
    return saved || '';
  });

  // Load state helper (fallback / fast-cache)
  const getStored = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing localStorage for ' + key, e);
      }
    }
    return defaultValue;
  };

  // State definitions (initialized with cached state for zero layout shifts)
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'adminPassword');
    return saved || 'admin';
  });

  const [members, setMembers] = useState<Member[]>(() => getStored('members', []));
  const [seasons, setSeasons] = useState<Season[]>(() => getStored('seasons', []));
  const [divisions, setDivisions] = useState<Division[]>(() => getStored('divisions', []));
  const [courses, setCourses] = useState<GolfCourse[]>(() => getStored('courses', []));
  const [events, setEvents] = useState<Event[]>(() => getStored('events', []));
  const [results, setResults] = useState<TournamentResult[]>(() => getStored('results', []));
  const [news, setNews] = useState<NewsArticle[]>(() => getStored('news', []));
  const [gallery, setGallery] = useState<GalleryImage[]>(() => getStored('gallery', []));
  const [siteContent, setSiteContent] = useState<Record<string, string>>(() => getStored('siteContent', DEFAULT_SITE_CONTENT));
  const [manualEntries, setManualEntries] = useState<Record<string, StandingEntry[]>>(() => {
    const saved = localStorage.getItem('hit_and_miss_club_manual_entries');
    return saved ? JSON.parse(saved) : {};
  });
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>(() => getStored('visitorLogs', []));

  // Connection test on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Sync state to local storage to maintain immediate rendering on next reload
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'adminPassword', adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'isAdmin', JSON.stringify(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'activeSeasonId', activeSeasonId);
  }, [activeSeasonId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'seasons', JSON.stringify(seasons));
  }, [seasons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'divisions', JSON.stringify(divisions));
  }, [divisions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'siteContent', JSON.stringify(siteContent));
  }, [siteContent]);

  // Real-time Firestore Sync Listeners
  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const list: Member[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Member);
      });
      setMembers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'members');
    });

    const unsubSeasons = onSnapshot(collection(db, 'seasons'), (snapshot) => {
      const list: Season[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Season);
      });
      setSeasons(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'seasons');
    });

    const unsubDivisions = onSnapshot(collection(db, 'divisions'), (snapshot) => {
      const list: Division[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Division);
      });
      setDivisions(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'divisions');
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const list: GolfCourse[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as GolfCourse);
      });
      setCourses(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const list: Event[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Event);
      });
      setEvents(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    const unsubResults = onSnapshot(collection(db, 'results'), (snapshot) => {
      const list: TournamentResult[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as TournamentResult);
      });
      setResults(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'results');
    });

    const unsubNews = onSnapshot(collection(db, 'news'), (snapshot) => {
      const list: NewsArticle[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as NewsArticle);
      });
      setNews(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'news');
    });

    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const list: GalleryImage[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as GalleryImage);
      });
      setGallery(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });

    const unsubSiteContent = onSnapshot(collection(db, 'siteContent'), (snapshot) => {
      const contentMap: Record<string, string> = { ...DEFAULT_SITE_CONTENT };
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.key) {
          let val = data.value;
          // Dynamically clean up any residual or outdated placeholder texts from the Firestore DB
          if (
            val === "We love the greens, the drives, and the double-bogeys. The Hit & Miss Club is a premium society of friends and golfers, playing the absolute finest links and parklands throughout the seasons." ||
            val === "We love the greens, the drives, and the double-bogeys. The Hit & Miss Club is a premium society of friends and golfers, playing the absolute finest links and parklands throughout the seasons. Welcoming all handicaps with fair scoring, strict administration, and lively clubhouse reviews."
          ) {
            val = DEFAULT_SITE_CONTENT.home_hero_subtitle;
          }
          if (val === "Join Garry & The Caddies This Saturday!") {
            val = DEFAULT_SITE_CONTENT.home_cta_title;
          }
          if (val === "Google Maps Link - Portmarnock peninsula, County Dublin") {
            val = DEFAULT_SITE_CONTENT.contact_map_btn_sub;
          }
          if (val === "We are currently accepting waitlist applications for the upcoming winter cup sequence. Perfect your chip shots and stand a chance to claim the silver plate.") {
            val = DEFAULT_SITE_CONTENT.home_cta_body;
          }
          if (val && typeof val === 'string') {
            if (val.includes("since 2021.")) {
              val = val.replace("since 2021.", "since 2026.");
            }
            if (val.includes("2021")) {
              val = val.replace(/2021/g, "2026");
            }
          }
          contentMap[data.key] = val;
        }
      });
      setSiteContent(contentMap);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'siteContent');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.adminPassword && typeof data.adminPassword === 'string' && data.adminPassword.trim()) {
          const pass = data.adminPassword.trim();
          setAdminPassword(pass);
          localStorage.setItem(STORAGE_KEY_PREFIX + 'adminPassword', pass);
        }
        if (data.activeSeasonId) {
          setActiveSeasonId(data.activeSeasonId);
          localStorage.setItem(STORAGE_KEY_PREFIX + 'activeSeasonId', data.activeSeasonId);
        }
      } else {
        // Document doesn't exist on server yet. Do not write a default doc here as that causes offline/cold-cache
        // clients to overwrite custom server passwords back to default 'admin'. Just use local state defaults.
        console.log("Settings config document not found in Firestore. Using local cached or default values.");
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'settings/config');
    });

    const unsubManualEntries = onSnapshot(doc(db, 'settings', 'manualEntries'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.data) {
          try {
            const parsed = JSON.parse(data.data);
            setManualEntries(parsed);
          } catch (e) {
            console.error('Error parsing Firestore manualEntries: ', e);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'settings/manualEntries');
    });

    const unsubVisitorLogs = onSnapshot(collection(db, 'visitorLogs'), (snapshot) => {
      const list: VisitorLog[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as VisitorLog);
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setVisitorLogs(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'visitorLogs');
    });

    return () => {
      unsubMembers();
      unsubSeasons();
      unsubDivisions();
      unsubCourses();
      unsubEvents();
      unsubResults();
      unsubNews();
      unsubGallery();
      unsubSiteContent();
      unsubSettings();
      unsubManualEntries();
      unsubVisitorLogs();
    };
  }, []);

  const updateManualEntries = async (newEntries: Record<string, StandingEntry[]>) => {
    setManualEntries(newEntries);
    localStorage.setItem('hit_and_miss_club_manual_entries', JSON.stringify(newEntries));
    try {
      await setDoc(doc(db, 'settings', 'manualEntries'), { data: JSON.stringify(newEntries) });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/manualEntries');
    }
  };

  const updateSiteContent = async (key: string, value: string) => {
    setSiteContent(prev => ({
      ...prev,
      [key]: value
    }));
    try {
      await setDoc(doc(db, 'siteContent', key), { key, value });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `siteContent/${key}`);
    }
  };

  const updateAdminPasswordOnDB = async (password: string) => {
    const trimmed = password.trim();
    if (!trimmed) return;
    setAdminPassword(trimmed);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'adminPassword', trimmed);
    try {
      await setDoc(doc(db, 'settings', 'config'), { adminPassword: trimmed }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/config');
    }
  };

  // Record site visitor access hit
  const recordVisit = async (pageName: string = 'home', isManual: boolean = false) => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const sessionKey = `hit_and_miss_visited_${today}`;
      if (!isManual && sessionStorage.getItem(sessionKey)) {
        return; // already recorded in this session today
      }

      let visitorId = localStorage.getItem('hit_and_miss_visitor_id');
      if (!visitorId) {
        visitorId = 'vis_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        localStorage.setItem('hit_and_miss_visitor_id', visitorId);
      }

      // ISO week calculation
      const tempDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = tempDate.getUTCDay() || 7;
      tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const weekStr = `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Detect device
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      let device = 'Desktop';
      if (/tablet|ipad|playbook|silk/i.test(ua)) {
        device = 'Tablet';
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
        device = 'Mobile';
      }

      let browser = 'Chrome';
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
      else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

      const logId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const logEntry: VisitorLog = {
        id: logId,
        visitorId,
        date: today,
        week: weekStr,
        month: monthStr,
        timestamp: now.toISOString(),
        device,
        browser,
        page: pageName
      };

      if (!isManual) {
        sessionStorage.setItem(sessionKey, '1');
      }

      await setDoc(doc(db, 'visitorLogs', logId), cleanUndefined(logEntry));
    } catch (err) {
      console.error('Error logging site visitor:', err);
    }
  };

  // Automatically record visitor session on load
  useEffect(() => {
    recordVisit('home', false);
  }, []);

  // Seed sample visitor data if collection is empty
  const seedSampleVisitorData = async () => {
    try {
      const now = new Date();
      const mockVisitors = [
        'vis_alpha', 'vis_bravo', 'vis_charlie', 'vis_delta', 'vis_echo',
        'vis_foxtrot', 'vis_golf', 'vis_hotel', 'vis_india', 'vis_juliet',
        'vis_kilo', 'vis_lima', 'vis_mike', 'vis_november', 'vis_oscar',
        'vis_papa', 'vis_quebec', 'vis_romeo', 'vis_sierra', 'vis_tango'
      ];
      const devices = ['Desktop', 'Desktop', 'Mobile', 'Mobile', 'Mobile', 'Tablet'];
      const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
      const pages = ['home', 'league', 'events', 'results', 'courses'];

      for (let dayOffset = 28; dayOffset >= 0; dayOffset--) {
        const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const tempDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = tempDate.getUTCDay() || 7;
        tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        const weekStr = `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

        const visitsToday = Math.floor(8 + Math.abs(Math.sin(dayOffset)) * 12 + (dayOffset === 0 ? 6 : 2));
        for (let i = 0; i < visitsToday; i++) {
          const vId = mockVisitors[(dayOffset * 3 + i) % mockVisitors.length];
          const logId = `seed_${dateStr}_${i}_${Math.random().toString(36).substring(2, 6)}`;
          const log: VisitorLog = {
            id: logId,
            visitorId: vId,
            date: dateStr,
            week: weekStr,
            month: monthStr,
            timestamp: new Date(d.getTime() + (i * 45 + 15) * 60 * 1000).toISOString(),
            device: devices[(i + dayOffset) % devices.length],
            browser: browsers[(i + dayOffset) % browsers.length],
            page: pages[(i + dayOffset) % pages.length]
          };
          await setDoc(doc(db, 'visitorLogs', logId), cleanUndefined(log));
        }
      }
    } catch (err) {
      console.error('Error seeding visitor logs:', err);
    }
  };

  // Calculate visitor statistics: daily, weekly, monthly, and historical breakdowns
  const visitorStats: VisitorStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    // Daily
    const todayLogs = visitorLogs.filter(l => l.date === todayStr);
    const dailyCount = todayLogs.length;
    const dailyUnique = new Set(todayLogs.map(l => l.visitorId)).size;

    // Weekly (rolling 7 days)
    const weekLogs = visitorLogs.filter(l => new Date(l.timestamp).getTime() >= sevenDaysAgo);
    const weeklyCount = weekLogs.length;
    const weeklyUnique = new Set(weekLogs.map(l => l.visitorId)).size;

    // Monthly (current calendar month)
    const monthLogs = visitorLogs.filter(l => l.month === currentMonthStr || (l.date && l.date.startsWith(currentMonthStr)));
    const monthlyCount = monthLogs.length;
    const monthlyUnique = new Set(monthLogs.map(l => l.visitorId)).size;

    // Total
    const totalCount = visitorLogs.length;
    const totalUnique = new Set(visitorLogs.map(l => l.visitorId)).size;

    // Daily breakdown: last 14 days
    const dailyBreakdown: { date: string; count: number; unique: number; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split('T')[0];
      const dLogs = visitorLogs.filter(l => l.date === dStr);
      const label = d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
      dailyBreakdown.push({
        date: dStr,
        count: dLogs.length,
        unique: new Set(dLogs.map(l => l.visitorId)).size,
        label: i === 0 ? 'Today' : label
      });
    }

    // Weekly breakdown: last 8 weeks
    const weeklyBreakdown: { week: string; count: number; unique: number; label: string }[] = [];
    for (let w = 7; w >= 0; w--) {
      const endMs = now.getTime() - w * 7 * 24 * 60 * 60 * 1000;
      const startMs = endMs - 7 * 24 * 60 * 60 * 1000;
      const wLogs = visitorLogs.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= startMs && t < endMs + (w === 0 ? 24 * 60 * 60 * 1000 : 0);
      });
      const startDate = new Date(startMs);
      const endDate = new Date(endMs);
      const label = w === 0 ? 'This Week' : `${startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;
      weeklyBreakdown.push({
        week: `W-${w}`,
        count: wLogs.length,
        unique: new Set(wLogs.map(l => l.visitorId)).size,
        label
      });
    }

    // Monthly breakdown: last 6 months
    const monthlyBreakdown: { month: string; count: number; unique: number; label: string }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLogs = visitorLogs.filter(l => l.month === mStr || (l.date && l.date.startsWith(mStr)));
      const label = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      monthlyBreakdown.push({
        month: mStr,
        count: mLogs.length,
        unique: new Set(mLogs.map(l => l.visitorId)).size,
        label: m === 0 ? `This Month (${label})` : label
      });
    }

    return {
      daily: dailyCount,
      dailyUnique,
      weekly: weeklyCount,
      weeklyUnique,
      monthly: monthlyCount,
      monthlyUnique,
      total: totalCount,
      totalUnique,
      dailyBreakdown,
      weeklyBreakdown,
      monthlyBreakdown,
      recentLogs: visitorLogs.slice(0, 30)
    };
  }, [visitorLogs]);

  // Actions
  const resetDatabase = async () => {
    if (window.confirm('Are you sure you want to clear the entire database? This will delete all members, courses, results, tournaments, gallery, and news.')) {
      try {
        // Clear all edits and collections from Firestore
        for (const item of members) {
          await deleteDoc(doc(db, 'members', item.id));
        }
        for (const item of seasons) {
          await deleteDoc(doc(db, 'seasons', item.id));
        }
        for (const item of divisions) {
          await deleteDoc(doc(db, 'divisions', item.id));
        }
        for (const item of courses) {
          await deleteDoc(doc(db, 'courses', item.id));
        }
        for (const item of events) {
          await deleteDoc(doc(db, 'events', item.id));
        }
        for (const item of results) {
          await deleteDoc(doc(db, 'results', item.id));
        }
        for (const item of news) {
          await deleteDoc(doc(db, 'news', item.id));
        }
        for (const item of gallery) {
          await deleteDoc(doc(db, 'gallery', item.id));
        }
        for (const key of Object.keys(siteContent)) {
          await deleteDoc(doc(db, 'siteContent', key));
        }
        await setDoc(doc(db, 'settings', 'config'), { adminPassword: 'admin', activeSeasonId: '' });

        setMembers([]);
        setSeasons([]);
        setDivisions([]);
        setCourses([]);
        setEvents([]);
        setResults([]);
        setNews([]);
        setGallery([]);
        setSiteContent(DEFAULT_SITE_CONTENT);
        setActiveSeasonId('');
        setAdminPassword('admin');
        setIsAdmin(false);

        // Clear cached items in localStorage
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'activeSeasonId');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'members');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'seasons');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'divisions');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'courses');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'events');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'results');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'news');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'gallery');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'siteContent');
        localStorage.removeItem('hit_and_miss_club_manual_entries');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'resetDatabase');
      }
    }
  };

  // Members Actions
  const addMember = async (m: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...m,
      id: 'member-' + Date.now(),
    };
    try {
      await setDoc(doc(db, 'members', newMember.id), cleanUndefined(newMember));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${newMember.id}`);
      throw err;
    }
    return newMember;
  };

  const updateMember = async (updated: Member) => {
    try {
      await setDoc(doc(db, 'members', updated.id), cleanUndefined(updated));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${updated.id}`);
      throw err;
    }
  };

  const deleteMember = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member? All associated tournament results will also be deleted.')) {
      try {
        await deleteDoc(doc(db, 'members', id));
        const associatedResults = results.filter(r => r.playerId === id);
        for (const r of associatedResults) {
          await deleteDoc(doc(db, 'results', r.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `members/${id}`);
      }
    }
  };

  // Events Actions
  const addEvent = async (e: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...e,
      id: 'event-' + Date.now()
    };
    try {
      await setDoc(doc(db, 'events', newEvent.id), cleanUndefined(newEvent));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `events/${newEvent.id}`);
      throw err;
    }
    return newEvent;
  };

  const updateEvent = async (updated: Event) => {
    try {
      await setDoc(doc(db, 'events', updated.id), cleanUndefined(updated));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `events/${updated.id}`);
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This will also remove any tournament results entered for it.')) {
      try {
        await deleteDoc(doc(db, 'events', id));
        const associatedResults = results.filter(r => getBaseEventId(r.eventId) === id);
        for (const r of associatedResults) {
          await deleteDoc(doc(db, 'results', r.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
      }
    }
  };

  // Course Actions
  const addCourse = async (c: Omit<GolfCourse, 'id'>) => {
    const newCourse: GolfCourse = {
      ...c,
      id: 'course-' + Date.now()
    };
    try {
      await setDoc(doc(db, 'courses', newCourse.id), newCourse);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `courses/${newCourse.id}`);
    }
    return newCourse;
  };

  const updateCourse = async (updated: GolfCourse) => {
    try {
      await setDoc(doc(db, 'courses', updated.id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `courses/${updated.id}`);
    }
  };

  const deleteCourse = async (id: string) => {
    const inUse = events.some(e => e.courseId === id);
    if (inUse) {
      alert('Cannot delete this course as it has scheduled events. Please delete or reassign those events first.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this golf course?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${id}`);
      }
    }
  };

  // Results Actions
  const addResult = async (res: Omit<TournamentResult, 'id'>) => {
    const newRes: TournamentResult = {
      ...res,
      id: 'res-' + Date.now()
    };
    try {
      await setDoc(doc(db, 'results', newRes.id), cleanUndefined(newRes));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `results/${newRes.id}`);
    }
    return newRes;
  };

  const deleteResult = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'results', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `results/${id}`);
    }
  };

  const setEventResults = async (eventId: string, newResults: Omit<TournamentResult, 'id' | 'eventId'>[]) => {
    const formatted: TournamentResult[] = newResults.map((r, idx) => ({
      ...r,
      id: `res-added-${eventId}-${idx}-${Date.now()}`,
      eventId
    }));
    setResults(prev => [...prev.filter(r => r.eventId !== eventId), ...formatted]);
    try {
      const associated = results.filter(r => r.eventId === eventId);
      for (const r of associated) {
        await deleteDoc(doc(db, 'results', r.id));
      }
      for (const r of formatted) {
        await setDoc(doc(db, 'results', r.id), cleanUndefined(r));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `resultsByEvent/${eventId}`);
    }
  };

  // News Actions
  const addNews = async (n: Omit<NewsArticle, 'id'>) => {
    const newArt: NewsArticle = {
      ...n,
      id: 'news-' + Date.now()
    };
    try {
      await setDoc(doc(db, 'news', newArt.id), newArt);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `news/${newArt.id}`);
    }
    return newArt;
  };

  const updateNews = async (updated: NewsArticle) => {
    try {
      await setDoc(doc(db, 'news', updated.id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `news/${updated.id}`);
    }
  };

  const deleteNews = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this news article?')) {
      try {
        await deleteDoc(doc(db, 'news', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `news/${id}`);
      }
    }
  };

  // Gallery Actions
  const addGalleryImage = async (img: Omit<GalleryImage, 'id'>) => {
    const newImg: GalleryImage = {
      ...img,
      id: 'gal-' + Date.now()
    };
    try {
      await setDoc(doc(db, 'gallery', newImg.id), newImg);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `gallery/${newImg.id}`);
    }
    return newImg;
  };

  const approveGalleryImage = async (id: string) => {
    try {
      const img = gallery.find(g => g.id === id);
      if (img) {
        const updated = { ...img, approved: true };
        await setDoc(doc(db, 'gallery', id), updated);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `gallery/${id}`);
    }
  };

  const deleteGalleryImage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `gallery/${id}`);
      }
    }
  };

  // Season Actions
  const addSeason = async (name: string) => {
    const newId = 'season-' + Date.now();
    const newSeason: Season = { id: newId, name, isActive: false };
    try {
      await setDoc(doc(db, 'seasons', newSeason.id), newSeason);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `seasons/${newSeason.id}`);
    }
    return newSeason;
  };

  const toggleSeasonActive = async (id: string) => {
    setActiveSeasonId(id);
    try {
      const updatedSeasons = seasons.map(s => ({
        ...s,
        isActive: s.id === id
      }));
      for (const s of updatedSeasons) {
        await setDoc(doc(db, 'seasons', s.id), s);
      }
      await setDoc(doc(db, 'settings', 'config'), { activeSeasonId: id }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `toggleSeasonActive/${id}`);
    }
  };

  const deleteSeason = async (id: string) => {
    if (id === activeSeasonId) {
      alert('Cannot delete the active campaign. Please set another season as active first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this season? This will also remove any outings/tournaments and results linked to it.')) {
      try {
        await deleteDoc(doc(db, 'seasons', id));
        const associatedEvents = events.filter(e => e.seasonId === id);
        for (const e of associatedEvents) {
          await deleteDoc(doc(db, 'events', e.id));
          const associatedResults = results.filter(r => getBaseEventId(r.eventId) === e.id);
          for (const r of associatedResults) {
            await deleteDoc(doc(db, 'results', r.id));
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `seasons/${id}`);
      }
    }
  };

  // Auto-calculated Standings
  const getStandingsForSeason = (seasonId: string): StandingsRow[] => {
    const seasonEvents = events.filter(e => e.seasonId === seasonId && e.status === 'Completed');
    const seasonEventIds = seasonEvents.map(e => e.id);
    const seasonResults = results.filter(r => seasonEventIds.includes(getBaseEventId(r.eventId)));

    const standingsMap = new Map<string, {
      totalPoints: number;
      eventsPlayed: number;
      wins: number;
      strokesAccumulated: number;
      netStrokesAccumulated: number;
    }>();

    // Initialize map with members
    members.forEach(m => {
      // Only active members are eligible for active divisional positions / standings
      if (m.active !== false) {
        standingsMap.set(m.id, {
          totalPoints: 0,
          eventsPlayed: 0,
          wins: 0,
          strokesAccumulated: 0,
          netStrokesAccumulated: 0
        });
      }
    });

    // Populate from results
    seasonResults.forEach(r => {
      const stats = standingsMap.get(r.playerId);
      if (!stats) return; // Skip inactive members

      stats.totalPoints += r.points;
      stats.eventsPlayed += 1;
      if (r.position === 1) {
        stats.wins += 1;
      }
      stats.strokesAccumulated += r.grossScore;
      stats.netStrokesAccumulated += r.netScore;

      standingsMap.set(r.playerId, stats);
    });

    // Map to standings rows
    const rows: StandingsRow[] = [];
    standingsMap.forEach((stats, plyrId) => {
      const member = members.find(m => m.id === plyrId);
      if (member && member.active !== false) {
        rows.push({
          playerId: plyrId,
          playerName: member.name,
          handicap: member.handicap,
          totalPoints: stats.totalPoints,
          eventsPlayed: stats.eventsPlayed,
          wins: stats.wins,
          averagePoints: stats.eventsPlayed > 0 ? Number((stats.totalPoints / stats.eventsPlayed).toFixed(1)) : 0,
          ranking: 0 // Set after sorting
        });
      }
    });

    // Sort by: Total Points Desc, Wins Desc, EventsPlayed Desc, Handicap Asc
    rows.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.eventsPlayed !== a.eventsPlayed) return b.eventsPlayed - a.eventsPlayed;
      return a.handicap - b.handicap;
    });

    // Assign dynamic absolute rankings
    rows.forEach((row, index) => {
      row.ranking = index + 1;
    });

    return rows;
  };

  const addDivision = async (name: string) => {
    const newDiv = { id: 'div-' + Date.now(), name };
    try {
      await setDoc(doc(db, 'divisions', newDiv.id), newDiv);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `divisions/${newDiv.id}`);
    }
    return newDiv;
  };

  const deleteDivision = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'divisions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `divisions/${id}`);
    }
  };

  const standings = getStandingsForSeason(activeSeasonId);

  return {
    isAdmin,
    setIsAdmin,
    siteContent,
    updateSiteContent,
    activeSeasonId,
    setActiveSeasonId,
    members,
    setMembers,
    seasons,
    divisions,
    setDivisions,
    courses,
    events,
    setEvents,
    results,
    news,
    gallery,
    standings,
    manualEntries,
    updateManualEntries,
    resetDatabase,
    adminPassword,
    setAdminPassword: updateAdminPasswordOnDB,
    // Add operations
    addMember,
    updateMember,
    deleteMember,
    addEvent,
    updateEvent,
    deleteEvent,
    addCourse,
    updateCourse,
    deleteCourse,
    addResult,
    deleteResult,
    setEventResults,
    addNews,
    updateNews,
    deleteNews,
    addGalleryImage,
    approveGalleryImage,
    deleteGalleryImage,
    addSeason,
    toggleSeasonActive,
    deleteSeason,
    getStandingsForSeason,
    addDivision,
    deleteDivision,
    visitorLogs,
    visitorStats,
    recordVisit,
    seedSampleVisitorData
  };
}

export type SocietyState = ReturnType<typeof useSocietyState>;
