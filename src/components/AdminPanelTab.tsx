/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Plus, Trash2, Edit, RefreshCw, Upload, Download, Save, Newspaper, ArrowUpRight, Scale, CalendarCheck, Key, Lock, Eye, EyeOff, Facebook, MessageSquare, Youtube, Mail, Phone, MapPin, Users, Globe } from 'lucide-react';
import { NewsArticle, Member, Event, TournamentResult, GalleryImage, Season } from '../types';
import { formatAppDate } from '../utils/dateUtils';

interface AdminPanelTabProps {
  news: NewsArticle[];
  members: Member[];
  events: Event[];
  results: TournamentResult[];
  gallery: GalleryImage[];
  isAdmin: boolean;
  addNews: (n: Omit<NewsArticle, 'id'>) => any;
  updateNews: (updated: NewsArticle) => void;
  deleteNews: (id: string) => void;
  resetDatabase: () => void;
  seasons: Season[];
  addSeason: (name: string) => any;
  activeSeasonId: string;
  toggleSeasonActive: (id: string) => void;
  adminPassword: string;
  setAdminPassword: (pass: string) => void;
  deleteSeason: (id: string) => void;
  updateMember: (updated: Member) => void;
  siteContent: Record<string, string>;
  updateSiteContent: (key: string, val: string) => void;
}

