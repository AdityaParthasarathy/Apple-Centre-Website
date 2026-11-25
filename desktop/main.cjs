// The Apple Centre desktop app: the live website in its own window. All of the
// site's pages and portals are the website itself, so changes to the site reach
// the app the moment they go live; this file only provides the window.

const { app, BrowserWindow, Menu, dialog, session, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

// Point the app somewhere else for testing, e.g. APPLE_CENTRE_URL=http://localhost:3000
const SITE_URL = (process.env.APPLE_CENTRE_URL || 'https://apple-centre-rit.vercel.app').replace(/\/$/, '')
const SITE_ORIGIN = new URL(SITE_URL).origin

app.setAppUserModelId('edu.rit.applecentre')

// One window only: opening the app again brings the first one forward.
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

let win = null

const stateFile = () => path.join(app.getPath('userData'), 'window-state.json')

function loadWindowState() {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile(), 'utf8'))
    if (saved && Number.isFinite(saved.width) && Number.isFinite(saved.height)) return saved
  } catch {
    // First run, or an unreadable file: start with the defaults.
  }
  return { width: 1280, height: 860 }
}

function saveWindowState() {
  if (!win || win.isDestroyed()) return
  try {
    const { x, y, width, height } = win.getNormalBounds()
    fs.writeFileSync(stateFile(), JSON.stringify({ x, y, width, height, maximized: win.isMaximized() }))
  } catch {
    // Not worth stopping the app over.
  }
}

const isSite = (url) => {
  try {
    return new URL(url).origin === SITE_ORIGIN
  } catch {
    return false
  }
}

const isGoogleSignIn = (url) => {
  try {
    return new URL(url).hostname === 'accounts.google.com'
  } catch {
    return false
  }
}

function openInBrowser(url) {
  // Only ordinary web addresses; never a file path or another program's protocol.
  try {
    const { protocol } = new URL(url)
    if (protocol === 'https:' || protocol === 'http:') shell.openExternal(url)
  } catch {
    // Not a valid address: ignore.
  }
}

// Google does not let people sign in inside another app's window, so say so and
// offer the browser instead of leaving a blank error page.
async function explainGoogle() {
  const { response } = await dialog.showMessageBox(win, {
    type: 'info',
    title: 'Google sign-in',
    message: "Google sign-in isn't available inside the app",
    detail:
      "Google doesn't allow sign-in inside desktop apps. Sign in here with your username and password, or open the website in your browser to use Google.",
    buttons: ['OK', 'Open in browser'],
    defaultId: 0,
    cancelId: 0,
  })
  if (response === 1) openInBrowser(`${SITE_URL}/members/login`)
}

function sendOutside(url) {
  if (isGoogleSignIn(url)) explainGoogle()
  else openInBrowser(url)
}

function go(pathname) {
  if (win) win.loadURL(`${SITE_URL}${pathname}`)
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Home', accelerator: 'CmdOrCtrl+H', click: () => go('/') },
        { label: 'Members Portal', click: () => go('/members') },
        { label: 'Faculty Portal', click: () => go('/staff') },
        { type: 'separator' },
        { label: 'Privacy Policy', click: () => go('/privacy') },
        { label: 'Open Current Page in Browser', click: () => win && openInBrowser(win.webContents.getURL()) },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Go',
      submenu: [
        { label: 'Back', accelerator: 'Alt+Left', click: () => win && win.webContents.navigationHistory.canGoBack() && win.webContents.navigationHistory.goBack() },
        { label: 'Forward', accelerator: 'Alt+Right', click: () => win && win.webContents.navigationHistory.canGoForward() && win.webContents.navigationHistory.goForward() },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  const state = loadWindowState()
  win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 420,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#fafafa',
    title: 'Apple Centre',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  if (state.maximized) win.maximize()

  // Show it once there is something to show, not as a blank white box.
  win.once('ready-to-show', () => win.show())
  win.on('close', saveWindowState)
  win.on('closed', () => {
    win = null
  })

  const contents = win.webContents

  // Links that would open a new window: the site's own stay in this window,
  // everything else goes to the browser.
  contents.setWindowOpenHandler(({ url }) => {
    if (isSite(url)) go(new URL(url).pathname + new URL(url).search)
    else sendOutside(url)
    return { action: 'deny' }
  })

  // The window only ever shows the site; any other address is handed off.
  const guard = (event, url) => {
    if (isSite(url)) return
    event.preventDefault()
    sendOutside(url)
  }
  contents.on('will-navigate', guard)
  contents.on('will-redirect', guard)

  // No connection (or the site is down): a friendly page with a retry button.
  contents.on('did-fail-load', (_event, errorCode, _description, failedUrl, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return // -3: the load was replaced by another, not an error
    win.loadFile(path.join(__dirname, 'offline.html'), { query: { retry: failedUrl || SITE_URL } })
  })

  win.loadURL(SITE_URL)
}

app.whenReady().then(() => {
  // The site needs none of these; refuse them rather than ask.
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(permission === 'fullscreen' || permission === 'clipboard-sanitized-write')
  })

  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('second-instance', () => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.focus()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
