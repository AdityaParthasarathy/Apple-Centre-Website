# Apple Centre desktop app

The live website in its own Windows window (Electron). It is the website itself, so site changes reach the app as soon as they go live; this folder only provides the window. It is a separate project from the website: its own `package.json`, ignored by the website's build.

```
cd desktop
npm install
npm start                # run from source
npm run dist             # build the installer -> dist/Apple Centre Setup <version>.exe
```

- Point it elsewhere for testing: `APPLE_CENTRE_URL=http://localhost:3000 npm start` (PowerShell: `$env:APPLE_CENTRE_URL='http://localhost:3000'; npm start`).
- Google sign-in does not work inside any desktop app's window (Google blocks it), so the app explains that and offers to open the browser. Username and password sign-in works normally.
- The installer is not code-signed, so Windows SmartScreen shows "unknown publisher" on first run (More info → Run anyway). Signing needs a paid certificate.
- Bump `version` in `package.json` before building a new installer.
