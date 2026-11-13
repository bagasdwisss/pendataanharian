export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - KANTAH ATR/BPN KOTA MEDAN
 * PENDATAAN HARIAN PLOTTING, DIGITASI, SITATA, DAN KKP
 * =========================================================================
 *
 * Folder Google Drive Induk:
 * https://drive.google.com/drive/folders/18q1anXDV3cHJT56ooKunFgEumFmbaUM3
 *
 * Struktur Folder Otomatis:
 * [FOLDER INDUK] (18q1anXDV3cHJT56ooKunFgEumFmbaUM3)
 *   ├── TEAM 1&2
 *   │     └── [DD-MM-YYYY] (contoh: 13-11-2026) -> File Foto SITATA & KKP
 *   ├── TEAM 3
 *   │     └── [DD-MM-YYYY] -> File Foto SITATA & KKP
 *   └── TEAM4 (atau TEAM 4)
 *         └── [DD-MM-YYYY] -> File Foto SITATA & KKP
 *
 * CARA PEMASANGAN SCRIPT (HANYA 2 MENIT):
 * 1. Buka Google Spreadsheet Anda:
 *    https://docs.google.com/spreadsheets/d/e/2PACX-1vSBzJBw7aSjz-Tqn_pDUdxPKGDW1RM_UiEDBdWNl83BxLKgnCQIzjNE7MCK2NjI0--K1cLZEA9uTlDP/edit
 * 2. Di menu atas, klik 'Extensions' (Ekstensi) -> pilih 'Apps Script'.
 * 3. Hapus seluruh teks kode yang ada di editor Apps Script.
 * 4. Salin (copy) dan tempel (paste) SEMUA kode di bawah ini ke editor.
 * 5. Klik ikon Disket (Save project) di toolbar atas.
 * 6. Klik tombol biru 'Deploy' (Terapkan) di pojok kanan atas -> pilih 'New deployment' (Penerapan baru).
 * 7. Pada ikon gear (roda gigi) 'Select type', pastikan memilih 'Web app' (Aplikasi Web).
 * 8. Isi konfigurasi:
 *    - Description : Webhook Pendataan Harian
 *    - Execute as  : Me (akun email Anda)
 *    - Who has access : Anyone (Siapa saja)  <-- SANGAT PENTING agar form web bisa mengirim data!
 * 9. Klik 'Deploy'. Izinkan akses (Authorize Access) akun Google Anda jika diminta.
 * 10. Salin 'Web App URL' yang muncul (URL berakhiran '/exec').
 * 11. Buka aplikasi web Anda, masuk ke menu 'Koneksi Cloud & Drive', tempelkan URL tersebut, lalu klik 'Simpan Konfigurasi'.
 */