export default function AdminPanelTab({
  news,
  members,
  events,
  results,
  gallery,
  isAdmin,
  addNews,
  updateNews,
  deleteNews,
  resetDatabase,
  seasons,
  addSeason,
  activeSeasonId,
  toggleSeasonActive,
  adminPassword,
  setAdminPassword,
  deleteSeason,
  updateMember,
  siteContent,
  updateSiteContent
}: AdminPanelTabProps) {
  
  // Local admin states
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [formError, setFormError] = useState('');

  // Local season states
  const [newSeasonName, setNewSeasonName] = useState('');

  // Password change states
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Draft society contact details
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftFields, setDraftFields] = useState('');
  
  // Draft social URLs
  const [draftFacebook, setDraftFacebook] = useState('');
  const [draftDiscord, setDraftDiscord] = useState('');
  const [draftYoutube, setDraftYoutube] = useState('');

  // Draft committee officer additions
  const [newOfficerId, setNewOfficerId] = useState('');
  const [newOfficerTitle, setNewOfficerTitle] = useState('');
  const [newOfficerNotes, setNewOfficerNotes] = useState('');

  // Sync state values on siteContent load
  React.useEffect(() => {
    if (siteContent) {
      setDraftEmail(siteContent.contact_hq_email_val || 'garrydavies1963@gmail.com');
      setDraftPhone(siteContent.contact_hq_phone_val || '+353 (0) 86 123 4567');
      setDraftFields(siteContent.contact_hq_fields_val || 'County Dublin & County Kerry links, Ireland, EU');
      setDraftFacebook(siteContent.social_facebook || 'https://facebook.com/golf');
      setDraftDiscord(siteContent.social_discord || 'https://discord.gg/golf');
      setDraftYoutube(siteContent.social_youtube || 'https://youtube.com/golf');
    }
  }, [siteContent]);

  // Handle Contact Save
  const handleSaveContacts = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent('contact_hq_email_val', draftEmail);
    updateSiteContent('contact_hq_phone_val', draftPhone);
    updateSiteContent('contact_hq_fields_val', draftFields);
    alert('Society contact information updated successfully!');
  };

  // Handle Socials Save
  const handleSaveSocials = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent('social_facebook', draftFacebook);
    updateSiteContent('social_discord', draftDiscord);
    updateSiteContent('social_youtube', draftYoutube);
    alert('Social media/follow platform details updated successfully!');
  };

  // Handle Promote standard member to committee officer
  const handleAddCommitteeOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerId) {
      alert('Please select a member first.');
      return;
    }
    const target = members.find(m => m.id === newOfficerId);
    if (!target) return;

    updateMember({
      ...target,
      role: 'Committee',
      committeeTitle: newOfficerTitle || 'Committee Officer',
      notes: newOfficerNotes || 'No custom notes.'
    });

    setNewOfficerId('');
    setNewOfficerTitle('');
    setNewOfficerNotes('');
    alert(`Successfully added ${target.name} as a Committee Officer!`);
  };

  // Handle updates to existing committee officers
  const handleUpdateOfficerInfo = (m: Member, updatedTitle: string, updatedNotes: string) => {
    updateMember({
      ...m,
      committeeTitle: updatedTitle,
      notes: updatedNotes
    });
    alert(`Updated details for committee officer: ${m.name}`);
  };

  // Handle demoting officer back to regular member
  const handleRemoveFromCommittee = (m: Member) => {
    if (window.confirm(`Are you sure you want to remove ${m.name} from the committee board? This will change their role back to regular Member.`)) {
      updateMember({
        ...m,
        role: 'Member',
        committeeTitle: undefined,
        notes: undefined
      });
      alert(`Removed ${m.name} from the committee.`);
    }
  };

  // Form fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'Announcement' | 'Tournament Wrapup' | 'Social' | 'General'>('Announcement');
  const [author, setAuthor] = useState('David Smith');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Import / Export backup states
  const [backupString, setBackupString] = useState('');
  const [showBackupPanel, setShowBackupPanel] = useState(false);

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setContent('');
    setCategory('Announcement');
    setAuthor('David Smith');
    setImageUrl('');
    setIsFeatured(false);
    setEditingNews(null);
    setShowNewsForm(false);
    setFormError('');
  };

  const handleEditNewsClick = (n: NewsArticle) => {
    setEditingNews(n);
    setTitle(n.title);
    setSummary(n.summary);
    setContent(n.content);
    setCategory(n.category);
    setAuthor(n.author);
    setImageUrl(n.image);
    setIsFeatured(n.isFeatured);
    setShowNewsForm(true);
  };

  const handleSubmitNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !content || !author) {
      setFormError('Please fill in required fields (Title, Summary, Content, Author).');
      return;
    }

    // Default image if blank
    const seed = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const imgValue = imageUrl || `https://picsum.photos/seed/${seed}/800/500`;

    const payload = {
      title,
      summary,
      content,
      category,
      author,
      image: imgValue,
      isFeatured,
      date: new Date().toISOString().split('T')[0]
    };

    if (editingNews) {
      updateNews({
        ...editingNews,
        ...payload
      });
      alert('News article updated successfully.');
    } else {
      addNews(payload);
      alert('New society news article published.');
    }

    resetForm();
  };

  // Export current states as a single JSON backup clipboard string
  const handleExportBackup = () => {
    const fullBackup = {
      members,
      events,
      results,
      news,
      gallery
    };
    const backupStr = JSON.stringify(fullBackup, null, 2);
    setBackupString(backupStr);
    
    // Copy to clipboard
    navigator.clipboard.writeText(backupStr);
    alert('Full database backup copied to clipboard in JSON notation!');
  };

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-850 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto py-12">
        <Database className="w-12 h-12 text-amber-600 mx-auto animate-pulse" />
        <h2 className="font-display font-bold uppercase text-lg">Administrative Clearance Required</h2>
        <p className="text-sm font-sans">
          You are currently browsing the society website under standard Guest View. 
          To unlock management panels, click the **Guest View** badge in the header to switch permissions on.
        </p>
      </div>
    );
  }

  const handleCreateSeason = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newSeasonName.trim();
    if (!cleanName) {
      alert('Season name is required.');
      return;
    }
    const exists = seasons.some(s => s.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      alert('A season with this name already exists.');
      return;
    }
    const newS = addSeason(cleanName);
    toggleSeasonActive(newS.id);
    setNewSeasonName('');
    alert(`Campaign "${cleanName}" created successfully and set as the active season!`);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = newPasswordValue.trim();
    if (!cleanPass) {
      alert('Password cannot be empty.');
      return;
    }
    if (cleanPass.length < 4) {
      alert('Security recommendation: passcode should be at least 4 characters long.');
      return;
    }
    setAdminPassword(cleanPass);
    setNewPasswordValue('');
    alert(`Success! Admin passcode has been updated to "${cleanPass}". Feel free to test with guest logout/login.`);
  };

  return (
    <div className="space-y-12 pb-12 animate-fadeIn text-left">
      
      {/* 1. Header with Stats counts */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight">
          Admin Control Center
        </h1>
        <p className="text-stone-500 text-sm">
          Overview club directories, adjust society-wide announcements, and trigger database backups or restorations.
        </p>
      </div>

      {/* 2. Bento Statistics Tally Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-stone-150 shadow-sm text-center">
          <span className="text-[10px] text-stone-400 font-mono uppercase block">Admitted Players</span>
          <span className="text-3xl font-display font-bold text-[#064e3b] mt-2 block font-mono">{members.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-150 shadow-sm text-center">
          <span className="text-[10px] text-stone-400 font-mono uppercase block">Total Fixtures</span>
          <span className="text-3xl font-display font-bold text-[#064e3b] mt-2 block font-mono">{events.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-150 shadow-sm text-center">
          <span className="text-[10px] text-stone-400 font-mono uppercase block">Results Cards</span>
          <span className="text-3xl font-display font-bold text-[#fbbf24] mt-2 block font-mono">{results.length}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-150 shadow-sm text-center">
          <span className="text-[10px] text-stone-400 font-mono uppercase block">News Feed Count</span>
          <span className="text-3xl font-display font-bold text-stone-800 mt-2 block font-mono">{news.length}</span>
        </div>

      </section>

      {/* Campaign & Season Management Panel */}
      <section className="space-y-6">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="font-display font-bold text-xl text-stone-900 uppercase flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#064e3b]" />
            <span>Campaign & Season Management</span>
          </h2>
          <p className="text-stone-500 text-xs">
            Create new golfing campaigns, monitor list catalogs, and activate specific seasons for dynamic leaderboards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Create Season Form */}
          <form onSubmit={handleCreateSeason} className="md:col-span-5 bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="font-display font-bold uppercase text-stone-900 text-xs tracking-wider">Create New Season</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Add an independent campaign year. Tournaments can be linked to this season to isolate tables and standing scores.
              </p>
              
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-semibold text-stone-600">Season Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 2027 Golfing Campaign"
                  value={newSeasonName}
                  onChange={e => setNewSeasonName(e.target.value)}
                  className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-emerald-850 hover:bg-emerald-900 text-white w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create & Activate Season</span>
            </button>
          </form>

          {/* Season List Grid */}
          <div className="md:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 space-y-3 flex flex-col">
            <h3 className="font-display font-bold uppercase text-stone-900 text-xs tracking-wider border-b pb-2">Registered Campaigns</h3>
            
            <div className="space-y-2.5 overflow-y-auto max-h-[190px] pr-1 flex-1">
              {seasons.map((s) => {
                const isActive = s.id === activeSeasonId;
                const seasonEventsCount = events.filter(e => e.seasonId === s.id).length;
                
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'border-[#fbbf24] bg-amber-50/25 shadow-sm'
                        : 'border-stone-150 hover:border-stone-300 bg-stone-50/40'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-stone-900 text-xs tracking-tight block">{s.name}</span>
                      <span className="text-[10px] font-mono text-stone-400 block">{seasonEventsCount} tournaments linked</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => deleteSeason(s.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-650 p-1.5 rounded-lg border border-red-200 transition-colors"
                          title="Delete season and all its records"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isActive ? (
                        <span className="bg-emerald-800 text-white font-mono font-bold text-[9px] uppercase px-2.5 py-1 rounded-md shadow-sm">
                          ✓ Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            toggleSeasonActive(s.id);
                            alert(`Campaign "${s.name}" is now set as the active view!`);
                          }}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-850 font-sans font-bold text-[9px] uppercase px-2.5 py-1 rounded-md"
                        >
                          Set Active
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 3. News Articles Management */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <h2 className="font-display font-bold text-xl text-stone-900 uppercase flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#064e3b]" />
            <span>Manage News & Announcements</span>
          </h2>
          
          <button
            onClick={() => {
              resetForm();
              setShowNewsForm(!showNewsForm);
            }}
            className="bg-[#064e3b] hover:bg-[#022c22] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{showNewsForm ? 'Hide Form' : 'Write Article'}</span>
          </button>
        </div>

        {showNewsForm && (
          <div className="bg-stone-50 border-2 border-[#fbbf24]/40 rounded-2xl p-6 shadow-md animate-fadeIn">
            <h3 className="font-display font-bold uppercase text-[#064e3b] text-sm border-b border-stone-200 pb-2 mb-4">
              {editingNews ? `Modifier details: ${editingNews.title}` : 'Draft new society newsletter / announcement'}
            </h3>

            <form onSubmit={handleSubmitNews} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-sm">
              {formError && (
                <div className="md:col-span-12 text-xs bg-red-50 text-red-700 p-3 rounded border border-red-200">
                  {formError}
                </div>
              )}

              <div className="md:col-span-8 flex flex-col gap-1">
                <label className="font-semibold text-stone-700">Article Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Handicap Review Results released"
                  className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="font-semibold text-stone-700">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="bg-white border border-stone-250 rounded px-3 py-2 text-stone-900 focus:outline-none"
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Tournament Wrapup">Tournament Wrapup</option>
                  <option value="Social">Social</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="md:col-span-5 flex flex-col gap-1">
                <label className="font-semibold text-stone-700">Author Name *</label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-7 flex flex-col gap-1">
                <label className="font-semibold text-stone-700">Hero Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-12 flex flex-col gap-1">
                <label className="font-semibold text-stone-700">Short Summary Paragraph * (For home screens feed list)</label>
                <input
                  type="text"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="A concise, enticing summary of the newsletter..."
                  className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-12 flex flex-col gap-1">
                <label className="font-semibold text-stone-700">Full Newsletter Content * (Supports paragraphs)</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Draft the complete message text..."
                  rows={6}
                  className="bg-white border border-stone-250 rounded p-3 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-12 flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={e => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isFeatured" className="font-medium text-stone-700 cursor-pointer">
                  Feature this article prominently on the welcome slider page
                </label>
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
                  className="bg-[#064e3b] hover:bg-[#022c22] text-white font-bold px-5 py-2 rounded-lg text-xs uppercase"
                >
                  {editingNews ? 'Save Edits' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing news feed editor list */}
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs sm:text-sm font-sans leading-relaxed">
            <thead className="bg-stone-950 text-stone-200 font-display uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Publication Date</th>
                <th className="py-3 px-4">Article Title</th>
                <th className="py-3 px-4">Category Tag</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-250 text-stone-800">
              {news.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/50">
                  <td className="py-3.5 px-4 font-mono font-medium text-stone-500 whitespace-nowrap">{formatAppDate(item.date)}</td>
                  <td className="py-3.5 px-4 font-semibold text-stone-900 max-w-xs truncate">{item.title}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-stone-605">{item.author}</td>
                  <td className="py-3.5 px-4 text-center">
                    {item.isFeatured ? (
                      <span className="bg-yellow-50 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded text-[9px] uppercase font-mono">
                        ★ Featured
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[10px]">Standard</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEditNewsClick(item)}
                        className="p-1 rounded text-stone-450 hover:text-[#064e3b] hover:bg-stone-50"
                        title="Edit article"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteNews(item.id)}
                        className="p-1 rounded text-stone-450 hover:text-red-650 hover:bg-stone-50"
                        title="Delete article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Society Profile, Contacts & Committee Control Panel */}
      <section className="space-y-8 border-t border-stone-200 pt-8">
        <div className="border-b border-stone-100 pb-3 text-left">
          <h2 className="font-display font-bold text-xl text-stone-900 uppercase flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            <span>Society Profile, Contacts & Committee Board</span>
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Configure contact details, social media platforms, caddie hotlines, and c-suite committee profiles universally displayed across the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Contact and Social Editors */}
          <div className="space-y-6">
            
            {/* A. Contacts Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm text-left">
              <h3 className="font-display font-bold text-sm text-stone-900 uppercase flex items-center gap-2 border-b pb-2.5 mb-4">
                <Mail className="w-4 h-4 text-emerald-800" />
                <span>Society Contact Details</span>
              </h3>
              
              <form onSubmit={handleSaveContacts} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-700">Club Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={draftEmail}
                    onChange={e => setDraftEmail(e.target.value)}
                    className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-800"
                    placeholder="garrydavies1963@gmail.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-700">Caddie Hotline Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={draftPhone}
                    onChange={e => setDraftPhone(e.target.value)}
                    className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-800"
                    placeholder="+353 (0) 86 123 4567"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-700">Principal Playing Fields & Regions *</label>
                  <input
                    type="text"
                    required
                    value={draftFields}
                    onChange={e => setDraftFields(e.target.value)}
                    className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-800"
                    placeholder="County Dublin & County Kerry links, Ireland..."
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#064e3b] hover:bg-emerald-900 text-white font-bold uppercase tracking-wider text-[11px] py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Contact Details</span>
                </button>
              </form>
            </div>

            {/* B. Social Networks Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm text-left">
              <h3 className="font-display font-bold text-sm text-stone-900 uppercase flex items-center gap-2 border-b pb-2.5 mb-4">
                <Globe className="w-4 h-4 text-emerald-800" />
                <span>Connect & Follow Platforms</span>
              </h3>
              
              <form onSubmit={handleSaveSocials} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    <span>Facebook URL</span>
                  </label>
                  <input
                    type="url"
                    value={draftFacebook}
                    onChange={e => setDraftFacebook(e.target.value)}
                    className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-800"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Discord Server Invitation URL</span>
                  </label>
                  <input
                    type="url"
                    value={draftDiscord}
                    onChange={e => setDraftDiscord(e.target.value)}
                    className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-800"
                    placeholder="https://discord.gg/..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    <span>YouTube Channel URL</span>
                  </label>
                  <input
                    type="url"
                    value={draftYoutube}
                    onChange={e => setDraftYoutube(e.target.value)}
                    className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-800"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#064e3b] hover:bg-emerald-990 text-white font-bold uppercase tracking-wider text-[11px] py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Social Platforms</span>
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Committee Board Management */}
          <div className="space-y-6">
            
            {/* C. Promote Officer Card */}
            <div className="bg-[#064e3b]/5 border-2 border-emerald-800/10 rounded-2xl p-5 text-left">
              <h3 className="font-display font-bold text-sm text-stone-900 uppercase flex items-center gap-2 border-b border-stone-200 pb-2.5 mb-4">
                <Plus className="w-4 h-4 text-emerald-800" />
                <span>Promote Officer to Committee</span>
              </h3>
              
              <form onSubmit={handleAddCommitteeOfficer} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-700">Select Member to Promote *</label>
                  <select
                    value={newOfficerId}
                    onChange={e => setNewOfficerId(e.target.value)}
                    required
                    className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  >
                    <option value="">-- Select Member --</option>
                    {members
                      .filter(m => m.role !== 'Committee')
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} (Hcp {m.handicap})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-stone-700">Committee Officer Title *</label>
                    <input
                      type="text"
                      required
                      value={newOfficerTitle}
                      onChange={e => setNewOfficerTitle(e.target.value)}
                      placeholder="e.g. Treasurer"
                      className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 justify-center">
                    <span className="text-[10px] text-stone-400 leading-normal font-sans">Assign unique designations like Captain, President, Vice Captain, or Treasurer.</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-700">Officer Notes & Statement *</label>
                  <input
                    type="text"
                    required
                    value={newOfficerNotes}
                    onChange={e => setNewOfficerNotes(e.target.value)}
                    placeholder="e.g. Manages society finances & trophies"
                    className="bg-white border border-stone-250 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#064e3b] hover:bg-emerald-900 text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md w-full transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Approve Promotion to Board</span>
                </button>
              </form>
            </div>

            {/* D. List & Edit Existing Officers */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm text-left">
              <h3 className="font-display font-bold text-sm text-stone-900 uppercase flex items-center gap-2 border-b pb-2.5 mb-4">
                <Users className="w-4 h-4 text-emerald-800" />
                <span>Active Board of Directors ({members.filter(m => m.role === 'Committee').length})</span>
              </h3>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {members.filter(m => m.role === 'Committee').length === 0 ? (
                  <p className="text-stone-400 text-center text-xs py-4 font-sans italic">No committee members assigned yet.</p>
                ) : (
                  members
                    .filter(m => m.role === 'Committee')
                    .map(m => (
                      <CommitteeMemberRow
                        key={m.id}
                        member={m}
                        onUpdate={handleUpdateOfficerInfo}
                        onDelete={handleRemoveFromCommittee}
                      />
                    ))
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Security & Passcode Configuration Panel */}
      <section className="space-y-6">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="font-display font-bold text-xl text-stone-900 uppercase flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-800" />
            <span>Security & Passcode Settings</span>
          </h2>
          <p className="text-stone-500 text-xs text-left">
            Change the default committee passcode to protect tournament standings, scorecards, and society news from unauthorized editing.
          </p>
        </div>

        <div className="bg-white border border-stone-150 rounded-2xl p-5 shadow-sm max-w-2xl text-left">
          <form onSubmit={handleChangePasswordSubmit} className="space-y-5 text-xs sm:text-sm">
            <div className="space-y-1.5 max-w-md">
              <span className="text-[10px] text-stone-400 font-mono uppercase block font-bold">Current Code in Effect</span>
              <div className="flex items-center gap-2 font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold tracking-wider">{adminPassword}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end max-w-xl">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-700">Enter New Passcode *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="New passcode..."
                    value={newPasswordValue}
                    onChange={e => setNewPasswordValue(e.target.value)}
                    className="w-full bg-white border border-stone-250 rounded-xl pr-10 py-2 px-3 font-mono text-xs text-stone-900 focus:outline-none focus:border-emerald-850"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#064e3b] hover:bg-[#022c22] text-white font-bold uppercase tracking-wider text-[10px] sm:text-xs py-2.5 px-5 rounded-xl h-fit flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save New Passcode</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 5. Critical Database Tools panel (bento block) */}
      <section className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch font-sans">
        
        {/* Bulk reset panel */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-stone-900 text-base uppercase">Factory Reset Database</h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Instantly erase all custom entries, edited scorecards, adjusted handicaps, course records, and published news. 
              This will restore the society's state back to the original starting seeds.
            </p>
          </div>

          <button
            onClick={resetDatabase}
            className="w-full sm:w-fit px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl tracking-wider flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Trigger Factory Reset</span>
          </button>
        </div>

        {/* Database export / import */}
        <div className="space-y-4 flex flex-col justify-between border-t md:border-t-0 md:border-l border-stone-200 pt-6 md:pt-0 md:pl-8">
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-stone-900 text-base uppercase">Import / Export Backup JSON</h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Export the current full club directory states as a structured JSON backup. You can copy the code to clipboard to save society campaigns.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportBackup}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-850 text-[#fbbf24] border border-stone-800 text-xs font-bold uppercase rounded-xl tracking-wider flex items-center gap-1.5 shadow"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON to Clipboard</span>
            </button>
          </div>
        </div>

      </section>

    </div>
  );
}

function CommitteeMemberRow({
  member,
  onUpdate,
  onDelete
}: {
  member: Member;
  onUpdate: (m: Member, title: string, notes: string) => void;
  onDelete: (m: Member) => void;
  key?: string;
}) {
  const [title, setTitle] = useState(member.committeeTitle || '');
  const [notes, setNotes] = useState(member.notes || '');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="border border-stone-150 rounded-xl p-3 bg-stone-50/40 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="font-sans">
          <span className="font-semibold text-stone-900 block">{member.name}</span>
          <span className="text-[10px] text-stone-400 uppercase font-mono tracking-tight">Hcp {member.handicap}</span>
        </div>
        
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                onUpdate(member, title, notes);
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
            className="p-1 px-2.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold uppercase text-[9px] transition-colors"
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
          
          <button
            type="button"
            onClick={() => onDelete(member)}
            className="p-1 px-2 rounded bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 font-bold uppercase text-[9px] transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <div>
          <span className="text-[9px] text-stone-400 font-mono uppercase block">Title Role</span>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white border border-stone-250 rounded px-2 py-1 focus:outline-none"
            />
          ) : (
            <span className="font-medium text-emerald-800">{member.committeeTitle || 'Director'}</span>
          )}
        </div>

        <div>
          <span className="text-[9px] text-stone-400 font-mono uppercase block">Official Statement</span>
          {isEditing ? (
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-white border border-stone-250 rounded px-2 py-1 focus:outline-none"
            />
          ) : (
            <span className="text-stone-600 block italic">"{member.notes || 'Serving the community.'}"</span>
          )}
        </div>
      </div>
    </div>
  );
}
