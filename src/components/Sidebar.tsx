'use client';

import React from 'react';
import { 
  FileSpreadsheet, 
  Layers, 
  History, 
  Settings, 
  ExternalLink, 
  Download, 
  RotateCcw, 
  CheckCircle,
  FolderArchive,
  Share2,
  Building,
  X
} from 'lucide-react';
import { KecamatanData } from '@/lib/types';

interface Props {
  activeTab: 'form' | 'summary' | 'history' | 'settings' | 'sheet';
  setActiveTab: (tab: 'form' | 'summary' | 'history' | 'settings' | 'sheet') => void;
  kecamatanList: KecamatanData[];
  onReset: () => void;
  onDownloadZip: () => void;
  isDownloadingZip: boolean;
  cloudConnected: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  kecamatanList,
  onReset,
  onDownloadZip,
  isDownloadingZip,
  cloudConnected,
  isMobileOpen,
  onCloseMobile,
}) => {
  const totalImageFiles = kecamatanList.reduce((acc, k) => {
    const sitataCount = (k.sitataFiles || []).filter(s => s.status === 'ready' || s.file).length +
      (k.sitataPairs || []).filter(p => p.status === 'ready' || p.mergedUrl || p.beforeFile || p.afterFile).length;
    const kkpCount = (k.kkpPairs || []).filter(p => p.status === 'ready' || p.mergedUrl || p.beforeFile || p.afterFile).length;
    return acc + sitataCount + kkpCount;
  }, 0);

  const totalPlotting = kecamatanList.reduce((acc, k) => acc + (Number(k.berhasilPlotting) || 0), 0);
  const totalDigitasi = kecamatanList.reduce((acc, k) => acc + (Number(k.digitasi) || 0), 0);

  const navItems = [
    { id: 'form', label: 'Form Input Harian', icon: Layers, badge: `${kecamatanList.length} Kecamatan` },
    { id: 'summary', label: 'Rekap & Teks Laporan', icon: Share2 },
    { id: 'history', label: 'Riwayat Pengiriman', icon: History },
    { id: 'settings', label: 'Koneksi Cloud & Drive', icon: Settings, status: cloudConnected },
    { id: 'sheet', label: 'Sheet Publikasi Asli', icon: FileSpreadsheet },
  ] as const;

  const handleNavClick = (id: 'form' | 'summary' | 'history' | 'settings' | 'sheet') => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container (Sticky on Desktop, Off-Canvas Drawer on Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-sidebar-bg text-white border-r-4 border-brutal flex flex-col justify-between p-4 sm:p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain transition-transform duration-300 ease-in-out shadow-neo-xl lg:shadow-none lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:flex-shrink-0 lg:translate-x-0 lg:z-20 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b-2 border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl border-2 border-brutal bg-pastel-butter flex items-center justify-center text-brutal font-black text-xl shadow-neo-sm">
                🏛️
              </div>
              <div>
                <div className="pill-badge bg-pastel-matcha text-brutal text-[9px] py-0 px-2 font-black">
                  ATR/BPN MEDAN
                </div>
                <h1 className="text-base font-black tracking-tight text-white mt-0.5 leading-snug">
                  PENDATAAN HARIAN
                </h1>
                <p className="text-[11px] font-semibold text-neutral-400">
                  Kantah Kota Medan
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Status Badge */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-3 mb-6 shadow-neo-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-neutral-300">
                <span className={`w-2.5 h-2.5 rounded-full ${cloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                Status Sinkron:
              </span>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${cloudConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'}`}>
                {cloudConnected ? 'Terkoneksi' : 'Siap Kirim'}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">
              Data tersimpan aman di browser & siap dikirim ke Google Sheets & Drive.
            </p>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-2 mb-6">
            <div className="text-[10px] font-black uppercase text-neutral-500 tracking-wider px-2 mb-2">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 text-xs font-black transition-all ${
                    isActive
                      ? 'bg-pastel-butter text-brutal border-brutal shadow-neo-sm translate-x-1'
                      : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brutal' : 'text-neutral-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {'badge' in item && Boolean((item as any).badge) && (
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold whitespace-nowrap flex-shrink-0 ${
                      isActive ? 'bg-brutal text-white' : 'bg-neutral-800 text-neutral-300'
                    }`}>
                      {(item as any).badge}
                    </span>
                  )}
                  {'status' in item && (
                    <span className={`w-2 h-2 rounded-full ${(item as any).status ? 'bg-emerald-400' : 'bg-neutral-500'}`}></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Real-time Metric Widget in Sidebar */}
          <div className="rounded-2xl border-2 border-neutral-800 bg-neutral-900/80 p-4 mb-4">
            <div className="text-[10px] font-black uppercase text-neutral-400 mb-2">
              Ringkasan Berkas Hari Ini
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-neutral-800/80 rounded-xl p-2 border border-neutral-700">
                <span className="text-[9px] font-black uppercase text-neutral-400 block">Plotting</span>
                <span className="text-lg font-black text-emerald-400">{totalPlotting}</span>
              </div>
              <div className="bg-neutral-800/80 rounded-xl p-2 border border-neutral-700">
                <span className="text-[9px] font-black uppercase text-neutral-400 block">Digitasi</span>
                <span className="text-lg font-black text-blue-400">{totalDigitasi}</span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-bold text-[11px]">Berkas PDF:</span>
              <span className="font-extrabold text-amber-400">{totalImageFiles} Dokumen</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4 border-t-2 border-neutral-800">
          <button
            type="button"
            onClick={() => {
              onDownloadZip();
              onCloseMobile();
            }}
            disabled={totalImageFiles === 0 || isDownloadingZip}
            className="w-full neo-btn bg-pastel-matcha hover:bg-emerald-300 text-brutal px-3 py-2 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <FolderArchive className="w-4 h-4" />
            {isDownloadingZip ? 'Membuat ZIP...' : `Unduh Semua PDF (${totalImageFiles})`}
          </button>

          <button
            type="button"
            onClick={() => {
              onReset();
              onCloseMobile();
            }}
            className="w-full neo-btn bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 px-3 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Form Baru
          </button>

          <div className="text-center pt-2 text-[10px] text-neutral-500 font-medium">
            Vercel Production Ready • v1.0
          </div>
        </div>
      </aside>
    </>
  );
};
