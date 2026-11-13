export interface ImagePair {
  id: string;
  beforeFile: File | null;
  beforePreview: string | null;
  afterFile: File | null;
  afterPreview: string | null;
  mergedUrl: string | null;
  mergedBlob: Blob | null;
  status: 'idle' | 'merging' | 'ready' | 'error';
}

export interface KecamatanData {
  id: string;
  kecamatan: string;
  kelurahan: string;
  berhasilPlotting: number;
  digitasi: number;
  overlap: number;
  pemecahan: number;
  belumTeridentifikasi: number;
  dimatikan: number;
  diluarBatasAdministrasi: number;
  sitataPairs: ImagePair[];
  kkpPairs: ImagePair[];
}

export interface FormDataState {
  hariTanggal: string;
  tim: string;
  customTim: string;
  kecamatanList: KecamatanData[];
}

export interface SubmissionHistoryItem {
  id: string;
  timestamp: string;
  hariTanggal: string;
  tim: string;
  totalKecamatan: number;
  totalPlotting: number;
  totalDigitasi: number;
  items: KecamatanData[];
  status: 'tersimpan_lokal' | 'terkirim_cloud';
}
