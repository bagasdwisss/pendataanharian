'use client';

import React, { useState } from 'react';
import { ImagePair } from '@/lib/types';
import { mergeBeforeAfterImage, renderSingleImageCanvas } from '@/lib/imageMerger';
import { 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  Download, 
  Image as ImageIcon,
  Eye,
  Plus,
  FileCheck
} from 'lucide-react';

interface Props {
  title?: string;
  type?: 'KKP' | 'SITATA';
  pairs: ImagePair[];
  onChange: (pairs: ImagePair[]) => void;
  kecamatan: string;
  kelurahan: string;
  tim: string;
  dateStr: string;
}

export const ImagePairMerger: React.FC<Props> = ({
  title = 'Upload KKP',
  type = 'KKP',
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
      alert('Maksimum 10 pasang berkas per kategori!');
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
      pdfBlob: null,
      pdfBase64: null,
      status: 'idle',
      mode: undefined,
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

    if (file.size > 12 * 1024 * 1024) {
      alert(`Ukuran berkas "${file.name}" melebihi batas 12 MB!`);
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

    current.status = 'merging';
    updated[index] = current;
    onChange(updated);

    try {
      const commonOpts = {
        kecamatan: kecamatan || 'Kecamatan',
        kelurahan: kelurahan || 'Kelurahan',
        tim: tim || 'TIM',
        dateStr: dateStr || new Date().toLocaleDateString('id-ID'),
      };

      // Case 1: Both Sebelum & Sesudah exist -> Merge side-by-side
      if (current.beforePreview && current.afterPreview) {
        const result = await mergeBeforeAfterImage(
          current.beforePreview,
          current.afterPreview,
          {
            type: 'KKP',
            ...commonOpts,
          }
        );
        current.mergedUrl = result.dataUrl;
        current.mergedBlob = result.blob;
        current.pdfBlob = result.pdfBlob;
        current.pdfBase64 = result.pdfBase64;
        current.mode = 'both';
        current.status = 'ready';
      }
      // Case 2: Only Sebelum exists
      else if (current.beforePreview && !current.afterPreview) {
        const result = await renderSingleImageCanvas(current.beforePreview, {
          type: 'KKP',
          mode: 'before',
          ...commonOpts,
        });
        current.mergedUrl = result.dataUrl;
        current.mergedBlob = result.blob;
        current.pdfBlob = result.pdfBlob;
        current.pdfBase64 = result.pdfBase64;
        current.mode = 'before_only';
        current.status = 'ready';
      }
      // Case 3: Only Sesudah exists
      else if (!current.beforePreview && current.afterPreview) {
        const result = await renderSingleImageCanvas(current.afterPreview, {
          type: 'KKP',
          mode: 'after',
          ...commonOpts,
        });
        current.mergedUrl = result.dataUrl;
        current.mergedBlob = result.blob;
        current.pdfBlob = result.pdfBlob;
        current.pdfBase64 = result.pdfBase64;
        current.mode = 'after_only';
        current.status = 'ready';
      } else {
        current.status = 'idle';
      }
    } catch (err) {
      console.error('Error rendering KKP images/PDF:', err);
      current.status = 'error';
    }

    updated[index] = current;
    onChange(updated);
  };

  const handleDownloadPdf = (pair: ImagePair, idx: number) => {
    if (!pair.pdfBlob) return;
    const cleanKec = (kecamatan || 'Kec').replace(/\s+/g, '_');
    const cleanKel = (kelurahan || 'Kel').replace(/\s+/g, '_');
    let prefix = 'KKP_GABUNGAN';
    if (pair.mode === 'before_only') prefix = 'KKP_SEBELUM';
    if (pair.mode === 'after_only') prefix = 'KKP_SESUDAH';

    const url = URL.createObjectURL(pair.pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}_${cleanKec}_${cleanKel}_${idx + 1}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border-2 border-brutal bg-white p-4 shadow-neo">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-brutal pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl border-2 border-brutal bg-pastel-butter">
            <Layers className="w-5 h-5 text-brutal" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-brutal flex items-center gap-2">
              {title}
              <span className="pill-badge text-[10px] py-0 px-2 bg-yellow-100 text-yellow-900 border border-yellow-400 font-bold">
                {pairs.length}/10 Berkas
              </span>
            </h4>
            <p className="text-xs text-gray-600 font-medium">
              Foto <b>Sebelum</b> & <b>Sesudah</b> otomatis digabung jadi PDF. <i>(Jika hanya ada 1 foto tetap diproses resmi ke PDF).</i>
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
          Tambah Dokumentasi KKP
        </button>
      </div>

      {/* Notice info */}
      <div className="bg-canvas border-2 border-brutal rounded-xl p-2.5 mb-4 text-xs font-semibold flex items-center gap-2 text-gray-700">
        <span className="text-base">⚡</span>
        <span>
          Format output: <b>PDF</b> otomatis tersimpan di folder <b>KKP</b> Google Drive. Baik sepasang maupun foto tunggal tetap terproses aman.
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
            Upload Berkas Pertama
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
                      ⏳ Memproses PDF...
                    </span>
                  )}
                  {pair.status === 'ready' && pair.mode === 'both' && (
                    <span className="text-xs font-extrabold text-emerald-800 bg-pastel-matcha px-2.5 py-0.5 rounded-full border border-brutal flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil Digabung (PDF)
                    </span>
                  )}
                  {pair.status === 'ready' && pair.mode === 'before_only' && (
                    <span className="text-xs font-extrabold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-rose-600" /> Sebelum Saja (PDF Siap)
                    </span>
                  )}
                  {pair.status === 'ready' && pair.mode === 'after_only' && (
                    <span className="text-xs font-extrabold text-blue-800 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-300 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" /> Sesudah Saja (PDF Siap)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePair(idx)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
                    title="Hapus dokumentasi ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload Slots: Sebelum & Sesudah */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Sebelum */}
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
                      <span className="text-[10px] text-gray-400">JPG, PNG (Opsional bila ada)</span>
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

                {/* 2. Sesudah */}
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
                      <span className="text-[10px] text-gray-400">JPG, PNG (Opsional bila ada)</span>
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

              {/* Rendered Preview & PDF Actions */}
              {pair.mergedUrl && (
                <div className="mt-3 pt-2.5 border-t border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold text-brutal flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {pair.mode === 'both' ? 'Hasil Penggabungan Otomatis:' : 'Hasil Olah Dokumen Tunggal:'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalImg(pair.mergedUrl)}
                        className="neo-btn bg-white hover:bg-gray-100 text-brutal text-[11px] px-2.5 py-1 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                      {pair.pdfBlob && (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(pair, idx)}
                          className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal text-[11px] px-2.5 py-1 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Unduh PDF
                        </button>
                      )}
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

      {/* Modal Zoom Preview */}
      {activeModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModalImg(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl border-4 border-brutal p-2 shadow-neo-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-brutal px-2">
              <span className="font-extrabold text-sm text-brutal flex items-center gap-2">
                📄 Pratinjau Dokumen KKP
              </span>
              <button
                type="button"
                onClick={() => setActiveModalImg(null)}
                className="neo-btn bg-red-400 hover:bg-red-500 text-white text-xs px-2.5 py-1 font-black"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] flex items-center justify-center bg-gray-900 rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeModalImg}
                alt="Zoom"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
