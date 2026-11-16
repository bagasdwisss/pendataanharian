'use client';

import React, { useState, useRef } from 'react';
import { ImagePair } from '@/lib/types';
import { mergeBeforeAfterImage } from '@/lib/imageMerger';
import { 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  ExternalLink, 
  Download, 
  Image as ImageIcon,
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';

interface Props {
  title: 'Upload SITATA' | 'Upload KKP';
  type: 'SITATA' | 'KKP';
  pairs: ImagePair[];
  onChange: (pairs: ImagePair[]) => void;
  kecamatan: string;
  kelurahan: string;
  tim: string;
  dateStr: string;
}

export const ImagePairMerger: React.FC<Props> = ({
  title,
  type,
  pairs,
  onChange,
  kecamatan,
  kelurahan,
  tim,
  dateStr,
}) => {
  const [activeModalImg, setActiveModalImg] = useState<string | null>(null);

  const handleAddPair = () => {
    if (pairs.length >= 10) {
      alert('Maksimum 10 pasang file per kategori!');
      return;
    }
    const newPair: ImagePair = {
      id: Math.random().toString(36).substring(2, 9),
      beforeFile: null,
      beforePreview: null,
      afterFile: null,
      afterPreview: null,
      mergedUrl: null,
      mergedBlob: null,
      status: 'idle',
    };
    onChange([...pairs, newPair]);
  };

  const handleRemovePair = (index: number) => {
    const updated = pairs.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFileChange = async (
    index: number,
    slot: 'before' | 'after',
    file: File | null
  ) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(`Ukuran file "${file.name}" melebihi batas 10 MB!`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const updated = [...pairs];
    const current = { ...updated[index] };

    if (slot === 'before') {
      current.beforeFile = file;
      current.beforePreview = previewUrl;
    } else {
      current.afterFile = file;
      current.afterPreview = previewUrl;
    }

    // Check if both files are present to trigger auto-merge
    if (current.beforePreview && current.afterPreview) {
      current.status = 'merging';
      updated[index] = current;
      onChange(updated);

      try {
        const result = await mergeBeforeAfterImage(
          current.beforePreview,
          current.afterPreview,
          {
            type,
            kecamatan: kecamatan || 'Kecamatan',
            kelurahan: kelurahan || 'Kelurahan',
            tim: tim || 'TIM',
            dateStr: dateStr || new Date().toLocaleDateString('id-ID'),
          }
        );
        current.mergedUrl = result.dataUrl;
        current.mergedBlob = result.blob;
        current.status = 'ready';
      } catch (err) {
        console.error('Error merging images:', err);
        current.status = 'error';
      }
    } else {
      current.status = 'idle';
    }

    updated[index] = current;
    onChange(updated);
  };

  return (
    <div className="rounded-2xl border-2 border-brutal bg-white p-4 shadow-neo">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-brutal pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl border-2 border-brutal ${type === 'SITATA' ? 'bg-pastel-matcha' : 'bg-pastel-butter'}`}>
            <Layers className="w-5 h-5 text-brutal" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-brutal flex items-center gap-2">
              {title}
              <span className="pill-badge text-[10px] py-0 px-2">
                {pairs.length}/10 Pasang
              </span>
            </h4>
            <p className="text-xs text-gray-600 font-medium">
              Otomatis menggabungkan foto <b>Sebelum</b> & <b>Sesudah</b> jadi satu file terverifikasi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddPair}
          disabled={pairs.length >= 10}
          className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal px-3 py-1.5 text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Tambah Pasangan Foto
        </button>
      </div>

      {/* Notice info */}
      <div className="bg-canvas border-2 border-brutal rounded-xl p-2.5 mb-4 text-xs font-semibold flex items-center gap-2 text-gray-700">
        <span className="text-base">⚡</span>
        <span>
          Maks 10 pasang file (format JPG/PNG, maks 10 MB/file). Sistem otomatis menyatukan gambar berdampingan untuk arsip Google Drive.
        </span>
      </div>

      {/* List of pairs */}
      {pairs.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
          <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Belum ada dokumentasi {type}
          </p>
          <button
            type="button"
            onClick={handleAddPair}
            className="mt-2 neo-btn bg-white hover:bg-gray-100 text-brutal px-3 py-1.5 text-xs font-black inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Foto Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pairs.map((pair, idx) => (
            <div
              key={pair.id}
              className="border-2 border-brutal rounded-xl p-3 bg-gray-50 relative shadow-neo-sm"
            >
              {/* Pair Title Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
                <span className="pill-badge bg-brutal text-white text-[10px]">
                  {type} #{idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  {pair.status === 'merging' && (
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                      ⏳ Menggabungkan Foto...
                    </span>
                  )}
                  {pair.status === 'ready' && (
                    <span className="text-xs font-extrabold text-emerald-700 bg-pastel-matcha px-2 py-0.5 rounded-full border border-brutal flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil Digabung
                    </span>
                  )}
                  {pair.status === 'idle' && (pair.beforeFile || pair.afterFile) && !(pair.beforeFile && pair.afterFile) && (
                    <span className="text-xs font-extrabold text-blue-700 bg-sky-100 px-2 py-0.5 rounded-full border border-blue-400 flex items-center gap-1">
                      📷 1 Foto Terlampir (Siap Kirim)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePair(idx)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
                    title="Hapus pasang foto ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload Slots: Sebelum & Sesudah */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Sebelum */}
                <div className="border-2 border-dashed border-red-300 rounded-lg p-2.5 bg-red-50/40 relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black uppercase text-red-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                      1. Foto Sebelum
                    </span>
                    {pair.beforeFile && (
                      <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                        {pair.beforeFile.name}
                      </span>
                    )}
                  </div>

                  {pair.beforePreview ? (
                    <div className="relative group rounded-md overflow-hidden border border-brutal bg-black h-28 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pair.beforePreview}
                        alt="Sebelum"
                        className="h-full w-full object-cover"
                      />
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-white text-xs font-bold gap-1">
                        <Upload className="w-4 h-4" /> Ganti
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange(idx, 'before', e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-brutal bg-white hover:bg-pastel-pink-light/30 rounded-md h-28 flex flex-col items-center justify-center cursor-pointer transition text-center p-2">
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs font-bold text-gray-700">Pilih Foto Sebelum</span>
                      <span className="text-[10px] text-gray-400">JPG, PNG (Maks 10MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileChange(idx, 'before', e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  )}
                </div>

                {/* Sesudah */}
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-2.5 bg-emerald-50/40 relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black uppercase text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      2. Foto Sesudah
                    </span>
                    {pair.afterFile && (
                      <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                        {pair.afterFile.name}
                      </span>
                    )}
                  </div>

                  {pair.afterPreview ? (
                    <div className="relative group rounded-md overflow-hidden border border-brutal bg-black h-28 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pair.afterPreview}
                        alt="Sesudah"
                        className="h-full w-full object-cover"
                      />
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-white text-xs font-bold gap-1">
                        <Upload className="w-4 h-4" /> Ganti
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange(idx, 'after', e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-brutal bg-white hover:bg-pastel-matcha-light/40 rounded-md h-28 flex flex-col items-center justify-center cursor-pointer transition text-center p-2">
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs font-bold text-gray-700">Pilih Foto Sesudah</span>
                      <span className="text-[10px] text-gray-400">JPG, PNG (Maks 10MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileChange(idx, 'after', e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Merged Result Preview */}
              {pair.mergedUrl && (
                <div className="mt-3 pt-2.5 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-brutal flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Hasil Penggabungan Otomatis:
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalImg(pair.mergedUrl)}
                        className="neo-btn bg-white hover:bg-gray-100 text-brutal text-[11px] px-2.5 py-1 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Ukuran Penuh
                      </button>
                      <a
                        href={pair.mergedUrl}
                        download={`${type}_${kecamatan || 'Kec'}_${kelurahan || 'Kel'}_${idx + 1}.jpg`}
                        className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal text-[11px] px-2.5 py-1 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh
                      </a>
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveModalImg(pair.mergedUrl)}
                    className="cursor-pointer border-2 border-brutal rounded-lg overflow-hidden bg-black max-h-36 flex items-center justify-center hover:opacity-95 transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pair.mergedUrl}
                      alt="Hasil Gabungan"
                      className="w-full object-contain max-h-36"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {activeModalImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setActiveModalImg(null)}
        >
          <div 
            className="max-w-4xl w-full bg-white rounded-2xl border-4 border-brutal p-3 shadow-neo-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-brutal">
              <span className="font-extrabold text-sm text-brutal">
                Pratinjau Hasil Gabungan {type}
              </span>
              <button
                type="button"
                onClick={() => setActiveModalImg(null)}
                className="neo-btn bg-pastel-pink text-brutal px-2.5 py-0.5 text-xs font-black"
              >
                Tutup (✕)
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeModalImg}
              alt="Pratinjau Penuh"
              className="w-full max-h-[75vh] object-contain rounded-xl border-2 border-brutal"
            />
          </div>
        </div>
      )}
    </div>
  );
};
