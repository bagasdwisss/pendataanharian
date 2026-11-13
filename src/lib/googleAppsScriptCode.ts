export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - KANTAH ATR/BPN KOTA MEDAN (VERSI 2.0 TAHAN ERROR)
 * =========================================================================
 *
 * Folder Google Drive:
 * https://drive.google.com/drive/folders/18q1anXDV3cHJT56ooKunFgEumFmbaUM3
 *
 * FITUR VERSI 2.0:
 * - Anti-Gagal: Data formulir PASTI dicatat ke Spreadsheet meskipun Drive terkendala.
 * - Otomatis buat subfolder tanggal (DD-MM-YYYY) di TEAM 1&2, TEAM 3, atau TEAM4.
 * - Dilengkapi diagnostik live doGet() untuk mengecek status izin Google.
 */

var PARENT_FOLDER_ID = "18q1anXDV3cHJT56ooKunFgEumFmbaUM3";

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (t) {
    // Lanjutkan jika lock timeout
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data (e.postData kosong)"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    
    // 1. Dapatkan Sheet Target (Sheet1 atau Sheet Pertama)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error("Script tidak terhubung ke Spreadsheet. Pastikan membuat script dari menu Extensions > Apps Script di dalam file Spreadsheet Anda!");
    }
    
    var sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet() || ss.getSheets()[0];

    var tim = payload.tim || "TIM 1&2";
    var hariTanggal = payload.hariTanggal || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
    var todayStr = Utilities.formatDate(new Date(), "GMT+7", "dd-MM-yyyy");
    var kecamatanList = payload.kecamatanList || [];

    // 2. Siapkan Folder Drive hanya jika ada foto yang diupload
    var dateFolder = null;
    var driveErrorNotice = "";
    var hasAnyPhotos = kecamatanList.some(function(k) {
      return (k.sitataBase64List && k.sitataBase64List.length > 0) ||
             (k.kkpBase64List && k.kkpBase64List.length > 0);
    });

    if (hasAnyPhotos) {
      try {
        var parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
        var teamFolder = getTeamFolder(parentFolder, tim);
        dateFolder = getOrCreateSubFolder(teamFolder, todayStr);
      } catch (driveErr) {
        driveErrorNotice = " (Catatan Drive: " + driveErr.message + ")";
      }
    }

    var results = [];

    // 3. Catat Setiap Kecamatan ke Baris Baru Spreadsheet
    for (var i = 0; i < kecamatanList.length; i++) {
      var item = kecamatanList[i];
      var cleanKec = (item.kecamatan || "Kecamatan").replace(/[^a-zA-Z0-9]/g, "_");
      var cleanKel = (item.kelurahan || "Kelurahan").replace(/[^a-zA-Z0-9]/g, "_");

      // Simpan Foto SITATA (jika ada dan folder Drive siap)
      var sitataUrls = [];
      if (item.sitataBase64List && item.sitataBase64List.length > 0) {
        for (var s = 0; s < item.sitataBase64List.length; s++) {
          if (dateFolder) {
            try {
              var sFileName = "SITATA_" + cleanKec + "_" + cleanKel + "_" + (s + 1) + "_" + new Date().getTime() + ".jpg";
              var sUrl = saveBase64ToDrive(item.sitataBase64List[s], sFileName, dateFolder);
              sitataUrls.push(sUrl);
            } catch (errS) {
              sitataUrls.push("Gagal simpan foto: " + errS.message);
            }
          } else {
            sitataUrls.push("Foto ada tapi folder Drive belum siap" + driveErrorNotice);
          }
        }
      }

      // Simpan Foto KKP (jika ada dan folder Drive siap)
      var kkpUrls = [];
      if (item.kkpBase64List && item.kkpBase64List.length > 0) {
        for (var k = 0; k < item.kkpBase64List.length; k++) {
          if (dateFolder) {
            try {
              var kFileName = "KKP_" + cleanKec + "_" + cleanKel + "_" + (k + 1) + "_" + new Date().getTime() + ".jpg";
              var kUrl = saveBase64ToDrive(item.kkpBase64List[k], kFileName, dateFolder);
              kkpUrls.push(kUrl);
            } catch (errK) {
              kkpUrls.push("Gagal simpan foto: " + errK.message);
            }
          } else {
            kkpUrls.push("Foto ada tapi folder Drive belum siap" + driveErrorNotice);
          }
        }
      }

      // Baris Sesuai Format Kolom Spreadsheet Anda:
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
        sitataUrls.join(", "),                                           // Upload SITATA
        kkpUrls.join(", "),                                              // Upload KKP
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
      message: "Data " + results.length + " kecamatan berhasil disimpan ke Sheet " + sheet.getName() + "!",
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    try {
      lock.releaseLock();
    } catch(e) {}
  }
}

// Cari atau buat folder Tim
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

  var subFolders = parentFolder.getFolders();
  while (subFolders.hasNext()) {
    var f = subFolders.next();
    var fName = f.getName().toUpperCase().replace(/\\s+/g, "");
    var tClean = targetName.replace(/\\s+/g, "");
    if (fName === tClean || f.getName().toUpperCase() === targetName) {
      return f;
    }
  }

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

/**
 * Uji Coba Diagnostik Langsung di Browser
 * Buka Web App URL di tab baru browser untuk melihat hasil ini!
 */
function doGet(e) {
  var ssOk = false;
  var sheetName = "";
  var lastRow = 0;
  var driveOk = false;
  var errMsg = "";

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      ssOk = true;
      var sh = ss.getSheetByName("Sheet1") || ss.getActiveSheet() || ss.getSheets()[0];
      sheetName = sh.getName();
      lastRow = sh.getLastRow();
    }
  } catch(e1) {
    errMsg += "Spreadsheet: " + e1.message + ". ";
  }

  try {
    var folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    if (folder) {
      driveOk = true;
    }
  } catch(e2) {
    errMsg += "Drive: " + e2.message;
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: (ssOk && driveOk) ? "online_siap" : "perlu_perhatian",
    spreadsheetTerhubung: ssOk,
    namaSheet: sheetName,
    jumlahBarisSaatIni: lastRow,
    folderDriveTerhubung: driveOk,
    pesanDiagnostik: errMsg || "Semua koneksi (Spreadsheet & Google Drive) aktif dan siap menerima data!",
    timestamp: new Date().toISOString()
  }, null, 2)).setMimeType(ContentService.MimeType.JSON);
}
`;
