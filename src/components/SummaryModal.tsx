'use client';

import React, { useState } from 'react';
import { KecamatanData } from '@/lib/types';
import { 
  Copy, 
  Check, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Share2,
  Send,
  Building,
  CheckCircle2
} from 'lucide-react';

interface Props {
  hariTanggal: string;
  tim: string;
  kecamatanList: KecamatanData[];
}

export const SummaryModal: React.FC<Props> = ({
  hariTanggal,
  tim,
  kecamatanList,
}) => {
  const [copied, setCopied] = useState(false);

  const totalPlotting = kecamatanList.reduce((acc, k) => acc + (Number(k.berhasilPlotting) || 0), 0);
  const totalDigitasi = kecamatanList.reduce((acc, k) => acc + (Number(k.digitasi) || 0), 0);
  const totalOverlap = kecamatanList.reduce((acc, k) => acc + (Number(k.overlap) || 0), 0);
  const totalPemecahan = kecamatanList.reduce((acc, k) => acc + (Number(k.pemecahan) || 0), 0);
  const totalBelum = kecamatanList.reduce((acc, k) => acc + (Number(k.belumTeridentifikasi) || 0), 0);
  const totalDimatikan = kecamatanList.reduce((acc, k) => acc + (Number(k.dimatikan) || 0), 0);
  const totalDiluar = kecamatanList.reduce((acc, k) => acc + (Number(k.diluarBatasAdministrasi) || 0), 0);
  const grandTotal = totalPlotting + totalDigitasi + totalOverlap + totalPemecahan + totalBelum + totalDimatikan + totalDiluar;

  const generateWhatsAppText = () => {
    let text = `*PROGRESS HARIAN VALIDASI, PLOTTING & DIGITASI*\n`;
    text += `*ATR/BPN KANTAH KOTA MEDAN*\n\n`;
    text += `📅 Hari & Tanggal : ${hariTanggal || '-'}\n`;
    text += `👥 TIM Pelaksana  : ${tim || '-'}\n`;
    text += `📌 Total Kecamatan: ${kecamatanList.length} Kecamatan\n`;
    text += `===================================\n\n`;

    kecamatanList.forEach((k, idx) => {
      const subtotal = 
        (Number(k.berhasilPlotting) || 0) +
        (Number(k.digitasi) || 0) +
        (Number(k.overlap) || 0) +
        (Number(k.pemecahan) || 0) +
        (Number(k.belumTeridentifikasi) || 0) +
        (Number(k.dimatikan) || 0) +
        (Number(k.diluarBatasAdministrasi) || 0);

      text += `*${idx + 1}. KECAMATAN ${k.kecamatan?.toUpperCase() || '-'}*\n`;
      text += `   Kelurahan: ${k.kelurahan || '-'}\n`;
      text += `   • Berhasil Plotting : ${k.berhasilPlotting || 0}\n`;
      text += `   • Digitasi          : ${k.digitasi || 0}\n`;
      text += `   • Overlap           : ${k.overlap || 0}\n`;
      text += `   • Pemecahan         : ${k.pemecahan || 0}\n`;
      text += `   • Belum Terident.   : ${k.belumTeridentifikasi || 0}\n`;
      text += `   • Dimatikan         : ${k.dimatikan || 0}\n`;
      text += `   • Diluar Batas Adm  : ${k.diluarBatasAdministrasi || 0}\n`;
      const sitataCount = (k.sitataFiles?.length || 0) + (k.sitataPairs?.length || 0);
      const kkpCount = (k.kkpPairs?.length || 0);
      text += `   📄 Berkas SITATA (PDF): ${sitataCount} dokumen\n`;
      text += `   📷 Berkas KKP (PDF)   : ${kkpCount} dokumen\n`;
      text += `   👉 *Subtotal Bidang: ${subtotal}*\n\n`;
    });

    text += `===================================\n`;
    text += `*REKAP TOTAL AKUMULASI HARIAN:*\n`;
    text += `• Total Plotting : ${totalPlotting}\n`;
    text += `• Total Digitasi : ${totalDigitasi}\n`;
    text += `• Total Overlap  : ${totalOverlap}\n`;
    text += `• Total Dimatikan: ${totalDimatikan}\n`;
    text += `🏆 *GRAND TOTAL : ${grandTotal} BIDANG*\n`;
    text += `\n_Laporan dibuat otomatis via Sistem Pendataan Harian Kantah Medan_`;

    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'TIM',
      'Kecamatan',
      'Kelurahan',
      'Berhasil Plotting',
      'Digitasi',
      'Overlap',
      'Pemecahan',
      'Belum bisa teridentifikasi',
      'Dimatikan',
      'Diluar Batas Administrasi',
      'Upload SITATA (Pasang)',
      'Upload KKP (Pasang)',
      'Hari & Tanggal',
    ];

    const timestamp = new Date().toLocaleString('id-ID');

    const rows = kecamatanList.map((k) => [
      `"${timestamp}"`,
      `"${tim}"`,
      `"${k.kecamatan}"`,
      `"${k.kelurahan}"`,
      k.berhasilPlotting || 0,
      k.digitasi || 0,
      k.overlap || 0,
      k.pemecahan || 0,
      k.belumTeridentifikasi || 0,
      k.dimatikan || 0,
      k.diluarBatasAdministrasi || 0,
      (k.sitataFiles?.length || 0) + (k.sitataPairs?.length || 0),
      k.kkpPairs?.length || 0,
      `"${hariTanggal}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Progress_Harian_${tim}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border-3 border-brutal bg-pastel-butter p-4 sm:p-6 shadow-neo-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="pill-badge bg-brutal text-pastel-butter mb-1.5 text-[10px] sm:text-xs">
            LAPORAN KILAT WHATSAPP / TELEGRAM
          </span>
          <h2 className="text-lg sm:text-xl font-black text-brutal">
            Ringkasan & Format Siap Kirim
          </h2>
          <p className="text-xs text-gray-700 font-bold">
            Format laporan teks rapi untuk dikirimkan ke grup pimpinan atau grup koordinasi Kantah Medan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="neo-btn bg-brutal text-white px-4 py-2.5 sm:py-2 text-xs font-black flex items-center justify-center gap-2 shadow-neo-sm w-full sm:w-auto flex-1 sm:flex-none"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin Ke Clipboard!' : 'Salin Teks WhatsApp'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="neo-btn bg-pastel-matcha hover:bg-emerald-300 text-brutal px-3.5 py-2 text-xs font-black flex items-center justify-center gap-1.5 w-full sm:w-auto flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4" /> Unduh CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="neo-btn bg-white hover:bg-gray-100 text-brutal px-3 py-2 text-xs font-black flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Printer className="w-4 h-4" /> Cetak
          </button>
        </div>
      </div>

      {/* WhatsApp Message Preview Box */}
      <div className="rounded-3xl border-3 border-brutal bg-white p-4 sm:p-6 shadow-neo-lg">
        <div className="flex items-center justify-between border-b-2 border-brutal pb-3 mb-4">
          <span className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-600" /> Pratinjau Teks Pesan Laporan
          </span>
          <span className="text-[11px] font-bold text-gray-400">
            Font Monospace
          </span>
        </div>

        <div className="bg-canvas border-2 border-brutal rounded-2xl p-3 sm:p-4 font-mono text-[11px] sm:text-xs text-gray-800 whitespace-pre-wrap break-words leading-relaxed shadow-neo-sm select-all overflow-x-auto">
          {generateWhatsAppText()}
        </div>
      </div>
    </div>
  );
};
