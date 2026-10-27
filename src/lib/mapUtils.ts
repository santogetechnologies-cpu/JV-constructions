import { Project } from '../types/database';

/**
 * Validates that latitude and longitude are legitimate geographic coordinates.
 * Rejects NaN, null, undefined, out-of-bounds (lat outside -90..90, lng outside -180..180),
 * and dummy values (like 0,0 or 33333333).
 */
export function isValidCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (lat == null || lng == null) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return false;
  if (numLat === 0 && numLng === 0) return false;
  if (numLat < -90 || numLat > 90) return false;
  if (numLng < -180 || numLng > 180) return false;
  return true;
}

/**
 * Parses DMS (Degrees Minutes Seconds) strings such as:
 * - 8°30'48.9"N 77°40'12.3"E
 * - 8°34'17.5"N, 77°40'22.1"E
 * - 8 30 48.9 N 77 40 12.3 E
 */
export function parseDmsCoordinates(
  input: string
): { latitude: number; longitude: number } | null {
  if (!input) return null;
  const dmsRegex =
    /(\d+(?:\.\d+)?)\s*°?\s*(\d+(?:\.\d+)?)\s*['′]?\s*(\d+(?:\.\d+)?)\s*["″]?\s*([NSEWnsew])/g;
  const matches = [...input.matchAll(dmsRegex)];
  if (matches.length >= 2) {
    let lat: number | null = null;
    let lng: number | null = null;
    for (const m of matches) {
      const deg = parseFloat(m[1]);
      const min = parseFloat(m[2]);
      const sec = parseFloat(m[3]);
      const dir = m[4].toUpperCase();
      let dec = deg + min / 60 + sec / 3600;
      if (dir === 'S' || dir === 'W') dec = -dec;
      if (dir === 'N' || dir === 'S') lat = dec;
      if (dir === 'E' || dir === 'W') lng = dec;
    }
    if (isValidCoordinate(lat, lng)) {
      return { latitude: Number(lat!.toFixed(6)), longitude: Number(lng!.toFixed(6)) };
    }
  }
  return null;
}

/**
 * Extracts coordinates and cleans up Google Maps links or input.
 * Handles:
 * - DMS coordinates: "8°30'48.9\"N 77°40'12.3\"E"
 * - Decimal coordinates: "8.513583, 77.670083" or "8.513583 77.670083"
 * - Google maps URLs with @lat,lng: https://www.google.com/maps/@8.513583,77.670083,16z
 * - Google maps URLs with ?q=lat,lng: https://www.google.com/maps?q=8.513583,77.670083
 * - Google maps place URLs with !3dlat!4dlng
 * - Google maps embed iframe: <iframe src="https://..."></iframe>
 * - General share links: https://maps.app.goo.gl/xyz
 */
export function parseMapInput(input: string): {
  latitude: number | null;
  longitude: number | null;
  cleanUrl: string;
} {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    return { latitude: null, longitude: null, cleanUrl: '' };
  }

  // 1. If user pasted an iframe tag, extract the src URL
  let cleanUrl = trimmed;
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    cleanUrl = iframeSrcMatch[1];
  }

  // 2. Check DMS coordinates (e.g. 8°30'48.9"N 77°40'12.3"E)
  const dms = parseDmsCoordinates(cleanUrl);
  if (dms) {
    return {
      latitude: dms.latitude,
      longitude: dms.longitude,
      cleanUrl: `https://www.google.com/maps?q=${dms.latitude},${dms.longitude}`,
    };
  }

  // 3. Check for comma- or whitespace-separated decimal coordinates: e.g. "8.513583, 77.670083"
  const rawCoordsMatch = cleanUrl.match(
    /^([-+]?[0-9]*\.?[0-9]+)[\s,]+([-+]?[0-9]*\.?[0-9]+)$/
  );
  if (rawCoordsMatch) {
    const lat = parseFloat(rawCoordsMatch[1]);
    const lng = parseFloat(rawCoordsMatch[2]);
    if (isValidCoordinate(lat, lng)) {
      return {
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        cleanUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      };
    }
  }

  let latitude: number | null = null;
  let longitude: number | null = null;

  // 4. Search for @lat,lng in URL (e.g. /@8.513583,77.670083,17z)
  const atMatch = cleanUrl.match(/@([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoordinate(lat, lng)) {
      latitude = Number(lat.toFixed(6));
      longitude = Number(lng.toFixed(6));
    }
  }

  // 5. Search for ?q=lat,lng or &query=lat,lng or ll=lat,lng
  if (latitude === null) {
    const queryMatch = cleanUrl.match(
      /[?&](?:q|query|ll)=([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/
    );
    if (queryMatch) {
      const lat = parseFloat(queryMatch[1]);
      const lng = parseFloat(queryMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        latitude = Number(lat.toFixed(6));
        longitude = Number(lng.toFixed(6));
      }
    }
  }

  // 6. Search for destination or coordinates in place URL: !3dlat!4dlng
  if (latitude === null) {
    const placeMatch = cleanUrl.match(
      /!3d([-+]?[0-9]*\.?[0-9]+)!4d([-+]?[0-9]*\.?[0-9]+)/
    );
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        latitude = Number(lat.toFixed(6));
        longitude = Number(lng.toFixed(6));
      }
    }
  }

  // If coordinates were found from URL, standardize cleanUrl
  if (latitude !== null && longitude !== null && !cleanUrl.includes('google.com/maps/embed')) {
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
  }

  return {
    latitude,
    longitude,
    cleanUrl,
  };
}

