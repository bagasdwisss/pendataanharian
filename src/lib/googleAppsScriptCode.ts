export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - KANTAH ATR/BPN KOTA MEDAN
 * PENDATAAN HARIAN + AUTO SETUP TABEL & HEADER
 * =========================================================================
 *
 * Folder Google Drive:
 * https://drive.google.com/drive/folders/18q1anXDV3cHJT56ooKunFgEumFmbaUM3
 */

var PARENT_FOLDER_ID = "18q1anXDV3cHJT56ooKunFgEumFmbaUM3";

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

    // Siapkan Folder Drive jika ada foto yang diunggah
    var dateFolder = null;
    var hasAnyPhotos = kecamatanList.some(function(k) {
      return (k.sitataBase64List && k.sitataBase64List.length > 0) ||
             (k.kkpBase64List && k.kkpBase64List.length > 0);
    });

    if (hasAnyPhotos) {
      try {
        var parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
        var teamFolder = getTeamFolder(parentFolder, tim);
        dateFolder = getOrCreateSubFolder(teamFolder, todayStr);
      } catch (driveErr) {}
    }

    var results = [];

    // Tulis setiap kecamatan ke baris baru
    for (var i = 0; i < kecamatanList.length; i++) {
      var item = kecamatanList[i];
      var cleanKec = (item.kecamatan || "Kecamatan").replace(/[^a-zA-Z0-9]/g, "_");
      var cleanKel = (item.kelurahan || "Kelurahan").replace(/[^a-zA-Z0-9]/g, "_");

      // Simpan Foto SITATA
      var sitataUrls = [];
      if (item.sitataBase64List && item.sitataBase64List.length > 0 && dateFolder) {
        for (var s = 0; s < item.sitataBase64List.length; s++) {
          try {
            var sFileName = "SITATA_" + cleanKec + "_" + cleanKel + "_" + (s + 1) + "_" + new Date().getTime() + ".jpg";
            sitataUrls.push(saveBase64ToDrive(item.sitataBase64List[s], sFileName, dateFolder));
          } catch (eS) {}
        }
      }

      // Simpan Foto KKP
      var kkpUrls = [];
      if (item.kkpBase64List && item.kkpBase64List.length > 0 && dateFolder) {
        for (var k = 0; k < item.kkpBase64List.length; k++) {
          try {
            var kFileName = "KKP_" + cleanKec + "_" + cleanKel + "_" + (k + 1) + "_" + new Date().getTime() + ".jpg";
            kkpUrls.push(saveBase64ToDrive(item.kkpBase64List[k], kFileName, dateFolder));
          } catch (eK) {}
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
  var upper = (timName || "").toUpperCase();
  if (upper.indexOf("3") > -1 && upper.indexOf("4") === -1 && upper.indexOf("1") === -1) {
    targetName = "TEAM 3";
  } else if (upper.indexOf("4") > -1 && upper.indexOf("1") === -1 && upper.indexOf("3") === -1) {
    targetName = "TEAM 4";
  }

  var subFolders = parentFolder.getFolders();
  while (subFolders.hasNext()) {
    var f = subFolders.next();
    var fName = f.getName().toUpperCase().replace(/\\s+/g, "");
    if (fName === targetName.replace(/\\s+/g, "") || f.getName().toUpperCase() === targetName) {
      return f;
    }
  }
  return parentFolder.createFolder(targetName);
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  var folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(subFolderName);
}

function saveBase64ToDrive(base64Data, filename, folder) {
  var contentType = "image/jpeg";
  var cleanedData = base64Data;
  if (base64Data.indexOf(",") > -1) {
    var parts = base64Data.split(",");
    var mimePart = parts[0].match(/:(.*?);/);
    if (mimePart && mimePart[1]) contentType = mimePart[1];
    cleanedData = parts[1];
  }
  var decoded = Utilities.base64Decode(cleanedData);
  var blob = Utilities.newBlob(decoded, contentType, filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
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

  return ContentService.createTextOutput(JSON.stringify({
    status: "online_siap",
    spreadsheetTerhubung: !!ss,
    namaSheet: sheet ? sheet.getName() : "Tidak ditemukan",
    jumlahBaris: sheet ? sheet.getLastRow() : 0,
    headers: HEADERS,
    pesan: "Tabel dan Header siap! Endpoint siap menerima data."
  }, null, 2)).setMimeType(ContentService.MimeType.JSON);
}
`;
