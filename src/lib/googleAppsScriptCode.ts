export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - KANTAH ATR/BPN KOTA MEDAN
 * PENDATAAN HARIAN + AUTO SETUP TABEL & HEADER
 * =========================================================================
 *
 * Folder Google Drive Induk:
 * https://drive.google.com/drive/folders/1Gv-qZF-at6F-3KMZkdPNdZUnVSlDohQ6
 */

var PARENT_FOLDER_ID = "1Gv-qZF-at6F-3KMZkdPNdZUnVSlDohQ6";

// Daftar 14 Kolom Header Resmi
var HEADERS = [
  "Timestamp",
  "TIM",
  "Kecamatan",
  "Kelurahan",
  "Berhasil Plotting",
  "Digitasi",
  "Overlap",
  "Pemecahan",
  "Belum bisa teridentifikasi",
  "Dimatikan",
  "Diluar Batas Administrasi",
  "Upload SITATA",
  "Upload KKP",
  "Hari & Tanggal"
];

/**
 * JALANKAN FUNGSI INI SEKALI UNTUK MENGAKTIFKAN IZIN GOOGLE DRIVE!
 * Di dropdown fungsi atas, pilih 'tesIzinDrive' lalu klik tombol 'Run / Jalankan'.
 */
function tesIzinDrive() {
  var folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
  Logger.log("✅ Berhasil! Terhubung ke Folder Drive: " + folder.getName());
  return "Berhasil terhubung ke folder: " + folder.getName();
}

/**
 * Menu otomatis di bilah menu Google Sheets
 * Saat Anda membuka Spreadsheet, akan muncul menu '🏛️ Kantah Medan' di samping menu Bantuan
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🏛️ Kantah Medan")
    .addItem("✨ Buat Header & Format Tabel Otomatis", "setupTableAndHeaders")
    .addToUi();
}

/**
 * FUNGSI UTAMA UNTUK MEMBUAT TABEL & HEADER CANTIK SECARA OTOMATIS
 * Anda bisa menjalankannya langsung dari editor Apps Script atau lewat menu di Spreadsheet!
 */
function setupTableAndHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet() || ss.getSheets()[0];

  // 1. Tulis Header di Baris 1
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);

  // 2. Format Tampilan Header (Modern Dark Neo-Brutalist)
  headerRange
    .setBackground("#1E1B4B")      // Warna latar biru gelap / indigo mewah
    .setFontColor("#FFFFFF")       // Teks putih kontras tinggi
    .setFontWeight("bold")         // Huruf tebal
    .setFontSize(10)               // Ukuran font proporsional
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  // Atur tinggi baris header agar lega
  sheet.setRowHeight(1, 42);

  // 3. Bekukan Baris Pertama (Freeze Header Row) agar tetap terlihat saat scroll ke bawah
  sheet.setFrozenRows(1);

  // 4. Atur Lebar Kolom yang Ideal & Rapi
  var columnWidths = [
    160, // Timestamp
    90,  // TIM
    180, // Kecamatan
    180, // Kelurahan
    120, // Berhasil Plotting
    90,  // Digitasi
    90,  // Overlap
    100, // Pemecahan
    150, // Belum bisa teridentifikasi
    100, // Dimatikan
    160, // Diluar Batas Administrasi
    220, // Upload SITATA
    220, // Upload KKP
    140  // Hari & Tanggal
  ];

  for (var c = 0; c < columnWidths.length; c++) {
    sheet.setColumnWidth(c + 1, columnWidths[c]);
  }

  // 5. Tambahkan Border Tegas pada Header
  headerRange.setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  return "Header dan format tabel berhasil dibuat rapi!";
}

/**
 * Memastikan header sudah ada sebelum data baru ditulis
 */
function ensureHeadersExist(sheet) {
  var firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell || firstCell.toString().trim() === "") {
    setupTableAndHeaders();
  }
}

