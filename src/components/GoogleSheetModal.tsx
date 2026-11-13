'use client';

import React, { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '@/lib/googleAppsScriptCode';
import { 
  Cloud, 
  Copy, 
  Check, 
  ExternalLink, 
  Save, 
  HelpCircle, 
  Sparkles, 
  FileSpreadsheet,
  HardDrive
} from 'lucide-react';

interface Props {
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
}

export const GoogleSheetModal: React.FC<Props> = ({
  webhookUrl,
  onSaveWebhookUrl,
}) => {
  const [inputUrl, setInputUrl] = useState(webhookUrl);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    onSaveWebhookUrl(inputUrl.trim());
    alert('Pengaturan Google Apps Script URL berhasil disimpan!');
  };

  const handleTestConnection = async () => {
    if (!inputUrl) {
      alert('Silakan masukkan Web App URL terlebih dahulu!');
      return;
    }
    setTestStatus('testing');
    setTestMsg('Menghubungi endpoint Google Apps Script...');

    try {
      // Direct GET to test diagnostics
      const res = await fetch(inputUrl.trim());
      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setTestMsg(
          `✅ Endpoint Aktif! Sheet: "${data.namaSheet || 'Sheet1'}" (${data.jumlahBarisSaatIni || 0} baris saat ini). Drive: ${data.folderDriveTerhubung ? 'Terhubung' : 'Perlu Izin'}. ${data.pesanDiagnostik || ''}`
        );
      } else {
        setTestStatus('error');
        setTestMsg(`Status HTTP: ${res.status}. Pastikan deployment diset 'Who has access: Anyone'.`);
      }
    } catch (err: any) {
      // Fallback if blocked by CORS
      try {
        await fetch(inputUrl.trim(), { method: 'GET', mode: 'no-cors' });
        setTestStatus('success');
        setTestMsg('✅ Endpoint terdeteksi online! Klik tombol "Buka di Tab Baru" di bawah untuk memverifikasi izin akun.');
      } catch (err2: any) {
        setTestStatus('error');
        setTestMsg('Gagal terhubung ke URL. Pastikan URL benar berakhiran /exec.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Card */}
      <div className="rounded-3xl border-3 border-brutal bg-pastel-butter p-6 shadow-neo-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-brutal text-pastel-butter rounded-2xl shadow-neo-sm">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="pill-badge bg-brutal text-white text-[10px] mb-1">
              CLOUD INTEGRATION
            </div>
            <h2 className="text-xl font-black text-brutal">
              Integrasi Google Sheets & Google Drive
            </h2>
            <p className="text-xs text-gray-700 font-bold">
              Hubungkan aplikasi dengan Google Spreadsheet & Google Drive Anda agar data dan foto gabungan langsung tersimpan secara otomatis.
            </p>
          </div>
        </div>

        {/* Spreadsheet & Drive Link Banners */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Spreadsheet */}
          <div className="bg-white rounded-2xl border-2 border-brutal p-3.5 flex items-center justify-between gap-3 shadow-neo-sm">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-black text-brutal block">
                  Google Spreadsheet:
                </span>
                <span className="text-[11px] text-gray-500 font-medium truncate block">
                  PENDATAAN PROGRESS HARIAN
                </span>
              </div>
            </div>
            <a
              href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSBzJBw7aSjz-Tqn_pDUdxPKGDW1RM_UiEDBdWNl83BxLKgnCQIzjNE7MCK2NjI0--K1cLZEA9uTlDP/pubhtml?gid=1897439068&single=true"
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn bg-pastel-matcha hover:bg-emerald-300 text-brutal px-2.5 py-1 text-[11px] font-black flex items-center gap-1 flex-shrink-0"
            >
              Buka <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Drive Folder */}
          <div className="bg-white rounded-2xl border-2 border-brutal p-3.5 flex items-center justify-between gap-3 shadow-neo-sm">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-black text-brutal block">
                  Google Drive Foto:
                </span>
                <span className="text-[11px] text-gray-500 font-medium truncate block">
                  Folder TEAM 1&2, TEAM 3, TEAM4
                </span>
              </div>
            </div>
            <a
              href="https://drive.google.com/drive/folders/18q1anXDV3cHJT56ooKunFgEumFmbaUM3?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn bg-pastel-blue hover:bg-sky-300 text-brutal px-2.5 py-1 text-[11px] font-black flex items-center gap-1 flex-shrink-0"
            >
              Drive <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* URL Input Form */}
      <div className="rounded-3xl border-3 border-brutal bg-white p-6 shadow-neo-lg">
        <h3 className="text-base font-black text-brutal mb-2 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-600" />
          1. Masukkan Google Apps Script Web App URL
        </h3>
        <p className="text-xs text-gray-600 font-medium mb-4">
          URL Web App ini akan bertugas menerima data baris, mengunggah foto gabungan ke Google Drive, dan mengisi kolom link SITATA & KKP.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-black uppercase text-brutal mb-1">
              Google Apps Script Web App URL (Berakhiran /exec)
            </label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full neo-input px-3.5 py-2.5 text-sm font-bold text-brutal"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="neo-btn bg-pastel-matcha hover:bg-emerald-300 text-brutal px-4 py-2 text-xs font-black flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Simpan Konfigurasi
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="neo-btn bg-white hover:bg-gray-100 text-brutal px-3.5 py-2 text-xs font-black flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              {testStatus === 'testing' ? 'Menguji...' : 'Uji Koneksi Langsung'}
            </button>

            {inputUrl && (
              <a
                href={inputUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal px-3.5 py-2 text-xs font-black flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> Buka URL di Tab Baru (Cek Izin)
              </a>
            )}
          </div>

          {testMsg && (
            <div className={`p-3 rounded-xl border-2 border-brutal text-xs font-bold ${
              testStatus === 'success' ? 'bg-pastel-matcha text-emerald-900' : 'bg-pastel-pink text-rose-900'
            }`}>
              {testMsg}
            </div>
          )}
        </div>
      </div>

      {/* Step by Step Setup Guide & Script Code */}
      <div className="rounded-3xl border-3 border-brutal bg-white p-6 shadow-neo-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-brutal pb-4 mb-4">
          <div>
            <h3 className="text-base font-black text-brutal flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              2. Kode Google Apps Script & Petunjuk Pasang
            </h3>
            <p className="text-xs text-gray-600 font-medium">
              Salin kode berikut ke Google Spreadsheet Anda dalam 2 menit.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal px-4 py-2 text-xs font-black flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Berhasil Disalin!' : 'Salin Seluruh Kode'}
          </button>
        </div>

        {/* Step Guide */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5 text-xs">
          <div className="bg-canvas border-2 border-brutal rounded-xl p-3 shadow-neo-sm">
            <span className="pill-badge bg-brutal text-white text-[9px] mb-1.5">Langkah 1</span>
            <p className="font-bold text-brutal">Buka Spreadsheet & klik menu <b>Ekstensi &gt; Apps Script</b>.</p>
          </div>
          <div className="bg-canvas border-2 border-brutal rounded-xl p-3 shadow-neo-sm">
            <span className="pill-badge bg-brutal text-white text-[9px] mb-1.5">Langkah 2</span>
            <p className="font-bold text-brutal">Hapus isi file <code>Code.gs</code> lalu tempelkan kode di bawah.</p>
          </div>
          <div className="bg-canvas border-2 border-brutal rounded-xl p-3 shadow-neo-sm">
            <span className="pill-badge bg-brutal text-white text-[9px] mb-1.5">Langkah 3</span>
            <p className="font-bold text-brutal">Klik <b>Deploy &gt; New deployment</b>, pilih tipe <b>Web app</b>.</p>
          </div>
          <div className="bg-canvas border-2 border-brutal rounded-xl p-3 shadow-neo-sm">
            <span className="pill-badge bg-brutal text-white text-[9px] mb-1.5">Langkah 4</span>
            <p className="font-bold text-brutal">Set <b>Who has access</b> ke <b>Anyone</b>, salin Web App URL ke atas.</p>
          </div>
        </div>

        {/* Code Box */}
        <div className="relative rounded-2xl border-2 border-brutal bg-gray-900 text-gray-200 overflow-hidden text-xs font-mono shadow-neo-sm">
          <div className="bg-black/80 px-4 py-2 border-b border-gray-700 flex items-center justify-between text-[11px] text-gray-400">
            <span>Code.gs (Google Apps Script)</span>
            <span>JavaScript</span>
          </div>
          <pre className="p-4 max-h-80 overflow-y-auto leading-relaxed select-all">
            {GOOGLE_APPS_SCRIPT_TEMPLATE}
          </pre>
        </div>
      </div>
    </div>
  );
};
