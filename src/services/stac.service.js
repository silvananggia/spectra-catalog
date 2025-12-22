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
 * @param {Object} params.geometry - GeoJSON geometry object
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

  // Add geometry if provided
  if (params.geometry) {
    searchParams.geometry = params.geometry;
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
 * @param {Object} geoJson - GeoJSON geometry object
 * @returns {Object} STAC geometry object
 */
export const geoJsonToGeometry = (geoJson) => {
  return geoJson;
};

/**
 * Format date range for STAC datetime parameter
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} ISO 8601 datetime range string
 */
export const formatDateRange = (startDate, endDate) => {
  const start = startDate instanceof Date 
    ? startDate.toISOString() 
    : new Date(startDate).toISOString();
  
  const end = endDate instanceof Date 
    ? endDate.toISOString() 
    : new Date(endDate).toISOString();
  
  return `${start}/${end}`;
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

