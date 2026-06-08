/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Image, Plus, Trash2, X, ChevronLeft, ChevronRight, Filter, ZoomIn } from 'lucide-react';
import { GalleryImage } from '../types';

interface GalleryTabProps {
  gallery: GalleryImage[];
  isAdmin: boolean;
  addGalleryImage: (img: Omit<GalleryImage, 'id'>) => any;
  deleteGalleryImage: (id: string) => void;
}

export default function GalleryTab({
  gallery,
  isAdmin,
  addGalleryImage,
  deleteGalleryImage
}: GalleryTabProps) {
  // Filters states
  const [activeCategory, setActiveCategory] = useState<'All' | 'Tournaments' | 'Courses' | 'Social' | 'Trophy'>('All');
  
  // Modal light box state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Admin form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Fields
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<'Tournaments' | 'Courses' | 'Social' | 'Trophy'>('Tournaments');

  const filteredGallery = gallery.filter((img) => {
    if (activeCategory === 'All') return true;
    return img.category === activeCategory;
  });

  const resetForm = () => {
    setImageUrl('');
    setCaption('');
    setCategory('Tournaments');
    setShowAddForm(false);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !caption) {
      setFormError('Please fill in both required fields (Image URL, Caption).');
      return;
    }

    addGalleryImage({
      imageUrl,
      caption,
      category,
      date: new Date().toISOString().split('T')[0]
    });

    alert('New image memories appended to gallery board successfully.');
    resetForm();
  };

  // Lightbox navigate controls
  const handlePrevLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    } else {
      setLightboxIndex(filteredGallery.length - 1); // loop back
    }
  };

  const handleNextLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex < filteredGallery.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    } else {
      setLightboxIndex(0); // loop back
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn text-left">
      
      {/* 1. Header with category buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight">
            Society Gallery
          </h1>
          <p className="text-stone-500 text-sm">
            Captured moments of scenic layouts, trophy presentations, caddie disasters, and clubhouse gatherings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category tabs filters */}
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1 text-xs">
            {(['All', 'Tournaments', 'Courses', 'Social', 'Trophy'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setLightboxIndex(null);
                  setActiveCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-md font-mono ${
                  activeCategory === cat 
                    ? 'bg-[#064e3b] text-white font-bold' 
                    : 'text-stone-650 hover:text-[#064e3b] hover:bg-stone-50'
                }`}
              >
                {cat}
              </button>
            ))}
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
              <span>Add Memory</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Admin Form Frame */}
      {isAdmin && showAddForm && (
        <div className="bg-stone-50 border-2 border-[#fbbf24]/40 rounded-2xl p-6 shadow-md animate-fadeIn">
          <h2 className="font-display font-bold text-base text-emerald-950 uppercase border-b border-stone-200 pb-2 mb-4">
            Upload New Photo Memory
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-sm">
            {formError && (
              <div className="md:col-span-12 text-xs bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label className="font-semibold text-stone-700">Image absolute URL *</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="font-semibold text-stone-700">Category Tag *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Tournaments">Tournaments</option>
                <option value="Courses">Courses</option>
                <option value="Social">Social</option>
                <option value="Trophy">Trophy</option>
              </select>
            </div>

            <div className="md:col-span-12 flex flex-col gap-1.5">
              <label className="font-semibold text-stone-700">Caption / Description *</label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write a descriptive caption (who is in the photo, what hole, which tournament...)"
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-800"
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
                Save memory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Image Responsive Grid */}
      {filteredGallery.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-2">
          <Image className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-display font-medium text-stone-800 text-lg">No Images Loaded</h3>
          <p className="text-stone-500 text-sm max-w-sm mx-auto">
            No memories matched category tag "{activeCategory}". Select another category or upload new ones.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredGallery.map((img, index) => (
            <div
              key={img.id}
              onClick={() => setLightboxIndex(index)}
              className="bg-white rounded-2xl border border-stone-150 p-3 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              id={`gallery-card-${img.id}`}
            >
              {/* Image box */}
              <div className="h-56 overflow-hidden rounded-xl border border-stone-100 relative select-none">
                <img 
                  src={img.imageUrl} 
                  alt={img.caption} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/golfgallery/800/600";
                  }}
                />
                
                {/* Immersive zoom overlay */}
                <div className="absolute inset-0 bg-stone-950/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                  <div className="p-2.5 rounded-full bg-emerald-800 border border-emerald-600 shadow-md">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Left side category overlay tag */}
                <div className="absolute top-2.5 left-2.5 flex">
                  <span className="bg-stone-900/90 text-[#fbbf24] text-[8px] uppercase tracking-widest font-black font-mono border border-stone-800 shadow px-2 py-0.5 rounded">
                    {img.category}
                  </span>
                </div>
              </div>

              {/* Caption and meta */}
              <div className="pt-3 px-1 flex items-start justify-between gap-3 text-left">
                <div className="space-y-1">
                  <p className="text-stone-800 font-sans text-xs font-semibold leading-relaxed line-clamp-2">
                    {img.caption}
                  </p>
                  <span className="text-[10px] text-stone-400 font-mono block">Captured {img.date}</span>
                </div>

                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGalleryImage(img.id);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-650 hover:bg-stone-50 flex-shrink-0"
                    title="Remove memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 4. Immersive Fullscreen Lightbox Frame */}
      {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
        <div 
          className="fixed inset-0 bg-black/95 z-55 flex flex-col justify-between p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setLightboxIndex(null)}
          id="gallery-fullscreen-lightbox"
        >
          {/* Top header navigation */}
          <div className="flex items-center justify-between text-white py-2 px-4 relative z-50">
            <span className="font-mono text-xs text-stone-400 tracking-wider">
              🏞️ SOCIETY LOG BOOK ({lightboxIndex + 1} of {filteredGallery.length})
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 bg-stone-900/60 border border-stone-850 rounded-full hover:bg-stone-855 text-white shadow focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core content slide sheet */}
          <div className="flex-1 flex items-center justify-between gap-2 max-w-7xl mx-auto w-full relative z-40 select-none">
            {/* Prev arrow toggle button */}
            <button
              onClick={handlePrevLightbox}
              className="p-3 bg-stone-900/60 border border-stone-850 hover:border-[#fbbf24]/40 text-white rounded-full hover:bg-stone-855 flex items-center justify-center transition-colors shadow"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Core Slide Container */}
            <div className="max-w-4xl h-[60vh] sm:h-[75vh] flex items-center justify-center p-2 relative">
              <img 
                src={filteredGallery[lightboxIndex].imageUrl} 
                alt="Selected Lightbox Display" 
                className="w-auto h-auto max-w-full max-h-full rounded-xl object-contain border border-stone-800 shadow-2xl"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://picsum.photos/seed/golfgallery/800/600";
                }}
                onClick={(e) => e.stopPropagation()} // stop close on image click
              />
            </div>

            {/* Next arrow toggle button */}
            <button
              onClick={handleNextLightbox}
              className="p-3 bg-stone-900/60 border border-stone-850 hover:border-[#fbbf24]/40 text-white rounded-full hover:bg-stone-855 flex items-center justify-center transition-colors shadow"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Subtitle Caption */}
          <div className="p-6 bg-stone-950/90 text-center border-t border-stone-905 max-w-3xl mx-auto w-full rounded-xl relative z-40 mb-4 select-none">
            <span className="bg-[#fbbf24] text-stone-950 text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded inline-block mb-2">
              📸 {filteredGallery[lightboxIndex].category} memory
            </span>
            <p className="text-stone-200 text-sm sm:text-base font-sans font-medium">
              {filteredGallery[lightboxIndex].caption}
            </p>
            <span className="text-[11px] text-stone-500 font-mono block mt-1">Uploaded on {filteredGallery[lightboxIndex].date}</span>
          </div>

        </div>
      )}

    </div>
  );
}
