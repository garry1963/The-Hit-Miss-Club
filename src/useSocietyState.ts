/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Member, Season, Division, GolfCourse, Event, TournamentResult, NewsArticle, GalleryImage, StandingsRow } from './types';
import {
  INITIAL_MEMBERS,
  INITIAL_SEASONS,
  INITIAL_GOLF_COURSES,
  INITIAL_EVENTS,
  INITIAL_RESULTS,
  INITIAL_NEWS,
  INITIAL_GALLERY
} from './data';
import { DEFAULT_SITE_CONTENT } from './defaultContent';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreError';

const STORAGE_KEY_PREFIX = 'hit_and_miss_club_v1_';

export function useSocietyState() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'isAdmin');
    return saved ? JSON.parse(saved) : false;
  });

  const [activeSeasonId, setActiveSeasonId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'activeSeasonId');
    return saved || 'season-2026';
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

  const [members, setMembers] = useState<Member[]>(() => getStored('members', INITIAL_MEMBERS));
  const [seasons, setSeasons] = useState<Season[]>(() => getStored('seasons', INITIAL_SEASONS));
  const [divisions, setDivisions] = useState<Division[]>(() => getStored('divisions', [
    { id: 'div-premier', name: 'Premier Division' },
    { id: 'div-championship', name: 'Championship Division' }
  ]));
  const [courses, setCourses] = useState<GolfCourse[]>(() => getStored('courses', INITIAL_GOLF_COURSES));
  const [events, setEvents] = useState<Event[]>(() => getStored('events', INITIAL_EVENTS));
  const [results, setResults] = useState<TournamentResult[]>(() => getStored('results', INITIAL_RESULTS));
  const [news, setNews] = useState<NewsArticle[]>(() => getStored('news', INITIAL_NEWS));
  const [gallery, setGallery] = useState<GalleryImage[]>(() => getStored('gallery', INITIAL_GALLERY));
  const [siteContent, setSiteContent] = useState<Record<string, string>>(() => getStored('siteContent', DEFAULT_SITE_CONTENT));

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
      if (list.length > 0) {
        setMembers(list);
      } else {
        INITIAL_MEMBERS.forEach(item => {
          setDoc(doc(db, 'members', item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `members/${item.id}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'members');
    });

    const unsubSeasons = onSnapshot(collection(db, 'seasons'), (snapshot) => {
      const list: Season[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Season);
      });
      if (list.length > 0) {
        setSeasons(list);
      } else {
        INITIAL_SEASONS.forEach(item => {
          setDoc(doc(db, 'seasons', item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `seasons/${item.id}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'seasons');
    });

    const unsubDivisions = onSnapshot(collection(db, 'divisions'), (snapshot) => {
      const list: Division[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Division);
      });
      if (list.length > 0) {
        setDivisions(list);
      } else {
        const initialDivs = [
          { id: 'div-premier', name: 'Premier Division' },
          { id: 'div-championship', name: 'Championship Division' }
        ];
        initialDivs.forEach(item => {
          setDoc(doc(db, 'divisions', item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `divisions/${item.id}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'divisions');
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const list: GolfCourse[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as GolfCourse);
      });
      if (list.length > 0) {
        setCourses(list);
      } else {
        INITIAL_GOLF_COURSES.forEach(item => {
          setDoc(doc(db, 'courses', item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `courses/${item.id}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const list: Event[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Event);
      });
      if (list.length > 0) {
        setEvents(list);
      } else {
        INITIAL_EVENTS.forEach(item => {
          setDoc(doc(db, 'events', item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `events/${item.id}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    const unsubResults = onSnapshot(collection(db, 'results'), (snapshot) => {
      const list: TournamentResult[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as TournamentResult);
      });
      if (list.length > 0) {
        setResults(list);
      } else {
        INITIAL_RESULTS.forEach(item => {
          setDoc(doc(db, 'results', item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `results/${item.id}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'results');
    });

    const unsubNews = onSnapshot(collection(db, 'news'), (snapshot) => {
      const list: NewsArticle[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as NewsArticle);
      });
      if (list.length > 0) {
        setNews(list);
      } else {
        INITIAL_NEWS.forEach(item => {
          setDoc(doc(db, 'news', item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `news/${item.id}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'news');
    });

    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const list: GalleryImage[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as GalleryImage);
      });
      if (list.length > 0) {
        setGallery(list);
      } else {
        INITIAL_GALLERY.forEach(item => {
          setDoc(doc(db, 'gallery', item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `gallery/${item.id}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });

    const unsubSiteContent = onSnapshot(collection(db, 'siteContent'), (snapshot) => {
      const contentMap: Record<string, string> = { ...DEFAULT_SITE_CONTENT };
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.key) {
          contentMap[data.key] = data.value;
        }
      });
      if (snapshot.size > 0) {
        setSiteContent(contentMap);
      } else {
        Object.entries(DEFAULT_SITE_CONTENT).forEach(([key, value]) => {
          setDoc(doc(db, 'siteContent', key), { key, value }).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `siteContent/${key}`);
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'siteContent');
    });

    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id === 'config') {
          const data = doc.data();
          if (data.adminPassword) setAdminPassword(data.adminPassword);
          if (data.activeSeasonId) setActiveSeasonId(data.activeSeasonId);
        }
      });
      if (snapshot.size === 0) {
        setDoc(doc(db, 'settings', 'config'), { adminPassword: 'admin', activeSeasonId: 'season-2026' }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, 'settings/config');
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'settings');
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
    };
  }, []);

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
      await setDoc(doc(db, 'settings', 'config'), { adminPassword: password, activeSeasonId });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/config');
    }
  };

  // Actions
  const resetDatabase = async () => {
    if (window.confirm('Are you sure you want to reset the database? This will clear all edits and restore initial club data from local cache.')) {
      try {
        // Clear and rewrite with initial data
        for (const item of INITIAL_MEMBERS) {
          await setDoc(doc(db, 'members', item.id), item);
        }
        for (const item of INITIAL_SEASONS) {
          await setDoc(doc(db, 'seasons', item.id), item);
        }
        const initialDivs = [
          { id: 'div-premier', name: 'Premier Division' },
          { id: 'div-championship', name: 'Championship Division' }
        ];
        for (const item of initialDivs) {
          await setDoc(doc(db, 'divisions', item.id), item);
        }
        for (const item of INITIAL_GOLF_COURSES) {
          await setDoc(doc(db, 'courses', item.id), item);
        }
        for (const item of INITIAL_EVENTS) {
          await setDoc(doc(db, 'events', item.id), item);
        }
        for (const item of INITIAL_RESULTS) {
          await setDoc(doc(db, 'results', item.id), item);
        }
        for (const item of INITIAL_NEWS) {
          await setDoc(doc(db, 'news', item.id), item);
        }
        for (const item of INITIAL_GALLERY) {
          await setDoc(doc(db, 'gallery', item.id), item);
        }
        for (const [key, value] of Object.entries(DEFAULT_SITE_CONTENT)) {
          await setDoc(doc(db, 'siteContent', key), { key, value });
        }
        await setDoc(doc(db, 'settings', 'config'), { adminPassword: 'admin', activeSeasonId: 'season-2026' });

        setMembers(INITIAL_MEMBERS);
        setSeasons(INITIAL_SEASONS);
        setDivisions(initialDivs);
        setCourses(INITIAL_GOLF_COURSES);
        setEvents(INITIAL_EVENTS);
        setResults(INITIAL_RESULTS);
        setNews(INITIAL_NEWS);
        setGallery(INITIAL_GALLERY);
        setSiteContent(DEFAULT_SITE_CONTENT);
        setActiveSeasonId('season-2026');
        setAdminPassword('admin');
        setIsAdmin(false);
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
      await setDoc(doc(db, 'members', newMember.id), newMember);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${newMember.id}`);
    }
    return newMember;
  };

  const updateMember = async (updated: Member) => {
    try {
      await setDoc(doc(db, 'members', updated.id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${updated.id}`);
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
      await setDoc(doc(db, 'events', newEvent.id), newEvent);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `events/${newEvent.id}`);
    }
    return newEvent;
  };

  const updateEvent = async (updated: Event) => {
    try {
      await setDoc(doc(db, 'events', updated.id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `events/${updated.id}`);
    }
  };

  const deleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This will also remove any tournament results entered for it.')) {
      try {
        await deleteDoc(doc(db, 'events', id));
        const associatedResults = results.filter(r => r.eventId === id);
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

  const deleteGalleryImage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image from the gallery?')) {
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
      await setDoc(doc(db, 'settings', 'config'), { adminPassword, activeSeasonId: id });
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
          const associatedResults = results.filter(r => r.eventId === e.id);
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
    const seasonResults = results.filter(r => seasonEventIds.includes(r.eventId));

    const standingsMap = new Map<string, {
      totalPoints: number;
      eventsPlayed: number;
      wins: number;
      strokesAccumulated: number;
      netStrokesAccumulated: number;
    }>();

    // Initialize map with members
    members.forEach(m => {
      standingsMap.set(m.id, {
        totalPoints: 0,
        eventsPlayed: 0,
        wins: 0,
        strokesAccumulated: 0,
        netStrokesAccumulated: 0
      });
    });

    // Populate from results
    seasonResults.forEach(r => {
      const stats = standingsMap.get(r.playerId) || {
        totalPoints: 0,
        eventsPlayed: 0,
        wins: 0,
        strokesAccumulated: 0,
        netStrokesAccumulated: 0
      };

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
      if (member) {
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
