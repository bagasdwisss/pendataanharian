'use client';

import React from 'react';
import { Calendar, Users, BarChart3, Clock, Sparkles } from 'lucide-react';
import { TIM_PRESETS } from '@/lib/kantahData';
import { KecamatanData } from '@/lib/types';

interface Props {
  hariTanggal: string;
  setHariTanggal: (val: string) => void;
  tim: string;
  setTim: (val: string) => void;
  customTim: string;
  setCustomTim: (val: string) => void;
  kecamatanList: KecamatanData[];
}

export const HeaderBento: React.FC<Props> = ({
  hariTanggal,
  setHariTanggal,
  tim,
  setTim,
  customTim,
  setCustomTim,
  kecamatanList,
}) => {
  // Aggregate stats across all kecamatan
  const totalPlotting = kecamatanList.reduce((acc, curr) => acc + (Number(curr.berhasilPlotting) || 0), 0);
  const totalDigitasi = kecamatanList.reduce((acc, curr) => acc + (Number(curr.digitasi) || 0), 0);
  const totalOverlap = kecamatanList.reduce((acc, curr) => acc + (Number(curr.overlap) || 0), 0);
  const totalPemecahan = kecamatanList.reduce((acc, curr) => acc + (Number(curr.pemecahan) || 0), 0);
  const totalBelum = kecamatanList.reduce((acc, curr) => acc + (Number(curr.belumTeridentifikasi) || 0), 0);
  const totalDimatikan = kecamatanList.reduce((acc, curr) => acc + (Number(curr.dimatikan) || 0), 0);
  const totalDiluar = kecamatanList.reduce((acc, curr) => acc + (Number(curr.diluarBatasAdministrasi) || 0), 0);
  const grandTotal = totalPlotting + totalDigitasi + totalOverlap + totalPemecahan + totalBelum + totalDimatikan + totalDiluar;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-5 mb-6">
      {/* Card 1: Hari & Tanggal (Pastel Butter Yellow) */}
      <div className="col-span-1 lg:col-span-4 rounded-2xl border-2 border-brutal bg-pastel-butter p-4 sm:p-5 shadow-neo relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="pill-badge bg-brutal text-pastel-butter text-[10px] sm:text-xs">
            <Calendar className="w-3.5 h-3.5" /> JADWAL LAPORAN
          </span>
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-brutal/70 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Hari Ini
          </span>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-black uppercase text-brutal mb-1.5 tracking-wider">
            Hari & Tanggal Laporan
          </label>
          <input
            type="text"
            value={hariTanggal}
            onChange={(e) => setHariTanggal(e.target.value)}
            placeholder="Contoh: Jumat, 13 November 2026 atau 13/11/2026"
            className="w-full neo-input px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold text-brutal"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold text-brutal/80 bg-white/70 rounded-xl p-2 border border-brutal/30">
          <span>Format: <b>DD/MM/YYYY</b></span>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              const day = days[now.getDay()];
              const d = String(now.getDate()).padStart(2, '0');
              const m = String(now.getMonth() + 1).padStart(2, '0');
              const y = now.getFullYear();
              setHariTanggal(`${day}, ${d}/${m}/${y}`);
            }}
            className="text-[10px] font-black uppercase text-brutal underline hover:text-black"
          >
            Reset Ke Hari Ini
          </button>
        </div>
      </div>

      {/* Card 2: TIM Pelaksana (Pastel Pink) */}
      <div className="col-span-1 lg:col-span-4 rounded-2xl border-2 border-brutal bg-pastel-pink p-4 sm:p-5 shadow-neo relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="pill-badge bg-brutal text-pastel-pink text-[10px] sm:text-xs">
            <Users className="w-3.5 h-3.5" /> TIM PELAKSANA
          </span>
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-brutal">
            {tim ? `Terpilih: ${tim}` : 'Pilih Tim'}
          </span>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-black uppercase text-brutal mb-2 tracking-wider">
            Pilih TIM Pelaksana:
          </label>
          
          {/* 2 TIM Buttons: TIM 1&2 and TIM 3&4 */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {TIM_PRESETS.map((t) => {
              const isSelected = tim === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTim(t.id);
                  }}
                  className={`neo-btn py-2 text-center text-xs font-black transition-all ${
                    isSelected
                      ? 'bg-brutal text-white shadow-neo-sm translate-x-[1px] translate-y-[1px]'
                      : 'bg-white hover:bg-gray-100 text-brutal'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 text-[11px] font-bold text-gray-700 bg-white/60 p-2 rounded-xl border border-brutal/20 truncate">
          Folder Drive Target: <b>{TIM_PRESETS.find(p => p.id === tim)?.folderName || 'TEAM 1&2'}</b>
        </div>
      </div>

      {/* Card 3: Live Aggregate Bento (Pastel Matcha Green) */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-2xl border-2 border-brutal bg-pastel-matcha p-4 sm:p-5 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="pill-badge bg-brutal text-pastel-matcha text-[10px] sm:text-xs">
            <BarChart3 className="w-3.5 h-3.5" /> REKAP TOTAL
          </span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-brutal text-brutal">
            {kecamatanList.length} Kecamatan
          </span>
        </div>

        <div className="my-2 flex sm:flex-row lg:flex-col items-baseline sm:items-center lg:items-baseline justify-between sm:gap-4 lg:gap-0">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-0.5">
              TOTAL AKUMULASI BIDANG
            </div>
            <div className="text-2xl sm:text-3xl font-black text-brutal tracking-tight flex items-baseline gap-1">
              {grandTotal.toLocaleString('id-ID')}
              <span className="text-xs font-bold text-gray-600">Bidang</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2 sm:pt-0 lg:pt-2 border-t-2 sm:border-t-0 lg:border-t-2 border-brutal/30 text-xs w-full sm:w-auto lg:w-full mt-2 sm:mt-0 lg:mt-2">
            <div className="bg-white/80 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-brutal/40">
              <span className="text-[10px] font-black uppercase text-gray-600 block">Plotting:</span>
              <span className="font-extrabold text-sm text-emerald-700">{totalPlotting}</span>
            </div>
            <div className="bg-white/80 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-brutal/40">
              <span className="text-[10px] font-black uppercase text-gray-600 block">Digitasi:</span>
              <span className="font-extrabold text-sm text-blue-700">{totalDigitasi}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
