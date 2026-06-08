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

  // Load state helper
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

  // State definitions
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

  // Sync to localStorage
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

  const updateSiteContent = (key: string, value: string) => {
    setSiteContent(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Actions
  const resetDatabase = () => {
    if (window.confirm('Are you sure you want to reset the database? This will clear all edits and restore initial club data.')) {
      setMembers(INITIAL_MEMBERS);
      setSeasons(INITIAL_SEASONS);
      setDivisions([
        { id: 'div-premier', name: 'Premier Division' },
        { id: 'div-championship', name: 'Championship Division' }
      ]);
      setCourses(INITIAL_GOLF_COURSES);
      setEvents(INITIAL_EVENTS);
      setResults(INITIAL_RESULTS);
      setNews(INITIAL_NEWS);
      setGallery(INITIAL_GALLERY);
      setSiteContent(DEFAULT_SITE_CONTENT);
      setActiveSeasonId('season-2026');
      setIsAdmin(false);
    }
  };

  // Members Actions
  const addMember = (m: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...m,
      id: 'member-' + Date.now(),
    };
    setMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const updateMember = (updated: Member) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const deleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to delete this member? All associated tournament results will also be deleted.')) {
      setMembers(prev => prev.filter(m => m.id !== id));
      setResults(prev => prev.filter(r => r.playerId !== id));
    }
  };

  // Events Actions
  const addEvent = (e: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...e,
      id: 'event-' + Date.now()
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent = (updated: Event) => {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const deleteEvent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This will also remove any tournament results entered for it.')) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setResults(prev => prev.filter(r => r.eventId !== id));
    }
  };

  // Course Actions
  const addCourse = (c: Omit<GolfCourse, 'id'>) => {
    const newCourse: GolfCourse = {
      ...c,
      id: 'course-' + Date.now()
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  };

  const updateCourse = (updated: GolfCourse) => {
    setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCourse = (id: string) => {
    // Check if courses are playing in events
    const inUse = events.some(e => e.courseId === id);
    if (inUse) {
      alert('Cannot delete this course as it has scheduled events. Please delete or reassign those events first.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this golf course?')) {
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  // Results Actions
  const addResult = (res: Omit<TournamentResult, 'id'>) => {
    const newRes: TournamentResult = {
      ...res,
      id: 'res-' + Date.now()
    };
    setResults(prev => [...prev, newRes]);
    return newRes;
  };

  const deleteResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const setEventResults = (eventId: string, newResults: Omit<TournamentResult, 'id' | 'eventId'>[]) => {
    // Remove existing results for this event
    setResults(prev => {
      const filtered = prev.filter(r => r.eventId !== eventId);
      const formatted = newResults.map((r, idx) => ({
        ...r,
        id: `res-added-${eventId}-${idx}-${Date.now()}`,
        eventId
      }));
      return [...filtered, ...formatted];
    });
  };

  // News Actions
  const addNews = (n: Omit<NewsArticle, 'id'>) => {
    const newArt: NewsArticle = {
      ...n,
      id: 'news-' + Date.now()
    };
    setNews(prev => [newArt, ...prev]);
    return newArt;
  };

  const updateNews = (updated: NewsArticle) => {
    setNews(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const deleteNews = (id: string) => {
    if (window.confirm('Are you sure you want to delete this news article?')) {
      setNews(prev => prev.filter(n => n.id !== id));
    }
  };

  // Gallery Actions
  const addGalleryImage = (img: Omit<GalleryImage, 'id'>) => {
    const newImg: GalleryImage = {
      ...img,
      id: 'gal-' + Date.now()
    };
    setGallery(prev => [newImg, ...prev]);
    return newImg;
  };

  const deleteGalleryImage = (id: string) => {
    if (window.confirm('Are you sure you want to delete this image from the gallery?')) {
      setGallery(prev => prev.filter(g => g.id !== id));
    }
  };

  // Season Actions
  const addSeason = (name: string) => {
    const newId = 'season-' + Date.now();
    const newSeason: Season = { id: newId, name, isActive: false };
    setSeasons(prev => [...prev, newSeason]);
    return newSeason;
  };

  const toggleSeasonActive = (id: string) => {
    setSeasons(prev => prev.map(s => ({
      ...s,
      isActive: s.id === id
    })));
    setActiveSeasonId(id);
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

    // Filter out players who haven't played any events if we want, but let's keep them and sort them.
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

  const addDivision = (name: string) => {
    const newDiv = { id: 'div-' + Date.now(), name };
    setDivisions(prev => [...prev, newDiv]);
    return newDiv;
  };

  const deleteDivision = (id: string) => {
    setDivisions(prev => prev.filter(d => d.id !== id));
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
    getStandingsForSeason,
    addDivision,
    deleteDivision
  };
}

export type SocietyState = ReturnType<typeof useSocietyState>;
