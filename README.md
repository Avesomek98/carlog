# CarLog

Planer serwisu, terminów prawnych (OC/AC, przegląd techniczny) i budżetu samochodu. PWA, dane trzymane lokalnie w przeglądarce (IndexedDB) — bez backendu, działa offline.

## Uruchomienie

```
npm install
npm run dev
```

Na Windows z PowerShell, jeśli `npm` zgłasza błąd polityki wykonywania skryptów, użyj `npm.cmd run dev`.

## Build produkcyjny

```
npm run build
npm run preview
```

## Stack

Vite + React + TypeScript, Dexie.js (IndexedDB), vite-plugin-pwa, react-router-dom.
