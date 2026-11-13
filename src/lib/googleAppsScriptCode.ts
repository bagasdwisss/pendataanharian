export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT - KANTAH ATR/BPN KOTA MEDAN
 * Script untuk menerima pengiriman Form Pendataan Harian,
 * menyimpan foto gabungan ke Google Drive, dan mencatat data ke Google Sheets.
 *
 * CARA PEMASANGAN:
 * 1. Buka Google Spreadsheet Anda:
 *    https://docs.google.com/spreadsheets/d/e/2PACX-1vSBzJBw7aSjz-Tqn_pDUdxPKGDW1RM_UiEDBdWNl83BxLKgnCQIzjNE7MCK2NjI0--K1cLZEA9uTlDP/edit
 * 2. Klik menu 'Extensions' (Ekstensi) -> 'Apps Script'.
 * 3. Hapus semua kode yang ada di Apps Script, lalu tempelkan (paste) seluruh kode di bawah ini.
 * 4. Klik tombol Simpan (ikon disket).
 * 5. Klik 'Deploy' (Terapkan) -> 'New deployment' (Penerapan baru).
 * 6. Pilih tipe: 'Web app' (Aplikasi Web).
 * 7. Konfigurasi:
 *    - Description: Pendataan Harian Webhook
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING agar form web bisa mengirim data!
 * 8. Klik 'Deploy' dan salin 'Web App URL' yang berakhiran '/exec'.
 * 9. Tempelkan Web App URL tersebut ke Pengaturan di aplikasi web Anda.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var parentFolder = getOrCreateFolder("DOKUMENTASI_PENDATAAN_HARIAN");

    var hariTanggal = payload.hariTanggal || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
    var tim = payload.tim || "";
    var kecamatanList = payload.kecamatanList || [];

    var results = [];

    // Proses setiap kecamatan & kelurahan yang diinput
    for (var i = 0; i < kecamatanList.length; i++) {
      var item = kecamatanList[i];

      // Folder per tanggal & tim
      var dateFolder = getOrCreateSubFolder(parentFolder, hariTanggal.replace(/\\//g, "-") + "_" + tim.replace(/\\s+/g, ""));

      // 1. Simpan foto SITATA ke Google Drive
      var sitataUrls = [];
      if (item.sitataBase64List && item.sitataBase64List.length > 0) {
        for (var s = 0; s < item.sitataBase64List.length; s++) {
          var sData = item.sitataBase64List[s];
          var sFileName = "SITATA_" + (item.kecamatan || "Kec") + "_" + (item.kelurahan || "Kel") + "_" + (s + 1) + "_" + new Date().getTime() + ".jpg";
          var sUrl = saveBase64ToDrive(sData, sFileName, dateFolder);
          sitataUrls.push(sUrl);
        }
      }

      // 2. Simpan foto KKP ke Google Drive
      var kkpUrls = [];
      if (item.kkpBase64List && item.kkpBase64List.length > 0) {
        for (var k = 0; k < item.kkpBase64List.length; k++) {
          var kData = item.kkpBase64List[k];
          var kFileName = "KKP_" + (item.kecamatan || "Kec") + "_" + (item.kelurahan || "Kel") + "_" + (k + 1) + "_" + new Date().getTime() + ".jpg";
          var kUrl = saveBase64ToDrive(kData, kFileName, dateFolder);
          kkpUrls.push(kUrl);
        }
      }

      // 3. Susun Baris Data sesuai Format Kolom Spreadsheet Anda
      // Kolom: Timestamp | TIM | Kecamatan | Kelurahan | Berhasil Plotting | Digitasi | Overlap | Pemecahan | Dimatikan | Diluar Batas Administrasi | Upload SITATA | Upload KKP | Hari & Tanggal
      var row = [
        Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"), // Timestamp
        tim,                                                             // TIM
        item.kecamatan || "",                                            // Kecamatan
        item.kelurahan || "",                                            // Kelurahan
        Number(item.berhasilPlotting) || 0,                              // Berhasil Plotting
        Number(item.digitasi) || 0,                                      // Digitasi
        Number(item.overlap) || 0,                                       // Overlap
        Number(item.pemecahan) || 0,                                     // Pemecahan
        Number(item.dimatikan) || 0,                                     // Dimatikan
        Number(item.diluarBatasAdministrasi) || 0,                       // Diluar Batas Administrasi
        sitataUrls.join(", "),                                           // Upload SITATA (Link Drive)
        kkpUrls.join(", "),                                              // Upload KKP (Link Drive)
        hariTanggal                                                      // Hari & Tanggal
      ];

      sheet.appendRow(row);
      results.push({ kecamatan: item.kecamatan, kelurahan: item.kelurahan, sitataCount: sitataUrls.length, kkpCount: kkpUrls.length });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data " + results.length + " kecamatan berhasil disimpan ke Google Sheets & Google Drive!",
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function saveBase64ToDrive(base64Data, filename, folder) {
  var contentType = "image/jpeg";
  var cleanedData = base64Data;
  if (base64Data.indexOf(",") > -1) {
    var parts = base64Data.split(",");
    var mimePart = parts[0].match(/:(.*?);/);
    if (mimePart && mimePart[1]) {
      contentType = mimePart[1];
    }
    cleanedData = parts[1];
  }
  var decoded = Utilities.base64Decode(cleanedData);
  var blob = Utilities.newBlob(decoded, contentType, filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  var folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(subFolderName);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Kantah Medan Pendataan Harian Endpoint",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
