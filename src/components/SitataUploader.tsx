'use client';

import React, { useState } from 'react';
import { SitataFileItem } from '@/lib/types';
import { renderSingleImageCanvas } from '@/lib/imageMerger';
import { 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Download, 
  Eye, 
  Plus, 
  Upload,
  FileCheck
} from 'lucide-react';

interface Props {
  items: SitataFileItem[];
  onChange: (items: SitataFileItem[]) => void;
  kecamatan: string;
  kelurahan: string;
  tim: string;
  dateStr: string;
}

export const SitataUploader: React.FC<Props> = ({
  items,
  onChange,
  kecamatan,
  kelurahan,
  tim,
  dateStr,
}) => {
  const [activeModalImg, setActiveModalImg] = useState<string | null>(null);

  const handleAddItem = () => {
    if (items.length >= 10) {
      alert('Maksimum 10 berkas SITATA per kecamatan!');
      return;
    }
    const newItem: SitataFileItem = {
      id: Math.random().toString(36).substring(2, 9),
      file: null,
      previewUrl: null,
      pdfBlob: null,
      pdfBase64: null,
      status: 'idle',
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFileChange = async (index: number, file: File | null) => {
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert(`Ukuran berkas "${file.name}" melebihi batas 12 MB!`);
      return;
    }

    const updated = [...items];
    const current = { ...updated[index], file };

    // Handle PDF direct upload
    if (file.type === 'application/pdf') {
      current.status = 'ready';
      current.pdfBlob = file;
      const reader = new FileReader();
      reader.onload = () => {
        current.pdfBase64 = reader.result as string;
        current.previewUrl = null;
        updated[index] = current;
        onChange(updated);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Handle Image: render to branded template and convert to PDF immediately!
    const objectUrl = URL.createObjectURL(file);
    current.previewUrl = objectUrl;
    current.status = 'rendering';
    updated[index] = current;
    onChange(updated);

    try {
      const result = await renderSingleImageCanvas(objectUrl, {
        type: 'SITATA',
        mode: 'single',
        kecamatan: kecamatan || 'Kecamatan',
        kelurahan: kelurahan || 'Kelurahan',
        tim: tim || 'TIM',
        dateStr: dateStr || new Date().toLocaleDateString('id-ID'),
      });

      current.previewUrl = result.dataUrl;
      current.pdfBlob = result.pdfBlob;
      current.pdfBase64 = result.pdfBase64;
      current.status = 'ready';
    } catch (err) {
      console.error('Error rendering SITATA PDF:', err);
      current.status = 'error';
    }

    updated[index] = current;
    onChange(updated);
  };

  const handleDownloadPdf = (item: SitataFileItem, idx: number) => {
    if (!item.pdfBlob) return;
    const url = URL.createObjectURL(item.pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    const cleanKec = (kecamatan || 'Kecamatan').replace(/\s+/g, '_');
    const cleanKel = (kelurahan || 'Kelurahan').replace(/\s+/g, '_');
    a.download = `SITATA_${cleanKec}_${cleanKel}_${idx + 1}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border-2 border-brutal bg-white p-4 shadow-neo">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-brutal pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl border-2 border-brutal bg-pastel-matcha">
            <FileText className="w-5 h-5 text-brutal" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-brutal flex items-center gap-2">
              Upload SITATA
              <span className="pill-badge text-[10px] py-0 px-2 bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold">
                {items.length}/10 Berkas
              </span>
            </h4>
            <p className="text-xs text-gray-600 font-medium">
              Cukup 1 berkas per dokumen (JPG/PNG/PDF). Otomatis dikonversi ke format <b>PDF Arsip</b>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          disabled={items.length >= 10}
          className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal px-3 py-1.5 text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Tambah Berkas SITATA
        </button>
      </div>

      {/* Info Notice */}
      <div className="bg-canvas border-2 border-brutal rounded-xl p-2.5 mb-4 text-xs font-semibold flex items-center gap-2 text-gray-700">
        <span className="text-base">📄</span>
        <span>
          Format output: <b>PDF</b> otomatis tersimpan di folder <b>SITATA</b> Google Drive.
        </span>
      </div>

      {/* List of SITATA Items */}
      {items.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
          <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Belum ada berkas SITATA
          </p>
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2 neo-btn bg-white hover:bg-gray-100 text-brutal px-3 py-1.5 text-xs font-black inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Berkas Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="border-2 border-brutal rounded-xl p-3 bg-gray-50 relative shadow-neo-sm flex flex-col gap-2.5"
            >
              {/* Item Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="pill-badge bg-brutal text-white text-[10px]">
                  SITATA #{idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  {item.status === 'rendering' && (
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                      ⏳ Memproses PDF...
                    </span>
                  )}
                  {item.status === 'ready' && (
                    <span className="text-xs font-extrabold text-emerald-800 bg-pastel-matcha px-2.5 py-0.5 rounded-full border border-brutal flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PDF Siap
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
                    title="Hapus berkas ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload Slot */}
              {!item.file ? (
                <label className="border-2 border-dashed border-gray-300 hover:border-brutal bg-white hover:bg-pastel-matcha-light/40 rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer transition text-center p-3">
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-gray-700">Pilih Foto atau Dokumen SITATA</span>
                  <span className="text-[10px] text-gray-400">JPG, PNG, PDF (Maks 12MB)</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(idx, e.target.files?.[0] || null)}
                  />
                </label>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                    {item.previewUrl ? (
                      <div
                        onClick={() => setActiveModalImg(item.previewUrl)}
                        className="w-16 h-14 rounded-lg border border-brutal overflow-hidden bg-black flex items-center justify-center cursor-pointer flex-shrink-0 hover:opacity-90 transition"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt="SITATA Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-14 rounded-lg border border-brutal bg-emerald-50 flex flex-col items-center justify-center flex-shrink-0 text-emerald-800">
                        <FileCheck className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase">PDF</span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <span className="text-xs font-black text-brutal block truncate max-w-[200px]">
                        {item.file.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold block">
                        {(item.file.size / 1024).toFixed(1)} KB • Otomatis jadi PDF
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    {item.previewUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveModalImg(item.previewUrl)}
                        className="neo-btn bg-white hover:bg-gray-100 text-brutal text-[11px] px-2.5 py-1.5 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    )}

                    {item.pdfBlob && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(item, idx)}
                        className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal text-[11px] px-2.5 py-1.5 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh PDF
                      </button>
                    )}

                    <label className="neo-btn bg-white hover:bg-gray-100 text-brutal text-[11px] px-2.5 py-1.5 flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> Ganti
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileChange(idx, e.target.files?.[0] || null)}
                      />
                    </label>
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
                📄 Pratinjau Dokumen SITATA
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
