/**
 * Güvenli logger - production build'lerde otomatik susturulur.
 *
 * Kullanım:
 *   import { log, warn, error } from '../utils/logger';
 *   log("debug mesajı");
 *
 * Vite, import.meta.env.DEV ve PROD sabitlerini build sırasında inline eder,
 * yani dead-code elimination ile prod bundle'ında bu çağrılar tamamen kaybolur.
 */

const isDev = import.meta.env?.DEV ?? false;

export const log = (...args) => {
  if (isDev) console.log(...args);
};

export const warn = (...args) => {
  if (isDev) console.warn(...args);
};

// Hatalar her zaman loglanmalı (konsol + gelecekteki crash reporting).
export const error = (...args) => {
  console.error(...args);
};
