import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchCatalog,
  fetchCollections,
  fetchCollection,
  searchItems,
  boundsToBbox,
  geoJsonToGeometry,
  formatDateRange,
} from '../../services/stac.service';

/**
 * Fetch STAC Collections
 */
export const fetchCollectionsAsync = createAsyncThunk(
  'stacCatalog/fetchCollections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchCollections();
      return response.collections || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch collections'
      );
    }
  }
);

/**
 * Fetch a specific STAC Collection
 */
export const fetchCollectionAsync = createAsyncThunk(
  'stacCatalog/fetchCollection',
  async (collectionId, { rejectWithValue }) => {
    try {
      const response = await fetchCollection(collectionId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch collection'
      );
    }
  }
);

/**
 * Search STAC Items
 */
export const searchItemsAsync = createAsyncThunk(
  'stacCatalog/searchItems',
  async (searchParams, { rejectWithValue }) => {
    try {
      const params = { ...searchParams };

      // Convert bounds to bbox if provided
      if (params.bounds) {
        params.bbox = boundsToBbox(params.bounds);
        delete params.bounds;
      }

      // Convert GeoJSON geometry if provided
      // STAC API uses "intersects" parameter for spatial filtering
      if (params.geoJson) {
        const geometry = geoJsonToGeometry(params.geoJson);
        if (geometry) {
          // STAC API expects "intersects" not "geometry"
          params.intersects = geometry;
          console.log('Geometry converted for search (intersects):', {
            type: geometry.type,
            coordinates: geometry.coordinates ? 'present' : 'missing',
            firstCoordinate: geometry.coordinates?.[0]?.[0]?.[0],
            geometry: geometry
          });
        }
        delete params.geoJson;
      }

      // Format date range if provided (supports single date or range)
      if (params.startDate || params.endDate) {
        const datetime = formatDateRange(params.startDate, params.endDate);
        if (datetime) {
          params.datetime = datetime;
        }
        delete params.startDate;
        delete params.endDate;
      }

      const response = await searchItems(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to search items'
      );
    }
  }
);

const initialState = {
  collections: [],
  selectedCollection: null,
  items: [],
  features: [], // GeoJSON features from items
  loading: false,
  error: null,
  searchParams: {
    collections: [],
    startDate: null,
    endDate: null,
    bbox: null,
    geometry: null,
  },
  pagination: {
    next: null,
    hasMore: false,
  },
  drawnGeometry: null, // Leaflet drawn geometry
};

const stacCatalogSlice = createSlice({
  name: 'stacCatalog',
  initialState,
  reducers: {
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    setDrawnGeometry: (state, action) => {
      state.drawnGeometry = action.payload;
    },
    clearDrawnGeometry: (state) => {
      state.drawnGeometry = null;
    },
    setSelectedCollections: (state, action) => {
      state.searchParams.collections = action.payload;
    },
    setDateRange: (state, action) => {
      state.searchParams.startDate = action.payload.startDate;
      state.searchParams.endDate = action.payload.endDate;
    },
    clearSearch: (state) => {
      state.items = [];
      state.features = [];
      state.searchParams = {
        collections: [],
        startDate: null,
        endDate: null,
        bbox: null,
        geometry: null,
      };
      state.drawnGeometry = null;
      state.pagination = {
        next: null,
        hasMore: false,
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Collections
      .addCase(fetchCollectionsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollectionsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload;
        state.error = null;
      })
      .addCase(fetchCollectionsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.collections = [];
      })
      // Fetch Collection
      .addCase(fetchCollectionAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollectionAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCollection = action.payload;
        state.error = null;
      })
      .addCase(fetchCollectionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedCollection = null;
      })
      // Search Items
      .addCase(searchItemsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchItemsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.features || [];
        state.features = action.payload.features || [];
        state.pagination.next = action.payload.next || null;
        state.pagination.hasMore = !!action.payload.next;
        state.error = null;
      })
      .addCase(searchItemsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
        state.features = [];
      });
  },
});

export const {
  setSearchParams,
  setDrawnGeometry,
  clearDrawnGeometry,
  setSelectedCollections,
  setDateRange,
  clearSearch,
  clearError,
} = stacCatalogSlice.actions;

export default stacCatalogSlice.reducer;

