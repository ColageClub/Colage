// Geohash encoding/decoding — no external dependencies
// Base32 alphabet used by standard geohash
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode lat/lng to a geohash string.
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @param {number} precision - Number of characters (1-12). Default 7 (~150m x 150m cells)
 * @returns {string} Geohash string
 */
export function encode(lat, lng, precision = 7) {
  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isLng = true; // Alternate: lng first, then lat

  while (hash.length < precision) {
    if (isLng) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        ch |= (1 << (4 - bit));
        lngMin = mid;
      } else {
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= (1 << (4 - bit));
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isLng = !isLng;
    bit++;

    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

/**
 * Decode a geohash string to a bounding box.
 * @param {string} hash - Geohash string
 * @returns {{ latMin: number, latMax: number, lngMin: number, lngMax: number, lat: number, lng: number }}
 */
export function decode(hash) {
  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;
  let isLng = true;

  for (const c of hash) {
    const bits = BASE32.indexOf(c);
    if (bits === -1) break;

    for (let i = 4; i >= 0; i--) {
      if (isLng) {
        const mid = (lngMin + lngMax) / 2;
        if (bits & (1 << i)) {
          lngMin = mid;
        } else {
          lngMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (bits & (1 << i)) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isLng = !isLng;
    }
  }

  return {
    latMin, latMax, lngMin, lngMax,
    lat: (latMin + latMax) / 2,
    lng: (lngMin + lngMax) / 2,
  };
}

/**
 * Get the 8 neighboring geohash cells + the cell itself (9 total).
 * This ensures we don't miss students near cell boundaries.
 * @param {string} hash - Center geohash
 * @returns {string[]} Array of 9 geohash prefixes to query
 */
export function neighbors(hash) {
  const { lat, lng } = decode(hash);
  const box = decode(hash);
  const latDelta = box.latMax - box.latMin;
  const lngDelta = box.lngMax - box.lngMin;

  const cells = new Set();
  for (const dLat of [-latDelta, 0, latDelta]) {
    for (const dLng of [-lngDelta, 0, lngDelta]) {
      const neighborHash = encode(lat + dLat, lng + dLng, hash.length);
      cells.add(neighborHash);
    }
  }

  return [...cells];
}

/**
 * Pick the right geohash precision for a given search radius.
 * Returns the number of characters that gives cells roughly matching the radius.
 *
 * Precision → approximate cell size:
 *   4 → ~40km x 20km
 *   5 → ~5km x 5km
 *   6 → ~1.2km x 600m
 *   7 → ~150m x 150m
 *   8 → ~38m x 19m
 *
 * @param {number} radiusFeet - Search radius in feet
 * @returns {number} Geohash precision (characters)
 */
export function precisionForRadius(radiusFeet) {
  const radiusMeters = radiusFeet * 0.3048;
  if (radiusMeters > 5000) return 5;   // ~5km cells
  if (radiusMeters > 1200) return 6;   // ~1.2km cells
  if (radiusMeters > 150) return 7;    // ~150m cells — default for campus
  return 8;                             // ~38m cells — very tight
}
