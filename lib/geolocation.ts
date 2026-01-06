/**
 * Geolocation utilities for getting user location from IP address
 */

export interface IPLocation {
  country: string
  countryCode: string
  city?: string
  latitude: number
  longitude: number
  region?: string
}

/**
 * Normalize country names to official abbreviations where applicable
 */
function normalizeCountryName(countryName: string): string {
  const countryMappings: Record<string, string> = {
    'United States': 'USA',
    'United States of America': 'USA',
    'United Kingdom': 'UK',
    'United Arab Emirates': 'UAE',
  }
  
  return countryMappings[countryName] || countryName
}

/**
 * Get user location from IP address using ipapi.co (free tier)
 * Falls back to ip-api.com if first fails
 */
export async function getUserLocationFromIP(): Promise<IPLocation | null> {
  try {
    // Try ipapi.co first (free, no API key needed for basic usage)
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.latitude && data.longitude && data.country_name) {
        return {
          country: normalizeCountryName(data.country_name),
          countryCode: data.country_code || data.country_code_iso3,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          region: data.region,
        }
      }
    }
  } catch (error) {
    console.warn('ipapi.co failed, trying fallback:', error)
  }

  try {
    // Fallback to ip-api.com (free, no API key needed)
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,city,lat,lon,regionName', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.status === 'success' && data.lat && data.lon && data.country) {
        return {
          country: normalizeCountryName(data.country),
          countryCode: data.countryCode,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon,
          region: data.regionName,
        }
      }
    }
  } catch (error) {
    console.warn('ip-api.com fallback failed:', error)
  }

  // If both fail, return null (will use default view)
  return null
}

/**
 * Get country center coordinates (approximate center of country)
 * Returns a default center if country not found
 */
export function getCountryCenter(countryName: string): { lat: number; lng: number; zoom: number } {
  // Normalize country name to abbreviation first
  const normalizedName = normalizeCountryName(countryName)
  
  // Approximate centers for major countries (can be expanded)
  const countryCenters: Record<string, { lat: number; lng: number; zoom: number }> = {
    'USA': { lat: 39.8283, lng: -98.5795, zoom: 4 },
    'Canada': { lat: 56.1304, lng: -106.3468, zoom: 4 },
    'UK': { lat: 54.7024, lng: -3.2766, zoom: 6 },
    'Germany': { lat: 51.1657, lng: 10.4515, zoom: 6 },
    'France': { lat: 46.2276, lng: 2.2137, zoom: 6 },
    'Italy': { lat: 41.8719, lng: 12.5674, zoom: 6 },
    'Spain': { lat: 40.4637, lng: -3.7492, zoom: 6 },
    'Netherlands': { lat: 52.1326, lng: 5.2913, zoom: 7 },
    'Belgium': { lat: 50.5039, lng: 4.4699, zoom: 7 },
    'Switzerland': { lat: 46.8182, lng: 8.2275, zoom: 7 },
    'Austria': { lat: 47.5162, lng: 14.5501, zoom: 7 },
    'Poland': { lat: 51.9194, lng: 19.1451, zoom: 6 },
    'India': { lat: 20.5937, lng: 78.9629, zoom: 5 },
    'China': { lat: 35.8617, lng: 104.1954, zoom: 4 },
    'Japan': { lat: 36.2048, lng: 138.2529, zoom: 6 },
    'South Korea': { lat: 35.9078, lng: 127.7669, zoom: 7 },
    'Singapore': { lat: 1.3521, lng: 103.8198, zoom: 11 },
    'Australia': { lat: -25.2744, lng: 133.7751, zoom: 4 },
    'Brazil': { lat: -14.2350, lng: -51.9253, zoom: 4 },
    'Mexico': { lat: 23.6345, lng: -102.5528, zoom: 5 },
    'Argentina': { lat: -38.4161, lng: -63.6167, zoom: 4 },
    'South Africa': { lat: -30.5595, lng: 22.9375, zoom: 5 },
    'Nigeria': { lat: 9.0820, lng: 8.6753, zoom: 6 },
    'Egypt': { lat: 26.0975, lng: 30.0444, zoom: 6 },
    'Israel': { lat: 31.0461, lng: 34.8516, zoom: 7 },
    'UAE': { lat: 23.4241, lng: 53.8478, zoom: 7 },
    'Turkey': { lat: 38.9637, lng: 35.2433, zoom: 6 },
    'Russia': { lat: 61.5240, lng: 105.3188, zoom: 3 },
  }

  // Try exact match first
  if (countryCenters[normalizedName]) {
    return countryCenters[normalizedName]
  }

  // Try case-insensitive match
  const normalizedCountry = Object.keys(countryCenters).find(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  )
  if (normalizedCountry) {
    return countryCenters[normalizedCountry]
  }

  // Default: return world view
  return { lat: 20, lng: 0, zoom: 2 }
}

