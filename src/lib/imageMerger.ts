import jsPDF from 'jspdf';

export interface MergeOptions {
  type: 'SITATA' | 'KKP';
  kecamatan: string;
  kelurahan: string;
  tim: string;
  dateStr: string;
  mode?: 'both' | 'before_only' | 'after_only' | 'single';
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Convert HTML5 Canvas to genuine PDF Document using jsPDF
 */
export async function canvasToPdf(
  canvas: HTMLCanvasElement,
  filename: string = 'dokumen.pdf'
): Promise<{ pdfBlob: Blob; pdfBase64: string }> {
  const width = canvas.width;
  const height = canvas.height;
  const orientation = width >= height ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
    hotfixes: ['px_scaling'],
  });

  // Compress image to JPEG 0.76 inside PDF for fast, lightweight uploads (~80-150KB)
  const imgData = canvas.toDataURL('image/jpeg', 0.76);
  pdf.addImage(imgData, 'JPEG', 0, 0, width, height, undefined, 'FAST');

  const pdfBlob = pdf.output('blob');
  const pdfBase64 = pdf.output('datauristring');
  return { pdfBlob, pdfBase64 };
}

/**
 * Render single photo onto official Kantah ATR/BPN Medan branded template
 * Used for: SITATA (1 photo) or KKP (when only Sebelum or only Sesudah is provided)
 */
export async function renderSingleImageCanvas(
  imgUrl: string,
  options: {
    type: 'SITATA' | 'KKP';
    mode?: 'before' | 'after' | 'single';
    kecamatan: string;
    kelurahan: string;
    tim: string;
    dateStr: string;
  }
): Promise<{
  dataUrl: string;
  blob: Blob;
  pdfBlob: Blob;
  pdfBase64: string;
}> {
  const img = await loadImage(imgUrl);

  const paneHeight = 700;
  const aspect = img.naturalWidth / img.naturalHeight;
  const rawWidth = Math.round(paneHeight * aspect);
  const paneWidth = Math.min(Math.max(rawWidth, 650), 1100);

  const headerHeight = 110;
  const footerHeight = 40;
  const borderWidth = 6;

  const totalWidth = paneWidth + borderWidth * 2;
  const totalHeight = headerHeight + paneHeight + footerHeight + borderWidth * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d canvas context');

  // Background
  ctx.fillStyle = '#F6F5F0';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Top Header (Solid Black Neo-Brutalist)
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, totalWidth, headerHeight);

  // Accent line below header
  ctx.fillStyle = options.type === 'SITATA' ? '#86EFAC' : '#FDE047';
  ctx.fillRect(0, headerHeight - 6, totalWidth, 6);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillText('ATR/BPN KANTAH KOTA MEDAN', borderWidth + 20, 42);

  ctx.font = 'bold 14px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillStyle = '#D1D5DB';
  const subtitle = `TIM: ${options.tim || '-'} | KEC: ${options.kecamatan || '-'} | KEL: ${options.kelurahan || '-'}`;
  ctx.fillText(subtitle.toUpperCase(), borderWidth + 20, 72);

  // Tag Badge in Header
  let badgeText = options.type === 'SITATA' ? 'SITATA DOKUMEN' : 'KKP TUNGGAL';
  let badgeColor = options.type === 'SITATA' ? '#86EFAC' : '#FDE047';
  if (options.type === 'KKP') {
    if (options.mode === 'before') {
      badgeText = 'KKP - SEBELUM';
      badgeColor = '#FCA5A5';
    } else if (options.mode === 'after') {
      badgeText = 'KKP - SESUDAH';
      badgeColor = '#86EFAC';
    }
  }

  ctx.font = 'bold 15px "Plus Jakarta Sans", "Inter", sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 36;
  const badgeX = totalWidth - badgeWidth - borderWidth - 20;

  ctx.fillStyle = badgeColor;
  ctx.beginPath();
  ctx.roundRect(badgeX, 26, badgeWidth, 36, [18]);
  ctx.fill();
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#111111';
  ctx.fillText(badgeText, badgeX + 18, 50);

  // Date in Header
  ctx.font = '12px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillStyle = '#9CA3AF';
  const dateText = options.dateStr || new Date().toLocaleDateString('id-ID');
  ctx.fillText(dateText, totalWidth - badgeWidth - borderWidth - 20, 82);

  // Draw Photo
  const imgX = borderWidth;
  const imgY = headerHeight;
  ctx.drawImage(img, imgX, imgY, paneWidth, paneHeight);

  // Label Pill on top of photo
  let pillText = '📄 DOKUMENTASI SITATA';
  let pillBg = '#1E1B4B';
  let pillTextColor = '#FFFFFF';

  if (options.type === 'KKP') {
    if (options.mode === 'before') {
      pillText = '🔴 KKP: FOTO SEBELUM (BEFORE)';
      pillBg = '#EF4444';
    } else {
      pillText = '🟢 KKP: FOTO SESUDAH (AFTER)';
      pillBg = '#10B981';
    }
  }

  ctx.font = 'bold 15px "Plus Jakarta Sans", "Inter", sans-serif';
  const pillW = ctx.measureText(pillText).width + 28;
  ctx.fillStyle = pillBg;
  ctx.beginPath();
  ctx.roundRect(imgX + 16, imgY + 16, pillW, 34, [8]);
  ctx.fill();
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = pillTextColor;
  ctx.fillText(pillText, imgX + 30, imgY + 39);

  // Footer Bar
  const footerY = totalHeight - footerHeight - borderWidth;
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, footerY, totalWidth, footerHeight + borderWidth);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillText('PROSES VALIDASI & PLOTTING • KANTAH ATR/BPN KOTA MEDAN', borderWidth + 20, footerY + 25);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('SISTEM PENDATAAN HARIAN DIGITAL (PDF)', totalWidth - borderWidth - 20, footerY + 25);
  ctx.textAlign = 'start';

  // Outer Neo-Brutalist Border
  ctx.lineWidth = borderWidth * 2;
  ctx.strokeStyle = '#111111';
  ctx.strokeRect(0, 0, totalWidth, totalHeight);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
  const { pdfBlob, pdfBase64 } = await canvasToPdf(canvas);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve({
          dataUrl,
          blob: blob || new Blob(),
          pdfBlob,
          pdfBase64,
        });
      },
      'image/jpeg',
      0.78
    );
  });
}

