/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

interface ContactTabProps {
  isAdmin: boolean;
  siteContent: Record<string, string>;
  updateSiteContent: (key: string, val: string) => void;
}

export default function ContactTab({
  isAdmin,
  siteContent,
  updateSiteContent
}: ContactTabProps) {
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Membership Enquiry');
  const [message, setMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Editor states
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSub, setDraftSub] = useState('');
  const [draftDirTitle, setDraftDirTitle] = useState('');
  const [draftHqTitle, setDraftHqTitle] = useState('');
  const [draftHqSub, setDraftHqSub] = useState('');
  const [draftEmailLbl, setDraftEmailLbl] = useState('');
  const [draftEmailVal, setDraftEmailVal] = useState('');
  const [draftPhoneLbl, setDraftPhoneLbl] = useState('');
  const [draftPhoneVal, setDraftPhoneVal] = useState('');
  const [draftFieldsLbl, setDraftFieldsLbl] = useState('');
  const [draftFieldsVal, setDraftFieldsVal] = useState('');
  const [draftRuleLbl, setDraftRuleLbl] = useState('');
  const [draftRuleVal, setDraftRuleVal] = useState('');
  const [draftFormTitle, setDraftFormTitle] = useState('');
  const [draftFormSub, setDraftFormSub] = useState('');
  const [draftMapTitle, setDraftMapTitle] = useState('');
  const [draftMapBody, setDraftMapBody] = useState('');
  const [draftMapBtnText, setDraftMapBtnText] = useState('');
  const [draftMapBtnSub, setDraftMapBtnSub] = useState('');

  // Sync state values on load
  React.useEffect(() => {
    if (siteContent) {
      setDraftTitle(siteContent.contact_welcome_title || "Get in Touch");
      setDraftSub(siteContent.contact_welcome_sub || "Have an enquiry regarding membership caps, upcoming outings, or corporate tee slots? Leave us a message.");
      setDraftDirTitle(siteContent.contact_dir_title || "DIRECTORY CORRESPONDENCE");
      setDraftHqTitle(siteContent.contact_hq_title || "The Hit & Miss HQ");
      setDraftHqSub(siteContent.contact_hq_sub || "Administrative queries are monitored by Garry Davies, Club President.");
      setDraftEmailLbl(siteContent.contact_hq_email_lbl || "Club Contact Email");
      setDraftEmailVal(siteContent.contact_hq_email_val || "garrydavies1963@gmail.com");
      setDraftPhoneLbl(siteContent.contact_hq_phone_lbl || "Caddie Hotline Number");
      setDraftPhoneVal(siteContent.contact_hq_phone_val || "+353 (0) 86 123 4567");
      setDraftFieldsLbl(siteContent.contact_hq_fields_lbl || "Principal Playing Fields");
      setDraftFieldsVal(siteContent.contact_hq_fields_val || "County Dublin & County Kerry links, Ireland, EU");
      setDraftRuleLbl(siteContent.contact_rule_lbl || "Clubhouse Rule #1");
      setDraftRuleVal(siteContent.contact_rule_val || "\"We are hit and miss, but we keep it fair. Any complaints regarding handicaps must be submitted alongside a premium pint of draft stout.\"");
      setDraftFormTitle(siteContent.contact_form_title || "Write to the Committee");
      setDraftFormSub(siteContent.contact_form_sub || "Provide your information below and we will get back to you shortly.");
      setDraftMapTitle(siteContent.contact_hq_map_title || "The Swilcan Woods");
      setDraftMapBody(siteContent.contact_hq_map_body || "We gather administrative assemblies in Portmarnock, Dublin, while tee-off fixtures circulate countrywide. Look up our Approved Courses Directory to navigate individually mapped addresses for upcoming events.");
      setDraftMapBtnText(siteContent.contact_map_btn_text || "PORTMARNOCK DUBLIN HQ");
      setDraftMapBtnSub(siteContent.contact_map_btn_sub || "Google Maps Link - Portmarnock peninsula, County Dublin");
    }
  }, [siteContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert('Please fill in required fields (Name, Email, Message).');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate real API handler send
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    }, 1200);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent('contact_welcome_title', draftTitle);
    updateSiteContent('contact_welcome_sub', draftSub);
    updateSiteContent('contact_dir_title', draftDirTitle);
    updateSiteContent('contact_hq_title', draftHqTitle);
    updateSiteContent('contact_hq_sub', draftHqSub);
    updateSiteContent('contact_hq_email_lbl', draftEmailLbl);
    updateSiteContent('contact_hq_email_val', draftEmailVal);
    updateSiteContent('contact_hq_phone_lbl', draftPhoneLbl);
    updateSiteContent('contact_hq_phone_val', draftPhoneVal);
    updateSiteContent('contact_hq_fields_lbl', draftFieldsLbl);
    updateSiteContent('contact_hq_fields_val', draftFieldsVal);
    updateSiteContent('contact_rule_lbl', draftRuleLbl);
    updateSiteContent('contact_rule_val', draftRuleVal);
    updateSiteContent('contact_form_title', draftFormTitle);
    updateSiteContent('contact_form_sub', draftFormSub);
    updateSiteContent('contact_hq_map_title', draftMapTitle);
    updateSiteContent('contact_hq_map_body', draftMapBody);
    updateSiteContent('contact_map_btn_text', draftMapBtnText);
    updateSiteContent('contact_map_btn_sub', draftMapBtnSub);
    setIsEditingContact(false);
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
            <p className="text-xs text-stone-700">You have unlock authorization. Edit all club emails, phone lines, clubhouse rules, maps metadata, and card headings on this tab.</p>
          </div>
          <button
            onClick={() => setIsEditingContact(true)}
            className="bg-stone-900 hover:bg-stone-850 text-[#fbbf24] font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 shrink-0"
          >
            <span>Edit Contact Texts</span>
          </button>
        </div>
      )}
      
      {/* 1. Header Banner */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight">
          {siteContent?.contact_welcome_title || "Get in Touch"}
        </h1>
        <p className="text-stone-500 text-sm">
          {siteContent?.contact_welcome_sub || "Have an enquiry regarding membership caps, upcoming outings, or corporate tee slots? Leave us a message."}
        </p>
      </div>

      {/* 2. Form & Contacts layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
        
        {/* Contact coordinates list */}
        <div className="lg:col-span-4 bg-[#064e3b] text-white p-6 sm:p-8 rounded-2xl border border-emerald-990 flex flex-col justify-between gap-12 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 left-0 opacity-[0.03] bg-[radial-gradient(#fbbf24_1px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest block font-bold">
                {siteContent?.contact_dir_title || "DIRECTORY CORRESPONDENCE"}
              </span>
              <h2 className="font-display font-bold text-xl text-[#fbbf24] uppercase">
                {siteContent?.contact_hq_title || "The Hit & Miss HQ"}
              </h2>
              <p className="text-stone-300 text-xs">
                {siteContent?.contact_hq_sub || "Administrative queries are monitored by Garry Davies, Club President."}
              </p>
            </div>

            <ul className="space-y-5 font-sans text-sm">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#fbbf24] mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block leading-none">
                    {siteContent?.contact_hq_email_lbl || "Club Contact Email"}
                  </span>
                  <a href={`mailto:${siteContent?.contact_hq_email_val || "garrydavies1963@gmail.com"}`} className="font-semibold text-stone-100 hover:text-white transition-colors">
                    {siteContent?.contact_hq_email_val || "garrydavies1963@gmail.com"}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#fbbf24] mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block leading-none">
                    {siteContent?.contact_hq_phone_lbl || "Caddie Hotline Number"}
                  </span>
                  <span className="font-semibold text-stone-100">{siteContent?.contact_hq_phone_val || "+353 (0) 86 123 4567"}</span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#fbbf24] mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono text-stone-400 block leading-none">
                    {siteContent?.contact_hq_fields_lbl || "Principal Playing Fields"}
                  </span>
                  <span className="text-stone-300">{siteContent?.contact_hq_fields_val || "County Dublin & County Kerry links, Ireland, EU"}</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="border-t border-emerald-900 pt-6 relative z-10 text-left">
            <span className="text-[10px] text-[#fbbf24] font-mono uppercase font-semibold block mb-2">
              {siteContent?.contact_rule_lbl || "Clubhouse Rule #1"}
            </span>
            <p className="text-xs text-stone-400 italic leading-relaxed">
              {siteContent?.contact_rule_val || `"We are hit and miss, but we keep it fair. Any complaints regarding handicaps must be submitted alongside a premium pint of draft stout."`}
            </p>
          </div>
        </div>

        {/* Dynamic Contact Form Panel */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm min-h-[480px]">
          
          {isSubmitted ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-4 animate-fadeIn">
              <div className="p-4 bg-emerald-50 rounded-full text-emerald-800 border border-emerald-200 shadow-md">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-2xl text-stone-900 uppercase">Message Dispatched!</h2>
              <p className="text-stone-600 text-sm max-w-md font-sans">
                We have received your society inquiry. Garry or David will return correspondence on your caddie mailbox within 48 active hours.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-[#064e3b] hover:bg-emerald-990 text-[#fbbf24] font-bold text-xs uppercase px-5 py-3 rounded-xl transition shadow"
              >
                Send another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-stone-100 pb-2 text-left">
                <h2 className="font-display font-bold text-stone-900 text-lg uppercase">
                  {siteContent?.contact_form_title || "Write to the Committee"}
                </h2>
                <p className="text-xs text-stone-500">
                  {siteContent?.contact_form_sub || "Provide your information below and we will get back to you shortly."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="flex flex-col gap-1.5 text-sm">
                  <label className="font-semibold text-stone-704">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Garry Davies Jnr"
                    className="bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 focus:outline-none focus:border-emerald-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-sm">
                  <label className="font-semibold text-stone-704">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@golf.com"
                    className="bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 focus:outline-none focus:border-emerald-800"
                  />
                </div>

              </div>

              <div className="flex flex-col gap-1.5 text-sm">
                <label className="font-semibold text-stone-704">Enquiry Subject</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="bg-white border border-stone-250 rounded-xl px-3.5 py-2.5 text-stone-900 focus:outline-none"
                >
                  <option value="Membership Enquiry">Membership Application / Admission Cap</option>
                  <option value="Fixture Registration">Fixture Guest Entry Request</option>
                  <option value="Sponsorship & Cup Donation">Cup Donation / Plate Sponsorship</option>
                  <option value="Handicap Dispute Review">Handicap Dispute & Appeal</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-sm">
                <label className="font-semibold text-stone-704">Message / Correspondence Text *</label>
                <textarea
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us about yourself, your current golf home ground, your official handicap index (if you have one), or details on why you slicing into the rough..."
                  rows={5}
                  className="bg-white border border-stone-250 rounded-xl p-3.5 text-stone-900 focus:outline-none focus:border-emerald-800"
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-stone-900 hover:bg-[#064e3b] text-[#fbbf24] border border-stone-850 font-display font-medium text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 ml-auto w-full sm:w-fit cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Transmitting scores mails...' : 'Transmit Enquiry'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </section>

      {/* 3. High Integrity Map Location mockup */}
      <section className="bg-stone-100/60 p-6 rounded-2xl border border-stone-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[10px] bg-stone-204 text-stone-605 px-2.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
              🚩 Home Ground Headquarters
            </span>
            <h3 className="font-display font-bold text-stone-900 text-lg uppercase">
              {siteContent?.contact_hq_map_title || "The Swilcan Woods"}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm font-sans leading-relaxed">
              {siteContent?.contact_hq_map_body || "We gather administrative assemblies in Portmarnock, Dublin, while tee-off fixtures circulate countrywide. Look up our Approved Courses Directory to navigate individually mapped addresses for upcoming events."}
            </p>
          </div>

          {/* Map mock panel element */}
          <div className="lg:col-span-7 h-40 bg-[#064e3b] text-white rounded-xl flex flex-col justify-center items-center text-center p-6 border border-[#fbbf24]/20 shadow-inner select-none relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center filter opacity-15" style={{ backgroundImage: "url('https://picsum.photos/seed/mapmockey/800/400')" }} />
            <div className="relative z-10 space-y-1">
              <MapPin className="w-6 h-6 text-[#fbbf24] mx-auto animate-bounce" />
              <h4 className="font-display font-bold font-mono text-stone-100 text-xs">
                {siteContent?.contact_map_btn_text || "PORTMARNOCK DUBLIN HQ"}
              </h4>
              <p className="text-stone-400 text-[10px]">
                {siteContent?.contact_map_btn_sub || "Google Maps Link - Portmarnock peninsula, County Dublin"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Contact Tab Editor modal */}
      {isEditingContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white text-stone-900 rounded-3xl border-2 border-[#fbbf24] shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 text-left relative">
            <button 
              onClick={() => setIsEditingContact(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-150 transition"
              type="button"
            >
              ✕
            </button>

            <div className="border-b border-stone-200 pb-3">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight text-emerald-950">
                ✏️ Edit Contact Us Page Information
              </h3>
              <p className="text-xs text-stone-500">
                Change public communication details, secretary telephone indices, compliance notices, and main descriptions.
              </p>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 uppercase block">Welcome Title</label>
                  <input type="text" required value={draftTitle} onChange={e => setDraftTitle(e.target.value)} className="w-full bg-white border border-stone-250 py-2.5 px-3.5 rounded-lg text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 uppercase block">Directory Label</label>
                  <input type="text" required value={draftDirTitle} onChange={e => setDraftDirTitle(e.target.value)} className="w-full bg-white border border-stone-250 py-2.5 px-3.5 rounded-lg text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 uppercase block">Welcome Tagline</label>
                <textarea required value={draftSub} onChange={e => setDraftSub(e.target.value)} rows={2} className="w-full bg-white border border-stone-250 p-2.5 rounded-lg text-xs" />
              </div>

              <div className="border-t border-stone-205 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-widest">Directory Coordinates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-stone-600 block">HQ Display Title</label>
                    <input type="text" required value={draftHqTitle} onChange={e => setDraftHqTitle(e.target.value)} className="w-full p-2 border border-stone-250 rounded-md text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-stone-600 block">HQ Brief Description</label>
                    <input type="text" required value={draftHqSub} onChange={e => setDraftHqSub(e.target.value)} className="w-full p-2 border border-stone-250 rounded-md text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase block leading-none font-semibold text-stone-600">Email Display Title</label>
                    <input type="text" required value={draftEmailLbl} onChange={e => setDraftEmailLbl(e.target.value)} className="w-full text-xs p-2 border border-stone-250 rounded-md" />
                    <input type="email" required value={draftEmailVal} onChange={e => setDraftEmailVal(e.target.value)} className="w-full text-xs p-2 border border-stone-250 rounded-md" />
                  </div>
                  <div className="space-y-1 block">
                    <label className="text-[10px] uppercase block leading-none font-semibold text-stone-600">Phone Display Line</label>
                    <input type="text" required value={draftPhoneLbl} onChange={e => setDraftPhoneLbl(e.target.value)} className="w-full text-xs p-2 border border-stone-250 rounded-md" />
                    <input type="text" required value={draftPhoneVal} onChange={e => setDraftPhoneVal(e.target.value)} className="w-full text-xs p-2 border border-stone-250 rounded-md" />
                  </div>
                  <div className="space-y-1 block">
                    <label className="text-[10px] uppercase block leading-none font-semibold text-stone-600">Fields Location Line</label>
                    <input type="text" required value={draftFieldsLbl} onChange={e => setDraftFieldsLbl(e.target.value)} className="w-full text-xs p-2 border border-stone-250 rounded-md" />
                    <input type="text" required value={draftFieldsVal} onChange={e => setDraftFieldsVal(e.target.value)} className="w-full text-xs p-2 border border-stone-250 rounded-md" />
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-4 space-y-2">
                <h4 className="text-xs font-bold text-emerald-905 uppercase tracking-widest">Clubhouse Regulation Footnote</h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-stone-600 block uppercase">Label</label>
                    <input type="text" required value={draftRuleLbl} onChange={e => setDraftRuleLbl(e.target.value)} className="w-full text-xs p-2.5 border border-stone-250 rounded-lg" />
                  </div>
                  <div className="sm:col-span-9 space-y-1">
                    <label className="text-[10px] font-bold text-stone-600 block uppercase">Notice text</label>
                    <input type="text" required value={draftRuleVal} onChange={e => setDraftRuleVal(e.target.value)} className="w-full text-xs p-2.5 border border-stone-250 rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-widest">Interactive Form Header & Address Map</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-701 block text-[10px] uppercase">Form Header title</label>
                    <input type="text" required value={draftFormTitle} onChange={e => setDraftFormTitle(e.target.value)} className="w-full bg-white border border-stone-250 p-2.5 rounded-lg text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-701 block text-[10px] uppercase">Form Slogan subtext</label>
                    <input type="text" required value={draftFormSub} onChange={e => setDraftFormSub(e.target.value)} className="w-full bg-white border border-stone-250 p-2.5 rounded-lg text-xs" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-600 block uppercase font-mono">Location Title</label>
                      <input type="text" required value={draftMapTitle} onChange={e => setDraftMapTitle(e.target.value)} className="w-full text-xs p-2 border border-stone-250 rounded" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-600 block uppercase font-mono font-bold text-amber-800">Map Button Line</label>
                      <input type="text" required value={draftMapBtnText} onChange={e => setDraftMapBtnText(e.target.value)} className="w-full text-xs p-2 border border-[#fbbf24] bg-amber-50/20 rounded" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-600 block uppercase font-mono">Location description text</label>
                    <textarea required value={draftMapBody} onChange={e => setDraftMapBody(e.target.value)} rows={2} className="w-full text-xs p-2 border border-stone-250 rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditingContact(false)}
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
