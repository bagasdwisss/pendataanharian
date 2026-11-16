'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { HeaderBento } from '@/components/HeaderBento';
import { KecamatanCard } from '@/components/KecamatanCard';
import { GoogleSheetModal } from '@/components/GoogleSheetModal';
import { SummaryModal } from '@/components/SummaryModal';
import { HistoryTab } from '@/components/HistoryTab';
import { SheetPreviewTab } from '@/components/SheetPreviewTab';
import { KecamatanData, ImagePair, SubmissionHistoryItem } from '@/lib/types';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  Send, 
  Save, 
  Download, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  FolderArchive,
  Layers,
  ArrowRight,
  Menu
} from 'lucide-react';
import { DEFAULT_WEBHOOK_URL } from '@/lib/kantahData';

const createDefaultKecamatan = (kecamatanName: string = 'Medan Helvetia'): KecamatanData => ({
  id: Math.random().toString(36).substring(2, 9),
  kecamatan: kecamatanName,
  kelurahan: '',
  berhasilPlotting: 0,
  digitasi: 0,
  overlap: 0,
  pemecahan: 0,
  belumTeridentifikasi: 0,
  dimatikan: 0,
  diluarBatasAdministrasi: 0,
  sitataPairs: [],
  kkpPairs: [],
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<'form' | 'summary' | 'history' | 'settings' | 'sheet'>('form');
  
  // Header state
  const [hariTanggal, setHariTanggal] = useState<string>('');
  const [tim, setTim] = useState<string>('TIM 1&2');
  const [customTim, setCustomTim] = useState<string>('');

  // Dynamic Kecamatan list
  const [kecamatanList, setKecamatanList] = useState<KecamatanData[]>([
    createDefaultKecamatan('Medan Helvetia'),
  ]);

  // Cloud & History state (Hardcoded default URL)
  const [webhookUrl, setWebhookUrl] = useState<string>(DEFAULT_WEBHOOK_URL);
  const [history, setHistory] = useState<SubmissionHistoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Initialize date on mount
  useEffect(() => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const day = days[now.getDay()];
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    setHariTanggal(`${day}, ${d}/${m}/${y}`);

    // Load saved webhook and history from localStorage (always fallback to hardcoded default)
    const savedWebhook = localStorage.getItem('kantah_medan_webhook_url');
    if (savedWebhook && savedWebhook.trim().length > 0) {
      setWebhookUrl(savedWebhook.trim());
    } else {
      setWebhookUrl(DEFAULT_WEBHOOK_URL);
      localStorage.setItem('kantah_medan_webhook_url', DEFAULT_WEBHOOK_URL);
    }
    const savedHistory = localStorage.getItem('kantah_medan_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveWebhook = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('kantah_medan_webhook_url', url);
  };

  // Kecamatan handlers
  const handleAddKecamatan = () => {
    const newKec = createDefaultKecamatan('');
    setKecamatanList([...kecamatanList, newKec]);
  };

  const handleUpdateKecamatan = (index: number, updated: KecamatanData) => {
    const list = [...kecamatanList];
    list[index] = updated;
    setKecamatanList(list);
  };

  const handleRemoveKecamatan = (index: number) => {
    if (kecamatanList.length <= 1) return;
    const list = kecamatanList.filter((_, i) => i !== index);
    setKecamatanList(list);
  };

  const handleDuplicateKecamatan = (index: number) => {
    const target = kecamatanList[index];
    const duplicated: KecamatanData = {
      ...target,
      id: Math.random().toString(36).substring(2, 9),
      // keep metrics and names, but fresh image pairs
      sitataPairs: [],
      kkpPairs: [],
    };
    const list = [...kecamatanList];
    list.splice(index + 1, 0, duplicated);
    setKecamatanList(list);
  };

  const handleResetForm = () => {
    if (confirm('Yakin ingin mereset seluruh form input harian ini?')) {
      setKecamatanList([createDefaultKecamatan('')]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Convert Blob to Base64 helper
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Download all merged images as ZIP
  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      let count = 0;

      for (const kec of kecamatanList) {
        const folderName = `${kec.kecamatan || 'Kecamatan'}_${kec.kelurahan || 'Kelurahan'}`.replace(/\s+/g, '_');
        const folder = zip.folder(folderName);

        // Sitata
        for (let i = 0; i < kec.sitataPairs.length; i++) {
          const pair = kec.sitataPairs[i];
          if (pair.mergedBlob) {
            folder?.file(`SITATA_GABUNGAN_${i + 1}.jpg`, pair.mergedBlob);
            count++;
          }
        }

        // KKP
        for (let j = 0; j < kec.kkpPairs.length; j++) {
          const pair = kec.kkpPairs[j];
          if (pair.mergedBlob) {
            folder?.file(`KKP_GABUNGAN_${j + 1}.jpg`, pair.mergedBlob);
            count++;
          }
        }
      }

      if (count === 0) {
        alert('Belum ada foto yang digabungkan untuk diunduh!');
        setIsDownloadingZip(false);
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dokumentasi_Foto_SITATA_KKP_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat file ZIP: ' + err.message);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Form Submit Handler
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tim) {
      alert('Harap pilih atau masukkan TIM terlebih dahulu!');
      setActiveTab('form');
      return;
    }

    if (kecamatanList.some(k => !k.kecamatan)) {
      alert('Terdapat bagian Kecamatan yang belum dipilih atau diisi!');
      setActiveTab('form');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccessMsg(null);

    try {
      // 1. Prepare payload with base64 merged images
      const preparedList = await Promise.all(
        kecamatanList.map(async (k) => {
          const sitataBase64List: string[] = [];
          for (const s of k.sitataPairs) {
            if (s.mergedBlob) {
              const b64 = await blobToBase64(s.mergedBlob);
              sitataBase64List.push(b64);
            }
          }

          const kkpBase64List: string[] = [];
          for (const kp of k.kkpPairs) {
            if (kp.mergedBlob) {
              const b64 = await blobToBase64(kp.mergedBlob);
              kkpBase64List.push(b64);
            }
          }

          return {
            ...k,
            sitataBase64List,
            kkpBase64List,
          };
        })
      );

      const payload = {
        hariTanggal,
        tim,
        kecamatanList: preparedList,
      };

      let cloudSuccess = false;

      // 2. If Google Apps Script Webhook is configured, POST to it
      if (webhookUrl) {
        try {
          // Attempt standard POST first (to read JSON response if CORS is allowed)
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors', // standard cross-origin submission to Apps Script
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
          });
          cloudSuccess = true;
        } catch (postErr) {
          console.warn('POST to Apps Script failed:', postErr);
        }
      }

      // 3. Save to Local Storage History
      const totalPlot = kecamatanList.reduce((acc, k) => acc + (Number(k.berhasilPlotting) || 0), 0);
      const totalDig = kecamatanList.reduce((acc, k) => acc + (Number(k.digitasi) || 0), 0);

      const historyItem: SubmissionHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleString('id-ID'),
        hariTanggal,
        tim,
        totalKecamatan: kecamatanList.length,
        totalPlotting: totalPlot,
        totalDigitasi: totalDig,
        items: kecamatanList,
        status: cloudSuccess ? 'terkirim_cloud' : 'tersimpan_lokal',
      };

      const updatedHistory = [historyItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('kantah_medan_history', JSON.stringify(updatedHistory));

      // Trigger Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSubmitSuccessMsg(
        cloudSuccess
          ? 'Data dan dokumentasi foto gabungan berhasil dikirim ke Google Sheets & Google Drive!'
          : 'Laporan berhasil disimpan di riwayat lokal browser! Hubungkan Google Apps Script Webhook di menu Pengaturan untuk sinkronisasi otomatis ke Google Sheets & Drive.'
      );

      // Scroll to top to see message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreHistory = (item: SubmissionHistoryItem) => {
    setHariTanggal(item.hariTanggal);
    setTim(item.tim);
    setKecamatanList(item.items);
    setActiveTab('form');
    alert(`Data dari ${item.timestamp} berhasil dimuat kembali ke formulir!`);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('kantah_medan_history');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-canvas bg-grid-pattern">
      {/* Sticky Mobile Top Header (Screens < lg) */}
      <div className="lg:hidden sticky top-0 z-30 bg-sidebar-bg text-white border-b-3 border-brutal px-4 py-3 flex items-center justify-between shadow-neo">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl border-2 border-brutal bg-pastel-butter flex items-center justify-center text-brutal font-black text-base shadow-neo-sm">
            🏛️
          </div>
          <div>
            <div className="pill-badge bg-pastel-matcha text-brutal text-[8px] py-0 px-1.5 font-black">
              ATR/BPN MEDAN
            </div>
            <span className="font-black text-xs block leading-tight text-white mt-0.5">
              PENDATAAN HARIAN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Terkoneksi"></span>
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal px-3 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-neo-sm"
          >
            <Menu className="w-4 h-4" />
            Menu
          </button>
        </div>
      </div>

      {/* Split-Tone Dark Sidebar (Docked on Desktop, Off-Canvas Drawer on Mobile) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kecamatanList={kecamatanList}
        onReset={handleResetForm}
        onDownloadZip={handleDownloadZip}
        isDownloadingZip={isDownloadingZip}
        cloudConnected={!!webhookUrl}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Canvas Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Top Notification if submitted */}
        {submitSuccessMsg && (
          <div className="mb-6 rounded-2xl border-3 border-brutal bg-pastel-matcha p-4 shadow-neo flex items-start justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-800 flex-shrink-0" />
              <div>
                <span className="font-extrabold text-sm text-emerald-950 block">
                  PENGIRIMAN BERHASIL!
                </span>
                <span className="text-xs font-bold text-emerald-900">
                  {submitSuccessMsg}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmitSuccessMsg(null)}
              className="text-xs font-black text-brutal px-2 py-1 rounded-lg border border-brutal bg-white hover:bg-gray-100"
            >
              ✕ Tutup
            </button>
          </div>
        )}

        {/* Tab 1: Main Input Form */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmitForm}>
            {/* Bento Grid Header */}
            <HeaderBento
              hariTanggal={hariTanggal}
              setHariTanggal={setHariTanggal}
              tim={tim}
              setTim={setTim}
              customTim={customTim}
              setCustomTim={setCustomTim}
              kecamatanList={kecamatanList}
            />

            {/* List of Dynamic Kecamatan Cards */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="pill-badge bg-brutal text-white text-xs">
                    DATA WILAYAH & DOKUMENTASI
                  </span>
                  <h2 className="text-lg font-black text-brutal">
                    Daftar Kecamatan & Pengukuran
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleAddKecamatan}
                  className="neo-btn bg-pastel-butter hover:bg-yellow-300 text-brutal px-4 py-2 text-xs font-black flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Kecamatan Lain
                </button>
              </div>

              {kecamatanList.map((kec, idx) => (
                <KecamatanCard
                  key={kec.id}
                  index={idx}
                  data={kec}
                  onChange={(updated) => handleUpdateKecamatan(idx, updated)}
                  onRemove={() => handleRemoveKecamatan(idx)}
                  onDuplicate={() => handleDuplicateKecamatan(idx)}
                  canRemove={kecamatanList.length > 1}
                  tim={tim}
                  hariTanggal={hariTanggal}
                />
              ))}

              {/* Big Bottom Button to Add More Kecamatan */}
              <div className="text-center py-4">
                <button
                  type="button"
                  onClick={handleAddKecamatan}
                  className="neo-btn bg-white hover:bg-pastel-butter-light text-brutal px-6 py-3 text-sm font-black inline-flex items-center gap-2 shadow-neo-lg"
                >
                  <Plus className="w-5 h-5 text-emerald-600" />
                  Tambah Kecamatan & Kelurahan Baru
                </button>
              </div>

              {/* Bottom Submit Bento Card */}
              <div className="rounded-3xl border-3 border-brutal bg-white p-6 shadow-neo-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="pill-badge bg-brutal text-pastel-matcha mb-1">
                      FINALISASI DATA
                    </span>
                    <h3 className="text-xl font-black text-brutal">
                      Kirim & Simpan Progress Harian
                    </h3>
                    <p className="text-xs text-gray-600 font-bold">
                      Data {kecamatanList.length} kecamatan akan dicatat dan seluruh foto Sebelum & Sesudah digabung otomatis.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('summary')}
                      className="neo-btn bg-canvas hover:bg-gray-100 text-brutal px-4 py-2.5 text-xs font-black flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" /> Pratinjau Teks WhatsApp
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="neo-btn bg-pastel-matcha hover:bg-emerald-300 text-brutal px-6 py-3 text-sm font-black flex items-center gap-2 shadow-neo-lg disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? 'Memproses & Menyimpan...' : '🚀 KIRIM PROGRESS HARIAN'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: WhatsApp / Telegram Summary */}
        {activeTab === 'summary' && (
          <SummaryModal
            hariTanggal={hariTanggal}
            tim={tim}
            kecamatanList={kecamatanList}
          />
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            onClearHistory={handleClearHistory}
            onRestore={handleRestoreHistory}
          />
        )}

        {/* Tab 4: Google Sheets & Drive Settings */}
        {activeTab === 'settings' && (
          <GoogleSheetModal
            webhookUrl={webhookUrl}
            onSaveWebhookUrl={handleSaveWebhook}
          />
        )}

        {/* Tab 5: Published Sheet Live Embed */}
        {activeTab === 'sheet' && <SheetPreviewTab />}
      </main>
    </div>
  );
}
