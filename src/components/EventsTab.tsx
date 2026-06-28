/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, CheckCircle, Info, Clock, MapPin, Users, Download, Upload, Trophy, X, Sparkles, Globe } from 'lucide-react';
import { Event, GolfCourse, Season } from '../types';
import { formatAppDate } from '../utils/dateUtils';

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
  setCurrentTab
}: EventsTabProps) {
  // Local states
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewingCourse, setViewingCourse] = useState<GolfCourse | null>(null);
  const [filterFormat, setFilterFormat] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Upcoming' | 'Completed'>('All');
  
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
  const [format, setFormat] = useState<'Stableford' | 'Stroke Play' | 'Modified Stableford'>('Stableford');
  const [classification, setClassification] = useState<'Major' | 'Standard' | 'Alternate' | 'Qualifier'>('Standard');
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Upcoming' | 'Completed'>('Upcoming');
  const [eventSeasonId, setEventSeasonId] = useState(activeSeasonId);

  useEffect(() => {
    if (!editingEvent) {
      setEventSeasonId(activeSeasonId);
    }
  }, [activeSeasonId, editingEvent]);

  // Filter events of activeSeasonId
  const filteredEvents = events
    .filter(e => e.seasonId === activeSeasonId)
    .filter(e => {
      if (filterStatus === 'All') return true;
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
    setFormat('Stableford');
    setClassification('Standard');
    setMaxPlayers(16);
    setNotes('');
    setStatus('Upcoming');
    setEventSeasonId(activeSeasonId);
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
    setFormat(e.format || 'Stableford');
    setClassification(e.classification || 'Standard');
    setMaxPlayers(e.maxPlayers || 16);
    setNotes(e.notes || '');
    setStatus(e.status);
    setEventSeasonId(e.seasonId || activeSeasonId);
    setShowAddForm(true);
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
      format,
      classification,
      maxPlayers: Number(maxPlayers),
      notes,
      status
    };

    if (editingEvent) {
      updateEvent({
        ...editingEvent,
        ...payload
      });
      alert('Tournament parameters updated successfully.');
    } else {
      addEvent(payload);
      alert('New tournament registered successfully.');
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
                  courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
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

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Rounds Count</label>
              <input
                type="number"
                min="1"
                max="8"
                value={roundsCount}
                onChange={e => setRoundsCount(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Max Players Limit</label>
              <input
                type="number"
                value={maxPlayers}
                onChange={e => setMaxPlayers(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Tournament Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Upcoming">Upcoming / Inactive</option>
                <option value="Completed">Completed / Closed</option>
              </select>
            </div>

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

      {/* 3. Filter Navigation items */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Status filtering switches */}
        <div className="flex border border-stone-200 rounded bg-white overflow-hidden text-xs p-0.5">
          {(['All', 'Upcoming', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-1.5 rounded-md font-bold transition-all ${
                filterStatus === st 
                  ? 'bg-emerald-800 text-white font-bold' 
                  : 'text-stone-600 hover:text-emerald-850 hover:bg-stone-50'
              }`}
            >
              {st}
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
            
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEventId(isSelected ? null : ev.id)}
                className={`bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? 'border-emerald-800 ring-2 ring-emerald-800/10 shadow-lg scale-[1.01]' 
                    : 'border-stone-205 hover:border-stone-350 shadow-sm'
                }`}
              >
                {/* Visual Accent */}
                <div className={`h-1.5 ${ev.status === 'Completed' ? 'bg-stone-400' : 'bg-[#fbbf24]'}`} />

                <div className="p-5 space-y-4">
                  {/* Title Bar */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider flex flex-wrap items-center gap-1.5 font-bold mb-1">
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

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      ev.status === 'Completed'
                        ? 'bg-stone-105 text-stone-605 border border-stone-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-150 animate-pulse'
                    }`}>
                      {ev.status}
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
                    {ev.status === 'Completed' ? (
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

                {selectedEvent.status === 'Completed' ? (
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

    </div>
  );
}
