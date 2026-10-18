/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, CheckCircle, Info, Clock, MapPin, Users, Download, Upload, Trophy, X, Sparkles, Globe, Flag, Sliders } from 'lucide-react';
import { Event, GolfCourse, Season, Member, TournamentResult, StandingsScoreFormat } from '../types';
import { formatAppDate, isEventLive, isEventEnded, getBaseEventId } from '../utils/dateUtils';
import LiveLeaderboardModal from './LiveLeaderboardModal';

interface EventsTabProps {
  events: Event[];
  setEvents?: React.Dispatch<React.SetStateAction<Event[]>>;
  courses: GolfCourse[];
  seasons: Season[];
  activeSeasonId: string;
  isAdmin: boolean;
  addEvent: (e: Omit<Event, 'id'>) => any;
  updateEvent: (updated: Event) => void;
  deleteEvent: (id: string) => void;
  setCurrentTab: (tab: string) => void;
  siteContent?: Record<string, string>;
  updateSiteContent?: (key: string, val: string) => void;
  results?: TournamentResult[];
  members?: Member[];
  setEventResults?: (eventId: string, newResults: Omit<TournamentResult, 'id' | 'eventId'>[]) => Promise<void>;
}

export default function EventsTab({
  events,
  setEvents,
  courses,
  seasons,
  activeSeasonId,
  isAdmin,
  addEvent,
  updateEvent,
  deleteEvent,
  setCurrentTab,
  siteContent,
  updateSiteContent,
  results = [],
  members = [],
  setEventResults
}: EventsTabProps) {
  // Local states
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewingCourse, setViewingCourse] = useState<GolfCourse | null>(null);
  const [filterFormat, setFilterFormat] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Live' | 'Upcoming' | 'Completed'>('All');
  const [liveLeaderboardEvent, setLiveLeaderboardEvent] = useState<Event | null>(null);
  const [liveLeaderboardDivision, setLiveLeaderboardDivision] = useState<'main' | 'alternate'>('main');
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formError, setFormError] = useState('');

  // Tournament fields
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('12:00 AM GMT');
  const [courseId, setCourseId] = useState('');
  const [roundsCount, setRoundsCount] = useState(1);
  const [scoreDisplayFormats, setScoreDisplayFormats] = useState<StandingsScoreFormat[]>(['gross', 'net', 'points']);
  const [format, setFormat] = useState<'Stableford' | 'Stroke Play' | 'Modified Stableford'>('Stableford');
  const [classification, setClassification] = useState<'Major' | 'Standard' | 'Alternate' | 'Qualifier'>('Standard');
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Completed'>('Upcoming');
  const [eventSeasonId, setEventSeasonId] = useState(activeSeasonId);
  const [isSpotlightForm, setIsSpotlightForm] = useState(false);

  useEffect(() => {
    if (!editingEvent) {
      setEventSeasonId(activeSeasonId);
    }
  }, [activeSeasonId, editingEvent]);

  // Live tournament detection for EventsTab
  const liveEvent = React.useMemo(() => {
    const activeSeasonLive = events.filter(e => (!activeSeasonId || e.seasonId === activeSeasonId) && isEventLive(e));
    if (activeSeasonLive.length > 0) {
      return activeSeasonLive.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    }
    const anyLive = events.filter(e => isEventLive(e));
    return anyLive[0] || null;
  }, [events, activeSeasonId]);

  // Spotlight active resolution for EventsTab
  const configuredSpotlightId = siteContent?.spotlight_event_id;
  const isManuallyPinned = Boolean(configuredSpotlightId && configuredSpotlightId !== 'auto');
  
  const currentSpotlightEvent = React.useMemo(() => {
    // 1. TOP PRIORITY: If a tournament is live, prioritise that tournament as the spotlight fixture!
    if (liveEvent) {
      return liveEvent;
    }

    // 2. Explicitly configured spotlight event
    if (configuredSpotlightId && configuredSpotlightId !== 'auto') {
      const match = events.find(e => e.id === configuredSpotlightId);
      if (match) return match;
    }
    const marked = events.find(e => (e as any).isSpotlight);
    if (marked) return marked;

    return events
      .filter(e => (!activeSeasonId || e.seasonId === activeSeasonId) && e.status !== 'Completed' && !isEventEnded(e))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || events[0] || null;
  }, [liveEvent, events, configuredSpotlightId, activeSeasonId]);

  const isCurrentSpotlightLive = Boolean(currentSpotlightEvent && isEventLive(currentSpotlightEvent));

  // Filter events of activeSeasonId
  const filteredEvents = events
    .filter(e => e.seasonId === activeSeasonId)
    .filter(e => {
      if (filterStatus === 'All') return true;
      if (filterStatus === 'Live') return isEventLive(e);
      if (filterStatus === 'Upcoming') return (e.status === 'Upcoming' || !e.status) && !isEventEnded(e);
      if (filterStatus === 'Completed') return e.status === 'Completed' || isEventEnded(e);
      return e.status === filterStatus;
    })
    .filter(e => {
      if (filterFormat === 'All') return true;
      return e.format === filterFormat;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const resetForm = () => {
    setTitle('');
    setStartDate('');
    setEndDate('');
    setTime('12:00 AM GMT');
    setCourseId(courses[0]?.id || '');
    setRoundsCount(1);
    setScoreDisplayFormats(['gross', 'net', 'points']);
    setFormat('Stableford');
    setClassification('Standard');
    setMaxPlayers(16);
    setNotes('');
    setStatus('Upcoming');
    setEventSeasonId(activeSeasonId);
    setIsSpotlightForm(false);
    setEditingEvent(null);
    setShowAddForm(false);
    setFormError('');
  };

  const handleEditClick = (e: Event, eventObj: React.MouseEvent) => {
    eventObj.stopPropagation();
    setEditingEvent(e);
    setTitle(e.title);
    setStartDate(e.date);
    setEndDate(e.endDate || e.date);
    setTime(e.time);
    setCourseId(e.courseId);
    setRoundsCount(e.roundsCount || 1);
    setScoreDisplayFormats(e.scoreDisplayFormats && e.scoreDisplayFormats.length > 0 ? e.scoreDisplayFormats : ['gross', 'net', 'points']);
    setFormat(e.format || 'Stableford');
    setClassification(e.classification || 'Standard');
    setMaxPlayers(e.maxPlayers || 16);
    setNotes(e.notes || '');
    setStatus(e.status);
    setEventSeasonId(e.seasonId || activeSeasonId);
    setIsSpotlightForm(siteContent?.spotlight_event_id === e.id || Boolean((e as any).isSpotlight));
    setShowAddForm(true);
  };

  // Check if editing tournament or draft tournament has live results
  const editingResults = editingEvent
    ? results.filter(r => getBaseEventId(r.eventId) === editingEvent.id)
    : [];
  const hasExistingLiveScores = editingResults.length > 0;

  const handleOpenLiveLeaderboardFromForm = async () => {
    if (editingEvent) {
      setLiveLeaderboardEvent(editingEvent);
    } else {
      if (!title.trim()) {
        setFormError('Please enter a Tournament Name above before creating the live leaderboard.');
        return;
      }
      setFormError('');
      try {
        const payload = {
          seasonId: eventSeasonId || activeSeasonId,
          title: title.trim(),
          date: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || startDate || new Date().toISOString().split('T')[0],
          time: time || '12:00 AM GMT',
          courseId: courseId || courses[0]?.id || '',
          roundsCount: Number(roundsCount) || 1,
          scoreDisplayFormats: scoreDisplayFormats.length > 0 ? scoreDisplayFormats : ['gross', 'net', 'points'],
          format,
          classification,
          maxPlayers: Number(maxPlayers) || 16,
          notes,
          status: 'Live' as const,
          isSpotlight: isSpotlightForm
        };
        const created = await addEvent(payload);
        if (created) {
          setEditingEvent(created);
          setLiveLeaderboardEvent(created);
          if (isSpotlightForm && updateSiteContent) {
            updateSiteContent('spotlight_event_id', created.id);
          }
        }
      } catch (err: any) {
        setFormError('Failed to initialize tournament: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !time || !courseId) {
      setFormError('Please fill in required fields (Tournament Name, Start Date, Tee Time, Golf Course).');
      return;
    }

    const payload = {
      seasonId: eventSeasonId,
      title,
      date: startDate,
      endDate: endDate || startDate,
      time,
      courseId,
      roundsCount: Number(roundsCount) || 1,
      scoreDisplayFormats: scoreDisplayFormats.length > 0 ? scoreDisplayFormats : ['gross', 'net', 'points'],
      format,
      classification,
      maxPlayers: Number(maxPlayers),
      notes,
      status,
      isSpotlight: isSpotlightForm
    };

    let targetEventId = editingEvent?.id;

    if (editingEvent) {
      updateEvent({
        ...editingEvent,
        ...payload
      });
      alert('Tournament parameters updated successfully.');
    } else {
      const created = addEvent(payload);
      if (created && created.id) {
        targetEventId = created.id;
      }
      alert('New tournament registered successfully.');
    }

    if (updateSiteContent) {
      if (isSpotlightForm && targetEventId) {
        updateSiteContent('spotlight_event_id', targetEventId);
      } else if (!isSpotlightForm && editingEvent && siteContent?.spotlight_event_id === editingEvent.id) {
        updateSiteContent('spotlight_event_id', 'auto');
      }
    }

    resetForm();
  };

  // CSV Tournament Download helper
  const handleCSVDownload = () => {
    const headers = ['Tournament Name', 'Course ID', 'Host Course Name', 'Start Date', 'End Date', 'Number of Rounds', 'Format', 'Tee Time', 'Max Players', 'Status', 'Notes'];
    const rows = events.map(e => {
      const course = courses.find(c => c.id === e.courseId);
      return [
        `"${e.title.replace(/"/g, '""')}"`,
        e.courseId,
        `"${(course ? course.name : 'Unknown Course').replace(/"/g, '""')}"`,
        e.date,
        e.endDate || e.date,
        e.roundsCount || 1,
        e.format || 'Stableford',
        e.time,
        e.maxPlayers || 16,
        e.status,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.className = "hidden";
    link.setAttribute('href', url);
    link.setAttribute('download', 'hit_and_miss_tournaments_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Tournaments Import helper
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!setEvents) {
      alert("Database error: setEvents modifier is undefined.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const parsedEvents: Event[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Smart CSV splitter that respects quoted strings
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const parts = matches ? matches.map(val => val.replace(/^"|"$/g, '')) : line.split(',');

        if (parts.length < 4) continue;

        const title = parts[0]?.trim();
        const csvCourseId = parts[1]?.trim() || '';
        // If courseId is not a match, lookup by course name
        const csvCourseName = parts[2]?.trim();
        let finalCourseId = csvCourseId;

        if (csvCourseId) {
          // Verify existence
          const matchCourse = courses.find(c => c.id === csvCourseId || c.name.toLowerCase() === csvCourseId.toLowerCase());
          if (matchCourse) finalCourseId = matchCourse.id;
        } else if (csvCourseName) {
          const matchCourse = courses.find(c => c.name.toLowerCase() === csvCourseName.toLowerCase());
          if (matchCourse) finalCourseId = matchCourse.id;
        }

        if (!finalCourseId) {
          finalCourseId = courses[0]?.id || 'course-all';
        }

        const startDate = parts[3]?.trim() || new Date().toISOString().split('T')[0];
        const endDate = parts[4]?.trim() || startDate;
        const rounds = parseInt(parts[5]?.trim() || '1');
        const formatStr = parts[6]?.trim() || 'Stableford';
        const finalFormat = (['Stableford', 'Stroke Play', 'Modified Stableford'].includes(formatStr) 
          ? formatStr 
          : 'Stableford') as 'Stableford' | 'Stroke Play' | 'Modified Stableford';
        
        const teeTime = parts[7]?.trim() || '12:00 AM GMT';
        const limitPlayers = parseInt(parts[8]?.trim() || '16');
        const statusStr = parts[9]?.trim() || 'Upcoming';
        const finalStatus = (statusStr === 'Completed' ? 'Completed' : 'Upcoming') as 'Upcoming' | 'Completed';
        const notesDescr = parts[10]?.trim() || '';

        if (!title) continue;

        parsedEvents.push({
          id: 'event-' + (Date.now() + i),
          seasonId: activeSeasonId,
          title,
          date: startDate,
          endDate,
          roundsCount: isNaN(rounds) ? 1 : rounds,
          format: finalFormat,
          time: teeTime,
          courseId: finalCourseId,
          maxPlayers: isNaN(limitPlayers) ? 16 : limitPlayers,
          status: finalStatus,
          notes: notesDescr
        });
      }

      if (parsedEvents.length > 0) {
        if (window.confirm(`Parsed ${parsedEvents.length} tournaments. Do you want to overwrite your active Tournaments database?`)) {
          setEvents(parsedEvents);
          alert(`Successfully replaced spreadsheet with ${parsedEvents.length} tournaments record rows.`);
        }
      } else {
        alert('Could not find any valid tournament data rows. Target structure: Tournament Name,Course ID,Course Name,Start Date,End Date,Rounds,Format,Tee Time...');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // CSV Golf Course Download helper (highly convenient, requested)
  const handleGolfCourseCSVDownload = () => {
    const headers = ['Course ID', 'Course Name', 'Location', 'Holes Count', 'Par Score', 'Course Rating', 'Slope Rating', 'Website URL', 'Notes Description'];
    const rows = courses.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.location.replace(/"/g, '""')}"`,
      c.holes,
      c.par,
      c.courseRating,
      c.slopeRating,
      `"${(c.website || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.className = "hidden";
    link.setAttribute('href', url);
    link.setAttribute('download', 'hit_and_miss_golf_courses_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedCourse = selectedEvent ? courses.find(c => c.id === selectedEvent.courseId) : null;
  const currentSeasonName = seasons.find(s => s.id === activeSeasonId)?.name || 'Active Campaign';

  return (
    <div className="space-y-8 pb-12 animate-fadeIn text-left leading-normal">
      
      {/* 1. Header with Filters & Administrative Triggers */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-800" />
            <span>Tournaments Ledger</span>
          </h1>
          <p className="text-stone-500 text-sm">
            Manage upcoming cup challenges, view individual tournament formats, and load spreadsheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export / Import schedulers */}
          <button
            onClick={handleCSVDownload}
            className="border border-[#fbbf24] hover:bg-stone-50 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            title="Download tournament schedule spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Export Tournaments</span>
          </button>

          <button
            onClick={handleGolfCourseCSVDownload}
            className="border border-[#fbbf24] hover:bg-stone-50 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            title="Download registered golf course attributes spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-800" />
            <span>Export Courses</span>
          </button>

          {isAdmin && (
            <label className="border border-[#fbbf24] hover:bg-stone-50 text-[#064e3b] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>Import Tournaments</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tournament</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Admin Form Wrapper */}
      {isAdmin && showAddForm && (
        <div className="bg-stone-50 border-2 border-[#fbbf24]/45 rounded-2xl p-6 shadow-md animate-fadeIn">
          <h2 className="font-display font-medium text-emerald-950 uppercase border-b border-stone-200 pb-2 mb-4 font-bold text-sm">
            {editingEvent ? `Modify Tournament Parameters: ${editingEvent.title}` : 'Schedule New Cup Tournament'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs font-sans">
            {formError && (
              <div className="md:col-span-12 font-medium text-red-705 bg-red-50 p-2.5 rounded border border-red-200">
                {formError}
              </div>
            )}

            <div className="md:col-span-5 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Tournament Name *</label>
              <input
                type="text"
                placeholder="e.g. Summer Shootout, President's Cup"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Host Golf Course *</label>
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                {courses.length === 0 ? (
                  <option value="">No courses registered. Insert one first.</option>
                ) : (
                  [...courses]
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                )}
              </select>
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Cup Format Rule *</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as any)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Stableford">Stableford</option>
                <option value="Stroke Play">Stroke Play</option>
                <option value="Modified Stableford">Modified Stableford</option>
              </select>
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Tournament Classification *</label>
              <select
                value={classification}
                onChange={e => setClassification(e.target.value as any)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none font-medium"
              >
                <option value="Standard">Standard</option>
                <option value="Major">Major</option>
                <option value="Alternate">Alternate</option>
                <option value="Qualifier">Qualifier</option>
              </select>
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Link to Campaign Season *</label>
              <select
                value={eventSeasonId}
                onChange={e => setEventSeasonId(e.target.value)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Tee Time *</label>
              <input
                type="text"
                placeholder="09:00 AM"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Max Players</label>
              <input
                type="number"
                value={maxPlayers}
                onChange={e => setMaxPlayers(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-9 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Tournament Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Upcoming">Upcoming / Inactive</option>
                <option value="Live">🔴 Live / In Progress ⛳</option>
                <option value="Completed">Completed / Closed</option>
              </select>
            </div>

            {/* 1. Option to select number of individual round scores to be tracked from 1 to 4 rounds */}
            <div className="md:col-span-6 flex flex-col gap-1.5 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
              <label className="font-semibold text-stone-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                  <span>Individual Rounds Tracked *</span>
                </span>
                <span className="text-[11px] text-emerald-800 font-mono font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                  {roundsCount} {roundsCount === 1 ? 'Round (R1)' : `Rounds (R1–R${roundsCount})`}
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-white rounded-lg border border-stone-200 shadow-2xs">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRoundsCount(num)}
                    className={`py-2 px-1 rounded-md text-xs font-bold font-mono transition-all text-center cursor-pointer ${
                      roundsCount === num
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <div>{num} {num === 1 ? 'Round' : 'Rounds'}</div>
                    <div className="text-[9px] font-normal opacity-75">
                      {num === 1 ? 'R1 only' : num === 2 ? 'R1 & R2' : num === 3 ? 'R1 to R3' : 'R1 to R4'}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-stone-500">
                Configure 1 to 4 individual round scores to track on live scorecards.
              </p>
            </div>

            {/* 2. Option to select standings score display format from individual gross, net or Stableford points or any combination of the three */}
            <div className="md:col-span-6 flex flex-col gap-1.5 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
              <label className="font-semibold text-stone-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  <span>Standings Score Display Format *</span>
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  (Any combination of the three)
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-lg border border-stone-200 shadow-2xs">
                {/* Individual Gross */}
                <button
                  type="button"
                  onClick={() => {
                    setScoreDisplayFormats(prev => {
                      if (prev.includes('gross')) {
                        if (prev.length <= 1) return prev;
                        return prev.filter(f => f !== 'gross');
                      }
                      return [...prev, 'gross'];
                    });
                  }}
                  className={`py-2 px-1 rounded-md text-xs font-bold font-mono transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                    scoreDisplayFormats.includes('gross')
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {scoreDisplayFormats.includes('gross') && <span>✓</span>}
                    <span>Gross</span>
                  </div>
                  <span className="text-[9px] font-normal opacity-80">Individual Gross</span>
                </button>

                {/* Individual Net */}
                <button
                  type="button"
                  onClick={() => {
                    setScoreDisplayFormats(prev => {
                      if (prev.includes('net')) {
                        if (prev.length <= 1) return prev;
                        return prev.filter(f => f !== 'net');
                      }
                      return [...prev, 'net'];
                    });
                  }}
                  className={`py-2 px-1 rounded-md text-xs font-bold font-mono transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                    scoreDisplayFormats.includes('net')
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {scoreDisplayFormats.includes('net') && <span>✓</span>}
                    <span>Net</span>
                  </div>
                  <span className="text-[9px] font-normal opacity-80">Handicap Adjusted</span>
                </button>

                {/* Stableford Points */}
                <button
                  type="button"
                  onClick={() => {
                    setScoreDisplayFormats(prev => {
                      if (prev.includes('points')) {
                        if (prev.length <= 1) return prev;
                        return prev.filter(f => f !== 'points');
                      }
                      return [...prev, 'points'];
                    });
                  }}
                  className={`py-2 px-1 rounded-md text-xs font-bold font-mono transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                    scoreDisplayFormats.includes('points')
                      ? 'bg-amber-500 text-stone-950 font-extrabold shadow-xs'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {scoreDisplayFormats.includes('points') && <span>✓</span>}
                    <span>Stableford</span>
                  </div>
                  <span className="text-[9px] font-normal opacity-80">Points Awarded</span>
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 text-[10px] text-stone-500 pt-0.5 font-mono">
                <span className="uppercase text-stone-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => setScoreDisplayFormats(['gross', 'net', 'points'])}
                  className="text-emerald-800 hover:underline font-semibold"
                >
                  All Three
                </button>
                <span>&middot;</span>
                <button
                  type="button"
                  onClick={() => setScoreDisplayFormats(['gross', 'net'])}
                  className="text-emerald-800 hover:underline font-semibold"
                >
                  Gross & Net
                </button>
                <span>&middot;</span>
                <button
                  type="button"
                  onClick={() => setScoreDisplayFormats(['net', 'points'])}
                  className="text-emerald-800 hover:underline font-semibold"
                >
                  Net & Points
                </button>
                <span>&middot;</span>
                <button
                  type="button"
                  onClick={() => setScoreDisplayFormats(['points'])}
                  className="text-emerald-800 hover:underline font-semibold"
                >
                  Stableford Only
                </button>
              </div>
            </div>

            {/* When Live/In Progress is selected in tournament status, add option to create and edit live leaderboard for that tournament */}
            {status === 'Live' && (
              <div className="md:col-span-12 bg-gradient-to-r from-red-950/85 via-stone-900 to-red-950/85 border-2 border-red-500/60 rounded-2xl p-4 sm:p-5 text-white shadow-lg space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping"></span>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold">
                        Live / In Progress Tournament Status Selected
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-base sm:text-lg text-white">
                      Live Tournament Leaderboard & Real-Time Scoring
                    </h4>
                    <p className="text-xs text-stone-300">
                      Manage real-time player scores, thru-holes, round tallies, and live standings for this tournament.
                    </p>
                    <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-stone-300 flex-wrap">
                      <span className="bg-stone-800/90 border border-stone-700 px-2 py-0.5 rounded text-stone-300">
                        Tracking: {roundsCount} {roundsCount === 1 ? 'Round (R1)' : `Rounds (R1–R${roundsCount})`}
                      </span>
                      <span className="bg-stone-800/90 border border-stone-700 px-2 py-0.5 rounded text-amber-300">
                        Display: {scoreDisplayFormats.map(s => s === 'points' ? 'Stableford Points' : s.toUpperCase()).join(' + ')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenLiveLeaderboardFromForm}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer shrink-0"
                  >
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>{hasExistingLiveScores ? 'Edit Live Leaderboard' : 'Create Live Leaderboard'}</span>
                  </button>
                </div>

                {hasExistingLiveScores ? (
                  <div className="flex items-center gap-3 text-xs text-stone-300 pt-2 border-t border-red-500/30 font-mono">
                    <span className="text-red-300">📊 {editingResults.length} Players recorded on live leaderboard</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-emerald-400">Scores live & synchronized in real time</span>
                  </div>
                ) : (
                  <div className="text-xs text-stone-400 pt-1 border-t border-red-500/20 italic">
                    💡 Click <strong>"Create Live Leaderboard"</strong> to initialize player scorecards or import the society roster for this tournament.
                  </div>
                )}
              </div>
            )}

            <div className="md:col-span-9 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Tournament Scope / Notes description</label>
              <input
                type="text"
                placeholder="Lunch provided, handicap limit standard, green fee is £45, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-12 flex items-center gap-2.5 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl">
              <input
                type="checkbox"
                id="isSpotlightFixtureForm"
                checked={isSpotlightForm}
                onChange={e => setIsSpotlightForm(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="isSpotlightFixtureForm" className="text-xs font-semibold text-stone-800 cursor-pointer select-none flex items-center gap-1.5 flex-wrap">
                <span>🌟 Feature as Spotlight Fixture on Society Homepage</span>
                <span className="text-[10px] text-stone-500 font-normal">
                  (Sets this tournament to be featured in the Spotlight card on the Home screen)
                </span>
              </label>
            </div>

            <div className="md:col-span-12 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={resetForm}
                className="bg-stone-200 text-stone-700 font-bold px-4 py-2 rounded-lg uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2 rounded-lg uppercase"
              >
                {editingEvent ? 'Save Parameters' : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Spotlight Fixture Overview Ribbon */}
      {currentSpotlightEvent && (
        <div className={`text-white rounded-xl p-3.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border shadow-sm text-xs text-left ${
          isCurrentSpotlightLive
            ? 'bg-red-950/90 border-red-500/50'
            : 'bg-stone-900 border-amber-400/40'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px] ${
              isCurrentSpotlightLive ? 'text-red-300' : 'text-amber-400'
            }`}>
              {isCurrentSpotlightLive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block animate-ping"></span>
                  🔴 Live Spotlight Priority:
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Homepage Spotlight:
                </>
              )}
            </span>
            <span className="font-bold text-stone-100">{currentSpotlightEvent.title}</span>
            <span className="text-stone-400 text-[11px]">({formatAppDate(currentSpotlightEvent.date)})</span>
            {isCurrentSpotlightLive ? (
              <span className="bg-red-500/20 text-red-200 border border-red-500/50 text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold animate-pulse">
                🔴 Live Now
              </span>
            ) : isManuallyPinned ? (
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold">
                📌 Pinned
              </span>
            ) : (
              <span className="bg-stone-800 text-stone-400 border border-stone-700 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase">
                ⚡ Auto
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCurrentSpotlightLive && (
              <button
                type="button"
                onClick={() => setLiveLeaderboardEvent(currentSpotlightEvent)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAdmin ? 'Manage Live Leaderboard' : 'View Live Leaderboard'}</span>
              </button>
            )}
            {isAdmin && updateSiteContent && isManuallyPinned && (
              <button
                onClick={() => updateSiteContent('spotlight_event_id', 'auto')}
                className="text-[11px] text-stone-400 hover:text-white underline cursor-pointer"
              >
                Reset to Auto
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Filter Navigation items */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Status filtering switches */}
        <div className="flex border border-stone-200 rounded bg-white overflow-hidden text-xs p-0.5">
          {(['All', 'Live', 'Upcoming', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 sm:px-4 py-1.5 rounded-md font-bold transition-all ${
                filterStatus === st 
                  ? 'bg-emerald-800 text-white font-bold' 
                  : 'text-stone-600 hover:text-emerald-850 hover:bg-stone-50'
              }`}
            >
              {st === 'Live' ? '🔴 Live' : st}
            </button>
          ))}
        </div>

        {/* Format filtering dropdown */}
        <div className="text-xs flex items-center gap-1.5 font-medium">
          <span className="text-stone-400 font-mono uppercase text-[10px]">Format Rule:</span>
          <select
            value={filterFormat}
            onChange={e => setFilterFormat(e.target.value)}
            className="bg-white border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Formats</option>
            <option value="Stableford">Stableford</option>
            <option value="Stroke Play">Stroke Play</option>
            <option value="Modified Stableford">Modified Stableford</option>
          </select>
        </div>

      </div>

      {/* 4. Tournaments Cards / Ledger listings */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-205 text-center space-y-2">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-display font-medium text-stone-800 text-base uppercase font-bold">No Tournaments found</h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto">
            No tournaments scheduling corresponded to the specified parameters for the {currentSeasonName} season database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((ev) => {
            const isSelected = selectedEventId === ev.id;
            const course = courses.find(c => c.id === ev.courseId);
            const isCurrentSpotlight = currentSpotlightEvent?.id === ev.id;
            const isExplicitlyPinned = configuredSpotlightId === ev.id;
            const isLive = isEventLive(ev);
            const isQualifier = ev.classification === 'Qualifier' || ev.title.includes('(Q)') || ev.title.includes('Qualifier');
            
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEventId(isSelected ? null : ev.id)}
                className={`bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isLive
                    ? 'border-red-400 ring-2 ring-red-400/30 shadow-md'
                    : isExplicitlyPinned
                      ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                      : isSelected 
                        ? 'border-emerald-800 ring-2 ring-emerald-800/10 shadow-lg scale-[1.01]' 
                        : 'border-stone-205 hover:border-stone-350 shadow-sm'
                }`}
              >
                {/* Visual Accent */}
                <div className={`h-1.5 ${isLive ? 'bg-red-500' : isCurrentSpotlight ? 'bg-amber-400' : ev.status === 'Completed' ? 'bg-stone-400' : 'bg-emerald-600'}`} />

                <div className="p-5 space-y-4">
                  {/* Title Bar */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider flex flex-wrap items-center gap-1.5 font-bold mb-1">
                        {isCurrentSpotlight && (
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] flex items-center gap-1 shadow-xs ${
                            isCurrentSpotlightLive
                              ? 'bg-red-500 text-white animate-pulse'
                              : isExplicitlyPinned 
                                ? 'bg-amber-400 text-stone-900 border border-amber-500' 
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            ★ SPOTLIGHT {isCurrentSpotlightLive ? 'LIVE' : isExplicitlyPinned ? 'PINNED' : 'AUTO'}
                          </span>
                        )}
                        {ev.classification === 'Major' ? (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-black text-[9px]">
                            🏆 MAJOR
                          </span>
                        ) : ev.classification === 'Alternate' ? (
                          <span className="text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-black text-[9px]">
                            ⛳ ALTERNATE
                          </span>
                        ) : ev.classification === 'Qualifier' ? (
                          <span className="text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-black text-[9px]">
                            ⭐ QUALIFIER
                          </span>
                        ) : (
                          <span className="text-stone-600 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded font-black text-[9px]">
                            STANDARD
                          </span>
                        )}
                        <span>&middot; {ev.format || 'Stableford'} &middot; {ev.roundsCount || 1} Round{(ev.roundsCount || 1) > 1 ? 's' : ''}</span>
                      </span>
                      <h3 className="font-display font-bold text-stone-900 text-base uppercase leading-normal hover:text-emerald-850">
                        {ev.title}
                      </h3>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase flex items-center gap-1 ${
                      isLive
                        ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse font-extrabold'
                        : ev.status === 'Completed'
                          ? 'bg-stone-105 text-stone-605 border border-stone-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-150'
                    }`}>
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-ping"></span>}
                      {isLive ? 'Live' : ev.status}
                    </span>
                  </div>

                  {/* Calendar details */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-stone-650 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatAppDate(ev.date)} {ev.endDate && ev.endDate !== ev.date ? `to ${formatAppDate(ev.endDate)}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>Tee off: 12:00 AM GMT</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate">Course: <strong>{course ? course.name : 'All host course'}</strong></span>
                    </div>
                  </div>

                  {/* Notes description */}
                  {ev.notes && (
                    <p className="text-xs text-stone-500 italic border-l-2 border-stone-200 pl-3.5">
                      "{ev.notes}"
                    </p>
                  )}
                </div>

                {/* Card footer details / actions */}
                <div className="bg-stone-50/50 p-4 border-t border-stone-105 flex items-center justify-between text-xs text-stone-450 font-mono">
                  <div className="flex items-center gap-1 font-semibold text-[10px]">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>LMT {ev.maxPlayers || 16} SPOTS</span>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {isLive ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isQualifier ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLiveLeaderboardDivision('main');
                              setLiveLeaderboardEvent(ev);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded font-bold text-[10px] uppercase flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                            <Trophy className="w-3 h-3 text-red-600" />
                            <span>{isAdmin ? 'Live Leaderboard' : 'Live Board'}</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLiveLeaderboardDivision('main');
                                setLiveLeaderboardEvent(ev);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded font-bold text-[10px] uppercase flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Main Division Live Leaderboard"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <Trophy className="w-3 h-3 text-emerald-700" />
                              <span>🏆 Main Board</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLiveLeaderboardDivision('alternate');
                                setLiveLeaderboardEvent(ev);
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded font-bold text-[10px] uppercase flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Alternate Division Live Leaderboard"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              <Trophy className="w-3 h-3 text-amber-700" />
                              <span>⛳ Alternate Board</span>
                            </button>
                          </>
                        )}
                      </div>
                    ) : ev.status === 'Completed' ? (
                      <button 
                        onClick={() => setCurrentTab('results')}
                        className="text-emerald-850 hover:underline hover:text-emerald-950 font-bold text-[10px] uppercase flex items-center gap-1"
                      >
                        <Trophy className="w-3 h-3 text-amber-500" />
                        <span>Scoresheet</span>
                      </button>
                    ) : (
                      <span className="text-stone-400 text-[9px] uppercase">Rounds open</span>
                    )}

                    {isAdmin && updateSiteContent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isExplicitlyPinned) {
                            updateSiteContent('spotlight_event_id', 'auto');
                          } else {
                            updateSiteContent('spotlight_event_id', ev.id);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-all cursor-pointer ${
                          isExplicitlyPinned
                            ? 'bg-amber-400 text-stone-900 shadow-xs hover:bg-amber-300 font-extrabold'
                            : isCurrentSpotlight
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                              : 'bg-stone-100 text-stone-600 hover:text-amber-800 hover:bg-amber-50 border border-stone-200'
                        }`}
                        title={
                          isExplicitlyPinned
                            ? "Currently pinned as Spotlight Fixture on Home. Click to unpin and return to auto."
                            : "Set this tournament as the Spotlight Fixture on Home page"
                        }
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>
                          {isExplicitlyPinned
                            ? '★ Spotlight Pinned'
                            : isCurrentSpotlight
                              ? isCurrentSpotlightLive
                                ? '★ Live Spotlight'
                                : '★ Spotlight (Auto)'
                              : 'Set Spotlight'}
                        </span>
                      </button>
                    )}

                    {isAdmin && (
                      <div className="flex gap-1 border-l border-stone-200 pl-2">
                        <button
                          onClick={(e) => handleEditClick(ev, e)}
                          className="p-1 rounded text-stone-400 hover:text-emerald-700"
                          title="Modify tournament parameters"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="p-1 rounded text-stone-400 hover:text-red-700"
                          title="Delete tournament"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 4. Real-time Tournament / Event profile details overlay in a high-contrast, backdrop-blurred modal */}
      {selectedEvent && selectedCourse && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedEventId(null)}
          id="event-detailed-modal"
        >
          <div 
            className="bg-stone-900 text-stone-100 rounded-3xl border-2 border-[#fbbf24]/50 shadow-2xl p-6 sm:p-8 space-y-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative overflow-hidden text-left font-sans animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex justify-between items-start border-b border-stone-800 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest block">ACTIVE TOURNEY HIGHLIGHT</span>
                <h2 className="font-display font-medium text-stone-200 text-xl sm:text-2xl uppercase font-bold inline-flex items-center gap-2">
                  <span>{selectedEvent.title}</span>
                  {selectedEvent.classification === 'Major' && (
                    <Sparkles className="w-4 h-4 text-[#fbbf24] animate-pulse" />
                  )}
                </h2>
                <p className="text-xs text-stone-400">📅 {formatAppDate(selectedEvent.date)} {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date ? `to ${formatAppDate(selectedEvent.endDate)}` : ''}</p>
              </div>

              <button
                onClick={() => setSelectedEventId(null)}
                className="text-stone-300 hover:text-white font-mono text-xs bg-stone-800 hover:bg-stone-750 transition px-3 py-1.5 rounded-lg border border-stone-700 font-bold"
              >
                Close Details ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-sm leading-relaxed">
              
              {/* Left Column info */}
              <div className="md:col-span-8 space-y-4 font-sans">
                <div className="space-y-1 bg-stone-950/50 p-4 rounded-xl border border-stone-850/65">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block font-bold mb-1">Host Golf Course Location</span>
                  <div className="text-stone-200 font-sans font-medium">
                    Course: <button 
                      type="button" 
                      onClick={() => setViewingCourse(selectedCourse)} 
                      className="text-[#fbbf24] hover:text-[#fbbf24]/80 underline font-extrabold hover:scale-102 transition-transform inline-flex items-center gap-1 font-mono text-xs uppercase"
                    >
                      {selectedCourse.name} ↗
                    </button>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">📍 {selectedCourse.location}</p>
                </div>

                {selectedEvent.notes && (
                  <div className="bg-stone-950 p-4 rounded-xl border border-stone-850/60 space-y-1">
                    <span className="text-[10px] font-mono text-amber-505 uppercase flex items-center gap-1 leading-none font-bold mb-1">
                      <Info className="w-3 h-3 text-[#fbbf24]" />
                      <span>Tournament notice & special instructions</span>
                    </span>
                    <p className="text-stone-305 text-xs italic leading-relaxed">
                      "{selectedEvent.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column Layout & Stats */}
              <div className="md:col-span-4 bg-stone-950 p-5 rounded-xl border border-stone-850/60 flex flex-col justify-between gap-6">
                
                <div className="space-y-3 text-xs">
                  <h4 className="font-display font-bold text-white uppercase text-[10px] tracking-widest border-b border-stone-850 pb-2">
                    Tournament Rules & Info
                  </h4>

                  <div className="flex justify-between items-center text-stone-400 font-mono">
                    <span>FORMAT RULE</span>
                    <span className="font-bold text-white uppercase">{selectedEvent.format || 'Stableford'}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-400 font-mono">
                    <span>TYPE STATUS</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      selectedEvent.classification === 'Major' ? 'bg-[#fbbf24]/20 text-[#fbbf24]' : 'bg-emerald-500/25 text-emerald-300'
                    }`}>
                      {selectedEvent.classification || 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-stone-400 font-mono">
                    <span>MAX PLAYERS</span>
                    <span className="font-bold text-white">{selectedEvent.maxPlayers || 16} SPOTS</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-400 font-mono">
                    <span>ROUNDS TOTAL</span>
                    <span className="font-bold text-white">{selectedEvent.roundsCount || 1} ROUNDS</span>
                  </div>
                </div>

                {selectedEvent.status === 'Live' || isEventLive(selectedEvent) ? (
                  <button
                    onClick={() => {
                      setLiveLeaderboardEvent(selectedEvent);
                    }}
                    className="w-full text-center bg-red-600 hover:bg-red-500 border border-red-500 text-white hover:scale-102 transition-all py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping"></span>
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isAdmin ? 'Manage Live Leaderboard' : 'View Live Leaderboard'}</span>
                  </button>
                ) : selectedEvent.status === 'Completed' ? (
                  <button
                    onClick={() => {
                      setSelectedEventId(null);
                      setCurrentTab('results');
                    }}
                    className="w-full text-center bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white hover:scale-102 transition-all py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>View Completed Results</span>
                  </button>
                ) : (
                  <div className="bg-emerald-955 border border-emerald-900/60 text-emerald-400 rounded-lg p-2.5 text-center text-[11px] font-mono font-bold uppercase tracking-wide">
                    ⏳ Dynamic registrations open
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* 5. Nested Course Profile modal inside Events Tab */}
      {viewingCourse && (
        <div 
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setViewingCourse(null)}
          id="course-nested-modal"
        >
          <div 
            className="bg-stone-900 text-stone-100 rounded-3xl border-2 border-[#fbbf24]/50 shadow-2xl p-6 sm:p-8 space-y-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative overflow-hidden text-left font-sans animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex justify-between items-start border-b border-stone-800 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest block">APPROVED COURSE PROFILE</span>
                <h2 className="font-display font-medium text-stone-200 text-xl sm:text-2xl uppercase font-bold inline-flex items-center gap-2">
                  <span>{viewingCourse.name}</span>
                  <Sparkles className="w-4 h-4 text-[#fbbf24] animate-pulse" />
                </h2>
                <p className="text-xs text-stone-400">📍 {viewingCourse.location}</p>
              </div>

              <button
                onClick={() => setViewingCourse(null)}
                className="text-stone-300 hover:text-white font-mono text-xs bg-stone-800 hover:bg-stone-750 transition px-3 py-1.5 rounded-lg border border-stone-700 font-bold"
              >
                Close Course View ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-sm leading-relaxed">
              
              <div className="md:col-span-8 space-y-4 font-sans">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Course Highlights & Bio</span>
                  <p className="text-stone-300 text-xs sm:text-sm">
                    {viewingCourse.description}
                  </p>
                </div>

                {viewingCourse.notes && (
                  <div className="bg-stone-950 p-4 rounded-xl border border-stone-850/60 space-y-1">
                    <span className="text-[10px] font-mono text-[#fbbf24] uppercase flex items-center gap-1 leading-none font-bold mb-1">
                      <Info className="w-3 h-3 text-[#fbbf24]" />
                      <span>Caddie playing guidelines (Committees Local Knowledge)</span>
                    </span>
                    <p className="text-stone-400 text-xs italic leading-relaxed">
                      "{viewingCourse.notes}"
                    </p>
                  </div>
                )}
              </div>

              <div className="md:col-span-4 bg-stone-950 p-5 rounded-xl border border-stone-850/60 flex flex-col justify-between gap-6">
                
                <div className="space-y-3 text-xs">
                  <h4 className="font-display font-bold text-white uppercase text-[10px] tracking-widest border-b border-stone-855 pb-2">
                    Layout Statistics
                  </h4>

                  <div className="flex justify-between items-center text-stone-400 font-mono">
                    <span>STANDARD PAR</span>
                    <span className="font-bold text-white uppercase">PAR {viewingCourse.par}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-400 font-mono">
                    <span>HCP DENSITY</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      viewingCourse.difficulty === 'Hard' ? 'bg-red-500/20 text-red-300' :
                      viewingCourse.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-500/20 text-slate-100'
                    }`}>
                      {viewingCourse.difficulty} Test
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-stone-400 font-mono">
                    <span>TEE ACCESS</span>
                    <span className="font-bold text-white">SOCIETY CONFIRMED</span>
                  </div>
                </div>

                {(viewingCourse.websiteUrl || viewingCourse.website) && (
                  <a
                    href={viewingCourse.websiteUrl || viewingCourse.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 hover:scale-102 transition-all py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Visit Club Website</span>
                  </a>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Live Tournament Leaderboard Modal */}
      {liveLeaderboardEvent && (
        <LiveLeaderboardModal
          isOpen={Boolean(liveLeaderboardEvent)}
          onClose={() => setLiveLeaderboardEvent(null)}
          event={liveLeaderboardEvent}
          course={courses.find(c => c.id === liveLeaderboardEvent.courseId)}
          members={members}
          results={results}
          isAdmin={isAdmin}
          defaultDivision={liveLeaderboardDivision}
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
