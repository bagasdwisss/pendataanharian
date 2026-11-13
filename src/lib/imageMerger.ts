export interface MergeOptions {
  type: 'SITATA' | 'KKP';
  kecamatan: string;
  kelurahan: string;
  tim: string;
  dateStr: string;
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

export async function mergeBeforeAfterImage(
  beforeUrl: string,
  afterUrl: string,
  options: MergeOptions
): Promise<{ dataUrl: string; blob: Blob }> {
  const [beforeImg, afterImg] = await Promise.all([
    loadImage(beforeUrl),
    loadImage(afterUrl),
  ]);

  // Standard target dimensions
  const paneHeight = 720;
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

  if (!ctx) {
    throw new Error('Failed to get 2d canvas context');
  }

  // 1. Fill entire canvas background with warm tone
  ctx.fillStyle = '#F6F5F0';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // 2. Draw Top Header Bar (Solid Neo-Brutalist Black)
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, totalWidth, headerHeight);

  // Accent line below header
  ctx.fillStyle = options.type === 'SITATA' ? '#86EFAC' : '#FDE047';
  ctx.fillRect(0, headerHeight - 6, totalWidth, 6);

  // Title on Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillText('ATR/BPN KANTAH KOTA MEDAN', borderWidth + 20, 42);

  ctx.font = 'bold 15px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillStyle = '#D1D5DB';
  const subtitle = `TIM: ${options.tim || '-'} | KEC: ${options.kecamatan || '-'} | KEL: ${options.kelurahan || '-'}`;
  ctx.fillText(subtitle.toUpperCase(), borderWidth + 20, 72);

  // Tag Badge (SITATA / KKP)
  const badgeColor = options.type === 'SITATA' ? '#86EFAC' : '#FDE047';
  const badgeText = `${options.type} COMPARISON`;
  ctx.font = 'bold 16px "Plus Jakarta Sans", "Inter", sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 36;
  const badgeX = totalWidth - badgeWidth - borderWidth - 20;

  ctx.fillStyle = badgeColor;
  ctx.beginPath();
  ctx.roundRect(badgeX, 26, badgeWidth, 38, [19]);
  ctx.fill();
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#111111';
  ctx.fillText(badgeText, badgeX + 18, 51);

  // Date in header
  ctx.font = '13px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillStyle = '#9CA3AF';
  const dateText = options.dateStr || new Date().toLocaleDateString('id-ID');
  ctx.fillText(dateText, totalWidth - badgeWidth - borderWidth - 20, 84);

  // 3. Draw Before Image (Left Pane)
  const beforeX = borderWidth;
  const paneY = headerHeight;
  ctx.drawImage(beforeImg, beforeX, paneY, beforeWidth, paneHeight);

  // Left Pane Label Pill: "SEBELUM"
  const labelBefore = '🔴 SEBELUM (BEFORE)';
  ctx.font = 'bold 16px "Plus Jakarta Sans", "Inter", sans-serif';
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

  // 4. Draw Center Divider
  const dividerX = beforeX + beforeWidth;
  ctx.fillStyle = '#111111';
  ctx.fillRect(dividerX, paneY, dividerWidth, paneHeight);

  // Divider Center Circle "➔"
  const circleY = paneY + paneHeight / 2;
  ctx.beginPath();
  ctx.arc(dividerX + dividerWidth / 2, circleY, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#FDE047';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#111111';
  ctx.stroke();

  ctx.fillStyle = '#111111';
  ctx.font = 'bold 20px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('➔', dividerX + dividerWidth / 2, circleY);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';

  // 5. Draw After Image (Right Pane)
  const afterX = dividerX + dividerWidth;
  ctx.drawImage(afterImg, afterX, paneY, afterWidth, paneHeight);

  // Right Pane Label Pill: "SESUDAH"
  const labelAfter = '🟢 SESUDAH (AFTER)';
  ctx.font = 'bold 16px "Plus Jakarta Sans", "Inter", sans-serif';
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

  // 6. Draw Footer Bar
  const footerY = totalHeight - footerHeight - borderWidth;
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, footerY, totalWidth, footerHeight + borderWidth);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px "Plus Jakarta Sans", "Inter", sans-serif';
  ctx.fillText('PROSES VALIDASI & PLOTTING • KANTAH ATR/BPN KOTA MEDAN', borderWidth + 20, footerY + 25);

  const rightStamp = 'SISTEM PENDATAAN HARIAN DIGITAL';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText(rightStamp, totalWidth - borderWidth - 20, footerY + 25);
  ctx.textAlign = 'start';

  // 7. Outer Neo-Brutalist Border
  ctx.lineWidth = borderWidth * 2;
  ctx.strokeStyle = '#111111';
  ctx.strokeRect(0, 0, totalWidth, totalHeight);

  // Convert to DataURL and Blob
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve({
          dataUrl,
          blob: blob || new Blob(),
        });
      },
      'image/jpeg',
      0.92
    );
  });
}
