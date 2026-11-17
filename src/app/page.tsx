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
import { mergeBeforeAfterImage, renderSingleImageCanvas } from '@/lib/imageMerger';

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
  sitataFiles: [],
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
      // keep metrics and names, but fresh image files
      sitataFiles: [],
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

  // Convert Blob or File to compressed Base64 helper (max 1400px, quality 0.85)
  const compressImageToBase64 = (
    fileOrBlob: Blob | File,
    maxDim = 1400,
    quality = 0.85
  ): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(fileOrBlob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(fileOrBlob);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(fileOrBlob);
        };
        img.src = url;
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrBlob);
      }
    });
  };

  // Download all merged documents as ZIP containing SITATA and KKP PDF folders
  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      let count = 0;

      for (const kec of kecamatanList) {
        const cleanKec = (kec.kecamatan || 'Kecamatan').replace(/[^a-zA-Z0-9]/g, '_');
        const cleanKel = (kec.kelurahan || 'Kelurahan').replace(/[^a-zA-Z0-9]/g, '_');
        const folderName = `${cleanKec}_${cleanKel}`;
        const kecFolder = zip.folder(folderName);
        const sitataFolder = kecFolder?.folder('SITATA');
        const kkpFolder = kecFolder?.folder('KKP');

        // 1. SITATA files (PDF)
        const sitataList = kec.sitataFiles || [];
        for (let i = 0; i < sitataList.length; i++) {
          const item = sitataList[i];
          const fileName = `SITATA_${cleanKec}_${cleanKel}_${i + 1}.pdf`;
          if (item.pdfBlob) {
            sitataFolder?.file(fileName, item.pdfBlob);
            count++;
          } else if (item.file) {
            sitataFolder?.file(fileName, item.file);
            count++;
          }
        }

        // Backwards compatibility for sitataPairs if any
        if (sitataList.length === 0 && kec.sitataPairs) {
          for (let i = 0; i < kec.sitataPairs.length; i++) {
            const pair = kec.sitataPairs[i];
            const fileName = `SITATA_${cleanKec}_${cleanKel}_${i + 1}.pdf`;
            if (pair.pdfBlob) {
              sitataFolder?.file(fileName, pair.pdfBlob);
              count++;
            } else if (pair.mergedBlob) {
              sitataFolder?.file(fileName.replace('.pdf', '.jpg'), pair.mergedBlob);
              count++;
            }
          }
        }

        // 2. KKP files (PDF: Dual / Sebelum / Sesudah)
        const kkpList = kec.kkpPairs || [];
        for (let j = 0; j < kkpList.length; j++) {
          const pair = kkpList[j];
          let suffix = 'GABUNGAN';
          if (pair.mode === 'before_only') suffix = 'SEBELUM';
          else if (pair.mode === 'after_only') suffix = 'SESUDAH';
          const fileName = `KKP_${suffix}_${cleanKec}_${cleanKel}_${j + 1}.pdf`;

          if (pair.pdfBlob) {
            kkpFolder?.file(fileName, pair.pdfBlob);
            count++;
          } else if (pair.mergedBlob) {
            kkpFolder?.file(fileName.replace('.pdf', '.jpg'), pair.mergedBlob);
            count++;
          } else if (pair.beforeFile) {
            kkpFolder?.file(`KKP_SEBELUM_${cleanKec}_${cleanKel}_${j + 1}.jpg`, pair.beforeFile);
            count++;
          } else if (pair.afterFile) {
            kkpFolder?.file(`KKP_SESUDAH_${cleanKec}_${cleanKel}_${j + 1}.jpg`, pair.afterFile);
            count++;
          }
        }
      }

      if (count === 0) {
        alert('Belum ada dokumen PDF SITATA atau KKP yang siap untuk diunduh!');
        setIsDownloadingZip(false);
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dokumentasi_PDF_SITATA_KKP_${new Date().toISOString().slice(0, 10)}.zip`;
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
      let totalPhotosAttached = 0;

      // 1. Prepare payload with pre-rendered, lightweight PDFs
      const preparedList = await Promise.all(
        kecamatanList.map(async (k) => {
          const cleanKec = (k.kecamatan || 'Kecamatan').replace(/[^a-zA-Z0-9]/g, '_');
          const cleanKel = (k.kelurahan || 'Kelurahan').replace(/[^a-zA-Z0-9]/g, '_');

          // --- Process SITATA (1 file per entry -> PDF) ---
          const sitataPdfFiles: { name: string; base64: string }[] = [];
          const sitataList = k.sitataFiles || [];
          for (let s = 0; s < sitataList.length; s++) {
            const item = sitataList[s];
            let base64 = item.pdfBase64;

            // Fallback generation if not pre-rendered
            if (!base64) {
              if (item.file && item.file.type === 'application/pdf') {
                base64 = await new Promise<string>((resolve) => {
                  const r = new FileReader();
                  r.onload = () => resolve((r.result as string) || '');
                  r.onerror = () => resolve('');
                  r.readAsDataURL(item.file!);
                });
              } else if (item.previewUrl) {
                try {
                  const rendered = await renderSingleImageCanvas(item.previewUrl, {
                    type: 'SITATA',
                    mode: 'single',
                    kecamatan: k.kecamatan,
                    kelurahan: k.kelurahan,
                    tim,
                    dateStr: hariTanggal,
                  });
                  base64 = rendered.pdfBase64;
                } catch (rErr) {
                  console.warn('Fallback render SITATA single image error:', rErr);
                }
              }
            }

            if (base64) {
              sitataPdfFiles.push({
                name: `SITATA_${cleanKec}_${cleanKel}_${s + 1}.pdf`,
                base64,
              });
            }
          }

          // Backwards compatibility for legacy sitataPairs if any
          if (sitataPdfFiles.length === 0 && k.sitataPairs && k.sitataPairs.length > 0) {
            for (let s = 0; s < k.sitataPairs.length; s++) {
              const pair = k.sitataPairs[s];
              if (pair.pdfBase64) {
                sitataPdfFiles.push({
                  name: `SITATA_${cleanKec}_${cleanKel}_${s + 1}.pdf`,
                  base64: pair.pdfBase64,
                });
              }
            }
          }

          // --- Process KKP (Dual or Single Sebelum / Sesudah -> PDF) ---
          const kkpPdfFiles: { name: string; base64: string }[] = [];
          const kkpList = k.kkpPairs || [];
          for (let kp = 0; kp < kkpList.length; kp++) {
            const pair = kkpList[kp];
            let base64 = pair.pdfBase64;
            let suffix = 'GABUNGAN';
            if (pair.mode === 'before_only') suffix = 'SEBELUM';
            else if (pair.mode === 'after_only') suffix = 'SESUDAH';

            // Fallback generation if not pre-rendered
            if (!base64) {
              const commonOpts = {
                kecamatan: k.kecamatan || 'Kecamatan',
                kelurahan: k.kelurahan || 'Kelurahan',
                tim: tim || 'TIM',
                dateStr: hariTanggal,
              };

              try {
                if (pair.beforePreview && pair.afterPreview) {
                  const res = await mergeBeforeAfterImage(pair.beforePreview, pair.afterPreview, {
                    type: 'KKP',
                    ...commonOpts,
                  });
                  base64 = res.pdfBase64;
                  suffix = 'GABUNGAN';
                } else if (pair.beforePreview) {
                  const res = await renderSingleImageCanvas(pair.beforePreview, {
                    type: 'KKP',
                    mode: 'before',
                    ...commonOpts,
                  });
                  base64 = res.pdfBase64;
                  suffix = 'SEBELUM';
                } else if (pair.afterPreview) {
                  const res = await renderSingleImageCanvas(pair.afterPreview, {
                    type: 'KKP',
                    mode: 'after',
                    ...commonOpts,
                  });
                  base64 = res.pdfBase64;
                  suffix = 'SESUDAH';
                }
              } catch (mErr) {
                console.warn('Fallback render KKP image/pdf error:', mErr);
              }
            }

            if (base64) {
              kkpPdfFiles.push({
                name: `KKP_${suffix}_${cleanKec}_${cleanKel}_${kp + 1}.pdf`,
                base64,
              });
            }
          }

          totalPhotosAttached += sitataPdfFiles.length + kkpPdfFiles.length;

          return {
            kecamatan: k.kecamatan,
            kelurahan: k.kelurahan,
            berhasilPlotting: k.berhasilPlotting,
            digitasi: k.digitasi,
            overlap: k.overlap,
            pemecahan: k.pemecahan,
            belumTeridentifikasi: k.belumTeridentifikasi,
            dimatikan: k.dimatikan,
            diluarBatasAdministrasi: k.diluarBatasAdministrasi,
            sitataPdfFiles,
            kkpPdfFiles,
            // Fallback string arrays for older script versions:
            sitataBase64List: sitataPdfFiles.map((f) => f.base64),
            kkpBase64List: kkpPdfFiles.map((f) => f.base64),
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

      let successMsg = '';
      if (cloudSuccess) {
        if (totalPhotosAttached > 0) {
          successMsg = `Data dan ${totalPhotosAttached} berkas PDF resmi berhasil disimpan ke Google Sheets & Google Drive (Folder KKP & SITATA)!`;
        } else {
          successMsg = `Data angka berhasil dikirim ke Google Sheets! (Catatan: Form ini dikirim tanpa lampiran dokumen SITATA / KKP).`;
        }
      } else {
        successMsg =
          'Laporan berhasil disimpan di riwayat lokal browser! Hubungkan Google Apps Script Webhook di menu Pengaturan untuk sinkronisasi otomatis ke Google Sheets & Drive.';
      }

      setSubmitSuccessMsg(successMsg);

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

              {/* Bottom Info Card */}
              <div className="rounded-3xl border-3 border-brutal bg-white/80 p-5 text-center shadow-neo-sm">
                <span className="pill-badge bg-brutal text-pastel-matcha mb-1.5 inline-block">
                  SELESAI INPUT
                </span>
                <h4 className="text-base font-black text-brutal">
                  Data {kecamatanList.length} Kecamatan Siap Dikirim
                </h4>
                <p className="text-xs text-gray-600 font-bold max-w-md mx-auto mt-1 mb-3">
                  Seluruh data angka dan foto akan diproses. Anda dapat langsung mengklik tombol melayang di pojok kanan bawah untuk mengirim progress harian.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className="neo-btn bg-canvas hover:bg-gray-100 text-brutal px-4 py-2 text-xs font-black inline-flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-emerald-700" /> Pratinjau Teks Laporan WhatsApp
                </button>
              </div>

              {/* Floating Bottom-Right Submit Action Button */}
              <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="neo-btn bg-pastel-matcha hover:bg-emerald-300 text-brutal px-5 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 shadow-neo-xl disabled:opacity-50 whitespace-nowrap transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Send className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {isSubmitting ? 'Memproses...' : '🚀 KIRIM PROGRESS HARIAN'}
                  </span>
                  <span className="pill-badge bg-brutal text-white text-[10px] sm:text-xs py-0.5 px-2.5 font-black whitespace-nowrap">
                    {kecamatanList.length} Kecamatan
                  </span>
                </button>
              </div>

              {/* Bottom Spacer for Floating Dock */}
              <div className="h-16" />
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
