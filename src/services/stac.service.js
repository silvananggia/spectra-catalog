import axiosInstance from '../api/axios';

/**
 * STAC Service
 * Handles all STAC API calls
 */

/**
 * Fetch STAC Catalog root
 * @returns {Promise} STAC Catalog JSON
 */
export const fetchCatalog = async () => {
  const response = await axiosInstance.get('/');
  return response.data;
};

/**
 * Fetch STAC Collections
 * @returns {Promise} STAC Collections JSON
 */
export const fetchCollections = async () => {
  const response = await axiosInstance.get('/collections');
  return response.data;
};

/**
 * Fetch a specific STAC Collection
 * @param {string} collectionId - Collection ID
 * @returns {Promise} STAC Collection JSON
 */
export const fetchCollection = async (collectionId) => {
  const response = await axiosInstance.get(`/collections/${collectionId}`);
  return response.data;
};

/**
 * Search STAC Items
 * @param {Object} params - Search parameters
 * @param {Array} params.bbox - Bounding box [minx, miny, maxx, maxy]
 * @param {Object} params.intersects - GeoJSON geometry object for spatial filtering (STAC API uses "intersects")
 * @param {string} params.datetime - ISO 8601 datetime range (e.g., "2020-01-01T00:00:00Z/2020-12-31T23:59:59Z")
 * @param {Array} params.collections - Array of collection IDs
 * @param {number} params.limit - Maximum number of results
 * @param {string} params.next - Pagination token
 * @returns {Promise} STAC Search response
 */
export const searchItems = async (params = {}) => {
  const searchParams = {
    limit: params.limit || 100,
  };

  // Add bbox if provided
  if (params.bbox && Array.isArray(params.bbox) && params.bbox.length === 4) {
    searchParams.bbox = params.bbox;
  }

  // Add intersects (geometry) if provided - STAC API uses "intersects" for spatial filtering
  if (params.intersects) {
    searchParams.intersects = params.intersects;
    console.log('Sending intersects to STAC API:', {
      type: params.intersects.type,
      hasCoordinates: !!params.intersects.coordinates
    });
  }

  // Add datetime if provided
  if (params.datetime) {
    searchParams.datetime = params.datetime;
  }

  // Add collections if provided
  if (params.collections && Array.isArray(params.collections) && params.collections.length > 0) {
    searchParams.collections = params.collections;
  }

  // Add pagination token if provided
  if (params.next) {
    searchParams.next = params.next;
  }

  const response = await axiosInstance.post('/search', searchParams, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

/**
 * Convert Leaflet bounds to STAC bbox format [minx, miny, maxx, maxy]
 * @param {L.LatLngBounds} bounds - Leaflet bounds
 * @returns {Array} Bbox array [minx, miny, maxx, maxy]
 */
export const boundsToBbox = (bounds) => {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return [sw.lng, sw.lat, ne.lng, ne.lat];
};

/**
 * Convert Leaflet GeoJSON geometry to STAC geometry format
 * STAC API expects GeoJSON geometry object (not Feature)
 * @param {Object} geoJson - GeoJSON geometry object
 * @returns {Object} STAC geometry object
 */
export const geoJsonToGeometry = (geoJson) => {
  if (!geoJson) {
    return null;
  }
  
  // If it's a Feature, extract the geometry
  if (geoJson.type === 'Feature') {
    return geoJson.geometry;
  }
  
  // If it's already a geometry, validate and return
  if (geoJson.type && ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(geoJson.type)) {
    // Validate coordinates exist
    if (!geoJson.coordinates || !Array.isArray(geoJson.coordinates)) {
      console.warn('Geometry missing coordinates:', geoJson);
      return null;
    }
    
    // For Polygon, ensure it's closed (first and last coordinates are the same)
    if (geoJson.type === 'Polygon' && geoJson.coordinates.length > 0) {
      const ring = geoJson.coordinates[0];
      if (ring.length > 0) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        // Check if polygon is closed (first coord == last coord)
        if (first[0] !== last[0] || first[1] !== last[1]) {
          console.warn('Polygon not closed, closing it automatically');
          // Close the polygon by adding first coordinate at the end
          geoJson.coordinates[0] = [...ring, first];
        }
      }
    }
    
    return geoJson;
  }
  
  // Otherwise return null (invalid format)
  console.warn('Invalid GeoJSON geometry format:', geoJson);
  return null;
};

/**
 * Format date range for STAC datetime parameter
 * Supports single date or date range:
 * - Only startDate: "2020-01-01T00:00:00Z/.."
 * - Only endDate: "../2020-12-31T23:59:59Z"
 * - Both: "2020-01-01T00:00:00Z/2020-12-31T23:59:59Z"
 * @param {Date|string|null} startDate - Start date (optional)
 * @param {Date|string|null} endDate - End date (optional)
 * @returns {string} ISO 8601 datetime range string
 */
export const formatDateRange = (startDate, endDate) => {
  let start = null;
  let end = null;

  if (startDate) {
    start = startDate instanceof Date 
      ? startDate.toISOString() 
      : new Date(startDate).toISOString();
  }

  if (endDate) {
    end = endDate instanceof Date 
      ? endDate.toISOString() 
      : new Date(endDate).toISOString();
    // Set end date to end of day (23:59:59)
    if (endDate instanceof Date) {
      const endDateObj = endDate;
      endDateObj.setHours(23, 59, 59, 999);
      end = endDateObj.toISOString();
    } else {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      end = endDateObj.toISOString();
    }
  }

  // Format according to STAC spec
  if (start && end) {
    return `${start}/${end}`;
  } else if (start) {
    return `${start}/..`;
  } else if (end) {
    return `../${end}`;
  }

  return null;
};

/**
 * Get asset URL from STAC Item
 * @param {Object} item - STAC Item
 * @param {string} assetKey - Asset key (e.g., 'thumbnail', 'visual')
 * @returns {string|null} Asset URL or null
 */
export const getAssetUrl = (item, assetKey) => {
  if (!item.assets || !item.assets[assetKey]) {
    return null;
  }
  
  const asset = item.assets[assetKey];
  return typeof asset === 'string' ? asset : asset.href;
};

