/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly,
  NetworkFirst,
  ExpirationPlugin,
} from "serwist";

// Deklarasi global scope untuk Serwist Service Worker
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. Matriks CP, Kurikulum, dan Job Cards (DESIGN.md §7.4: StaleWhileRevalidate)
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/api/v1/curricula") ||
        url.pathname.startsWith("/api/v1/job-cards") ||
        url.pathname.startsWith("/api/v1/departments"),
      handler: new StaleWhileRevalidate({
        cacheName: "vokalink-curricula-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
          }),
        ],
      }),
    },

    // 2. Map Tiles OpenStreetMap (DESIGN.md §7.4: CacheFirst terbatas)
    {
      matcher: ({ url }) =>
        url.hostname.includes("tile.openstreetmap.org") ||
        url.hostname.includes("openstreetmap"),
      handler: new CacheFirst({
        cacheName: "vokalink-osm-tiles",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100, // Batas 100 tiles agar hemat memori
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 hari
          }),
        ],
      }),
    },

    // 3. API Sinkronisasi Logbook & Evidence (DESIGN.md §7.4: NetworkOnly)
    // Penanganan offline & antrean retry dikelola sepenuhnya oleh Dexie.js di aplikasi
    {
      matcher: ({ url, request }) =>
        url.pathname.startsWith("/api/v1/logs") &&
        (request.method === "POST" || request.method === "PUT" || request.method === "DELETE"),
      handler: new NetworkOnly(),
    },

    // 4. Halaman Verifikasi Paspor Publik /verify/* (DESIGN.md §7.4: NetworkFirst 3s timeout)
    {
      matcher: ({ url }) => url.pathname.startsWith("/verify/"),
      handler: new NetworkFirst({
        cacheName: "vokalink-verify-passport",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 24 * 60 * 60, // 1 hari
          }),
        ],
      }),
    },

    // 5. Default Next.js App Shell & Static Asset Caching
    ...defaultCache,
  ],
});

serwist.addEventListeners();
