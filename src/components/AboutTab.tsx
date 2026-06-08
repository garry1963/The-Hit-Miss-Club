/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Award, Landmark } from 'lucide-react';
import { Member } from '../types';

interface AboutTabProps {
  members: Member[];
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  siteContent: Record<string, string>;
  updateSiteContent: (key: string, val: string) => void;
}

export default function AboutTab({
  members,
  setCurrentTab,
  isAdmin,
  siteContent,
  updateSiteContent
}: AboutTabProps) {
  // Find committee members
  const committee = members.filter(m => m.role === 'Committee');

  // Editor modal trigger states
  const [isEditingAbout, setIsEditingAbout] = React.useState(false);
  const [draftSub, setDraftSub] = React.useState('');
  const [draftBody, setDraftBody] = React.useState('');
  const [draftCard1Title, setDraftCard1Title] = React.useState('');
  const [draftCard1Body, setDraftCard1Body] = React.useState('');
  const [draftCard2Title, setDraftCard2Title] = React.useState('');
  const [draftCard2Body, setDraftCard2Body] = React.useState('');
  const [draftCard3Title, setDraftCard3Title] = React.useState('');
  const [draftCard3Body, setDraftCard3Body] = React.useState('');

  // Sync state values on database trigger load
  React.useEffect(() => {
    if (siteContent) {
      setDraftSub(siteContent.about_heritage_sub || "About The Hit & Miss Club");
      setDraftBody(siteContent.about_heritage_body || "Founded on a windy afternoon on the dunes of Dublin in 2021 by Garry Davies and a handful of golf fanatics, \"The Hit & Miss Club\" has grown into a highly regarded, friendly society. We represent the true amateur golfer—striving for the perfect drive, laughing off the stray slices, and celebrating our achievements over a proper pint.");
      setDraftCard1Title(siteContent.about_card1_title || "Sincere Sportsmanship");
      setDraftCard1Body(siteContent.about_card1_body || "While we celebrate competitive performance and lowest gross scores, our core pillar is high integrity. Playing by the standard R&A and USGA regulations is key, followed by immediate camaraderie in the clubhouse.");
      setDraftCard2Title(siteContent.about_card2_title || "Fair Handicapping");
      setDraftCard2Body(siteContent.about_card2_body || "Our custom trim system acts as an equalizer, modifying handicaps dynamically when society cups are won. This allows members of all backgrounds (3 to 28+) to remain in contention.");
      setDraftCard3Title(siteContent.about_card3_title || "Approved Venues");
      setDraftCard3Body(siteContent.about_card3_body || "From St. Andrews Old Course to Druids Glen, we carefully screen and reserve prestige tees, ensuring our members get the absolute finest golf course conditions available in Northern Europe.");
    }
  }, [siteContent]);

  const handleSaveAbout = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent('about_heritage_sub', draftSub);
    updateSiteContent('about_heritage_body', draftBody);
    updateSiteContent('about_card1_title', draftCard1Title);
    updateSiteContent('about_card1_body', draftCard1Body);
    updateSiteContent('about_card2_title', draftCard2Title);
    updateSiteContent('about_card2_body', draftCard2Body);
    updateSiteContent('about_card3_title', draftCard3Title);
    updateSiteContent('about_card3_body', draftCard3Body);
    setIsEditingAbout(false);
  };

  return (
    <div className="space-y-12 pb-12 animate-fadeIn text-left">

      {/* Editor Trigger for admin */}
      {isAdmin && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-850 bg-amber-500/15 px-2 py-0.5 rounded uppercase tracking-wider block w-fit mb-1">
              🔧 ADMIN EDIT PERMISSION ACTIVE
            </span>
            <p className="text-xs text-stone-700">You have unlock authorization. Edit all titles, core guidelines, requirements, card statements, and limits on this tab.</p>
          </div>
          <button
            onClick={() => setIsEditingAbout(true)}
            className="bg-stone-900 hover:bg-stone-850 text-[#fbbf24] font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 shrink-0"
          >
            <span>Edit About Texts</span>
          </button>
        </div>
      )}
      
      {/* 1. Header & Quick Intro */}
      <section className="bg-[#064e3b] text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden border border-emerald-950 shadow-lg">
        <div className="relative z-10 max-w-4xl space-y-4">
          <span className="text-xs bg-[#fbbf24] text-stone-950 px-3 py-1 rounded font-mono font-bold uppercase tracking-widest">
            🏌️ OUR HERITAGE
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl text-stone-100 uppercase tracking-tight">
            {siteContent?.about_heritage_sub || "About The Hit & Miss Club"}
          </h1>
          <p className="font-sans text-stone-200 text-base sm:text-lg leading-relaxed font-light">
            {siteContent?.about_heritage_body || `Founded on a windy afternoon on the dunes of Dublin in 2021 by Garry Davies and a handful of golf fanatics, "The Hit & Miss Club" has grown into a highly regarded, friendly society. We represent the true amateur golfer—striving for the perfect drive, laughing off the stray slices, and celebrating our achievements over a proper pint.`}
          </p>
        </div>
      </section>

      {/* 2. Mission & Philosophy Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl w-fit">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-stone-900 uppercase">
            {siteContent?.about_card1_title || "Sincere Sportsmanship"}
          </h3>
          <p className="text-stone-605 text-sm leading-relaxed">
            {siteContent?.about_card1_body || "While we celebrate competitive performance and lowest gross scores, our core pillar is high integrity. Playing by the standard R&A and USGA regulations is key, followed by immediate camaraderie in the clubhouse."}
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col gap-3">
          <div className="p-3 bg-amber-50 text-amber-750 rounded-xl w-fit">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-stone-900 uppercase">
            {siteContent?.about_card2_title || "Fair Handicapping"}
          </h3>
          <p className="text-stone-605 text-sm leading-relaxed">
            {siteContent?.about_card2_body || "Our custom trim system acts as an equalizer, modifying handicaps dynamically when society cups are won. This allows members of all backgrounds (3 to 28+) to remain in contention."}
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col gap-3">
          <div className="p-3 bg-stone-900 text-[#fbbf24] rounded-xl w-fit">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-stone-905 uppercase">
            {siteContent?.about_card3_title || "Approved Venues"}
          </h3>
          <p className="text-stone-605 text-sm leading-relaxed">
            {siteContent?.about_card3_body || "From St. Andrews Old Course to Druids Glen, we carefully screen and reserve prestige tees, ensuring our members get the absolute finest golf course conditions available in Northern Europe."}
          </p>
        </div>

      </section>

      {/* 3. The Society Committee */}
      <section className="space-y-6">
        <div className="border-b border-stone-200 pb-3">
          <h2 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight">
            The Society Committee
          </h2>
          <p className="text-stone-500 text-sm">
            Meet the administrators responsible for organizing fixtures, monitoring funds, and calculating handicaps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {committee.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-2xl p-6 border border-stone-150 shadow-sm flex flex-col items-center text-center gap-4 hover:shadow-md transition-all relative overflow-hidden"
              id={`committee-member-${member.id}`}
            >
              {/* Badge for role */}
              <span className="absolute top-3 right-3 bg-amber-500/10 text-amber-850 border border-amber-300/40 text-[9px] uppercase tracking-widest rounded px-2 py-0.5 font-bold font-mono">
                {member.committeeTitle ? 'Committee Officer' : 'Committee'}
              </span>

              {/* Avatar circle */}
              <div className="w-20 h-20 rounded-full border-2 border-[#fbbf24] bg-stone-50 overflow-hidden shadow-inner flex items-center justify-center relative">
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Bio details */}
              <div className="space-y-1">
                <h3 className="font-display font-bold text-[#064e3b] text-lg uppercase leading-tight">
                  {member.name}
                </h3>
                <p className="text-amber-850 font-mono text-xs font-semibold">
                  {member.committeeTitle || 'Officer'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="bg-stone-100 text-stone-605 px-2 py-0.5 rounded text-[10px] font-mono">
                    HCP: {member.handicap}
                  </span>
                  <span className="bg-stone-100 text-stone-605 px-2 py-0.5 rounded text-[10px] font-mono">
                    Joined: {new Date(member.joinedDate).getFullYear()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed max-w-sm italic">
                "{member.notes || 'No statement listed.'}"
              </p>

              {/* Quick links to members tab to view comprehensive player profile */}
              <button
                onClick={() => setCurrentTab('members')}
                className="mt-2 text-[10px] font-bold text-[#064e3b] hover:text-emerald-950 font-mono tracking-wider flex items-center gap-1 group"
              >
                <span>Full Member Profile</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

            </div>
          ))}
        </div>
      </section>

      {/* 4. Join the Society call to action */}
      <section className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2 max-w-2xl text-left">
          <h3 className="font-display font-bold text-xl text-stone-900 uppercase">
            Interested in Joining the Club?
          </h3>
          <p className="text-stone-600 text-sm leading-relaxed font-sans">
            Whether you play off standard single figures or are a recreational double-digit enthusiast, The Hit & Miss Club is dedicated to outstanding friendly camaraderie on and off the course. We are delighted to accept new membership inquiries.
          </p>
        </div>
        <button
          onClick={() => setCurrentTab('contact')}
          className="bg-[#064e3b] hover:bg-emerald-900 text-[#fbbf24] font-bold uppercase py-3.5 px-6 rounded-xl tracking-wider text-xs shadow-sm transition shrink-0"
        >
          Submit Membership Inquiry
        </button>
      </section>

      {/* Admin About Tab Editor modal */}
      {isEditingAbout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-stone-900 rounded-3xl border-2 border-[#fbbf24] shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 text-left relative">
            <button 
              onClick={() => setIsEditingAbout(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 transition"
              type="button"
            >
              ✕
            </button>

            <div className="border-b border-stone-200 pb-3">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight text-emerald-950">
                ✏️ Edit About Us Profile & Policy Texts
              </h3>
              <p className="text-xs text-stone-500">
                Modify core historical biographies, annual rates, guidelines, and limits.
              </p>
            </div>

            <form onSubmit={handleSaveAbout} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase block">Main Heritage Title</label>
                <input
                  type="text"
                  required
                  value={draftSub}
                  onChange={e => setDraftSub(e.target.value)}
                  className="w-full bg-white border border-stone-250 py-2 px-3 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase block">Main Historical Biography</label>
                <textarea
                  required
                  rows={4}
                  value={draftBody}
                  onChange={e => setDraftBody(e.target.value)}
                  className="w-full bg-white border border-stone-250 p-3 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-600 block uppercase">Sportsmanship Card Title</label>
                  <input
                    type="text" required value={draftCard1Title} onChange={e => setDraftCard1Title(e.target.value)}
                    className="w-full text-xs p-2 border border-stone-250 rounded-md"
                  />
                  <textarea
                    required rows={3} value={draftCard1Body} onChange={e => setDraftCard1Body(e.target.value)}
                    className="w-full text-[11px] p-2 border border-stone-250 rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-600 block uppercase">Handicap Card Title</label>
                  <input
                    type="text" required value={draftCard2Title} onChange={e => setDraftCard2Title(e.target.value)}
                    className="w-full text-xs p-2 border border-stone-250 rounded-md"
                  />
                  <textarea
                    required rows={3} value={draftCard2Body} onChange={e => setDraftCard2Body(e.target.value)}
                    className="w-full text-[11px] p-2 border border-stone-250 rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-600 block uppercase">Venues Card Title</label>
                  <input
                    type="text" required value={draftCard3Title} onChange={e => setDraftCard3Title(e.target.value)}
                    className="w-full text-xs p-2 border border-stone-250 rounded-md"
                  />
                  <textarea
                    required rows={3} value={draftCard3Body} onChange={e => setDraftCard3Body(e.target.value)}
                    className="w-full text-[11px] p-2 border border-stone-250 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditingAbout(false)}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase py-3 px-4 rounded-xl text-xs tracking-wider border border-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full bg-[#064e3b] hover:bg-emerald-900 text-[#fbbf24] font-bold uppercase py-3 px-4 rounded-xl text-xs tracking-wider transition shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
