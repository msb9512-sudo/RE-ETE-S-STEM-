
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import fs from 'node:fs'
import os from 'node:os'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

// --- FILE SYSTEM STORAGE SETUP ---
const DOCUMENTS_PATH = app.getPath('documents');
const DATA_FOLDER = path.join(DOCUMENTS_PATH, 'OtelStokVerileri');

// Klasör yoksa oluştur (Senkron olarak başlangıçta garanti et)
if (!fs.existsSync(DATA_FOLDER)) {
  try {
    fs.mkdirSync(DATA_FOLDER, { recursive: true });
    console.log("Veri klasörü oluşturuldu:", DATA_FOLDER);
  } catch (err) {
    console.error("Veri klasörü oluşturma hatası:", err);
  }
}

// IPC Handlers
ipcMain.handle('get-data', async (event, key) => {
  try {
    const filePath = path.join(DATA_FOLDER, `${key}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      try {
        return { data: JSON.parse(data), error: null };
      } catch (parseErr) {
        console.error(`JSON ayrıştırma hatası (${key}):`, parseErr);
        return { data: null, error: 'INVALID_JSON' };
      }
    }
    return { data: null, error: 'FILE_NOT_FOUND' };
  } catch (err) {
    console.error(`Dosya okuma hatası (${key}):`, err);
    return { data: null, error: 'READ_ERROR' };
  }
});

ipcMain.on('save-data', (event, key, data) => {
  try {
    // Klasörün varlığını her yazmada kontrol et (silinmiş olabilir)
    if (!fs.existsSync(DATA_FOLDER)) {
      fs.mkdirSync(DATA_FOLDER, { recursive: true });
    }
    
    const filePath = path.join(DATA_FOLDER, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    // console.log(`${key} kaydedildi.`); 
  } catch (err) {
    console.error(`Dosya yazma hatası (${key}):`, err);
  }
});

ipcMain.on('open-data-folder', () => {
  shell.openPath(DATA_FOLDER);
});

// --- MACHINE ID GENERATOR ---
// Bu kısım cihazın donanım özelliklerine göre sabit bir ID üretir.
ipcMain.handle('get-machine-id', () => {
  try {
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'unknown-cpu';
    const totalMem = os.totalmem();
    
    // Benzersiz bir string oluştur
    const rawId = `${platform}-${arch}-${hostname}-${cpuModel}-${totalMem}`;
    
    // Hash'le (MD5 veya SHA256) ve kısa, okunabilir bir formata çevir
    const hash = crypto.createHash('sha256').update(rawId).digest('hex');
    
    // Örn: A1B2-C3D4-E5F6-G7H8 formatına benzer ilk 16 karakter
    const shortId = hash.substring(0, 16).toUpperCase().match(/.{1,4}/g)?.join('-') || 'UNKNOWN-ID';
    
    return shortId;
  } catch (error) {
    console.error("Machine ID Error:", error);
    return "GENERIC-ID-0000";
  }
});

// ---------------------------------

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false, // Preload scriptin window objesine erişmesi için
    },
    autoHideMenuBar: false, 
  })

  // win.webContents.openDevTools()

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST || '', 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