/**
 * Returns the live Google Maps URL to open in browser / mobile.
 */
export function getProjectLiveMapUrl(project?: Partial<Project> | null): string {
  if (!project) return 'https://www.google.com/maps';

  // 1. If valid coordinates are directly available
  if (isValidCoordinate(project.latitude, project.longitude)) {
    return `https://www.google.com/maps?q=${project.latitude},${project.longitude}`;
  }

  // 2. Check custom map_link
  const customLink =
    (project as any).map_link ||
    project.contact_information?.map_link ||
    project.booking_policy?.map_link;

  if (customLink && customLink.trim()) {
    const parsed = parseMapInput(customLink);
    if (isValidCoordinate(parsed.latitude, parsed.longitude)) {
      return `https://www.google.com/maps?q=${parsed.latitude},${parsed.longitude}`;
    }
    const trimmed = customLink.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  // 3. Check if address itself contains coordinates or map URL
  if (project.address) {
    const parsed = parseMapInput(project.address);
    if (isValidCoordinate(parsed.latitude, parsed.longitude)) {
      return `https://www.google.com/maps?q=${parsed.latitude},${parsed.longitude}`;
    }
    if (project.address.startsWith('http://') || project.address.startsWith('https://')) {
      return project.address;
    }
  }

  // 4. Fallback search query
  const cleanAddr = project.address && !project.address.startsWith('http') ? project.address : '';
  const query = [project.name, cleanAddr, project.city, project.state]
    .filter(Boolean)
    .join(', ');
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return 'https://www.google.com/maps';
}

/**
 * Returns the URL suitable for embedding in an iframe (satellite/hybrid or standard map).
 * Always prioritizes exact coordinates and never passes broken URLs into query string.
 */
export function getProjectEmbedMapUrl(project?: Partial<Project> | null): string {
  if (!project) {
    return 'https://maps.google.com/maps?q=8.513583,77.670083&t=k&z=16&ie=UTF8&iwloc=&output=embed';
  }

  // 1. If coordinates are already valid on project object
  if (isValidCoordinate(project.latitude, project.longitude)) {
    return `https://maps.google.com/maps?q=${project.latitude},${project.longitude}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // 2. Check custom link
  const customLink =
    (project as any).map_link ||
    project.contact_information?.map_link ||
    project.booking_policy?.map_link;

  if (customLink && (customLink.includes('/embed') || customLink.includes('output=embed'))) {
    return customLink;
  }

  if (customLink) {
    const parsed = parseMapInput(customLink);
    if (isValidCoordinate(parsed.latitude, parsed.longitude)) {
      return `https://maps.google.com/maps?q=${parsed.latitude},${parsed.longitude}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
    }
  }

  // 3. Check if address field has coordinates or link
  if (project.address) {
    const parsedAddr = parseMapInput(project.address);
    if (isValidCoordinate(parsedAddr.latitude, parsedAddr.longitude)) {
      return `https://maps.google.com/maps?q=${parsedAddr.latitude},${parsedAddr.longitude}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
    }
  }

  // 4. Fallback: textual query (strictly excluding any URLs or http strings)
  const cleanAddress = project.address && !project.address.startsWith('http') ? project.address : '';
  const queryParts = [cleanAddress, project.city, project.state, 'Tamil Nadu'].filter(
    (part) => part && !part.startsWith('http')
  );

  const query = queryParts.join(', ') || project.name || 'Tamil Nadu';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=k&z=15&ie=UTF8&iwloc=&output=embed`;
}
