/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Image, Plus, Trash2, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { GalleryImage } from '../types';
import { formatAppDate } from '../utils/dateUtils';

interface GalleryTabProps {
  gallery: GalleryImage[];
  isAdmin: boolean;
  addGalleryImage: (img: Omit<GalleryImage, 'id'>) => any;
  deleteGalleryImage: (id: string) => void;
  approveGalleryImage?: (id: string) => void;
}

export default function GalleryTab({
  gallery,
  isAdmin,
  addGalleryImage,
  deleteGalleryImage,
  approveGalleryImage
}: GalleryTabProps) {
  // Filters states (Admins can also view Pending)
  const [activeCategory, setActiveCategory] = useState<'All' | 'Tournaments' | 'Courses' | 'Social' | 'Trophy' | 'Pending'>('All');
  
  // Modal light box state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  
  // Fields
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<'Tournaments' | 'Courses' | 'Social' | 'Trophy'>('Tournaments');

  const pendingCount = gallery.filter((img) => img.approved === false).length;

  const filteredGallery = gallery.filter((img) => {
    // Non-admins can only see approved images (approved could be true or undefined)
    if (!isAdmin && img.approved === false) {
      return false;
    }
    
    // Admin Pending tab
    if (isAdmin && activeCategory === 'Pending') {
      return img.approved === false;
    }
    
    // For general categories or 'All'
    if (activeCategory === 'All') {
      return isAdmin ? true : (img.approved !== false);
    }
    
    return img.category === activeCategory && (isAdmin || img.approved !== false);
  });

  const resetForm = () => {
    setImageUrl('');
    setCaption('');
    setCategory('Tournaments');
    setShowAddForm(false);
    setFormError('');
  };

  const validateAndGetDimensions = (urlOrDataUrl: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error("Failed to load image structure."));
      };
      img.src = urlOrDataUrl;
    });
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG/JPEG/GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      const img = new window.Image();
      img.onload = () => {
        if (img.width > 400 || img.height > 800) {
          setFormError(`Image dimensions (${img.width}x${img.height}px) exceed the 400x800 pixels limits. Please upload a smaller image.`);
          setImageUrl('');
        } else {
          setImageUrl(result);
          setFormError('');
        }
      };
      img.onerror = () => {
        setFormError('Failed to read image dimensions. Please try another file.');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !caption) {
      setFormError('Please fill in or upload both required fields (Image file/URL, Caption).');
      return;
    }

    setFormError('Verifying image dimensions...');
    
    try {
      const { width, height } = await validateAndGetDimensions(imageUrl);
      if (width > 400 || height > 800) {
        setFormError(`Image dimensions (${width}x${height}px) exceed the 400x800 pixels limit. Please use a smaller image.`);
        return;
      }
    } catch (err) {
      setFormError('Could not verify image dimensions. Please make sure the format is valid and readable.');
      return;
    }

    addGalleryImage({
      imageUrl,
      caption,
      category,
      date: new Date().toISOString().split('T')[0],
      approved: isAdmin ? true : false
    });

    if (isAdmin) {
      alert('New memory published to gallery board successfully.');
    } else {
      alert('Photo memory submitted for administrator review (awaiting approval).');
    }
    
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-stone-900 uppercase tracking-tight">
            Society Gallery
          </h1>
          <p className="text-stone-500 text-sm">
            Captured moments of scenic layouts, trophy presentations, and golf shot disasters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category tabs filters */}
          <div className="flex flex-wrap items-center gap-1 bg-white border border-stone-200 rounded-lg p-1 text-xs">
            {(isAdmin 
              ? ['All', 'Tournaments', 'Courses', 'Social', 'Trophy', 'Pending'] 
              : ['All', 'Tournaments', 'Courses', 'Social', 'Trophy']
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setLightboxIndex(null);
                  setActiveCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-md font-mono flex items-center gap-1 ${
                  activeCategory === cat 
                    ? 'bg-[#064e3b] text-white font-bold' 
                    : 'text-stone-650 hover:text-[#064e3b] hover:bg-stone-50'
                }`}
              >
                <span>{cat}</span>
                {cat === 'Pending' && pendingCount > 0 && (
                  <span className="bg-amber-400 text-stone-955 rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="bg-[#fbbf24] hover:bg-amber-400 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdmin ? 'Add Memory' : 'Upload Image'}</span>
          </button>
        </div>
      </div>

      {/* 2. Upload / Add Form Frame */}
      {showAddForm && (
        <div className="bg-stone-50 border-2 border-[#fbbf24]/40 rounded-2xl p-6 shadow-md animate-fadeIn">
          <h2 className="font-display font-bold text-base text-emerald-950 uppercase border-b border-stone-200 pb-2 mb-4">
            {isAdmin ? 'Upload New Photo Memory' : 'Submit Photo Memory (Admin Approved)'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-sm">
            {formError && (
              <div className="md:col-span-12 text-xs bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 font-mono">
                {formError}
              </div>
            )}

            {/* Upload Method Picker */}
            <div className="md:col-span-12 flex items-center gap-4 py-1">
              <span className="font-semibold text-stone-700 text-xs">Method:</span>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('file');
                  setImageUrl('');
                  setFormError('');
                }}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase transition-colors ${
                  uploadMode === 'file'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-200 text-stone-705 hover:bg-stone-300'
                }`}
              >
                Local File (Drag & Drop)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('url');
                  setImageUrl('');
                  setFormError('');
                }}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase transition-colors ${
                  uploadMode === 'url'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-200 text-stone-705 hover:bg-stone-300'
                }`}
              >
                Image Absolute URL
              </button>
            </div>

            {/* Local File Selector Drag Zone */}
            {uploadMode === 'file' ? (
              <div className="md:col-span-12">
                <label className="font-semibold text-stone-700 block mb-1.5">Select image (Max 400x800 pixels) *</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('gallery-file-picker')?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none min-h-[140px] ${
                    isDragging
                      ? 'border-[#fbbf24] bg-amber-50/45 scale-[0.99]'
                      : imageUrl 
                        ? 'border-emerald-600/50 bg-emerald-50/10'
                        : 'border-stone-300 hover:border-emerald-750 hover:bg-stone-100/40'
                  }`}
                >
                  <input
                    id="gallery-file-picker"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                  />
                  
                  {imageUrl ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <div className="relative">
                        <img 
                          src={imageUrl} 
                          alt="Local Upload Preview" 
                          className="max-h-32 rounded border border-stone-200 shadow-sm object-contain"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageUrl('');
                          }}
                          className="absolute -top-2 -right-2 bg-red-650 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                        >
                          <X className="w-3" />
                        </button>
                      </div>
                      <span className="text-xs text-emerald-800 font-mono font-bold">✓ Size compliant image loaded</span>
                    </div>
                  ) : (
                    <>
                      <Image className="w-8 h-8 text-stone-400" />
                      <div>
                        <span className="font-semibold text-emerald-800 underline">Click to upload</span> or drag and drop image file
                      </div>
                      <p className="text-[10px] text-stone-450 font-mono">
                        PNG, JPEG, GIF formats. Max width 400px and max height 800px.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* URL Upload Field */
              <div className="md:col-span-8 flex flex-col gap-1.5">
                <label className="font-semibold text-stone-700">Image absolute URL (Max 400x800 pixels) *</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => {
                    setImageUrl(e.target.value);
                    setFormError('');
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-800"
                />
                <p className="text-[11px] text-stone-400 font-mono">
                  Linked image cannot exceed 400x800 pixels. Verified on submission.
                </p>
              </div>
            )}

            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="font-semibold text-stone-700">Category Tag *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="bg-white border border-stone-200 rounded px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Tournaments">Tournaments</option>
                <option value="Courses font-mono">Courses</option>
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
                placeholder="Write a descriptive caption (who is in the photo, what tournament...)"
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
                {isAdmin ? 'Publish Direct' : 'Submit for Approval'}
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
            No memories matched category tag "{activeCategory}". Feel free to contribute the first upload!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredGallery.map((img, index) => {
            const isPending = img.approved === false;
            return (
              <div
                key={img.id}
                onClick={() => setLightboxIndex(index)}
                className={`bg-white rounded-2xl border p-3 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isPending 
                    ? 'border-amber-300 bg-amber-50/20' 
                    : 'border-stone-150'
                }`}
                id={`gallery-card-${img.id}`}
              >
                {/* Image box */}
                <div>
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
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                      <span className="bg-stone-900/95 text-[#fbbf24] text-[8px] uppercase tracking-widest font-black font-mono border border-stone-800 shadow px-2 py-0.5 rounded mr-auto">
                        {img.category}
                      </span>
                      {isPending && (
                        <span className="bg-amber-550 text-white text-[8px] uppercase tracking-wider font-extrabold font-mono shadow px-2 py-0.5 rounded border border-amber-400">
                          Awaiting Approval 🟡
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Caption and meta */}
                  <div className="pt-3 px-1 flex items-start justify-between gap-3 text-left">
                    <div className="space-y-1">
                      <p className="text-stone-800 font-sans text-xs font-semibold leading-relaxed line-clamp-3">
                        {img.caption}
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono block">Captured {formatAppDate(img.date)}</span>
                    </div>

                    {isAdmin && !isPending && (
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

                {/* Approve/Reject Controls for Admin */}
                {isAdmin && isPending && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-amber-200/50 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        approveGalleryImage?.(img.id);
                        alert('Image memory has been successfully approved and published!');
                      }}
                      className="flex-1 bg-emerald-850 hover:bg-emerald-900 text-white font-bold text-[10px] py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors border border-emerald-700"
                    >
                      Approve ✓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGalleryImage(img.id);
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-650 p-1.5 rounded-lg border border-red-200 transition-colors flex items-center justify-center"
                      title="Decline & Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>
            );
          })}
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
          <div className="flex-1 flex items-center justify-between gap-2 max-w-7xl mx-auto w-full relative z-40 select-none font-sans">
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
              <ChevronRight className="w-6 h-6 animate-fadeIn" />
            </button>
          </div>

          {/* Subtitle Caption */}
          <div className="p-6 bg-stone-950/90 text-center border-t border-stone-905 max-w-3xl mx-auto w-full rounded-xl relative z-40 mb-4 select-none">
            <span className="bg-[#fbbf24] text-stone-955 text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded inline-block mb-2">
              📸 {filteredGallery[lightboxIndex].category} memory
            </span>
            <p className="text-stone-200 text-sm sm:text-base font-sans font-medium">
              {filteredGallery[lightboxIndex].caption}
            </p>
            <span className="text-[11px] text-stone-500 font-mono block mt-1">Uploaded on {formatAppDate(filteredGallery[lightboxIndex].date)}</span>
          </div>

        </div>
      )}

    </div>
  );
}
