// Loaded as native browser modules by bootstrap.mjs, outside Metro's classic
// script bundle. MapLibre 6's worker URL uses import.meta, which requires ESM.
import type * as MapLibre from 'maplibre-gl';
declare global { interface Window { __clefMapLibre: typeof MapLibre } }
export const maplibregl = window.__clefMapLibre;
