import { Project } from '../types/database';

/**
 * Extracts coordinates and cleans up Google Maps links or input.
 * Handles:
 * - Direct coordinate strings: "11.0168, 76.9558"
 * - Google maps URLs with @lat,lng: https://www.google.com/maps/@11.0168,76.9558,16z
 * - Google maps URLs with ?q=lat,lng: https://www.google.com/maps?q=11.0168,76.9558
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

  // 2. Check for comma-separated coordinates: e.g. "11.0168, 76.9558"
  const rawCoordsMatch = cleanUrl.match(/^([-+]?[0-9]*\.?[0-9]+)\s*,\s*([-+]?[0-9]*\.?[0-9]+)$/);
  if (rawCoordsMatch) {
    const lat = parseFloat(rawCoordsMatch[1]);
    const lng = parseFloat(rawCoordsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        latitude: lat,
        longitude: lng,
        cleanUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      };
    }
  }

  let latitude: number | null = null;
  let longitude: number | null = null;

  // 3. Search for @lat,lng in URL (e.g. /@11.0168445,76.9558321,17z)
  const atMatch = cleanUrl.match(/@([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      latitude = lat;
      longitude = lng;
    }
  }

  // 4. Search for ?q=lat,lng or &query=lat,lng or ll=lat,lng
  if (latitude === null) {
    const queryMatch = cleanUrl.match(/[?&](?:q|query|ll)=([-+]?[0-9]*\.?[0-9]+),([-+]?[0-9]*\.?[0-9]+)/);
    if (queryMatch) {
      const lat = parseFloat(queryMatch[1]);
      const lng = parseFloat(queryMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        latitude = lat;
        longitude = lng;
      }
    }
  }

  // 5. Search for destination or coordinates in place URL
  if (latitude === null) {
    const placeMatch = cleanUrl.match(/!3d([-+]?[0-9]*\.?[0-9]+)!4d([-+]?[0-9]*\.?[0-9]+)/);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        latitude = lat;
        longitude = lng;
      }
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

  const customLink =
    (project as any).map_link ||
    project.contact_information?.map_link ||
    project.booking_policy?.map_link;

  if (customLink && customLink.trim()) {
    const trimmed = customLink.trim();
    // If it's raw coordinates
    if (/^[-+]?[0-9]*\.?[0-9]+\s*,\s*[-+]?[0-9]*\.?[0-9]+$/.test(trimmed)) {
      return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}`;
    }
    // If it's already a full URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  if (project.latitude && project.longitude) {
    return `https://www.google.com/maps?q=${project.latitude},${project.longitude}`;
  }

  if (project.city || project.name) {
    const query = [project.name, project.city, project.state].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return 'https://www.google.com/maps';
}

/**
 * Returns the URL suitable for embedding in an iframe (satellite/hybrid or standard map).
 */
export function getProjectEmbedMapUrl(project?: Partial<Project> | null): string {
  if (!project) {
    return 'https://maps.google.com/maps?q=11.0168,76.9558&t=k&z=16&ie=UTF8&iwloc=&output=embed';
  }

  const customLink =
    (project as any).map_link ||
    project.contact_information?.map_link ||
    project.booking_policy?.map_link;

  // If already an embed link
  if (customLink && (customLink.includes('/embed') || customLink.includes('output=embed'))) {
    return customLink;
  }

  // If coordinates are available
  const lat = project.latitude;
  const lng = project.longitude;
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    return `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // Try extracting from customLink if present
  if (customLink) {
    const parsed = parseMapInput(customLink);
    if (parsed.latitude != null && parsed.longitude != null) {
      return `https://maps.google.com/maps?q=${parsed.latitude},${parsed.longitude}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;
    }
  }

  // Fallback to location query
  const query = [project.address, project.city, project.state].filter(Boolean).join(', ') || project.name || 'Tamil Nadu';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=k&z=15&ie=UTF8&iwloc=&output=embed`;
}
