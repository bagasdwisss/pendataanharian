export const KANTAH_KECAMATAN_LIST = [
  'Medan Amplas',
  'Medan Area',
  'Medan Barat',
  'Medan Baru',
  'Medan Belawan',
  'Medan Deli',
  'Medan Denai',
  'Medan Helvetia',
  'Medan Johor',
  'Medan Kota',
  'Medan Labuhan',
  'Medan Maimun',
  'Medan Marelan',
  'Medan Perjuangan',
  'Medan Petisah',
  'Medan Polonia',
  'Medan Selayang',
  'Medan Sunggal',
  'Medan Tembung',
  'Medan Timur',
  'Medan Tuntungan',
];

export const KELURAHAN_BY_KECAMATAN: Record<string, string[]> = {
  'Medan Helvetia': [
    'Helvetia',
    'Helvetia Tengah',
    'Helvetia Timur',
    'Dwikora',
    'Sei Sikambing C II',
    'Tanjung Gusta',
    'Cinta Damai',
  ],
  'Medan Labuhan': [
    'Nelayan Indah',
    'Pekan Labuhan',
    'Besar',
    'Martubung',
    'Sei Mati',
    'Tangki',
  ],
  'Medan Tembung': [
    'Tegal Sari Mandala I',
    'Tegal Sari Mandala II',
    'Tegal Sari Mandala III',
    'Bantan',
    'Bantan Timur',
    'Bandar Selamat',
    'Sidorejo',
    'Sidorejo Hilir',
  ],
  'Medan Deli': [
    'Kota Bangun',
    'Mabar',
    'Mabar Hilir',
    'Tanjung Mulia',
    'Tanjung Mulia Hilir',
    'Titi Papan',
  ],
  'Medan Barat': [
    'Kesawan',
    'Silalas',
    'Glugur Kota',
    'Pulo Brayan Kota',
    'Karang Berombak',
    'Sei Agul',
  ],
  'Medan Kota': [
    'Mesjid',
    'Yuki',
    'Pasar Baru',
    'Pasar Merah Barat',
    'Teladan Barat',
    'Teladan Timur',
    'Kotamatsum III',
  ],
};

export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbx0h-Tj71gho3GyKyTw8n7UK8_AVllNGuw3FMIaMwrUkn6kvmqmfPPo2ZVJxvRw09te/exec';

export const TIM_PRESETS = [
  { id: 'TIM 1&2', label: 'TIM 1&2', folderName: 'TEAM 1&2' },
  { id: 'TIM 3&4', label: 'TIM 3&4', folderName: 'TEAM 3&4' },
];

export const PASTEL_THEMES = [
  {
    bg: 'bg-pastel-matcha',
    light: 'bg-pastel-matcha-light',
    border: 'border-brutal',
    badge: 'bg-brutal text-pastel-matcha',
    accent: '#86EFAC',
  },
  {
    bg: 'bg-pastel-butter',
    light: 'bg-pastel-butter-light',
    border: 'border-brutal',
    badge: 'bg-brutal text-pastel-butter',
    accent: '#FDE047',
  },
  {
    bg: 'bg-pastel-blue',
    light: 'bg-pastel-blue-light',
    border: 'border-brutal',
    badge: 'bg-brutal text-pastel-blue',
    accent: '#7DD3FC',
  },
  {
    bg: 'bg-pastel-pink',
    light: 'bg-pastel-pink-light',
    border: 'border-brutal',
    badge: 'bg-brutal text-pastel-pink',
    accent: '#F472B6',
  },
  {
    bg: 'bg-pastel-lavender',
    light: 'bg-white',
    border: 'border-brutal',
    badge: 'bg-brutal text-pastel-lavender',
    accent: '#C4B5FD',
  },
  {
    bg: 'bg-pastel-peach',
    light: 'bg-white',
    border: 'border-brutal',
    badge: 'bg-brutal text-pastel-peach',
    accent: '#FDBA74',
  },
];
