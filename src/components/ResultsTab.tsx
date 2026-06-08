/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Award, Plus, Trash2, Search, Filter, ShieldAlert, Download, Save, RefreshCw } from 'lucide-react';
import { Event, TournamentResult, Member, GolfCourse } from '../types';

interface ResultsTabProps {
  events: Event[];
  results: TournamentResult[];
  members: Member[];
  courses: GolfCourse[];
  activeSeasonId: string;
  isAdmin: boolean;
  setEventResults: (eventId: string, newResults: Omit<TournamentResult, 'id' | 'eventId'>[]) => void;
  deleteResult: (id: string) => void;
}

export default function ResultsTab({
  events,
  results,
  members,
  courses,
  activeSeasonId,
  isAdmin,
  setEventResults,
  deleteResult
}: ResultsTabProps) {
  // Filter only completed events for the current season
  const completedEvents = events.filter(e => e.seasonId === activeSeasonId && e.status === 'Completed');

  // Active selected event for looking at results
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return completedEvents[0]?.id || '';
  });

  // If selected event ID is not in active completedEvents (due to season switch), reset it safely
  React.useEffect(() => {
    if (completedEvents.length > 0 && !completedEvents.some(e => e.id === selectedEventId)) {
      setSelectedEventId(completedEvents[0].id);
    }
  }, [activeSeasonId, completedEvents, selectedEventId]);

  // Search filter
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  // Admin spreadsheet mock inputs for the selected event
  // Admin spreadsheet mock inputs for the selected event
  const [adminResults, setAdminResults] = useState<{
    playerId: string;
    grossScore: number;
    handicap: number;
    netScore: number;
    points: number;
    position: number;
  }[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const activeEvent = events.find(e => e.id === selectedEventId);
  const activeCourse = activeEvent ? courses.find(c => c.id === activeEvent.courseId) : null;

  // Find results for selected event
  const eventResults = results
    .filter(r => r.eventId === selectedEventId)
    .sort((a, b) => a.position - b.position);

  // Filtered by text query
  const searchableResults = eventResults.filter(r => {
    const member = members.find(m => m.id === r.playerId);
    if (!member) return false;
    return member.name.toLowerCase().includes(playerSearchQuery.toLowerCase());
  });

  // Set up admin panel state with existing results
  const handleOpenAdmin = () => {
    if (eventResults.length > 0) {
      setAdminResults(eventResults.map(r => {
        const member = members.find(m => m.id === r.playerId);
        return {
          playerId: r.playerId,
          grossScore: r.grossScore,
          handicap: r.handicap !== undefined ? r.handicap : (member ? member.handicap : 0),
          netScore: r.netScore,
          points: r.points,
          position: r.position
        };
      }));
    } else {
      // Seed with some blank entries
      const defaultMember = members[0];
      const defaultHcp = defaultMember ? defaultMember.handicap : 18;
      setAdminResults([{
        playerId: defaultMember?.id || '',
        grossScore: 85,
        handicap: defaultHcp,
        netScore: 85 - defaultHcp,
        points: 0,
        position: 1
      }]);
    }
    setShowAdminPanel(true);
  };

  const handleAddAdminRow = () => {
    // Find first member not already in adminResults
    const availableMember = members.find(m => !adminResults.some(ar => ar.playerId === m.id)) || members[0];
    const defaultHcp = availableMember ? availableMember.handicap : 18;
    setAdminResults(prev => [...prev, { 
      playerId: availableMember?.id || '', 
      grossScore: 85,
      handicap: defaultHcp,
      netScore: 85 - defaultHcp,
      points: 0,
      position: prev.length + 1
    }]);
  };

  const handleRemoveAdminRow = (index: number) => {
    setAdminResults(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdminValueChange = (
    index: number,
    key: 'playerId' | 'grossScore' | 'handicap' | 'netScore' | 'points' | 'position',
    value: any
  ) => {
    setAdminResults(prev => {
      const copy = [...prev];
      let val = value;
      if (key !== 'playerId') {
        val = Number(value);
      }
      
      const updatedRow = {
        ...copy[index],
        [key]: val
      };

      // Auto-update handicap standard when player changes, as a helpful default, but let them customize.
      if (key === 'playerId') {
        const member = members.find(m => m.id === value);
        if (member) {
          updatedRow.handicap = member.handicap;
          updatedRow.netScore = updatedRow.grossScore - member.handicap;
        }
      }

      copy[index] = updatedRow;
      return copy;
    });
  };

  const handleSaveScores = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminResults.length === 0) {
      alert('Cannot save an empty scorecard board.');
      return;
    }

    // Check for duplicate players in the scorecard
    const playerIdsSet = new Set(adminResults.map(ar => ar.playerId));
    if (playerIdsSet.size !== adminResults.length) {
      alert('Error: You have duplicate players entered in the score grid. Each player can only have one score record per event.');
      return;
    }

    const finalScores = adminResults.map(ar => ({
      playerId: ar.playerId,
      grossScore: ar.grossScore,
      handicap: ar.handicap,
      netScore: ar.netScore,
      points: ar.points,
      position: ar.position
    }));

    // Save
    setEventResults(selectedEventId, finalScores);
    setShowAdminPanel(false);
    alert('Scores successfully saved with standard manual adjustments. The League Table has automatically updated!');
  };

  // CSV download function for society records
  const handleDownloadResults = () => {
    if (eventResults.length === 0) return;
    const headers = ['Rank', 'Player', 'Handicap', 'Gross Score', 'Net Score', 'Points Won'];
    const rows = eventResults.map(r => {
      const member = members.find(m => m.id === r.playerId);
      return [
        r.position,
        member ? member.name : 'Unknown',
        member ? member.handicap : 0,
        r.grossScore,
        r.netScore,
        r.points
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `results_${activeEvent?.title || 'golf'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn text-left">
      
      {/* 1. Page Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight">
          Tournament Results
        </h1>
        <p className="text-stone-500 text-sm">
          Browse player gross outputs, net adjustments, scorecards distributions, and points awarded.
        </p>
      </div>

      {/* 2. Top control panel */}
      {completedEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-sm space-y-3">
          <Award className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-display font-medium text-stone-800 text-lg">No Results Available</h3>
          <p className="text-stone-500 text-sm max-w-sm mx-auto">
            There are no completed events recorded for the selected season yet. Go to Events tab to complete an event.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* selectors of events & filters */}
          <div className="bg-stone-50 p-4 sm:p-6 rounded-2xl border border-stone-250 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex flex-col gap-1.5 flex-1 max-w-md">
              <label className="text-[10px] text-[#fbbf24] font-mono tracking-widest uppercase block">Select Completed Tournament</label>
              <select
                id="results-event-picker"
                value={selectedEventId}
                onChange={e => {
                  setSelectedEventId(e.target.value);
                  setShowAdminPanel(false);
                }}
                className="bg-white border border-stone-250 rounded-lg p-2 text-stone-900 text-sm font-sans focus:outline-none focus:border-emerald-800"
              >
                {completedEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    🏆 {evt.title} ({evt.date})
                  </option>
                ))}
              </select>
            </div>

            {/* Searches / downloads */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative text-xs">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Player..."
                  value={playerSearchQuery}
                  onChange={e => setPlayerSearchQuery(e.target.value)}
                  className="bg-white border border-stone-250 rounded-xl pl-9 pr-4 py-2 w-44 text-stone-900 focus:outline-none"
                />
              </div>

              {eventResults.length > 0 && (
                <button
                  onClick={handleDownloadResults}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-stone-200"
                  title="Download CSV grid"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={handleOpenAdmin}
                  className="bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm shadow-stone-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>{eventResults.length > 0 ? 'Edit Scorecard' : 'Enter Scorecard'}</span>
                </button>
              )}
            </div>

          </div>

          {/* 3. Event Summary Header */}
          {activeEvent && (
            <div className="bg-emerald-950 text-white rounded-2xl p-5 sm:p-6 border border-emerald-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest block">Venue of Record</span>
                <h2 className="font-display font-bold text-lg sm:text-xl text-stone-100 uppercase">{activeEvent.title}</h2>
                <p className="text-stone-300 text-xs sm:text-sm">
                  Played at <strong>{activeCourse ? activeCourse.name : 'Unknown course'}</strong> across par {activeCourse?.par || 72}
                </p>
              </div>

              <div className="bg-stone-900/60 border border-emerald-800 rounded-xl px-4 py-3 text-right">
                <span className="text-[9px] text-stone-400 block uppercase font-mono">Tournament Date</span>
                <span className="text-sm font-bold text-yellow-400 font-mono">{activeEvent.date}</span>
              </div>
            </div>
          )}

          {/* 4. Admin scoring panel */}
          {isAdmin && showAdminPanel && (
            <div className="bg-white border-2 border-[#fbbf24]/40 rounded-2xl p-6 shadow-lg space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2 text-stone-900">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h3 className="font-display font-bold uppercase text-base">Scorecard Editor Spread: {activeEvent?.title}</h3>
                </div>
                <button 
                  onClick={() => setShowAdminPanel(false)} 
                  className="text-stone-500 hover:text-stone-900 font-mono text-xs"
                >
                  Close Grid ✕
                </button>
              </div>

              <form onSubmit={handleSaveScores} className="space-y-6">
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="w-full text-left text-xs sm:text-sm font-sans leading-relaxed">
                    <thead className="bg-[#064e3b] text-stone-100 font-display uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4"># Row</th>
                        <th className="py-3 px-4">Player Name</th>
                        <th className="py-3 px-4">Played Handicap</th>
                        <th className="py-3 px-4">Gross Score</th>
                        <th className="py-3 px-4">Net Score</th>
                        <th className="py-3 px-4">Points Awarded</th>
                        <th className="py-3 px-4">Pos / Rank</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {adminResults.map((ar, index) => {
                        return (
                          <tr key={index} className="hover:bg-stone-50/50">
                            <td className="py-3 px-4 font-mono font-semibold text-[#fbbf24]">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4 min-w-[180px]">
                              <select
                                value={ar.playerId}
                                onChange={e => handleAdminValueChange(index, 'playerId', e.target.value)}
                                className="bg-white border border-stone-250 p-1.5 rounded w-full text-stone-900 focus:outline-none text-xs"
                              >
                                {members.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} (Hcp: {m.handicap})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                step="0.1"
                                value={ar.handicap}
                                onChange={e => handleAdminValueChange(index, 'handicap', e.target.value)}
                                className="bg-white border border-stone-250 p-1.5 rounded w-16 font-mono text-stone-900 focus:outline-none text-xs"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min={0}
                                max={200}
                                value={ar.grossScore}
                                onChange={e => handleAdminValueChange(index, 'grossScore', e.target.value)}
                                className="bg-white border border-stone-250 p-1.5 rounded w-16 font-mono text-stone-900 focus:outline-none text-xs"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                step="0.1"
                                value={ar.netScore}
                                onChange={e => handleAdminValueChange(index, 'netScore', e.target.value)}
                                className="bg-white border border-stone-250 p-1.5 rounded w-16 font-mono text-stone-900 focus:outline-none text-xs"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min={0}
                                value={ar.points}
                                onChange={e => handleAdminValueChange(index, 'points', e.target.value)}
                                className="bg-white border border-stone-250 p-1.5 rounded w-16 font-mono text-stone-900 focus:outline-none text-xs"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min={1}
                                value={ar.position}
                                onChange={e => handleAdminValueChange(index, 'position', e.target.value)}
                                className="bg-white border border-stone-250 p-1.5 rounded w-16 font-mono text-stone-900 focus:outline-none text-xs"
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveAdminRow(index)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Remove row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-4">
                  <button
                    type="button"
                    onClick={handleAddAdminRow}
                    className="bg-stone-900 text-stone-100 hover:text-[#fbbf24] border border-stone-800 font-mono text-xs uppercase px-4 py-2 rounded-xl flex items-center gap-1.5"
                  >
                    <span>+ Add Player row</span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAdminPanel(false)}
                      className="bg-stone-200 text-stone-700 font-bold text-xs uppercase px-5 py-2.5 rounded-xl hover:bg-stone-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 font-bold text-xs uppercase px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Scorecard Parameters</span>
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-stone-500 leading-relaxed font-sans mt-2">
                  💡 <strong>Manual Input Mode Enabled:</strong> Played handicaps, gross/net scores, points earned, and position metrics are saved precisely as input above. Existing formulas or auto-ranks have been deactivated per requested specifications.
                </div>
              </form>
            </div>
          )}

          {/* 5. Results Listing Table */}
          {eventResults.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-8 rounded-2xl text-center space-y-2">
              <h4 className="font-display font-bold uppercase text-sm">No scorecards submitted for this event yet</h4>
              <p className="text-xs">
                As an administrator, toggle Admin View in the page header and click "Enter Scorecard" to declare player outputs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-stone-200 shadow-sm bg-white">
              <table className="w-full text-left text-xs sm:text-sm font-sans leading-relaxed">
                <thead className="bg-[#064e3b] text-stone-100 font-display uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-4 px-5">Pos</th>
                    <th className="py-4 px-5">Player Name</th>
                    <th className="py-4 px-5">Handicap</th>
                    <th className="py-4 px-5">Gross Score</th>
                    <th className="py-4 px-5">Net Score</th>
                    <th className="py-4 px-5 text-right">Points Awarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {searchableResults.map((row) => {
                    const member = members.find(m => m.id === row.playerId);
                    const isPodium = row.position <= 3;
                    
                    return (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-stone-50/70 transition-colors ${
                          row.position === 1 ? 'bg-amber-50/20' : ''
                        }`}
                        id={`results-row-${row.playerId}`}
                      >
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-bold ${
                            row.position === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            row.position === 2 ? 'bg-slate-100 text-slate-700 border border-slate-350' :
                            row.position === 3 ? 'bg-orange-50 text-orange-850 border border-orange-250' :
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {row.position}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-semibold text-stone-900 font-sans">
                          <div className="flex items-center gap-2">
                            <img 
                              src={member?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=fallback'} 
                              alt={member?.name || 'Player'} 
                              className="w-6 h-6 rounded-full bg-stone-100 border border-stone-200 flex-shrink-0"
                            />
                            <span>{member ? member.name : 'Unknown player'}</span>
                            {member?.role === 'Committee' && (
                              <span className="bg-emerald-50 text-emerald-800 text-[8px] uppercase font-bold px-1 py-0.5 rounded border border-emerald-200">
                                Comm
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-stone-600 font-medium">
                          {member ? member.handicap : 0}
                        </td>
                        <td className="py-4 px-5 font-mono font-normal text-stone-700">
                          {row.grossScore} strokes
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-emerald-800">
                          {row.netScore}
                        </td>
                        <td className="py-4 px-5 text-right font-mono font-bold text-stone-900">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            isPodium ? 'bg-teal-50 text-teal-800 border border-teal-200 font-bold' : ''
                          }`}>
                            +{row.points} PTS
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {searchableResults.length === 0 && eventResults.length > 0 && (
            <div className="text-center p-6 text-stone-500 font-sans text-xs">
              No matching records for filter "{playerSearchQuery}" found in the scorecard database.
            </div>
          )}

        </div>
      )}

    </div>
  );
}
