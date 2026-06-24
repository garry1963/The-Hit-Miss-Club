/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Member, Season, Division, GolfCourse, Event, TournamentResult, NewsArticle, GalleryImage, StandingsRow, StandingEntry } from './types';
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
        if (data.adminPassword) setAdminPassword(data.adminPassword);
        if (data.activeSeasonId) setActiveSeasonId(data.activeSeasonId);
      } else {
        setDoc(doc(db, 'settings', 'config'), { adminPassword: 'admin', activeSeasonId: '' }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, 'settings/config');
        });
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
    setAdminPassword(password);
    try {
      await setDoc(doc(db, 'settings', 'config'), { adminPassword: password, activeSeasonId }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/config');
    }
  };

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
      await setDoc(doc(db, 'results', newRes.id), newRes);
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
    try {
      const associated = results.filter(r => r.eventId === eventId);
      for (const r of associated) {
        await deleteDoc(doc(db, 'results', r.id));
      }
      const formatted = newResults.map((r, idx) => ({
        ...r,
        id: `res-added-${eventId}-${idx}-${Date.now()}`,
        eventId
      }));
      for (const r of formatted) {
        await setDoc(doc(db, 'results', r.id), r);
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
      await setDoc(doc(db, 'settings', 'config'), { adminPassword, activeSeasonId: id }, { merge: true });
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
    deleteDivision
  };
}

export type SocietyState = ReturnType<typeof useSocietyState>;
