/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, Globe, Plus, Trash2, Edit, ChevronRight, Award, Info, Sparkles } from 'lucide-react';
import { GolfCourse } from '../types';

interface CoursesTabProps {
  courses: GolfCourse[];
  isAdmin: boolean;
  addCourse: (c: Omit<GolfCourse, 'id'>) => any;
  updateCourse: (updated: GolfCourse) => void;
  deleteCourse: (id: string) => void;
}

export default function CoursesTab({
  courses,
  isAdmin,
  addCourse,
  updateCourse,
  deleteCourse
}: CoursesTabProps) {
  // Local states
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<GolfCourse | null>(null);
  const [formError, setFormError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [par, setPar] = useState(72);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setLocation('');
    setPar(72);
    setDifficulty('Medium');
    setWebsiteUrl('');
    setImageUrl('');
    setDescription('');
    setNotes('');
    setEditingCourse(null);
    setShowAddForm(false);
    setFormError('');
  };

  const handleEditClick = (c: GolfCourse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(c);
    setName(c.name);
    setLocation(c.location);
    setPar(c.par);
    setDifficulty(c.difficulty);
    setWebsiteUrl(c.websiteUrl);
    setImageUrl(c.imageUrl);
    setDescription(c.description);
    setNotes(c.notes || '');
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !websiteUrl || !description) {
      setFormError('Please fill in required fields (Name, Location, Website URL, Description).');
      return;
    }

    // Default image if blank
    const seed = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const imgValue = imageUrl || `https://picsum.photos/seed/${seed}/800/600`;

    const payload = {
      name,
      location,
      par: Number(par),
      difficulty,
      websiteUrl,
      imageUrl: imgValue,
      description,
      notes
    };

    if (editingCourse) {
      updateCourse({
        ...editingCourse,
        ...payload
      });
      alert('Course successfully updated.');
    } else {
      addCourse(payload);
      alert('New golf course registered in database.');
    }

    resetForm();
  };

  const activeCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="space-y-8 pb-12 animate-fadeIn text-left">
      
      {/* 1. Page Header with Admin Form triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight">
            Society Course Directory
          </h1>
          <p className="text-stone-500 text-sm">
            Discover championship links and premium parklands visited by society tournaments.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {/* 2. Admin Form Modal Frame */}
      {isAdmin && showAddForm && (
        <div className="bg-stone-50 border-2 border-[#fbbf24]/40 rounded-2xl p-6 shadow-md animate-fadeIn">
          <h2 className="font-display font-bold text-base text-emerald-950 uppercase border-b border-stone-200 pb-2 mb-4">
            {editingCourse ? 'Editer Course Profile' : 'Register New Championship Golf Course'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-sm">
            {formError && (
              <div className="md:col-span-12 text-xs bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <div className="md:col-span-6 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Course Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Royal Portrush Golf Club"
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div className="md:col-span-6 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Geographic Location *</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. County Antrim, Northern Ireland"
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Course Standard Par *</label>
              <input
                type="number"
                min={60}
                max={76}
                value={par}
                onChange={e => setPar(Number(e.target.value))}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Design Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="md:col-span-6 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Official Website URL *</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://www.examplegolf.com"
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-12 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Course Photo URL (Optional, leaves blank for auto-generate)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="md:col-span-12 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Course Summary / Profile Details *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Write a descriptive overview: historical significance, course layout, general design style (links or parklands)..."
                rows={3}
                className="bg-white border border-stone-200 rounded p-3 text-stone-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div className="md:col-span-12 flex flex-col gap-1">
              <label className="font-semibold text-stone-700">Caddie / Playing Notes & Bunkers Advice</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Local knowledge tips: Deep fairways, avoid bunkers on 4th hole, greens are highly wind adjusted..."
                rows={2}
                className="bg-white border border-stone-200 rounded p-3 text-stone-900 focus:outline-none focus:border-emerald-800"
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
                {editingCourse ? 'Save Edits' : 'Publish Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Course Catalog list cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const isSelected = selectedCourseId === course.id;

          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between overflow-hidden group ${
                isSelected 
                  ? 'ring-2 ring-[#fbbf24] border-transparent shadow-md' 
                  : 'border-stone-150 hover:border-[#fbbf24]/40 shadow-sm'
              }`}
              id={`course-entry-${course.id}`}
            >
              
              {/* Media header block */}
              <div className="h-44 overflow-hidden relative select-none">
                <img 
                  src={course.imageUrl} 
                  alt={course.name} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/golfcourse/600/400";
                  }}
                />
                
                {/* Par Tag overlay */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono tracking-wider border shadow-md inline-block uppercase bg-emerald-950 text-white border-emerald-800`}>
                    🛡️ PAR {course.par}
                  </span>
                  
                  <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono tracking-wider border shadow-md inline-block uppercase ${
                    course.difficulty === 'Hard' ? 'bg-red-900/90 text-red-100 border-red-750' :
                    course.difficulty === 'Medium' ? 'bg-amber-800/90 text-amber-100 border-amber-700' :
                    'bg-slate-800/90 text-slate-100 border-slate-700'
                  }`}>
                    {course.difficulty} Grid
                  </span>
                </div>
              </div>

              {/* Course context description */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                <div className="space-y-2">
                  <h3 className="font-display font-medium text-stone-900 group-hover:text-emerald-800 text-base sm:text-lg leading-tight uppercase font-bold">
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-[#fbbf24] flex-shrink-0" />
                    <span>{course.location}</span>
                  </div>
                  <p className="text-stone-605 text-xs font-sans leading-relaxed line-clamp-3">
                    {course.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#fbbf24] uppercase tracking-widest flex items-center gap-1">
                    <span>View Board Advice & Notes</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>

                  {/* Inline Admin modifiers */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEditClick(course, e)}
                        className="p-1.5 rounded hover:bg-stone-50 text-stone-400 hover:text-emerald-700"
                        title="Edit course registry"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCourse(course.id);
                        }}
                        className="p-1.5 rounded hover:bg-stone-50 text-stone-400 hover:text-red-600"
                        title="Delete course registry"
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

      {/* 4. Single Course detailed popup screen overlay */}
      {activeCourse && (
        <section className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 space-y-6 mt-8 border border-[#fbbf24]/40 shadow-xl relative overflow-hidden animate-fadeIn">
          
          <div className="flex justify-between items-start border-b border-stone-800 pb-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#fbbf24] uppercase tracking-widest block">APPROVED COURSE PROFILE</span>
              <h2 className="font-display font-medium text-stone-200 text-xl sm:text-2xl uppercase font-bold inline-flex items-center gap-2">
                <span>{activeCourse.name}</span>
                <Sparkles className="w-4 h-4 text-[#fbbf24] animate-pulse" />
              </h2>
              <p className="text-xs text-stone-400">📍 {activeCourse.location}</p>
            </div>

            <button
              onClick={() => setSelectedCourseId(null)}
              className="text-stone-400 hover:text-white font-mono text-xs hover:underline"
            >
              Close Directory view ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-sm leading-relaxed">
            
            <div className="lg:col-span-8 space-y-4 font-sans">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Course Highlights & Bio</span>
                <p className="text-stone-300 text-xs sm:text-sm">
                  {activeCourse.description}
                </p>
              </div>

              {activeCourse.notes && (
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-850/60 space-y-1">
                  <span className="text-[10px] font-mono text-amber-500 uppercase flex items-center gap-1 leading-none font-bold mb-1">
                    <Info className="w-3 h-3 text-[#fbbf24]" />
                    <span>Caddie playing guidelines (Committees Local Knowledge)</span>
                  </span>
                  <p className="text-stone-400 text-xs italic leading-relaxed">
                    "{activeCourse.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 bg-stone-950 p-5 rounded-xl border border-stone-850/60 flex flex-col justify-between gap-6">
              
              <div className="space-y-3 text-xs">
                <h4 className="font-display font-bold text-white uppercase text-[10px] tracking-widest border-b border-stone-850 pb-2">
                  Layout Statistics
                </h4>

                <div className="flex justify-between items-center text-stone-400 font-mono">
                  <span>STANDARD PAR</span>
                  <span className="font-bold text-white uppercase">PAR {activeCourse.par}</span>
                </div>
                <div className="flex justify-between items-center text-stone-400 font-mono">
                  <span>HCP DENSITY</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    activeCourse.difficulty === 'Hard' ? 'bg-red-500/20 text-red-300' :
                    activeCourse.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-slate-500/20 text-slug-100'
                  }`}>
                    {activeCourse.difficulty} Test
                  </span>
                </div>
                <div className="flex justify-between items-center text-stone-400 font-mono">
                  <span>TEE ACCESS</span>
                  <span className="font-bold text-white">SOCIETY CONFIRMED</span>
                </div>
              </div>

              <a
                href={activeCourse.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 hover:scale-102 transition-all py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Visit Club Website</span>
              </a>

            </div>

          </div>

        </section>
      )}

    </div>
  );
}
