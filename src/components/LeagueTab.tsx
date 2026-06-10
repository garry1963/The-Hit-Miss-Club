/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Search, Check, Play, Edit, Trash2, Plus, Download, Upload, ShieldAlert, Sparkles } from 'lucide-react';
import { Member, Season, Division, Event, TournamentResult } from '../types';

interface LeagueTabProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  seasons: Season[];
  divisions: Division[];
  addDivision: (name: string) => any;
  deleteDivision: (id: string) => void;
  results: TournamentResult[];
  events: Event[];
  activeSeasonId: string;
  isAdmin: boolean;
  updateMember: (m: Member) => void;
  siteContent: Record<string, string>;
  updateSiteContent: (key: string, val: string) => void;
}

interface StandingEntry {
  id: string; // unique entry id
  rank: number;
  playerName: string;
  handicap: number;
  rounds: number;
  avgGross: number;
  avgNet: number;
  totalPoints: number;
  wins: number;
}

export default function LeagueTab({
  members,
  setMembers,
  seasons,
  divisions,
  addDivision,
  deleteDivision,
  results,
  events,
  activeSeasonId,
  isAdmin,
  updateMember,
  siteContent,
  updateSiteContent
}: LeagueTabProps) {
  // Local active division tab
  const [selectedDiv, setSelectedDiv] = useState<string>('Premier Division');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rule editing state (requested)
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [ruleInput, setRuleInput] = useState('');

  // Division creation form state
  const [newDivName, setNewDivName] = useState('');
  const [showAddDiv, setShowAddDiv] = useState(false);

  // Standing entries are manual-entry only
  const standingMode = 'manual';

  // Manual entries state persisted to localStorage
  const [manualEntries, setManualEntries] = useState<Record<string, StandingEntry[]>>(() => {
    const saved = localStorage.getItem('hit_and_miss_club_manual_entries');
    return saved ? JSON.parse(saved) : {};
  });

  // Entry modification states
  const [editingEntry, setEditingEntry] = useState<StandingEntry | null>(null);
  const [showAddEntryForm, setShowAddEntryForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Entry input fields
  const [entryPlayerName, setEntryPlayerName] = useState('');
  const [entryHandicap, setEntryHandicap] = useState(0);
  const [entryRounds, setEntryRounds] = useState(0);
  const [entryAvgGross, setEntryAvgGross] = useState(0);
  const [entryAvgNet, setEntryAvgNet] = useState(0);
  const [entryTotalPoints, setEntryTotalPoints] = useState(0);
  const [entryWins, setEntryWins] = useState(0);

  // Synchronize site rules
  useEffect(() => {
    if (siteContent) {
      setRuleInput(siteContent.league_rule_text || "Ties in standings points are settled dynamically by descending wins count, then highest average points output, followed by the lower initial player handicap tier.");
    }
  }, [siteContent]);

  // Standing entries are manual-entry only

  // Sync manual standings across reloads
  useEffect(() => {
    localStorage.setItem('hit_and_miss_club_manual_entries', JSON.stringify(manualEntries));
  }, [manualEntries]);

  // Reset selected division fallback if deleted
  useEffect(() => {
    const isAvailable = divisions.some(d => d.name === selectedDiv) || 
                        selectedDiv === 'Premier Division' || 
                        selectedDiv === 'Championship Division';
    if (!isAvailable) {
      setSelectedDiv(divisions[0]?.name || 'Premier Division');
    }
  }, [divisions, selectedDiv]);

  const handleSaveRule = () => {
    updateSiteContent('league_rule_text', ruleInput);
    setIsEditingRule(false);
    alert('Divisional tournament bylaws and rules saved.');
  };

  const handleCreateDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivName.trim()) return;

    const exists = divisions.some(d => d.name.toLowerCase() === newDivName.toLowerCase()) || 
                   newDivName.toLowerCase() === 'premier division' || 
                   newDivName.toLowerCase() === 'championship division';
    if (exists) {
      alert('A division with this name already exists.');
      return;
    }

    addDivision(newDivName.trim());
    setSelectedDiv(newDivName.trim());
    setNewDivName('');
    setShowAddDiv(false);
    alert(`"${newDivName}" successfully added as a new tournament division.`);
  };

  const handleDeleteDivisionClick = (div: Division) => {
    if (window.confirm(`Are you sure you want to delete the division "${div.name}"? Players assigned to this division will remain in the system.`)) {
      deleteDivision(div.id);
      setSelectedDiv('Premier Division');
    }
  };

  // Derive number of players in the selected division (requested)
  const divisionPlayerCount = members.filter(m => m.division === selectedDiv).length;

  const currentEntries = manualEntries[selectedDiv] || [];

  const filteredStandings = currentEntries.filter(row =>
    row.playerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manual entries update triggers
  const handleOpenAddEntry = () => {
    setEntryPlayerName('');
    setEntryHandicap(15);
    setEntryRounds(4);
    setEntryAvgGross(84);
    setEntryAvgNet(72);
    setEntryTotalPoints(45);
    setEntryWins(0);
    setEditingEntry(null);
    setShowAddEntryForm(true);
    setFormError('');
  };

  const handleEditEntryClick = (entry: any) => {
    setEditingEntry(entry);
    setEntryPlayerName(entry.playerName);
    setEntryHandicap(entry.handicap);
    setEntryRounds(entry.rounds);
    setEntryAvgGross(entry.avgGross);
    setEntryAvgNet(entry.avgNet);
    setEntryTotalPoints(entry.totalPoints);
    setEntryWins(entry.wins || 0);
    setShowAddEntryForm(true);
    setFormError('');
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm("Are you sure you want to delete this standings row?")) {
      const activeDivList = manualEntries[selectedDiv] || [];
      const updatedList = activeDivList.filter(e => e.id !== entryId).map((e, idx) => ({
        ...e,
        rank: idx + 1
      }));
      setManualEntries(prev => ({
        ...prev,
        [selectedDiv]: updatedList
      }));
    }
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryPlayerName.trim()) {
      setFormError("Player name is required.");
      return;
    }

    const payload: StandingEntry = {
      id: editingEntry ? editingEntry.id : 'manual-' + Date.now(),
      rank: 1, // Sort later
      playerName: entryPlayerName,
      handicap: Number(entryHandicap),
      rounds: Number(entryRounds),
      avgGross: Number(entryAvgGross),
      avgNet: Number(entryAvgNet),
      totalPoints: Number(entryTotalPoints),
      wins: Number(entryWins),
    };

    const activeList = manualEntries[selectedDiv] || [];
    let updatedList: StandingEntry[];

    if (editingEntry) {
      updatedList = activeList.map(item => item.id === editingEntry.id ? payload : item);
    } else {
      updatedList = [...activeList, payload];
    }

    // Sort manual entries by points descending, wins descending, rounds descending
    updatedList.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      return b.rounds - a.rounds;
    });

    // Reassign ranks
    updatedList = updatedList.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    setManualEntries(prev => ({
      ...prev,
      [selectedDiv]: updatedList
    }));

    setShowAddEntryForm(false);
    setEditingEntry(null);
    alert("Manually customized standings record saved successfully.");
  };

  // CSV Export for Divisional table
  const handleCSVDownload = () => {
    const headers = ['Rank', 'Player', 'Handicap', 'Rounds', 'AVG Gross', 'AVG Net', 'Wins', 'Total Points'];
    const rows = currentEntries.map(e => [
      e.rank,
      `"${e.playerName.replace(/"/g, '""')}"`,
      e.handicap,
      e.rounds,
      e.avgGross,
      e.avgNet,
      e.wins || 0,
      e.totalPoints
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.className = "hidden";
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDiv.toLowerCase().replace(/\s+/g, '_')}_standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import to override standings
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const importedList: StandingEntry[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length < 5) continue;

        const csvRank = parseInt(parts[0]?.trim() || '1');
        const csvPlayer = parts[1]?.replace(/^"|"$/g, '').trim();
        const csvHandicap = parseFloat(parts[2]?.trim() || '18.0');
        const csvRounds = parseInt(parts[3]?.trim() || '0');
        const csvAvgGross = parseFloat(parts[4]?.trim() || '0');
        const csvAvgNet = parseFloat(parts[5]?.trim() || '0');
        
        // Handle optional and positional Wins vs Total Points
        let csvWins = 0;
        let csvTotalPoints = 0;
        if (parts.length >= 8) {
          csvWins = parseInt(parts[6]?.trim() || '0');
          csvTotalPoints = parseFloat(parts[7]?.trim() || '0');
        } else {
          csvTotalPoints = parseFloat(parts[6]?.trim() || '0');
        }

        if (!csvPlayer) continue;

        importedList.push({
          id: 'imported-' + Date.now() + i,
          rank: csvRank,
          playerName: csvPlayer,
          handicap: isNaN(csvHandicap) ? 18.0 : csvHandicap,
          rounds: isNaN(csvRounds) ? 0 : csvRounds,
          avgGross: isNaN(csvAvgGross) ? 0 : csvAvgGross,
          avgNet: isNaN(csvAvgNet) ? 0 : csvAvgNet,
          wins: isNaN(csvWins) ? 0 : csvWins,
          totalPoints: isNaN(csvTotalPoints) ? 0 : csvTotalPoints
        });
      }

      if (importedList.length > 0) {
        if (window.confirm(`Parsed ${importedList.length} player standing rows. Import and set as current manual overrides for ${selectedDiv}?`)) {
          // Sort and rank
          importedList.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
            return b.rounds - a.rounds;
          });
          const finalRanks = importedList.map((item, idx) => ({
            ...item,
            rank: idx + 1
          }));

          setManualEntries(prev => ({
            ...prev,
            [selectedDiv]: finalRanks
          }));
          alert(`Imported ${importedList.length} rows successfully into manual standings!`);
        }
      } else {
        alert('Format not recognized. Heading should be Rank,Player,Handicap,Rounds,AVG Gross,AVG Net,Wins,Total Points (or Rank,Player,Handicap,Rounds,AVG Gross,AVG Net,Total Points).');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const currentSeasonName = seasons.find(s => s.id === activeSeasonId)?.name || 'Active Campaign';

  // Podium calculations
  const podium1 = currentEntries.find(s => s.rank === 1);
  const podium2 = currentEntries.find(s => s.rank === 2);
  const podium3 = currentEntries.find(s => s.rank === 3);

  return (
    <div className="space-y-8 pb-12 animate-fadeIn text-left leading-normal">
      
      {/* 1. Page Header with metadata & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-800" />
            <span>Divisional Leaderboards</span>
          </h1>
          <p className="text-stone-500 text-sm">
            Configure distinct divisions, review real-time standings counts, toggle modes, and download statistics spreadsheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Spreadsheet CSV Controls */}
          <button
            onClick={handleCSVDownload}
            className="border border-[#fbbf24] hover:bg-stone-50 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Download CSV</span>
          </button>

          {isAdmin && (
            <label className="border border-[#fbbf24] hover:bg-stone-50 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>Upload CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>
          )}

          {isAdmin && standingMode === 'manual' && (
            <>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to clear all standings rows for the ${selectedDiv}?`)) {
                    setManualEntries(prev => {
                      const updated = { ...prev };
                      delete updated[selectedDiv];
                      return updated;
                    });
                    alert(`Cleared all standing rows for ${selectedDiv}.`);
                  }
                }}
                className="border border-red-500 hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <span>Clear Leaderboard</span>
              </button>
              <button
                onClick={handleOpenAddEntry}
                className="bg-emerald-850 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Entry</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Horizontal Division Selector Tabs Menu (required) & Count (required) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-2">
        <div className="flex flex-wrap gap-1 bg-stone-100 rounded-xl p-1 text-xs">
          {/* Base Divisions */}
          {['Premier Division', 'Championship Division'].map((name) => {
            const count = members.filter(m => m.division === name).length;
            const isSelected = selectedDiv === name;
            return (
              <button
                key={name}
                onClick={() => setSelectedDiv(name)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {name} <span className="font-mono text-[10px] opacity-75 font-medium flex-none">({count} players)</span>
              </button>
            );
          })}

          {/* User Custom Created Divisions */}
          {divisions
            .filter(d => d.name !== 'Premier Division' && d.name !== 'Championship Division')
            .map((div) => {
              const count = members.filter(m => m.division === div.name).length;
              const isSelected = selectedDiv === div.name;
              return (
                <div key={div.id} className="relative group flex items-center">
                  <button
                    onClick={() => setSelectedDiv(div.name)}
                    className={`pl-4 pr-10 py-2 rounded-lg font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    <span>{div.name}</span>
                    <span className="font-mono text-[10px] opacity-75 font-medium flex-none">({count} p)</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteDivisionClick(div)}
                      className="absolute right-1 text-amber-400 hover:text-red-500 p-1 font-mono text-[10px]"
                      title="Delete this division definition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}

          {/* Create Division Button trigger */}
          {isAdmin && (
            <button
              onClick={() => setShowAddDiv(!showAddDiv)}
              className="text-[#fbbf24] hover:text-emerald-900 font-bold px-3 py-2 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Division</span>
            </button>
          )}
        </div>

        {/* Dynamic Display Stat Badge */}
        <div className="bg-amber-50 border border-[#fbbf24]/40 text-stone-900 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Active Division: <strong className="text-[#fbbf24] font-black">{selectedDiv}</strong> ({divisionPlayerCount} Registered Players)</span>
        </div>
      </div>

      {/* 3. Division Creation Sub-Form inline */}
      {isAdmin && showAddDiv && (
        <form onSubmit={handleCreateDivision} className="bg-stone-50 border border-stone-200 rounded-xl p-4 animate-fadeIn max-w-md">
          <h3 className="font-display font-bold text-xs uppercase text-emerald-950 mb-2">Configure New Golfing Division</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Master Division, Senior Division"
              value={newDivName}
              onChange={e => setNewDivName(e.target.value)}
              className="bg-white border border-stone-250 rounded px-3 py-1.5 text-xs w-full text-stone-900 focus:outline-none focus:border-emerald-800"
            />
            <button type="submit" className="bg-[#fbbf24] hover:bg-yellow-500 text-emerald-950 text-xs px-4 py-2 rounded font-bold uppercase tracking-wider flex-shrink-0">
              Create Name
            </button>
          </div>
        </form>
      )}

      {/* 5. Custom standing row form modal */}
      {isAdmin && showAddEntryForm && (
        <div className="bg-stone-50 border-2 border-amber-500/50 rounded-2xl p-6 shadow-md animate-fadeIn">
          <h2 className="font-display font-medium text-emerald-950 uppercase border-b border-stone-300 pb-2 mb-4 font-bold text-sm">
            {editingEntry ? `Edit Overrides Row for "${entryPlayerName}"` : 'Add Direct Standings Entry'}
          </h2>

          <form onSubmit={handleEntrySubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs font-sans">
            {formError && (
              <div className="sm:col-span-12 font-medium text-red-700 bg-red-50 p-2 border border-red-200 rounded">
                ⚠️ {formError}
              </div>
            )}

            <div className="sm:col-span-4 flex flex-col gap-1">
              <label className="font-semibold text-stone-600">Player Name</label>
              <select
                value={entryPlayerName}
                onChange={e => {
                  const selectedName = e.target.value;
                  setEntryPlayerName(selectedName);
                  // Dynamically set handicap matching selected member
                  const foundMember = members.find(m => m.name === selectedName);
                  if (foundMember) {
                    setEntryHandicap(foundMember.handicap);
                  }
                }}
                className="bg-white border rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-800"
              >
                <option value="">-- Select Player --</option>
                {entryPlayerName && !members.some(m => m.name === entryPlayerName) && (
                  <option value={entryPlayerName}>{entryPlayerName} (Custom/Unlisted)</option>
                )}
                {[...members]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(m => (
                    <option key={m.id} value={m.name}>
                      {m.name} (Hcp {m.handicap})
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-600">Handicap</label>
              <input
                type="number"
                step="0.1"
                value={entryHandicap}
                onChange={e => setEntryHandicap(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-600">Rounds</label>
              <input
                type="number"
                value={entryRounds}
                onChange={e => setEntryRounds(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-600">AVG Gross</label>
              <input
                type="number"
                step="0.1"
                value={entryAvgGross}
                onChange={e => setEntryAvgGross(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-600">AVG Net</label>
              <input
                type="number"
                step="0.1"
                value={entryAvgNet}
                onChange={e => setEntryAvgNet(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-600">Total Points</label>
              <input
                type="number"
                value={entryTotalPoints}
                onChange={e => setEntryTotalPoints(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-600">Wins</label>
              <input
                type="number"
                value={entryWins}
                onChange={e => setEntryWins(Number(e.target.value))}
                className="bg-white border rounded px-3 py-2 text-stone-900"
              />
            </div>

            <div className="sm:col-span-12 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowAddEntryForm(false)}
                className="bg-stone-200 text-stone-750 px-4 py-1.5 rounded uppercase font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#fbbf24] text-stone-950 px-4 py-1.5 rounded uppercase font-bold"
              >
                Save Standings Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Top 3 Banner podium layout (Auto-generates if rows present) */}
      {!searchQuery && currentEntries.length >= 3 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-2">
          {/* Second spot */}
          {podium2 && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col items-center text-center gap-3 order-2 md:order-1 h-[200px] justify-between relative overflow-hidden select-none">
              <span className="absolute top-2 left-2 text-[10px] font-mono text-stone-400 font-extrabold uppercase">SPOT 2 &middot; SILVER</span>
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xl shadow-inner mt-2">🥈</div>
              <div>
                <h3 className="font-display font-medium text-stone-900 group-hover:text-emerald-800 text-base uppercase font-bold line-clamp-1">{podium2.playerName}</h3>
                <span className="text-[10px] font-mono text-stone-400 uppercase">Hcp {podium2.handicap.toFixed(1)}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xl font-mono font-bold text-slate-800 leading-none block">{podium2.totalPoints} PTS</span>
                <span className="text-[10px] font-sans text-stone-405 leading-none block">AVG Net: {podium2.avgNet.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* First Spot */}
          {podium1 && (
            <div className="bg-[#064e3b] rounded-2xl p-6 border-2 border-[#fbbf24] shadow-xl flex flex-col items-center text-center gap-3 order-1 md:order-2 h-[240px] justify-between relative overflow-hidden text-white select-none">
              <span className="absolute top-2 left-2 text-[10px] font-mono text-yellow-300 font-black uppercase tracking-widest">🏆 LEADER &middot; {selectedDiv}</span>
              <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-305 flex items-center justify-center text-2xl shadow-md mt-4 animate-pulse">🥇</div>
              <div>
                <h3 className="font-display font-medium text-white text-lg uppercase font-bold line-clamp-1">{podium1.playerName}</h3>
                <span className="text-[10px] font-mono text-emerald-300 uppercase leading-none block mt-0.5">Hcp {podium1.handicap.toFixed(1)}</span>
              </div>
              <div className="space-y-0.5 mb-2">
                <span className="text-2xl font-mono font-bold text-[#fbbf24] leading-none block">{podium1.totalPoints} PTS</span>
                <span className="text-[10px] font-sans text-emerald-200 leading-none block">Gross Avg: {podium1.avgGross.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Third Spot */}
          {podium3 && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col items-center text-center gap-3 order-3 h-[180px] justify-between relative overflow-hidden select-none">
              <span className="absolute top-2 left-2 text-[10px] font-mono text-stone-400 font-extrabold uppercase">SPOT 3 &middot; BRONZE</span>
              <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-lg mt-2">🥉</div>
              <div>
                <h3 className="font-display font-medium text-stone-900 text-sm uppercase font-bold line-clamp-1">{podium3.playerName}</h3>
                <span className="text-[10px] font-mono text-stone-400 uppercase">Hcp {podium3.handicap.toFixed(1)}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-lg font-mono font-bold text-orange-900 leading-none block">{podium3.totalPoints} PTS</span>
                <span className="text-[10px] font-sans text-stone-405 leading-none block">Rounds: {podium3.rounds}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 7. Divisional Standing Table with requested columns */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-stone-400 text-xs font-mono font-medium block">
            Manual standing state is active. Custom records are manually managed by committee administrators.
          </span>

          <div className="relative text-xs w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search standings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-1.5 w-full text-stone-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 font-display font-bold text-[#fbbf24] uppercase text-[10px] tracking-wider select-none">
                <th className="py-4 px-5 text-center w-16">Rank</th>
                <th className="py-4 px-5">Player</th>
                <th className="py-4 px-4 text-center">Handicap</th>
                <th className="py-4 px-4 text-center">Rounds</th>
                <th className="py-4 px-4 text-center">AVG Gross</th>
                <th className="py-4 px-4 text-center">AVG Net</th>
                <th className="py-4 px-5 text-right">Total Points</th>
                <th className="py-4 px-5 text-right w-28">WINS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans text-stone-750">
              {filteredStandings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 font-mono">
                    ⚠️ No compatible divisional standing rows found.
                  </td>
                </tr>
              ) : (
                filteredStandings.map((row) => (
                  <tr key={row.id} className="hover:bg-amber-50/20 font-medium">
                    {/* Rank cell */}
                    <td className="py-3.5 px-5 text-center font-mono font-bold text-stone-850">
                      {row.rank === 1 ? '🥇 1' : row.rank === 2 ? '🥈 2' : row.rank === 3 ? '🥉 3' : row.rank}
                    </td>

                    {/* Name block */}
                    <td className="py-3.5 px-5 font-bold text-stone-900">
                      <span>{row.playerName}</span>
                    </td>

                    {/* Handicap cell */}
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {row.handicap.toFixed(1)}
                    </td>

                    {/* Completed rounds */}
                    <td className="py-3.5 px-4 text-center font-mono text-stone-700">
                      {row.rounds}
                    </td>

                    {/* Class AVG Gross score */}
                    <td className="py-3.5 px-4 text-center font-mono text-stone-700">
                      {row.avgGross.toFixed(1)}
                    </td>

                    {/* Class AVG Net score */}
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-800">
                      {row.avgNet.toFixed(1)}
                    </td>

                    {/* Sum of Points */}
                    <td className="py-3.5 px-5 text-right font-mono font-black text-emerald-900 text-xs sm:text-sm">
                      {row.totalPoints} PTS
                    </td>

                    {/* Wins column housing both number of wins and admin actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-2 text-right w-full">
                        <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm">{row.wins || 0}</span>
                        {isAdmin && standingMode === 'manual' && (
                          <div className="inline-flex gap-1 border-l border-stone-200 pl-1.5 ml-1">
                            <button
                              onClick={() => handleEditEntryClick(row)}
                              className="p-1 rounded text-stone-400 hover:text-emerald-705 hover:bg-stone-50"
                              title="Edit overrides row"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(row.id)}
                              className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-stone-50"
                              title="Delete custom row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Editorial rule bylaws text panel */}
      <section className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 space-y-4 border border-[#fbbf24]/40 shadow-xl relative overflow-hidden animate-fadeIn">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest block font-black">LEAGUE REGULATIONS</span>
          <h2 className="font-display font-medium text-stone-100 text-lg uppercase font-bold">Standard Divisional bylaws & Rules</h2>
        </div>

        {isEditingRule ? (
          <div className="space-y-3">
            <textarea
              className="w-full bg-stone-950 border border-stone-850 p-3 rounded-lg text-xs leading-relaxed text-stone-200 focus:outline-none"
              rows={3}
              value={ruleInput}
              onChange={(e) => setRuleInput(e.target.value)}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsEditingRule(false)}
                className="bg-stone-800 text-stone-300 font-bold px-3 py-1.5 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                className="bg-[#fbbf24] text-[#064e3b] font-bold px-4 py-1.5 rounded"
              >
                Save Regulations
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start gap-4">
            <p className="text-xs sm:text-sm text-stone-350 leading-relaxed max-w-4xl italic">
              "{ruleInput}"
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsEditingRule(true)}
                className="text-amber-500 hover:text-white shrink-0 font-bold text-xs uppercase p-1 hover:underline"
              >
                Edit Bylaws
              </button>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