// ID Folder Utama Google Drive Anda
var PARENT_FOLDER_ID = "18q1anXDV3cHJT56ooKunFgEumFmbaUM3";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data yang diterima"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. Ambil Folder Induk
    var parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);

    // 2. Tentukan Folder Tim (TEAM 1&2, TEAM 3, atau TEAM 4)
    var tim = payload.tim || "TIM 1&2";
    var teamFolder = getTeamFolder(parentFolder, tim);

    // 3. Buat Folder Tanggal Hari Ini di dalam Folder Tim masing-masing
    // Format tanggal: DD-MM-YYYY (contoh: 13-11-2026)
    var todayStr = Utilities.formatDate(new Date(), "GMT+7", "dd-MM-yyyy");
    var dateFolder = getOrCreateSubFolder(teamFolder, todayStr);

    var hariTanggal = payload.hariTanggal || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
    var kecamatanList = payload.kecamatanList || [];
    var results = [];

    // 4. Proses Setiap Kecamatan & Simpan Foto Gabungan ke Subfolder Tanggal
    for (var i = 0; i < kecamatanList.length; i++) {
      var item = kecamatanList[i];
      var cleanKec = (item.kecamatan || "Kecamatan").replace(/[^a-zA-Z0-9]/g, "_");
      var cleanKel = (item.kelurahan || "Kelurahan").replace(/[^a-zA-Z0-9]/g, "_");

      // Simpan Foto SITATA
      var sitataUrls = [];
      if (item.sitataBase64List && item.sitataBase64List.length > 0) {
        for (var s = 0; s < item.sitataBase64List.length; s++) {
          var sFileName = "SITATA_" + cleanKec + "_" + cleanKel + "_" + (s + 1) + "_" + new Date().getTime() + ".jpg";
          var sUrl = saveBase64ToDrive(item.sitataBase64List[s], sFileName, dateFolder);
          sitataUrls.push(sUrl);
        }
      }

      // Simpan Foto KKP
      var kkpUrls = [];
      if (item.kkpBase64List && item.kkpBase64List.length > 0) {
        for (var k = 0; k < item.kkpBase64List.length; k++) {
          var kFileName = "KKP_" + cleanKec + "_" + cleanKel + "_" + (k + 1) + "_" + new Date().getTime() + ".jpg";
          var kUrl = saveBase64ToDrive(item.kkpBase64List[k], kFileName, dateFolder);
          kkpUrls.push(kUrl);
        }
      }

      // Susun Baris Data Sesuai Kolom Spreadsheet Anda:
      // Timestamp | TIM | Kecamatan | Kelurahan | Berhasil Plotting | Digitasi | Overlap | Pemecahan | Belum bisa teridentifikasi | Dimatikan | Diluar Batas Administrasi | Upload SITATA | Upload KKP | Hari & Tanggal
      var row = [
        Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"), // Timestamp
        tim,                                                             // TIM
        item.kecamatan || "",                                            // Kecamatan
        item.kelurahan || "",                                            // Kelurahan
        Number(item.berhasilPlotting) || 0,                              // Berhasil Plotting
        Number(item.digitasi) || 0,                                      // Digitasi
        Number(item.overlap) || 0,                                       // Overlap
        Number(item.pemecahan) || 0,                                     // Pemecahan
        Number(item.belumTeridentifikasi) || 0,                          // Belum bisa teridentifikasi
        Number(item.dimatikan) || 0,                                     // Dimatikan
        Number(item.diluarBatasAdministrasi) || 0,                       // Diluar Batas Administrasi
        sitataUrls.join(", "),                                           // Upload SITATA (Link Foto Drive)
        kkpUrls.join(", "),                                              // Upload KKP (Link Foto Drive)
        hariTanggal                                                      // Hari & Tanggal
      ];

      sheet.appendRow(row);
      results.push({
        kecamatan: item.kecamatan,
        kelurahan: item.kelurahan,
        sitataCount: sitataUrls.length,
        kkpCount: kkpUrls.length
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data " + results.length + " kecamatan dan foto berhasil disimpan ke Folder " + teamFolder.getName() + "/" + todayStr + " dan Google Sheets!",
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Mencari folder tim yang cocok di dalam Google Drive
function getTeamFolder(parentFolder, timName) {
  var targetName = "TEAM 1&2";
  var upper = (timName || "").toUpperCase();

  if (upper.indexOf("3") > -1 && upper.indexOf("4") === -1 && upper.indexOf("1") === -1) {
    targetName = "TEAM 3";
  } else if (upper.indexOf("4") > -1 && upper.indexOf("1") === -1 && upper.indexOf("3") === -1) {
    targetName = "TEAM 4";
  } else {
    targetName = "TEAM 1&2";
  }

  // Cari folder yang cocok (mendukung "TEAM 4" atau "TEAM4")
  var subFolders = parentFolder.getFolders();
  while (subFolders.hasNext()) {
    var f = subFolders.next();
    var fName = f.getName().toUpperCase().replace(/\\s+/g, "");
    var tClean = targetName.replace(/\\s+/g, "");
    if (fName === tClean || f.getName().toUpperCase() === targetName) {
      return f;
    }
  }

  // Jika belum ada, buat foldernya
  return parentFolder.createFolder(targetName);
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  var folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(subFolderName);
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

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Kantah Medan Pendataan Harian Endpoint",
    driveFolderId: PARENT_FOLDER_ID,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
