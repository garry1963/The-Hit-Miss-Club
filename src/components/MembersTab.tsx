/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { Users, Plus, Search, Mail, Edit, Trash2, Trophy, Download, Upload, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { Member, TournamentResult, Event, Season, Division } from '../types';

interface MembersTabProps {
  members: Member[];
  results: TournamentResult[];
  events: Event[];
  seasons: Season[];
  divisions: Division[];
  activeSeasonId: string;
  isAdmin: boolean;
  addMember: (m: Omit<Member, 'id'>) => any;
  updateMember: (updated: Member) => void;
  deleteMember: (id: string) => void;
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
}

export default function MembersTab({
  members,
  results,
  events,
  seasons,
  divisions,
  activeSeasonId,
  isAdmin,
  addMember,
  updateMember,
  deleteMember,
  setMembers
}: MembersTabProps) {
  // Local UI states
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Form toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formError, setFormError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [handicap, setHandicap] = useState(18.0);
  const [email, setEmail] = useState('');
  const [joinedDate, setJoinedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [role, setRole] = useState<'Committee' | 'Member'>('Member');
  const [committeeTitle, setCommitteeTitle] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [notes, setNotes] = useState('');
  const [division, setDivision] = useState('Premier Division');
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setName('');
    setHandicap(18.0);
    setEmail('');
    setJoinedDate(new Date().toISOString().split('T')[0]);
    setRole('Member');
    setCommitteeTitle('');
    setGender('Male');
    setNotes('');
    setDivision(divisions[0]?.name || 'Premier Division');
    setActive(true);
    setEditingMember(null);
    setShowAddForm(false);
    setFormError('');
  };

  const handleEditClick = (m: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMember(m);
    setName(m.name);
    setHandicap(m.handicap);
    setEmail(m.email);
    setJoinedDate(m.joinedDate);
    setRole(m.role);
    setCommitteeTitle(m.committeeTitle || '');
    setGender(m.gender);
    setNotes(m.notes || '');
    setDivision(m.division || 'Premier Division');
    setActive(m.active);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !joinedDate) {
      setFormError('Please fill in required fields (Name, Joined Date).');
      return;
    }

    const seed = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

    const payload = {
      name,
      handicap: Number(handicap),
      email,
      joinedDate,
      avatar,
      role,
      committeeTitle: role === 'Committee' ? committeeTitle : undefined,
      active,
      gender,
      notes,
      division
    };

    try {
      if (editingMember) {
        await updateMember({
          ...editingMember,
          ...payload
        });
        alert('Member information adjusted successfully.');
      } else {
        await addMember(payload);
        alert('New player registered on society database.');
      }
      resetForm();
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Failed to save member. Please check that you entered valid parameters.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errMsg = `Database write rejected: ${parsed.error}`;
          } else {
            errMsg = err.message;
          }
        } catch {
          errMsg = err.message;
        }
      }
      setFormError(errMsg);
    }
  };

  // Status/Activation Quick toggle
  const toggleStatusDirect = (m: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    updateMember({
      ...m,
      active: !m.active
    });
  };

  // CSV Export helper
  const handleCSVDownload = () => {
    const headers = ['Name', 'Handicap', 'Division', 'Status', 'Role', 'Email', 'Notes', 'JoinedDate', 'Gender'];
    const rows = members.map(m => [
      `"${m.name.replace(/"/g, '""')}"`,
      m.handicap,
      `"${m.division.replace(/"/g, '""')}"`,
      m.active ? 'active' : 'inactive',
      m.role,
      `"${m.email.replace(/"/g, '""')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
      m.joinedDate,
      m.gender
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'hit_and_miss_members.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import parser
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!setMembers) {
      alert("Database error: could not update values from parent context.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const parsedMembers: Member[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV splitter that respects quoted strings
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const parts = matches ? matches.map(val => val.replace(/^"|"$/g, '')) : line.split(',');

        if (parts.length < 4) continue;

        const name = parts[0]?.trim();
        const handicap = parseFloat(parts[1]?.trim() || '18.0');
        const division = parts[2]?.trim() || 'Premier Division';
        const statusStr = parts[3]?.trim().toLowerCase();
        const active = statusStr === 'active' || statusStr === 'true';
        
        const role = (parts[4]?.trim() || 'Member') as 'Committee' | 'Member';
        const email = parts[5]?.trim() || `${name?.toLowerCase().replace(/[^a-z]/g, '') || 'player'}@hitandmiss.com`;
        const notes = parts[6]?.trim() || '';
        const joinedDate = parts[7]?.trim() || new Date().toISOString().split('T')[0];
        const gender = (parts[8]?.trim() || 'Male') as 'Male' | 'Female';

        if (!name) continue;

        parsedMembers.push({
          id: 'member-' + (Date.now() + i),
          name,
          handicap: isNaN(handicap) ? 18.0 : handicap,
          division,
          active,
          role,
          email,
          notes,
          joinedDate,
          gender,
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
        });
      }

      if (parsedMembers.length > 0) {
        if (window.confirm(`Found ${parsedMembers.length} members in the CSV file. Do you want to overwrite your active database with this records?`)) {
          setMembers(parsedMembers);
          alert(`Successfully loaded ${parsedMembers.length} members into the system database.`);
        }
      } else {
        alert('Could not find any valid member data rows in CSV. Target structure: Name,Handicap,Division,Status,Role,Email...');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  // Filter members list based on queries, division and status
  const filteredMembers = members.filter(m => {
    const nameMatch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const divMatch = divisionFilter === 'All' || m.division === divisionFilter;
    
    let statusMatch = true;
    if (statusFilter === 'Active') statusMatch = m.active === true;
    if (statusFilter === 'Inactive') statusMatch = m.active === false;

    return nameMatch && divMatch && statusMatch;
  });

  // Calculate stats for detail sheet
  const getMemberStats = (memberId: string) => {
    const playerResults = results.filter(r => r.playerId === memberId);
    
    const resultsWithSeason = playerResults.map(r => {
      const evt = events.find(e => e.id === r.eventId);
      return {
        ...r,
        seasonId: evt ? evt.seasonId : ''
      };
    });

    const activeSeasonResults = resultsWithSeason.filter(r => r.seasonId === activeSeasonId);

    const totalPointsActive = activeSeasonResults.reduce((acc, r) => acc + r.points, 0);
    const participationCountActive = activeSeasonResults.length;
    const winsCountActive = activeSeasonResults.filter(r => r.position === 1).length;

    // Hist histories
    const histories = resultsWithSeason.map(r => {
      const evt = events.find(e => e.id === r.eventId);
      const seas = seasons.find(s => s.id === r.seasonId);
      return {
        eventTitle: evt ? evt.title : 'Deleted Tournament',
        date: evt ? evt.date : '',
        seasonName: seas ? seas.name : '',
        grossScore: r.grossScore,
        netScore: r.netScore,
        points: r.points,
        position: r.position
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      pointsActive: totalPointsActive,
      participationActive: participationCountActive,
      winsActive: winsCountActive,
      histories
    };
  };

  const activeProfile = members.find(m => m.id === selectedMemberId);
  const activeProfileStats = activeProfile ? getMemberStats(activeProfile.id) : null;

  return (
    <div className="space-y-8 pb-12 animate-fadeIn text-left">
      
      {/* 1. Page Header with stats/actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-800" />
            <span>Members Ledger</span>
          </h1>
          <p className="text-stone-500 text-sm">
            Review active handicaps, manage divisional affiliations, toggle activity status, and utilize Excel spreadsheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export & Import Utilities */}
          <button
            onClick={handleCSVDownload}
            className="border border-[#fbbf24] hover:bg-stone-50 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            title="Download database spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <label className="border border-[#fbbf24] hover:bg-stone-50 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>Import CSV</span>
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
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Admin Form Frame */}
      {isAdmin && showAddForm && (
        <div className="bg-stone-50 border-2 border-[#fbbf24]/40 rounded-2xl p-6 shadow-md animate-fadeIn">
          <h2 className="font-display font-bold text-base text-emerald-950 uppercase border-b border-stone-200 pb-2 mb-4">
            {editingMember ? `Modify Profile: ${editingMember.name}` : 'Register New Society Player'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-sm">
            {formError && (
              <div className="md:col-span-12 text-xs bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Garry Davies"
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="garry@gmail.com"
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Admission Division</label>
              <select
                value={division}
                onChange={e => setDivision(e.target.value)}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                {divisions.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
                {/* Fallback standard divisions */}
                {!divisions.some(d => d.name === 'Premier Division') && <option value="Premier Division">Premier Division</option>}
                {!divisions.some(d => d.name === 'Championship Division') && <option value="Championship Division">Championship Division</option>}
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Handicap *</label>
              <input
                type="number"
                step="0.1"
                min="0.0"
                max="36.0"
                value={handicap}
                onChange={e => setHandicap(Number(e.target.value))}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Joined Date *</label>
              <input
                type="date"
                value={joinedDate}
                onChange={e => setJoinedDate(e.target.value)}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Society Class Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Member">Regular Member</option>
                <option value="Committee">Committee Officer</option>
              </select>
            </div>

            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Committee Position Title</label>
              <input
                type="text"
                disabled={role !== 'Committee'}
                value={committeeTitle}
                onChange={e => setCommitteeTitle(e.target.value)}
                placeholder="e.g. Founder & President"
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none disabled:bg-stone-200"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700 flex items-center gap-1">
                <span>Active Status</span>
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 border-stone-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="active-checkbox" className="text-stone-700 text-xs cursor-pointer">
                  Player is Active & Entitled to score
                </label>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as 'Male' | 'Female')}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="md:col-span-6 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Profile Playing Notes / Bio</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Consistent driver, orders Guinness, former pro, etc."
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-12 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={resetForm}
                className="bg-stone-200 text-stone-700 font-bold px-4 py-2 rounded-lg text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2 rounded-lg text-xs uppercase"
              >
                {editingMember ? 'Save Modifies' : 'Register Player'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Filtering and controls */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative text-xs w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Member Ledger..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2 w-full text-stone-900 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Division Filter */}
          <div className="text-xs flex items-center gap-1.5">
            <span className="text-stone-400 font-mono uppercase text-[10px]">Division:</span>
            <select
              value={divisionFilter}
              onChange={e => setDivisionFilter(e.target.value)}
              className="bg-white border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none font-medium"
            >
              <option value="All">All Divisions</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
              {!divisions.some(d => d.name === 'Premier Division') && <option value="Premier Division">Premier Division</option>}
              {!divisions.some(d => d.name === 'Championship Division') && <option value="Championship Division">Championship Division</option>}
            </select>
          </div>

          {/* Status Filter */}
          <div className="text-xs flex items-center gap-1.5">
            <span className="text-stone-400 font-mono uppercase text-[10px]">Status:</span>
            <div className="flex border border-stone-200 rounded bg-white overflow-hidden p-0.5">
              {(['All', 'Active', 'Inactive'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                    statusFilter === s 
                      ? 'bg-emerald-800 text-white font-bold' 
                      : 'text-stone-600 hover:text-stone-950'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Elegant Members Spreadsheet Ledger (HTML Table) */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 font-display font-bold text-[#fbbf24] uppercase text-[10px] tracking-wider select-none">
                <th className="py-4 px-5">Player Name</th>
                <th className="py-4 px-4 text-center">Handicap</th>
                <th className="py-4 px-4">Society Division</th>
                <th className="py-4 px-4 text-center">Eligibility / Status</th>
                <th className="py-4 px-4 text-center">Joined Date</th>
                {isAdmin && <th className="py-4 px-5 text-right">Manual Modifiers</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans text-stone-750">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-stone-400 font-mono">
                    ⚠️ No compatible society members correspond to the specified search filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const isSelected = selectedMemberId === m.id;
                  
                  return (
                    <React.Fragment key={m.id}>
                      <tr 
                        className={`hover:bg-amber-50/20 cursor-pointer transition-colors ${isSelected ? 'bg-amber-50/30' : ''}`}
                        onClick={() => setSelectedMemberId(isSelected ? null : m.id)}
                      >
                        <td className="py-3.5 px-5 font-semibold text-stone-900">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-bold flex items-center gap-1.5 text-stone-850 hover:text-emerald-800 transition-colors">
                                {m.name}
                                {m.role === 'Committee' && (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[8px] font-extrabold uppercase font-mono px-1 py-0.5 rounded leading-none">
                                    {m.committeeTitle || 'Officer'}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono lowercase">{m.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Benchmark handicap */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono bg-emerald-50 text-emerald-990 border border-emerald-200 px-2.5 py-1 rounded font-bold text-xs">
                            {m.handicap.toFixed(1)}
                          </span>
                        </td>

                        {/* Division category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-medium text-xs text-stone-800">
                              {m.division || 'Premier Division'}
                            </span>
                          </div>
                        </td>

                        {/* Eligibility state active/inactive */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => isAdmin ? toggleStatusDirect(m, e) : null}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase border inline-flex items-center gap-1 ${
                              m.active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 cursor-pointer hover:bg-emerald-100' 
                                : 'bg-stone-50 text-stone-500 border-stone-250 cursor-pointer hover:bg-stone-100'
                            }`}
                            disabled={!isAdmin}
                            title={isAdmin ? "Click to manually toggle status" : "Status is immutable"}
                          >
                            {m.active ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-stone-400" />
                                <span>Inactive</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Member since date */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-stone-450">
                          {m.joinedDate}
                        </td>

                        {/* Admin Action tools */}
                        {isAdmin && (
                          <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={(e) => handleEditClick(m, e)}
                                className="p-1.5 rounded hover:bg-emerald-50 hover:text-emerald-850 text-stone-400 transition-colors"
                                title="Edit parameters"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteMember(m.id)}
                                className="p-1.5 rounded hover:bg-red-50 hover:text-red-700 text-stone-400 transition-colors"
                                title="Expel member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Detail booklet booklet */}
                      {isSelected && activeProfileStats && (
                        <tr className="bg-stone-50/50">
                          <td colSpan={isAdmin ? 6 : 5} className="py-4 px-6 border-y border-stone-150">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 leading-relaxed">
                              
                              <div className="md:col-span-4 space-y-2 border-r border-stone-200/60 pr-4">
                                <h4 className="font-display font-medium text-stone-900 border-b border-stone-200 pb-1 uppercase font-bold text-[10px] tracking-widest text-[#fbbf24]">
                                  Personal Portfolio Details
                                </h4>
                                <div className="space-y-1.5 text-xs text-stone-605">
                                  <div className="flex justify-between">
                                    <span>Playing Gender:</span>
                                    <strong className="text-stone-800">{m.gender}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Contact Address:</span>
                                    <strong className="text-stone-850">{m.email}</strong>
                                  </div>
                                </div>
                                {m.notes && (
                                  <p className="text-xs text-stone-500 italic mt-3 bg-white p-3 rounded border border-stone-150">
                                    "{m.notes}"
                                  </p>
                                )}
                              </div>

                              <div className="md:col-span-8 flex flex-col justify-between gap-4">
                                <div className="space-y-3">
                                  <h4 className="font-display font-medium text-stone-900 border-b border-stone-200 pb-1 uppercase font-bold text-[10px] tracking-widest text-[#fbbf24]">
                                    Calculated Seasonal Score Statistics
                                  </h4>
                                  <div className="grid grid-cols-4 gap-3 text-center">
                                    <div className="bg-white p-2.5 rounded-lg border border-stone-150 shadow-sm">
                                      <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wide">Points Scored</span>
                                      <div className="text-sm font-bold text-emerald-900 mt-1 font-mono">{activeProfileStats.pointsActive} PTS</div>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg border border-stone-150 shadow-sm">
                                      <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wide">Tourney Entries</span>
                                      <div className="text-sm font-bold text-stone-900 mt-1 font-mono">{activeProfileStats.participationActive} Games</div>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg border border-stone-150 shadow-sm">
                                      <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wide">Tournament Wins</span>
                                      <div className="text-sm font-bold text-amber-800 mt-1 font-mono">{activeProfileStats.winsActive} Wins</div>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg border border-stone-150 shadow-sm">
                                      <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wide">Eligibility Check</span>
                                      <div className="text-[10px] font-extrabold text-emerald-700 mt-1.5 uppercase font-mono">{m.active ? 'Cleared ✅' : 'Suspended 🚫'}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[10px] flex justify-between text-stone-400 italic">
                                  <span>You're viewing the statistics binder for {m.name}.</span>
                                  <button
                                    onClick={() => setSelectedMemberId(null)}
                                    className="font-mono text-amber-600 hover:underline hover:text-amber-700"
                                  >
                                    Close Portfolio Profile
                                  </button>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
