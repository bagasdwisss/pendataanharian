'use client';

import React from 'react';
import { SubmissionHistoryItem } from '@/lib/types';
import { History, Calendar, Users, MapPin, Trash2, ArrowUpRight, RotateCcw } from 'lucide-react';

interface Props {
  history: SubmissionHistoryItem[];
  onClearHistory: () => void;
  onRestore: (item: SubmissionHistoryItem) => void;
}

export const HistoryTab: React.FC<Props> = ({
  history,
  onClearHistory,
  onRestore,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="rounded-3xl border-3 border-brutal bg-pastel-blue p-4 sm:p-6 shadow-neo-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="pill-badge bg-brutal text-pastel-blue mb-1.5 text-[10px] sm:text-xs">
            LOCAL STORAGE HISTORY
          </span>
          <h2 className="text-lg sm:text-xl font-black text-brutal">
            Riwayat Pengiriman Formulir
          </h2>
          <p className="text-xs text-gray-700 font-bold">
            Catatan pengiriman formulir yang tersimpan di perangkat ini. Anda dapat memuat ulang draft atau data terdahulu.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Yakin ingin menghapus seluruh riwayat pengiriman lokal?')) {
                onClearHistory();
              }
            }}
            className="neo-btn bg-red-400 hover:bg-red-500 text-white px-3.5 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4" /> Bersihkan Riwayat
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-3xl border-3 border-brutal bg-white p-8 sm:p-12 text-center shadow-neo-lg">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-gray-700 mb-1">
            Belum Ada Riwayat Pengiriman
          </h3>
          <p className="text-xs text-gray-500">
            Setelah Anda mengisi form dan mengklik tombol "Kirim Progress Harian", rekaman laporan akan otomatis tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border-2 border-brutal bg-white p-4 sm:p-5 shadow-neo hover:translate-x-0.5 sm:hover:translate-x-1 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-gray-100 pb-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill-badge bg-brutal text-white text-[10px]">
                    TIM {item.tim}
                  </span>
                  <span className="text-xs font-black text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> {item.hariTanggal}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[11px] font-bold text-gray-400">
                    {item.timestamp}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRestore(item)}
                    className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal px-3 py-1 text-xs font-black flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Muat ke Form
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs mb-3">
                <div className="bg-canvas p-2 rounded-xl border border-brutal/30">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Kecamatan:</span>
                  <span className="font-extrabold text-xs sm:text-sm">{item.totalKecamatan} Kecamatan</span>
                </div>
                <div className="bg-canvas p-2 rounded-xl border border-brutal/30">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Total Plotting:</span>
                  <span className="font-extrabold text-xs sm:text-sm text-emerald-700">{item.totalPlotting}</span>
                </div>
                <div className="bg-canvas p-2 rounded-xl border border-brutal/30">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Total Digitasi:</span>
                  <span className="font-extrabold text-xs sm:text-sm text-blue-700">{item.totalDigitasi}</span>
                </div>
                <div className="bg-canvas p-2 rounded-xl border border-brutal/30">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Status:</span>
                  <span className="font-extrabold text-[10px] sm:text-[11px] text-emerald-700 uppercase truncate block">
                    {item.status === 'terkirim_cloud' ? 'Terkirim ke Cloud' : 'Tersimpan Lokal'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-600 font-medium flex flex-wrap gap-1.5">
                {item.items.map((k, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-md border border-gray-300 text-[10px] sm:text-[11px]">
                    {k.kecamatan} ({k.kelurahan || '-'})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
