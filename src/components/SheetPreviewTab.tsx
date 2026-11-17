'use client';

import React from 'react';
import { FileSpreadsheet, ExternalLink, RefreshCw, Eye } from 'lucide-react';

export const SheetPreviewTab: React.FC = () => {
  const sheetUrl =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBzJBw7aSjz-Tqn_pDUdxPKGDW1RM_UiEDBdWNl83BxLKgnCQIzjNE7MCK2NjI0--K1cLZEA9uTlDP/pubhtml?gid=1897439068&single=true';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="rounded-3xl border-3 border-brutal bg-pastel-matcha p-4 sm:p-6 shadow-neo-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="pill-badge bg-brutal text-pastel-matcha mb-1.5 text-[10px] sm:text-xs">
            GOOGLE SPREADSHEET LIVE VIEW
          </span>
          <h2 className="text-lg sm:text-xl font-black text-brutal">
            Publikasi Lembar Kerja Progress Harian
          </h2>
          <p className="text-xs text-gray-700 font-bold">
            Tampilan langsung dari spreadsheet publikasi Kantah Kota Medan.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="neo-btn bg-brutal text-white px-4 py-2 text-xs font-black flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Buka di Tab Baru <ExternalLink className="w-4 h-4 text-pastel-butter" />
          </a>
        </div>
      </div>

      {/* Embedded Sheet Container */}
      <div className="rounded-3xl border-3 border-brutal bg-white p-3 sm:p-4 shadow-neo-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-brutal pb-3 mb-3 text-xs font-bold text-gray-600">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" /> Web Viewer Spreadsheet
          </span>
          <span className="text-[11px] text-gray-500">
            Geser horizontal untuk tabel lengkap di layar ponsel
          </span>
        </div>

        <div className="w-full h-[65vh] min-h-[420px] sm:h-[650px] rounded-2xl border-2 border-brutal overflow-hidden bg-gray-50">
          <iframe
            src={sheetUrl}
            title="Google Spreadsheet Progress Harian"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