/**
 * Penerima Pengiriman Formulir dari Web
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (t) {}

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data postData yang diterima"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error("Script tidak terhubung ke Spreadsheet!");
    }

    var sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet() || ss.getSheets()[0];

    // Pastikan Header & Tabel sudah terbentuk
    ensureHeadersExist(sheet);

    var tim = payload.tim || "TIM 1&2";
    var hariTanggal = payload.hariTanggal || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
    var todayStr = Utilities.formatDate(new Date(), "GMT+7", "dd-MM-yyyy");
    var kecamatanList = payload.kecamatanList || [];

    // 1. Siapkan Folder Google Drive Target Berjenjang:
    // TEAM -> TANGGAL -> Subfolder (SITATA & KKP)
    var teamFolder = null;
    var dateFolder = null;
    var sitataFolder = null;
    var kkpFolder = null;
    var folderErrMsg = "";

    try {
      var parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
      teamFolder = getTeamFolder(parentFolder, tim);
      dateFolder = getOrCreateSubFolder(teamFolder, todayStr);
      sitataFolder = getOrCreateSubFolder(dateFolder, "SITATA");
      kkpFolder = getOrCreateSubFolder(dateFolder, "KKP");
    } catch (eDrive) {
      folderErrMsg = eDrive.toString();
      Logger.log("Drive folder error: " + folderErrMsg);
    }

    var results = [];

    // Tulis setiap kecamatan ke baris baru
    for (var i = 0; i < kecamatanList.length; i++) {
      var item = kecamatanList[i];
      var cleanKec = (item.kecamatan || "Kecamatan").replace(/[^a-zA-Z0-9]/g, "_");
      var cleanKel = (item.kelurahan || "Kelurahan").replace(/[^a-zA-Z0-9]/g, "_");

      // Simpan Berkas SITATA (Format PDF ke Folder SITATA)
      var sitataUrls = [];
      var sitataList = item.sitataPdfFiles || item.sitataBase64List || [];
      if (sitataList.length > 0) {
        var targetSitataFolder = sitataFolder || dateFolder || teamFolder;
        if (!targetSitataFolder) {
          sitataUrls.push("[Gagal Drive: Folder tidak dapat diakses - " + folderErrMsg + "]");
        } else {
          for (var s = 0; s < sitataList.length; s++) {
            try {
              var sObj = sitataList[s];
              var sB64 = (typeof sObj === "object" && sObj.base64) ? sObj.base64 : sObj;
              var sFileName = (typeof sObj === "object" && sObj.name) ? sObj.name : ("SITATA_" + cleanKec + "_" + cleanKel + "_" + (s + 1) + ".pdf");
              var sUrl = saveBase64PdfToDrive(sB64, sFileName, targetSitataFolder);
              sitataUrls.push(sUrl);
            } catch (eS) {
              sitataUrls.push("[Gagal Simpan SITATA: " + eS.message + "]");
            }
          }
        }
      }

      // Simpan Berkas KKP (Format PDF ke Folder KKP)
      var kkpUrls = [];
      var kkpList = item.kkpPdfFiles || item.kkpBase64List || [];
      if (kkpList.length > 0) {
        var targetKkpFolder = kkpFolder || dateFolder || teamFolder;
        if (!targetKkpFolder) {
          kkpUrls.push("[Gagal Drive: Folder tidak dapat diakses - " + folderErrMsg + "]");
        } else {
          for (var k = 0; k < kkpList.length; k++) {
            try {
              var kObj = kkpList[k];
              var kB64 = (typeof kObj === "object" && kObj.base64) ? kObj.base64 : kObj;
              var kFileName = (typeof kObj === "object" && kObj.name) ? kObj.name : ("KKP_" + cleanKec + "_" + cleanKel + "_" + (k + 1) + ".pdf");
              var kUrl = saveBase64PdfToDrive(kB64, kFileName, targetKkpFolder);
              kkpUrls.push(kUrl);
            } catch (eK) {
              kkpUrls.push("[Gagal Simpan KKP: " + eK.message + "]");
            }
          }
        }
      }

      // Baris Sesuai 14 Kolom Header:
      var row = [
        Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"), // 1. Timestamp
        tim,                                                             // 2. TIM
        item.kecamatan || "",                                            // 3. Kecamatan
        item.kelurahan || "",                                            // 4. Kelurahan
        Number(item.berhasilPlotting) || 0,                              // 5. Berhasil Plotting
        Number(item.digitasi) || 0,                                      // 6. Digitasi
        Number(item.overlap) || 0,                                       // 7. Overlap
        Number(item.pemecahan) || 0,                                     // 8. Pemecahan
        Number(item.belumTeridentifikasi) || 0,                          // 9. Belum bisa teridentifikasi
        Number(item.dimatikan) || 0,                                     // 10. Dimatikan
        Number(item.diluarBatasAdministrasi) || 0,                       // 11. Diluar Batas Administrasi
        sitataUrls.join(", "),                                           // 12. Upload SITATA
        kkpUrls.join(", "),                                              // 13. Upload KKP
        hariTanggal                                                      // 14. Hari & Tanggal
      ];

      sheet.appendRow(row);

      // Berikan style rapi pada baris data baru
      var lastRow = sheet.getLastRow();
      var dataRange = sheet.getRange(lastRow, 1, 1, HEADERS.length);
      dataRange.setVerticalAlignment("middle");
      dataRange.setFontSize(9);
      sheet.setRowHeight(lastRow, 30);

      // Buat border tipis
      dataRange.setBorder(true, true, true, true, true, true, "#E5E7EB", SpreadsheetApp.BorderStyle.SOLID);

      results.push({ kecamatan: item.kecamatan, kelurahan: item.kelurahan });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data " + results.length + " kecamatan berhasil disimpan!",
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function getTeamFolder(parentFolder, timName) {
  var targetName = "TEAM 1&2";
  var upper = (timName || "").toUpperCase().replace(/\s+/g, "");
  if (upper.indexOf("3") > -1 || upper.indexOf("4") > -1) {
    targetName = "TEAM 3&4";
  }

  try {
    var subFolders = parentFolder.getFolders();
    while (subFolders.hasNext()) {
      var f = subFolders.next();
      var fName = f.getName().toUpperCase().replace(/\s+/g, "");
      if (
        fName === targetName.replace(/\s+/g, "") ||
        fName === targetName.replace("TEAM", "TIM").replace(/\s+/g, "")
      ) {
        return f;
      }
    }
    return parentFolder.createFolder(targetName);
  } catch (err) {
    return parentFolder;
  }
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  try {
    var folders = parentFolder.getFoldersByName(subFolderName);
    if (folders.hasNext()) return folders.next();
    return parentFolder.createFolder(subFolderName);
  } catch (err) {
    return parentFolder;
  }
}

function saveBase64PdfToDrive(base64Data, filename, folder) {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Data berkas kosong atau tidak valid");
  }
  var contentType = "application/pdf";
  var cleanedData = base64Data;
  if (base64Data.indexOf(",") > -1) {
    var parts = base64Data.split(",");
    var mimePart = parts[0].match(/:(.*?);/);
    if (mimePart && mimePart[1]) {
      contentType = mimePart[1];
    }
    cleanedData = parts[1];
  }

  // Pastikan nama file berakhiran .pdf
  if (filename.toLowerCase().indexOf(".pdf") === -1) {
    filename = filename.replace(/\.[^/.]+$/, "") + ".pdf";
  }

  var decoded = Utilities.base64Decode(cleanedData);
  var blob = Utilities.newBlob(decoded, contentType, filename);
  var file = folder.createFile(blob);

  // Coba bagikan link agar dapat diakses oleh tim
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (eShare) {}

  return file.getUrl();
}

function saveBase64ToDrive(base64Data, filename, folder) {
  return saveBase64PdfToDrive(base64Data, filename, folder);
}

/**
 * Diagnostik GET: Sekaligus memastikan tabel & header terpasang
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? (ss.getSheetByName("Sheet1") || ss.getActiveSheet() || ss.getSheets()[0]) : null;

  if (sheet) {
    ensureHeadersExist(sheet);
  }

  var driveOk = false;
  var driveInfo = "";
  try {
    var folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    if (folder) {
      driveOk = true;
      driveInfo = "Terhubung (" + folder.getName() + ")";
    }
  } catch(eDrive) {
    driveInfo = eDrive.message;
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: (ss && driveOk) ? "online_siap" : "perlu_perhatian",
    spreadsheetTerhubung: !!ss,
    namaSheet: sheet ? sheet.getName() : "Tidak ditemukan",
    jumlahBaris: sheet ? sheet.getLastRow() : 0,
    folderDriveTerhubung: driveOk,
    pesanDrive: driveInfo,
    headers: HEADERS,
    pesan: "Tabel dan Header siap! Endpoint siap menerima data."
  }, null, 2)).setMimeType(ContentService.MimeType.JSON);
}
`;
