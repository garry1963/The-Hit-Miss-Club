/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Users, 
  ArrowUpDown, 
  CheckCircle2, 
  Clock, 
  Flag, 
  AlertCircle,
  Eye,
  Edit3
} from 'lucide-react';
import { Event, GolfCourse, Member, TournamentResult } from '../types';
import { formatAppDate, getBaseEventId } from '../utils/dateUtils';

interface LiveLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  course?: GolfCourse | null;
  members: Member[];
  results: TournamentResult[];
  isAdmin: boolean;
  onSaveResults: (eventId: string, newResults: Omit<TournamentResult, 'id' | 'eventId'>[]) => Promise<void> | void;
}

interface LeaderboardDraftRow {
  playerId: string;
  grossScore: number;
  handicap: number;
  netScore: number;
  points: number;
  position: number;
  round1Score?: number;
  round2Score?: number;
  round3Score?: number;
  round4Score?: number;
  thru?: string;
}

export default function LiveLeaderboardModal({
  isOpen,
  onClose,
  event,
  course,
  members,
  results,
  isAdmin,
  onSaveResults
}: LiveLeaderboardModalProps) {
  const isQualifier = event.classification === 'Qualifier' || event.title.includes('(Q)') || event.title.includes('Qualifier');
  const isMajor = event.classification === 'Major' || (event.roundsCount && event.roundsCount >= 4);
  const roundsToRender = event.roundsCount ? Math.min(event.roundsCount, 4) : (isMajor ? 4 : 2);

  // Sub-entry selection (Main vs Alternate) for non-qualifiers
  const [entryType, setEntryType] = useState<'main' | 'alternate'>('main');
  const targetEventId = isQualifier 
    ? event.id 
    : (entryType === 'alternate' ? `${event.id}-alternate` : `${event.id}-main`);

  // View vs Edit Mode
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Draft rows for editing
  const [draftRows, setDraftRows] = useState<LeaderboardDraftRow[]>([]);

  // Find existing results for this target event
  const currentResults = useMemo(() => {
    // Check specific targetEventId first
    let res = results.filter(r => r.eventId === targetEventId);
    // If not found and target is main, also check base event.id
    if (res.length === 0 && (targetEventId.endsWith('-main') || isQualifier)) {
      res = results.filter(r => r.eventId === event.id);
    }
    return [...res].sort((a, b) => a.position - b.position || a.netScore - b.netScore);
  }, [results, targetEventId, event.id, isQualifier]);

  // Sync draftRows from currentResults whenever opening or switching entry type
  useEffect(() => {
    if (currentResults.length > 0) {
      setDraftRows(currentResults.map(r => {
        const mem = members.find(m => m.id === r.playerId);
        return {
          playerId: r.playerId,
          grossScore: r.grossScore || 0,
          handicap: r.handicap !== undefined ? r.handicap : (mem ? mem.handicap : 18),
          netScore: r.netScore !== undefined ? r.netScore : 0,
          points: r.points || 0,
          position: r.position || 1,
          round1Score: r.round1Score || 0,
          round2Score: r.round2Score || 0,
          round3Score: r.round3Score || 0,
          round4Score: r.round4Score || 0,
          thru: r.thru || 'F'
        };
      }));
    } else {
      setDraftRows([]);
    }
    setSaveSuccessMsg('');
  }, [currentResults, members, targetEventId]);

  if (!isOpen) return null;

  const handleAddPlayer = (memberId?: string) => {
    const chosenMember = memberId 
      ? members.find(m => m.id === memberId)
      : members.find(m => !draftRows.some(r => r.playerId === m.id)) || members[0];

    if (!chosenMember) return;
    const hcp = chosenMember.handicap ?? 18;

    const newRow: LeaderboardDraftRow = {
      playerId: chosenMember.id,
      grossScore: 0,
      handicap: hcp,
      netScore: -hcp,
      points: 0,
      position: draftRows.length + 1,
      round1Score: 0,
      round2Score: 0,
      round3Score: 0,
      round4Score: 0,
      thru: '1'
    };

    setDraftRows(prev => [...prev, newRow]);
  };

  const handleImportAllMembers = () => {
    if (members.length === 0) return;
    const existingPlayerIds = new Set(draftRows.map(r => r.playerId));
    const newMembers = members.filter(m => !existingPlayerIds.has(m.id));
    if (newMembers.length === 0) {
      alert('All society members are already in the live leaderboard grid.');
      return;
    }

    const startPos = draftRows.length + 1;
    const importedRows: LeaderboardDraftRow[] = newMembers.map((m, idx) => ({
      playerId: m.id,
      grossScore: 0,
      handicap: m.handicap ?? 18,
      netScore: -(m.handicap ?? 18),
      points: 0,
      position: startPos + idx,
      round1Score: 0,
      round2Score: 0,
      round3Score: 0,
      round4Score: 0,
      thru: '1'
    }));

    setDraftRows(prev => [...prev, ...importedRows]);
  };

  const handleRemoveRow = (index: number) => {
    setDraftRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (
    index: number,
    field: keyof LeaderboardDraftRow,
    value: any
  ) => {
    setDraftRows(prev => {
      const copy = [...prev];
      const target = { ...copy[index] };

      if (field === 'playerId') {
        target.playerId = value;
        const mem = members.find(m => m.id === value);
        if (mem) {
          target.handicap = mem.handicap;
        }
      } else if (field === 'thru') {
        target.thru = String(value);
      } else {
        (target as any)[field] = Number(value);
      }

      // Recalculate Gross Score from rounds
      const r1 = Number(target.round1Score) || 0;
      const r2 = Number(target.round2Score) || 0;
      const r3 = roundsToRender >= 3 ? (Number(target.round3Score) || 0) : 0;
      const r4 = roundsToRender >= 4 ? (Number(target.round4Score) || 0) : 0;
      
      const calculatedGross = r1 + r2 + r3 + r4;
      if (calculatedGross > 0 || r1 > 0 || r2 > 0) {
        target.grossScore = calculatedGross;
      }
      target.netScore = target.grossScore - Number(target.handicap || 0);

      copy[index] = target;
      return copy;
    });
  };

  const handleAutoSort = () => {
    setDraftRows(prev => {
      const sorted = [...prev].sort((a, b) => {
        if (event.format === 'Stableford') {
          return b.points - a.points || a.netScore - b.netScore;
        } else if (event.format === 'Stroke Play') {
          return a.grossScore - b.grossScore || a.netScore - b.netScore;
        }
        return a.netScore - b.netScore || a.grossScore - b.grossScore;
      });

      // Assign position numbers (handling ties)
      let currentRank = 1;
      return sorted.map((row, idx) => {
        if (idx > 0) {
          const prevRow = sorted[idx - 1];
          const isTied = event.format === 'Stableford'
            ? prevRow.points === row.points
            : prevRow.netScore === row.netScore;
          if (!isTied) {
            currentRank = idx + 1;
          }
        }
        return {
          ...row,
          position: currentRank
        };
      });
    });
  };

  const handleSave = async () => {
    if (draftRows.length === 0) {
      alert('The leaderboard is empty. Add at least one player before saving.');
      return;
    }

    // Check for duplicate players
    const playerIds = draftRows.map(r => r.playerId);
    if (new Set(playerIds).size !== draftRows.length) {
      alert('Duplicate players detected. Each member can only appear once on the leaderboard.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const payload: Omit<TournamentResult, 'id' | 'eventId'>[] = draftRows.map(r => ({
        playerId: r.playerId,
        grossScore: Number(r.grossScore) || 0,
        handicap: Number(r.handicap) || 0,
        netScore: Number(r.netScore) || 0,
        points: Number(r.points) || 0,
        position: Number(r.position) || 1,
        round1Score: Number(r.round1Score) || 0,
        round2Score: Number(r.round2Score) || 0,
        round3Score: roundsToRender >= 3 ? (Number(r.round3Score) || 0) : undefined,
        round4Score: roundsToRender >= 4 ? (Number(r.round4Score) || 0) : undefined,
        thru: r.thru || 'F'
      }));

      await onSaveResults(targetEventId, payload);
      setSaveSuccessMsg('✓ Live Leaderboard updated & saved to real-time database!');
      setTimeout(() => setSaveSuccessMsg(''), 4500);
      setMode('view');
    } catch (err: any) {
      alert('Error saving live leaderboard: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const listToExport = mode === 'edit' ? draftRows : currentResults;
    if (listToExport.length === 0) return;

    const headers = ['Position', 'Player Name', 'Handicap', 'Thru', 'R1', 'R2', 'Gross', 'Net', 'Points'];
    const rows = listToExport.map(r => {
      const mem = members.find(m => m.id === r.playerId);
      return [
        r.position,
        `"${mem?.name || 'Unknown'}"`,
        r.handicap ?? mem?.handicap ?? '',
        r.thru || 'F',
        r.round1Score || 0,
        r.round2Score || 0,
        r.grossScore || 0,
        r.netScore || 0,
        r.points || 0
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `live_leaderboard_${event.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper formatting for score vs par
  const formatScoreVsPar = (score: number) => {
    if (score > 0) return `+${score}`;
    if (score < 0) return `${score}`;
    return 'E';
  };

  const filteredViewRows = useMemo(() => {
    return currentResults.filter(r => {
      const mem = members.find(m => m.id === r.playerId);
      if (!mem) return false;
      return mem.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [currentResults, members, searchQuery]);

  // Current Leader
  const leaderResult = currentResults[0];
  const leaderMember = leaderResult ? members.find(m => m.id === leaderResult.playerId) : null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-stone-950/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-stone-900 text-stone-100 rounded-3xl border-2 border-red-500/60 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-left font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-stone-900 to-red-950 px-5 sm:px-7 py-4 border-b border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-red-500/20 text-red-300 border border-red-500/50 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold shadow-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block animate-ping"></span>
                🔴 LIVE LEADERBOARD
              </span>
              <span className="text-[10px] font-mono text-stone-400 uppercase">
                {event.format} • {course ? `${course.name} (Par ${course.par || 72})` : 'Course Host'}
              </span>
            </div>

            <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight uppercase flex items-center gap-2">
              <span>{event.title}</span>
              {event.classification === 'Major' && (
                <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded">
                  MAJOR
                </span>
              )}
            </h2>

            <p className="text-xs text-stone-300">
              📅 {formatAppDate(event.date)} {event.endDate && event.endDate !== event.date ? `to ${formatAppDate(event.endDate)}` : ''} • Tee off 12:00 AM GMT
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  mode === 'edit'
                    ? 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                }`}
              >
                {mode === 'edit' ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Leaderboard</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Live Scores</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-stone-700 transition"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl border border-stone-700 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-entry selector (Main vs Alternate) if tournament has split competitions */}
        {!isQualifier && (
          <div className="bg-stone-950/80 px-5 sm:px-7 py-2.5 border-b border-stone-800 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-stone-400 uppercase text-[10px]">Division Entry:</span>
              <button
                type="button"
                onClick={() => setEntryType('main')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                  entryType === 'main'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                🏆 Main Entry
              </button>
              <button
                type="button"
                onClick={() => setEntryType('alternate')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                  entryType === 'alternate'
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-extrabold'
                    : 'bg-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                ⛳ Alternate Entry
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
              {leaderMember && (
                <span className="text-amber-300 flex items-center gap-1 font-bold">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Leader: {leaderMember.name} ({formatScoreVsPar(leaderResult.netScore)})</span>
                </span>
              )}
              <span>Field: {currentResults.length} Players</span>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-900/90 text-emerald-100 px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b border-emerald-700 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* EDIT MODE */}
          {mode === 'edit' && isAdmin ? (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="font-display font-bold text-sm text-stone-200 uppercase tracking-wide">
                    Live Scorecard Editor
                  </h3>
                  <p className="text-xs text-stone-400">
                    Enter individual round scores, thru-holes, and handicaps. Gross, net and rank calculate automatically.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddPlayer()}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Player</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImportAllMembers}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition"
                    title="Import all society members into the live leaderboard"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Import All Members</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoSort}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition"
                    title="Sort rows by net score/points and update ranks"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto-Sort Rank</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-amber-400 hover:bg-amber-300 text-stone-950 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md font-mono transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Live Scores'}</span>
                  </button>
                </div>
              </div>

              {draftRows.length === 0 ? (
                <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-10 text-center space-y-3">
                  <Flag className="w-10 h-10 text-stone-600 mx-auto" />
                  <h4 className="font-display font-medium text-stone-300 text-base">No Players on Scorecard Yet</h4>
                  <p className="text-stone-500 text-xs max-w-md mx-auto">
                    Click <strong>"Add Player"</strong> to pick a specific member, or click <strong>"Import All Members"</strong> to seed the entire society roster with their official handicaps.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddPlayer()}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Player</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleImportAllMembers}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Import Roster</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-950 rounded-2xl border border-stone-800 overflow-x-auto shadow-inner">
                  <table className="w-full text-xs text-left border-collapse min-w-[720px]">
                    <thead>
                      <tr className="bg-stone-900 border-b border-stone-800 text-[10px] font-mono uppercase text-stone-400 tracking-wider">
                        <th className="p-3 w-14 text-center">Pos</th>
                        <th className="p-3 min-w-[180px]">Player Member</th>
                        <th className="p-3 w-20 text-center">Thru</th>
                        <th className="p-3 w-20 text-center">R1</th>
                        <th className="p-3 w-20 text-center">R2</th>
                        {roundsToRender >= 3 && <th className="p-3 w-20 text-center">R3</th>}
                        {roundsToRender >= 4 && <th className="p-3 w-20 text-center">R4</th>}
                        <th className="p-3 w-20 text-center">Gross</th>
                        <th className="p-3 w-20 text-center">HCP</th>
                        <th className="p-3 w-20 text-center">Net</th>
                        <th className="p-3 w-20 text-center">Points</th>
                        <th className="p-3 w-12 text-center">Act</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {draftRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-stone-900/60 transition-colors">
                          {/* Position */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={row.position}
                              onChange={e => handleFieldChange(idx, 'position', e.target.value)}
                              className="w-12 bg-stone-900 border border-stone-750 text-amber-300 font-mono font-bold text-center py-1 rounded focus:outline-none focus:border-amber-400"
                            />
                          </td>

                          {/* Player Select */}
                          <td className="p-2">
                            <select
                              value={row.playerId}
                              onChange={e => handleFieldChange(idx, 'playerId', e.target.value)}
                              className="w-full bg-stone-900 border border-stone-750 text-stone-100 py-1 px-2 rounded focus:outline-none focus:border-emerald-600 text-xs"
                            >
                              {members.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.handicap !== undefined ? m.handicap : '?'})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Thru hole */}
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={row.thru || 'F'}
                              placeholder="F, 14..."
                              onChange={e => handleFieldChange(idx, 'thru', e.target.value)}
                              className="w-16 bg-stone-900 border border-stone-750 text-red-300 font-mono font-bold text-center py-1 rounded focus:outline-none focus:border-red-400 text-xs"
                              title="Hole thru (e.g. F, 18, 14, 9, 1st)"
                            />
                          </td>

                          {/* Round 1 */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={row.round1Score ?? 0}
                              onChange={e => handleFieldChange(idx, 'round1Score', e.target.value)}
                              className="w-16 bg-stone-900 border border-stone-750 text-stone-100 font-mono text-center py-1 rounded focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Round 2 */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={row.round2Score ?? 0}
                              onChange={e => handleFieldChange(idx, 'round2Score', e.target.value)}
                              className="w-16 bg-stone-900 border border-stone-750 text-stone-100 font-mono text-center py-1 rounded focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Round 3 */}
                          {roundsToRender >= 3 && (
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                value={row.round3Score ?? 0}
                                onChange={e => handleFieldChange(idx, 'round3Score', e.target.value)}
                                className="w-16 bg-stone-900 border border-stone-750 text-stone-100 font-mono text-center py-1 rounded focus:outline-none focus:border-emerald-500"
                              />
                            </td>
                          )}

                          {/* Round 4 */}
                          {roundsToRender >= 4 && (
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                value={row.round4Score ?? 0}
                                onChange={e => handleFieldChange(idx, 'round4Score', e.target.value)}
                                className="w-16 bg-stone-900 border border-stone-750 text-stone-100 font-mono text-center py-1 rounded focus:outline-none focus:border-emerald-500"
                              />
                            </td>
                          )}

                          {/* Gross Score */}
                          <td className="p-2 text-center font-mono font-bold text-stone-200">
                            {row.grossScore}
                          </td>

                          {/* Handicap */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={row.handicap ?? 0}
                              onChange={e => handleFieldChange(idx, 'handicap', e.target.value)}
                              className="w-14 bg-stone-900 border border-stone-750 text-stone-300 font-mono text-center py-1 rounded focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Net Score */}
                          <td className="p-2 text-center font-mono font-extrabold text-emerald-400">
                            {row.netScore}
                          </td>

                          {/* Points */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={row.points ?? 0}
                              onChange={e => handleFieldChange(idx, 'points', e.target.value)}
                              className="w-14 bg-stone-900 border border-stone-750 text-amber-300 font-mono text-center py-1 rounded focus:outline-none focus:border-amber-400"
                            />
                          </td>

                          {/* Remove */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1 text-stone-500 hover:text-red-400 rounded transition"
                              title="Remove player"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-950 p-4 rounded-2xl border border-stone-850">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search live player..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-stone-900 border border-stone-750 rounded-xl px-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 w-48 sm:w-64 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <span className="text-xs font-mono text-stone-400">
                    {filteredViewRows.length} showing
                  </span>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Enter / Edit Scores</span>
                  </button>
                )}
              </div>

              {filteredViewRows.length === 0 ? (
                <div className="bg-stone-950/60 border border-stone-850 rounded-2xl p-12 text-center space-y-3">
                  <Trophy className="w-12 h-12 text-stone-600 mx-auto" />
                  <h4 className="font-display font-medium text-stone-300 text-lg">No Live Scores Recorded Yet</h4>
                  <p className="text-stone-400 text-xs max-w-md mx-auto">
                    {isAdmin
                      ? 'The live tournament is in progress, but no live player scores have been added yet. Click "Enter / Edit Scores" to initialize the live leaderboard.'
                      : 'Scores for this live tournament have not been posted yet. Check back shortly as players finish their holes!'}
                  </p>
                  {isAdmin && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setMode('edit')}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 mx-auto shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Live Leaderboard</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-stone-950 rounded-2xl border border-stone-850 overflow-x-auto shadow-xl">
                  <table className="w-full text-xs text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-stone-900 border-b border-stone-800 text-[10px] font-mono uppercase text-stone-400 tracking-wider">
                        <th className="p-3 w-14 text-center">Pos</th>
                        <th className="p-3">Player</th>
                        <th className="p-3 w-20 text-center">Thru</th>
                        <th className="p-3 w-16 text-center">R1</th>
                        <th className="p-3 w-16 text-center">R2</th>
                        {roundsToRender >= 3 && <th className="p-3 w-16 text-center">R3</th>}
                        {roundsToRender >= 4 && <th className="p-3 w-16 text-center">R4</th>}
                        <th className="p-3 w-20 text-center">Gross</th>
                        <th className="p-3 w-16 text-center">HCP</th>
                        <th className="p-3 w-20 text-center">Net</th>
                        <th className="p-3 w-20 text-center">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {filteredViewRows.map((r, idx) => {
                        const mem = members.find(m => m.id === r.playerId);
                        const isTop1 = r.position === 1;
                        const isTop3 = r.position <= 3;
                        const displayThru = r.thru || 'F';

                        return (
                          <tr 
                            key={r.id || idx} 
                            className={`transition-colors ${
                              isTop1 
                                ? 'bg-amber-400/10 font-medium' 
                                : isTop3 
                                  ? 'bg-stone-900/60' 
                                  : 'hover:bg-stone-900/40'
                            }`}
                          >
                            {/* Position */}
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono font-bold text-xs ${
                                isTop1
                                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                                  : r.position === 2
                                    ? 'bg-stone-300 text-stone-900'
                                    : r.position === 3
                                      ? 'bg-amber-700 text-white'
                                      : 'bg-stone-800 text-stone-400'
                              }`}>
                                {r.position}
                              </span>
                            </td>

                            {/* Player */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-900 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 font-mono">
                                  {mem?.name ? mem.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
                                </div>
                                <div>
                                  <span className="font-semibold text-stone-100 block text-xs">
                                    {mem?.name || 'Unknown Member'}
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400">
                                    HCP {r.handicap ?? mem?.handicap ?? 0}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Thru */}
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                displayThru === 'F' || displayThru === '18'
                                  ? 'bg-stone-800 text-stone-300 border border-stone-700'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                              }`}>
                                {displayThru === 'F' ? 'F' : `Thru ${displayThru}`}
                              </span>
                            </td>

                            {/* Round 1 */}
                            <td className="p-3 text-center font-mono text-stone-300">
                              {r.round1Score || '-'}
                            </td>

                            {/* Round 2 */}
                            <td className="p-3 text-center font-mono text-stone-300">
                              {r.round2Score || '-'}
                            </td>

                            {/* Round 3 */}
                            {roundsToRender >= 3 && (
                              <td className="p-3 text-center font-mono text-stone-300">
                                {r.round3Score || '-'}
                              </td>
                            )}

                            {/* Round 4 */}
                            {roundsToRender >= 4 && (
                              <td className="p-3 text-center font-mono text-stone-300">
                                {r.round4Score || '-'}
                              </td>
                            )}

                            {/* Gross Score */}
                            <td className="p-3 text-center font-mono font-bold text-stone-200">
                              {r.grossScore}
                            </td>

                            {/* Handicap */}
                            <td className="p-3 text-center font-mono text-stone-400">
                              {r.handicap ?? mem?.handicap ?? 0}
                            </td>

                            {/* Net Score */}
                            <td className="p-3 text-center font-mono font-extrabold text-sm text-emerald-400">
                              {r.netScore}
                            </td>

                            {/* Points */}
                            <td className="p-3 text-center font-mono font-bold text-amber-300">
                              {r.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-5 sm:px-7 py-3 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>Real-time live synced</span>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'edit' && isAdmin && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save & Close Editor'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
