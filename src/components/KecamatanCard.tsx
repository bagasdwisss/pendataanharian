'use client';

import React from 'react';
import { KecamatanData, ImagePair, SitataFileItem } from '@/lib/types';
import { ImagePairMerger } from './ImagePairMerger';
import { SitataUploader } from './SitataUploader';
import { 
  KANTAH_KECAMATAN_LIST, 
  KELURAHAN_BY_KECAMATAN, 
  PASTEL_THEMES 
} from '@/lib/kantahData';
import { 
  MapPin, 
  Building2, 
  Trash2, 
  Copy, 
  Hash, 
  CheckCircle2, 
  Plus, 
  Minus,
  Sparkles
} from 'lucide-react';

interface Props {
  index: number;
  data: KecamatanData;
  onChange: (updated: KecamatanData) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
  tim: string;
  hariTanggal: string;
}

export const KecamatanCard: React.FC<Props> = ({
  index,
  data,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
  tim,
  hariTanggal,
}) => {
  const theme = PASTEL_THEMES[index % PASTEL_THEMES.length];
  const kelurahanSuggestions = data.kecamatan ? KELURAHAN_BY_KECAMATAN[data.kecamatan] || [] : [];

  const handleFieldChange = (field: keyof KecamatanData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleMetricStep = (field: keyof KecamatanData, step: number) => {
    const current = Number(data[field]) || 0;
    const nextVal = Math.max(0, current + step);
    handleFieldChange(field, nextVal);
  };

  // Subtotal for this kecamatan
  const subtotal = 
    (Number(data.berhasilPlotting) || 0) +
    (Number(data.digitasi) || 0) +
    (Number(data.overlap) || 0) +
    (Number(data.pemecahan) || 0) +
    (Number(data.belumTeridentifikasi) || 0) +
    (Number(data.dimatikan) || 0) +
    (Number(data.diluarBatasAdministrasi) || 0);

  const metricFields = [
    { key: 'berhasilPlotting', label: 'Berhasil Plotting', color: 'bg-emerald-50 text-emerald-800 border-emerald-400', badge: 'bg-emerald-600' },
    { key: 'digitasi', label: 'Digitasi', color: 'bg-blue-50 text-blue-800 border-blue-400', badge: 'bg-blue-600' },
    { key: 'overlap', label: 'Overlap', color: 'bg-amber-50 text-amber-800 border-amber-400', badge: 'bg-amber-600' },
    { key: 'pemecahan', label: 'Pemecahan', color: 'bg-purple-50 text-purple-800 border-purple-400', badge: 'bg-purple-600' },
    { key: 'belumTeridentifikasi', label: 'Belum Teridentifikasi', color: 'bg-rose-50 text-rose-800 border-rose-400', badge: 'bg-rose-600' },
    { key: 'dimatikan', label: 'Dimatikan', color: 'bg-gray-100 text-gray-800 border-gray-400', badge: 'bg-gray-700' },
    { key: 'diluarBatasAdministrasi', label: 'Diluar Batas Administrasi', color: 'bg-orange-50 text-orange-800 border-orange-400', badge: 'bg-orange-600' },
  ] as const;

  return (
    <div className={`rounded-3xl border-3 border-brutal ${theme.bg} p-4 sm:p-6 shadow-neo-lg transition-all relative mb-6 sm:mb-8`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b-2 border-brutal pb-3 sm:pb-4 mb-4 sm:mb-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="pill-badge bg-brutal text-white text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pastel-butter" /> KECAMATAN #{index + 1}
          </span>
          <span className="text-xs sm:text-sm font-black text-brutal break-words">
            {data.kecamatan ? data.kecamatan : 'Nama Kecamatan Belum Dipilih'}
            {data.kelurahan ? ` • Kel. ${data.kelurahan}` : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Subtotal badge */}
          <span className="px-2.5 sm:px-3 py-1 bg-white border-2 border-brutal rounded-xl text-[11px] sm:text-xs font-black text-brutal shadow-neo-sm">
            Subtotal: <span className="text-xs sm:text-sm font-extrabold text-blue-700">{subtotal}</span> Bidang
          </span>

          <div className="flex items-center gap-1.5">
            {/* Duplicate button */}
            <button
              type="button"
              onClick={onDuplicate}
              className="neo-btn bg-white hover:bg-gray-100 text-brutal px-2.5 py-1 text-[11px] sm:text-xs font-bold flex items-center gap-1"
              title="Duplikasi baris data ini"
            >
              <Copy className="w-3.5 h-3.5" /> Salin
            </button>

            {/* Delete button */}
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="neo-btn bg-red-400 hover:bg-red-500 text-white px-2.5 py-1 text-[11px] sm:text-xs font-bold flex items-center gap-1"
                title="Hapus kecamatan ini"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: Kecamatan & Kelurahan Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mb-5 sm:mb-6">
        {/* Kecamatan */}
        <div className="bg-white rounded-2xl border-2 border-brutal p-3.5 sm:p-4 shadow-neo-sm">
          <label className="block text-[11px] sm:text-xs font-black uppercase text-brutal mb-1.5 tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            1. Nama Kecamatan
          </label>
          <div className="space-y-2">
            <select
              value={data.kecamatan}
              onChange={(e) => handleFieldChange('kecamatan', e.target.value)}
              className="w-full neo-input px-3 py-2 text-xs sm:text-sm font-bold text-brutal"
            >
              <option value="">-- Pilih Kecamatan di Kota Medan --</option>
              {KANTAH_KECAMATAN_LIST.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <span className="text-[10px] font-black uppercase text-gray-500 shrink-0">Atau ketik manual:</span>
              <input
                type="text"
                value={data.kecamatan}
                onChange={(e) => handleFieldChange('kecamatan', e.target.value)}
                placeholder="Ketik manual nama kecamatan..."
                className="w-full sm:flex-1 neo-input px-2.5 py-1 text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Kelurahan */}
        <div className="bg-white rounded-2xl border-2 border-brutal p-3.5 sm:p-4 shadow-neo-sm">
          <label className="block text-[11px] sm:text-xs font-black uppercase text-brutal mb-1.5 tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            2. Nama Kelurahan
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={data.kelurahan}
              onChange={(e) => handleFieldChange('kelurahan', e.target.value)}
              placeholder="Contoh: Helvetia Tengah, Nelayan Indah, dll..."
              className="w-full neo-input px-3 py-2 text-xs sm:text-sm font-bold text-brutal"
            />
            {kelurahanSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-[10px] font-black uppercase text-gray-500">Saran:</span>
                {kelurahanSuggestions.slice(0, 4).map((kel) => (
                  <button
                    key={kel}
                    type="button"
                    onClick={() => handleFieldChange('kelurahan', kel)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-yellow-200 border border-brutal rounded-md font-bold text-brutal text-[10px]"
                  >
                    {kel}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Metrics Bento Grid (7 Data Angka) */}
      <div className="mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2">
            <span className="pill-badge bg-brutal text-white text-[9px] sm:text-[10px]">
              <Hash className="w-3 h-3 text-pastel-butter" /> INDIKATOR PROGRESS
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold text-brutal">
              Data Angka Hasil Plotting & Validasi
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-gray-700">
            Klik tombol +/- untuk ubah cepat
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {metricFields.map((field, idx) => {
            const val = Number(data[field.key]) || 0;
            // On mobile 2-col layout, make 7th item span 2 cols so there is no awkward blank cell
            const isLastOddOnMobile = idx === 6 ? 'col-span-2 sm:col-span-1' : '';
            return (
              <div
                key={field.key}
                className={`bg-white rounded-2xl border-2 border-brutal p-2.5 sm:p-3 shadow-neo-sm flex flex-col justify-between ${isLastOddOnMobile}`}
              >
                <div className="min-h-[32px] sm:min-h-[36px]">
                  <span className="text-[10px] font-black uppercase leading-tight tracking-wider text-gray-700 block line-clamp-2">
                    {field.label}
                  </span>
                </div>

                <div className="my-1.5 sm:my-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    value={val === 0 ? '' : val}
                    onChange={(e) =>
                      handleFieldChange(
                        field.key,
                        e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
                      )
                    }
                    placeholder="0"
                    className="w-full text-center text-xl sm:text-2xl font-black text-brutal bg-pastel-butter-light/40 border-2 border-brutal rounded-xl py-1 shadow-neo-sm focus:outline-none focus:bg-pastel-butter"
                  />
                </div>

                {/* Quick Step Buttons */}
                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleMetricStep(field.key, -1)}
                    className="neo-btn bg-gray-100 hover:bg-gray-200 text-brutal py-1 text-xs font-black flex items-center justify-center rounded-lg shadow-none border min-h-[32px]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMetricStep(field.key, 1)}
                    className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal py-1 text-xs font-black flex items-center justify-center rounded-lg shadow-none border min-h-[32px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Upload SITATA (1 berkas) & Upload KKP (Sebelum & Sesudah / Tunggal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* SITATA (1 Berkas per dokumen) */}
        <SitataUploader
          items={data.sitataFiles || []}
          onChange={(items) => handleFieldChange('sitataFiles', items)}
          kecamatan={data.kecamatan}
          kelurahan={data.kelurahan}
          tim={tim}
          dateStr={hariTanggal}
        />

        {/* KKP (Sebelum & Sesudah atau Tunggal) */}
        <ImagePairMerger
          title="Upload KKP"
          type="KKP"
          pairs={data.kkpPairs || []}
          onChange={(pairs) => handleFieldChange('kkpPairs', pairs)}
          kecamatan={data.kecamatan}
          kelurahan={data.kelurahan}
          tim={tim}
          dateStr={hariTanggal}
        />
      </div>
    </div>
  );
};