/**
 * Merge dual Sebelum & Sesudah photos side-by-side onto branded template
 * Used for KKP (when both Sebelum and Sesudah are uploaded)
 */
export async function mergeBeforeAfterImage(
  beforeUrl: string,
  afterUrl: string,
  options: MergeOptions
): Promise<{
  dataUrl: string;
  blob: Blob;
  pdfBlob: Blob;
  pdfBase64: string;
}> {
  const [beforeImg, afterImg] = await Promise.all([
    loadImage(beforeUrl),
    loadImage(afterUrl),
  ]);

  // Standard target dimensions
  const paneHeight = 700;
  const aspectBefore = beforeImg.naturalWidth / beforeImg.naturalHeight;
  const aspectAfter = afterImg.naturalWidth / afterImg.naturalHeight;

  const beforeWidth = Math.round(paneHeight * aspectBefore);
  const afterWidth = Math.round(paneHeight * aspectAfter);

  const headerHeight = 110;
  const footerHeight = 40;
  const borderWidth = 6;
  const dividerWidth = 6;

  const totalWidth = beforeWidth + afterWidth + dividerWidth + borderWidth * 2;
  const totalHeight = headerHeight + paneHeight + footerHeight + borderWidth * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d canvas context');

  // Background
  ctx.fillStyle = '#F6F5F0';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Top Header Bar
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, totalWidth, headerHeight);

  // Accent Line
  ctx.fillStyle = '#FDE047';
  ctx.fillRect(0, headerHeight - 6, totalWidth, 6);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillText('ATR/BPN KANTAH KOTA MEDAN', borderWidth + 20, 42);

  ctx.font = 'bold 14px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillStyle = '#D1D5DB';
  const subtitle = `TIM: ${options.tim || '-'} | KEC: ${options.kecamatan || '-'} | KEL: ${options.kelurahan || '-'}`;
  ctx.fillText(subtitle.toUpperCase(), borderWidth + 20, 72);

  // Tag Badge
  const badgeColor = '#FDE047';
  const badgeText = 'KKP COMPARISON (GABUNGAN)';
  ctx.font = 'bold 15px "Plus Jakarta Sans", "Inter", sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 36;
  const badgeX = totalWidth - badgeWidth - borderWidth - 20;

  ctx.fillStyle = badgeColor;
  ctx.beginPath();
  ctx.roundRect(badgeX, 26, badgeWidth, 36, [18]);
  ctx.fill();
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#111111';
  ctx.fillText(badgeText, badgeX + 18, 50);

  // Date
  ctx.font = '12px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillStyle = '#9CA3AF';
  const dateText = options.dateStr || new Date().toLocaleDateString('id-ID');
  ctx.fillText(dateText, totalWidth - badgeWidth - borderWidth - 20, 82);

  // Draw Before (Left Pane)
  const beforeX = borderWidth;
  const paneY = headerHeight;
  ctx.drawImage(beforeImg, beforeX, paneY, beforeWidth, paneHeight);

  // Left Label: SEBELUM
  const labelBefore = '🔴 SEBELUM (BEFORE)';
  ctx.font = 'bold 15px "Plus Jakarta Sans", "Inter", sans-serif';
  const lblBeforeWidth = ctx.measureText(labelBefore).width + 28;

  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.roundRect(beforeX + 16, paneY + 16, lblBeforeWidth, 34, [8]);
  ctx.fill();
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(labelBefore, beforeX + 30, paneY + 39);

  // Center Divider
  const dividerX = beforeX + beforeWidth;
  ctx.fillStyle = '#111111';
  ctx.fillRect(dividerX, paneY, dividerWidth, paneHeight);

  // Divider Center Circle
  const circleY = paneY + paneHeight / 2;
  ctx.beginPath();
  ctx.arc(dividerX + dividerWidth / 2, circleY, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#FDE047';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#111111';
  ctx.stroke();

  ctx.fillStyle = '#111111';
  ctx.font = 'bold 18px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('➔', dividerX + dividerWidth / 2, circleY);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';

  // Draw After (Right Pane)
  const afterX = dividerX + dividerWidth;
  ctx.drawImage(afterImg, afterX, paneY, afterWidth, paneHeight);

  // Right Label: SESUDAH
  const labelAfter = '🟢 SESUDAH (AFTER)';
  ctx.font = 'bold 15px "Plus Jakarta Sans", "Inter", sans-serif';
  const lblAfterWidth = ctx.measureText(labelAfter).width + 28;

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.roundRect(afterX + 16, paneY + 16, lblAfterWidth, 34, [8]);
  ctx.fill();
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(labelAfter, afterX + 30, paneY + 39);

  // Footer
  const footerY = totalHeight - footerHeight - borderWidth;
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, footerY, totalWidth, footerHeight + borderWidth);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillText('PROSES VALIDASI & PLOTTING • KANTAH ATR/BPN KOTA MEDAN', borderWidth + 20, footerY + 25);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('SISTEM PENDATAAN HARIAN DIGITAL (PDF)', totalWidth - borderWidth - 20, footerY + 25);
  ctx.textAlign = 'start';

  // Outer Border
  ctx.lineWidth = borderWidth * 2;
  ctx.strokeStyle = '#111111';
  ctx.strokeRect(0, 0, totalWidth, totalHeight);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
  const { pdfBlob, pdfBase64 } = await canvasToPdf(canvas);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve({
          dataUrl,
          blob: blob || new Blob(),
          pdfBlob,
          pdfBase64,
        });
      },
      'image/jpeg',
      0.78
    );
  });
}
