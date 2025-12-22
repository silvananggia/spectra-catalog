import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap, GeoJSON } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet-draw';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCollectionsAsync,
  searchItemsAsync,
  setDrawnGeometry,
  clearDrawnGeometry,
  setSelectedCollections,
  setDateRange,
  clearSearch,
} from '../redux/slices/stacCatalog';
import Skeleton from './Skeleton';
import spectraLogo from '../assets/images/logo/spectra/spectra-merah.png';
import './Catalog.scss';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Map Ref Setter Component
const MapRefSetter = ({ mapRef, featureGroup }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      mapRef.current = map;
      // Add feature group to map for editing
      if (featureGroup && !map.hasLayer(featureGroup)) {
        featureGroup.addTo(map);
      }
    }
  }, [map, mapRef, featureGroup]);
  
  return null;
};

// Zoom Control Position Component (moves zoom control to bottom right)
const ZoomControlPosition = () => {
  const map = useMap();
  const zoomControlRef = useRef(null);
  
  useEffect(() => {
    if (map && !zoomControlRef.current) {
      // Add zoom control to bottom right
      // Since zoomControl={false} is set on MapContainer, no need to remove existing controls
      const zoomControl = L.control.zoom({
        position: 'bottomright'
      });
      zoomControl.addTo(map);
      zoomControlRef.current = zoomControl;
    }
    
    return () => {
      // Cleanup: remove zoom control when component unmounts
      if (zoomControlRef.current && map) {
        try {
          map.removeControl(zoomControlRef.current);
        } catch (e) {
          // Control might already be removed, ignore error
          console.warn('Error removing zoom control:', e);
        }
        zoomControlRef.current = null;
      }
    };
  }, [map]);
  
  return null;
};

// Hover Extent Layer Component (shows extent on hover)
const HoverExtentLayer = ({ item }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    // Remove existing layer
    if (layerRef.current && map.hasLayer(layerRef.current)) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!item || !item.geometry) return;

    // Create GeoJSON layer for extent preview
    const geoJsonLayer = L.geoJSON(item.geometry, {
      style: {
        color: '#3388ff',
        weight: 2,
        dashArray: '5, 5',
        fill: false,
        opacity: 0.9,
      },
    });

    geoJsonLayer.addTo(map);
    layerRef.current = geoJsonLayer;

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, item]);

  return null;
};

// All Items Extent Layer Component (shows all search result extents)
const AllItemsExtentLayer = ({ items, onItemClick, selectedItemId, visible = true }) => {
  const map = useMap();
  const layersRef = useRef([]);

  useEffect(() => {
    // Remove all existing layers
    layersRef.current.forEach((layer) => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    layersRef.current = [];

    if (!items || items.length === 0 || !visible) return;

    // Create extent layer for each item
    items.forEach((item) => {
      if (!item.geometry) return;

      const isSelected = selectedItemId === item.id;

      // Create GeoJSON layer for each item extent
      const geoJsonLayer = L.geoJSON(item.geometry, {
        style: {
          color: isSelected ? '#ff0000' : '#3388ff',
          weight: isSelected ? 3 : 2,
          fill: false,
          opacity: isSelected ? 1.0 : 0.7,
        },
      });

      // Add popup with item info
      const popupDiv = L.DomUtil.create('div', 'item-popup');
      popupDiv.innerHTML = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${item.id}</h3>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>Collection:</strong> ${item.collection || 'N/A'}
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>Date:</strong> ${item.properties?.datetime ? new Date(item.properties.datetime).toLocaleDateString() : 'N/A'}
          </p>
          ${item.properties?.description ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;">${item.properties.description}</p>` : ''}
          <button 
            class="popup-show-data-btn"
            style="margin-top: 0.5rem; padding: 0.4rem 0.8rem; background: #3388ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; width: 100%;"
          >
            Show Data
          </button>
        </div>
      `;

      // Add click handler to popup button
      L.DomEvent.on(popupDiv.querySelector('.popup-show-data-btn'), 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (onItemClick) {
          onItemClick(item);
        }
        // Close popup
        geoJsonLayer.closePopup();
      });

      geoJsonLayer.bindPopup(popupDiv);

      // Add click handler to select item and show data
      geoJsonLayer.on('click', function() {
        if (onItemClick) {
          onItemClick(item);
        }
      });

      // Add hover effect
      geoJsonLayer.on('mouseover', function(e) {
        const layer = e.target;
        if (selectedItemId !== item.id) {
          layer.setStyle({
            color: '#ff6600',
            weight: 3,
            opacity: 1.0,
          });
        }
      });

      geoJsonLayer.on('mouseout', function(e) {
        const layer = e.target;
        const isSelected = selectedItemId === item.id;
        layer.setStyle({
          color: isSelected ? '#ff0000' : '#3388ff',
          weight: isSelected ? 3 : 2,
          opacity: isSelected ? 1.0 : 0.7,
        });
      });

      geoJsonLayer.addTo(map);
      layersRef.current.push(geoJsonLayer);
    });

    return () => {
      layersRef.current.forEach((layer) => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      layersRef.current = [];
    };
  }, [map, items, selectedItemId, onItemClick, visible]);

  return null;
};

// Item Asset Layer Component
const ItemAssetLayer = ({ item, selected, showGeometry = false, showTiles = true, onLoadingChange }) => {
  const map = useMap();
  const tileLayerRef = useRef(null);
  const geoJsonLayerRef = useRef(null);

  useEffect(() => {
    if (!item || !selected) {
      // Remove layers if item is deselected
      if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }
      if (geoJsonLayerRef.current && map.hasLayer(geoJsonLayerRef.current)) {
        map.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }
      // Reset loading state when deselected
      if (onLoadingChange) {
        onLoadingChange(false);
      }
      return;
    }

    // Find tiles asset
    const tilesAsset = Object.values(item.assets || {}).find(
      (asset) => {
        const roles = asset.roles || [];
        return roles.includes('tiles') || roles.includes('data');
      }
    );

    // Reset loading state when item changes or no tiles
    if (!showTiles || !tilesAsset || !tilesAsset.href) {
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }

    // Add tile layer if tiles asset exists and showTiles is true
    if (showTiles && tilesAsset && tilesAsset.href) {
      let tileUrl = tilesAsset.href;
      
      // Fix HTTP to HTTPS if needed (for same domain)
      if (tileUrl.startsWith('http://') && window.location.protocol === 'https:') {
        tileUrl = tileUrl.replace('http://', 'https://');
      }
      
      // Ensure URL has {z}/{x}/{y} template
      if (!tileUrl.includes('{z}')) {
        tileUrl = tileUrl.endsWith('/') ? tileUrl : tileUrl + '/';
        tileUrl = `${tileUrl}{z}/{x}/{y}.png`;
      }

      // Remove existing tile layer
      if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
        map.removeLayer(tileLayerRef.current);
      }

      // Check if tile URL is same origin (try-catch for URL parsing)
      let isSameOrigin = false;
      try {
        // Try to parse URL by replacing template variables with sample values
        const sampleUrl = tileUrl.replace('{z}/{x}/{y}.png', '0/0/0.png');
        const tileUrlObj = new URL(sampleUrl);
        isSameOrigin = tileUrlObj.origin === window.location.origin;
      } catch (e) {
        // If URL parsing fails, assume cross-origin
        console.warn('Could not parse tile URL for origin check:', e);
        isSameOrigin = false;
      }

      // gdal2tiles generates TMS format tiles (Y coordinate needs to be flipped)
      // Check if URL is from spectra.brin.go.id/tiles (gdal2tiles output)
      const isTMS = tileUrl.includes('spectra.brin.go.id/tiles') || 
                    (tileUrl.includes('/tiles/') && !tileUrl.includes('tms=false'));

      console.log('Creating tile layer:', {
        url: tileUrl,
        isTMS: isTMS,
        isSameOrigin: isSameOrigin,
        itemId: item.id
      });

      // Create new tile layer with CORS support
      // Match leaflet.html configuration: tms format, proper z-index
      const tileLayer = L.tileLayer(tileUrl, {
        attribution: item.id || '',
        opacity: 1.0, // Full opacity - tiles should completely cover base map
        zIndex: 1000, // Higher z-index to ensure tiles are on top of base map
        maxZoom: tilesAsset['tiles:max_zoom'] || 18,
        minZoom: tilesAsset['tiles:min_zoom'] || 0,
        crossOrigin: isSameOrigin ? false : 'anonymous', // Only use CORS for cross-origin requests
        tms: isTMS, // Enable TMS format for gdal2tiles (flips Y coordinate) - matches leaflet.html
        // Remove errorTileUrl to prevent showing any error tiles (let them be transparent)
        // This matches leaflet.html behavior where missing tiles don't show anything
      });

      // Track tile loading state
      let loadingTiles = 0;
      let loadedTiles = 0;
      let totalTilesExpected = 0;
      
      const updateLoadingState = () => {
        if (onLoadingChange) {
          // Consider loading complete when all expected tiles are loaded
          const isLoading = loadingTiles > 0 && (loadedTiles < totalTilesExpected || totalTilesExpected === 0);
          onLoadingChange(isLoading);
        }
      };

      // Track tile loading start
      tileLayer.on('loading', function() {
        loadingTiles++;
        totalTilesExpected = Math.max(totalTilesExpected, loadingTiles);
        updateLoadingState();
      });

      // Track tile loading complete
      tileLayer.on('load', function() {
        loadedTiles++;
        updateLoadingState();
      });

      // Track when tile is loaded (alternative event)
      tileLayer.on('tileload', function() {
        loadedTiles++;
        // Small delay to check if loading is complete
        setTimeout(() => {
          if (onLoadingChange && loadedTiles >= totalTilesExpected && totalTilesExpected > 0) {
            onLoadingChange(false);
          }
        }, 300);
      });

      // Add error handling for tile loading - hide error tiles completely
      tileLayer.on('tileerror', function(error, tile) {
        console.warn('Tile loading error for:', {
          url: tile?.src || tileUrl,
          error: error,
          isTMS: isTMS
        });
        // Remove the error tile element to prevent showing base map through it
        if (tile && tile.el) {
          tile.el.style.display = 'none';
        }
        // Count error as loaded
        loadedTiles++;
        updateLoadingState();
      });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
      
      // Set initial loading state
      if (onLoadingChange) {
        onLoadingChange(true);
      }
    }

    // Add geometry layer (optional - can be disabled if not needed)
    // Only show border, no fill to avoid green overlay effect
    if (item.geometry && showGeometry) {
      // Remove existing geometry layer
      if (geoJsonLayerRef.current && map.hasLayer(geoJsonLayerRef.current)) {
        map.removeLayer(geoJsonLayerRef.current);
      }

      // Create GeoJSON layer with popup - only border, no fill to avoid green overlay
      const geoJsonLayer = L.geoJSON(item.geometry, {
        style: {
          color: '#ff0000',
          weight: 2,
          fill: false, // Disable fill completely to avoid overlay color issues
          opacity: 0.8,
        },
      });

      // Add popup with item info
      geoJsonLayer.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${item.id}</h3>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>Collection:</strong> ${item.collection || 'N/A'}
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>Date:</strong> ${item.properties?.datetime ? new Date(item.properties.datetime).toLocaleDateString() : 'N/A'}
          </p>
          ${item.properties?.description ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;">${item.properties.description}</p>` : ''}
        </div>
      `);

      geoJsonLayer.addTo(map);
      geoJsonLayerRef.current = geoJsonLayer;
    }

    // Zoom to item bbox or geometry when item is selected
    if (selected && item) {
      if (item.bbox && Array.isArray(item.bbox) && item.bbox.length === 4) {
        const [minx, miny, maxx, maxy] = item.bbox;
        map.fitBounds([[miny, minx], [maxy, maxx]], { padding: [50, 50] });
      } else if (item.geometry) {
        const tempLayer = L.geoJSON(item.geometry);
        const bounds = tempLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }

    return () => {
      if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
        map.removeLayer(tileLayerRef.current);
      }
      if (geoJsonLayerRef.current && map.hasLayer(geoJsonLayerRef.current)) {
        map.removeLayer(geoJsonLayerRef.current);
      }
    };
  }, [map, item, selected, showGeometry, showTiles]);

  return null;
};

// Draw Control Component
const DrawControl = ({ onDrawCreated, onDrawDeleted, onDrawEdited, featureGroup }) => {
  const map = useMap();
  const drawControlRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Initialize Leaflet Draw with shared FeatureGroup
    const drawControl = new L.Control.Draw({
      draw: {
        rectangle: {
          shapeOptions: {
            color: '#3388ff',
            weight: 2,
            fill: false, // No fill to avoid color overlay issues
            opacity: 0.8,
          },
        },
        polygon: {
          shapeOptions: {
            color: '#3388ff',
            weight: 2,
            fill: false, // No fill to avoid color overlay issues
            opacity: 0.8,
          },
        },
        circle: false,
        marker: false,
        circlemarker: false,
        polyline: false,
      },
      edit: {
        featureGroup: featureGroup,
        remove: true,
        edit: {
          selectedPathOptions: {
            color: '#3388ff',
            weight: 2,
          },
        },
      },
    });

    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    // Handle draw events
    const handleDrawCreated = (e) => {
      const layer = e.layer;
      const geoJson = layer.toGeoJSON();
      // Add layer to feature group for editing
      // This must be done here because Leaflet Draw doesn't automatically add to our FeatureGroup
      // The layer created by Leaflet Draw has the necessary edit handlers
      if (featureGroup && !featureGroup.hasLayer(layer)) {
        featureGroup.addLayer(layer);
      }
      onDrawCreated(geoJson, layer);
    };

    const handleDrawEdited = (e) => {
      // Handle edit event - update geometry
      const layers = e.layers;
      layers.eachLayer((layer) => {
        const geoJson = layer.toGeoJSON();
        onDrawEdited(geoJson);
      });
    };

    const handleDrawDeleted = (e) => {
      // Handle delete event
      const layers = e.layers;
      layers.eachLayer(() => {
        onDrawDeleted();
      });
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on(L.Draw.Event.EDITED, handleDrawEdited);
    map.on(L.Draw.Event.DELETED, handleDrawDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off(L.Draw.Event.EDITED, handleDrawEdited);
      map.off(L.Draw.Event.DELETED, handleDrawDeleted);
      map.removeControl(drawControl);
    };
  }, [map, onDrawCreated, onDrawDeleted, onDrawEdited, featureGroup]);

  return null;
};

// Main Catalog Component
const Catalog = () => {
  const dispatch = useDispatch();
  const {
    collections,
    items,
    loading,
    error,
    searchParams,
    drawnGeometry,
  } = useSelector((state) => state.stacCatalog);

  const [selectedCollections, setSelectedCollectionsLocal] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [drawnLayer, setDrawnLayer] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showExtentOnly, setShowExtentOnly] = useState(false);
  const [showAllExtents, setShowAllExtents] = useState(true);
  const [tilesLoading, setTilesLoading] = useState(false);
  const mapRef = useRef(null);
  const itemRefs = useRef({});
  const resultsPanelRef = useRef(null);
  const featureGroupRef = useRef(new L.FeatureGroup());

  // Fetch collections on mount
  useEffect(() => {
    dispatch(fetchCollectionsAsync());
  }, [dispatch]);

  // Sync local state with Redux
  useEffect(() => {
    setSelectedCollectionsLocal(searchParams.collections || []);
    if (searchParams.startDate) {
      setStartDate(new Date(searchParams.startDate).toISOString().split('T')[0]);
    }
    if (searchParams.endDate) {
      setEndDate(new Date(searchParams.endDate).toISOString().split('T')[0]);
    }
  }, [searchParams]);

  const handleDrawCreated = (geoJson, layer) => {
    dispatch(setDrawnGeometry(geoJson));
    
    // Remove existing layer if any (clean up previous drawing)
    if (drawnLayer && mapRef.current) {
      // Only remove if it's not the same layer
      if (drawnLayer !== layer) {
        // Remove from map and featureGroup
        if (mapRef.current.hasLayer(drawnLayer)) {
          mapRef.current.removeLayer(drawnLayer);
        }
        if (featureGroupRef.current.hasLayer(drawnLayer)) {
          featureGroupRef.current.removeLayer(drawnLayer);
        }
      }
    }
    
    // Store reference to the layer created by Leaflet Draw
    // This layer is already added to map by Leaflet Draw and to featureGroup in DrawControl
    setDrawnLayer(layer);
  };

  const handleDrawEdited = (geoJson) => {
    // Update geometry when edited
    // The layer is already updated by Leaflet Draw, we just need to update the state
    dispatch(setDrawnGeometry(geoJson));
    // No need to recreate layer - Leaflet Draw already handles the edit
  };

  const handleDrawDeleted = () => {
    dispatch(clearDrawnGeometry());
    if (drawnLayer && mapRef.current) {
      // Layer is already removed by Leaflet Draw, just clean up references
      if (featureGroupRef.current.hasLayer(drawnLayer)) {
        featureGroupRef.current.removeLayer(drawnLayer);
      }
      setDrawnLayer(null);
    }
  };

  const handleCollectionChange = (collectionId, checked) => {
    let updated = [...selectedCollections];
    if (checked) {
      if (!updated.includes(collectionId)) {
        updated.push(collectionId);
      }
    } else {
      updated = updated.filter((id) => id !== collectionId);
    }
    setSelectedCollectionsLocal(updated);
    dispatch(setSelectedCollections(updated));
  };

  const handleSelectAllCollections = () => {
    const allCollectionIds = collections.map((c) => c.id);
    setSelectedCollectionsLocal(allCollectionIds);
    dispatch(setSelectedCollections(allCollectionIds));
  };

  const handleDeselectAllCollections = () => {
    setSelectedCollectionsLocal([]);
    dispatch(setSelectedCollections([]));
  };

  const handleSearch = () => {
    const params = {
      collections: selectedCollections.length > 0 ? selectedCollections : undefined,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      geoJson: drawnGeometry || null,
    };

    // Remove undefined values
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null) {
        delete params[key];
      }
    });

    dispatch(searchItemsAsync(params));
  };

  const handleClear = () => {
    dispatch(clearSearch());
    setSelectedCollectionsLocal([]);
    setStartDate('');
    setEndDate('');
    setSelectedItem(null);
    // Clear drawn geometry and remove layer
    if (drawnLayer && mapRef.current) {
      // Remove from featureGroup first
      if (featureGroupRef.current.hasLayer(drawnLayer)) {
        featureGroupRef.current.removeLayer(drawnLayer);
      }
      // Remove from map if still there
      if (mapRef.current.hasLayer(drawnLayer)) {
        mapRef.current.removeLayer(drawnLayer);
      }
      setDrawnLayer(null);
    }
    // Also clear drawn geometry from Redux
    dispatch(clearDrawnGeometry());
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    // Zoom to item when clicked
    if (mapRef.current && item) {
      if (item.bbox && Array.isArray(item.bbox) && item.bbox.length === 4) {
        const [minx, miny, maxx, maxy] = item.bbox;
        mapRef.current.fitBounds([[miny, minx], [maxy, maxx]], { padding: [50, 50] });
      } else if (item.geometry) {
        const tempLayer = L.geoJSON(item.geometry);
        const bounds = tempLayer.getBounds();
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
    // Scroll to selected item in results list
    if (itemRefs.current[item.id] && resultsPanelRef.current) {
      setTimeout(() => {
        itemRefs.current[item.id].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  };

  // Auto-scroll to selected item when it changes
  useEffect(() => {
    if (selectedItem && itemRefs.current[selectedItem.id] && resultsPanelRef.current) {
      setTimeout(() => {
        itemRefs.current[selectedItem.id].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    }
  }, [selectedItem]);

  const handleAssetClick = (e, item) => {
    e.stopPropagation(); // Prevent card click
    handleItemClick(item); // Zoom to item
  };

  // Helper function to format URL to XYZ template
  const formatXYZUrl = (assetHref) => {
    let xyzUrl = assetHref;
    
    // Fix HTTP to HTTPS if needed
    if (xyzUrl.startsWith('http://') && window.location.protocol === 'https:') {
      xyzUrl = xyzUrl.replace('http://', 'https://');
    }
    
    // Ensure URL has {z}/{x}/{y} template
    if (!xyzUrl.includes('{z}')) {
      xyzUrl = xyzUrl.endsWith('/') ? xyzUrl : xyzUrl + '/';
      xyzUrl = `${xyzUrl}{z}/{x}/{y}.png`;
    }
    
    return xyzUrl;
  };

  // Helper function to format URL to QGIS/ArcGIS TMS template (uses {-y})
  const formatQGISArcGISUrl = (assetHref) => {
    let xyzUrl = assetHref;
    
    // Fix HTTP to HTTPS if needed
    if (xyzUrl.startsWith('http://') && window.location.protocol === 'https:') {
      xyzUrl = xyzUrl.replace('http://', 'https://');
    }
    
    // Ensure URL has {z}/{x}/{-y} template for QGIS/ArcGIS (TMS format)
    if (!xyzUrl.includes('{z}')) {
      xyzUrl = xyzUrl.endsWith('/') ? xyzUrl : xyzUrl + '/';
      xyzUrl = `${xyzUrl}{z}/{x}/{-y}.png`;
    } else {
      // Replace {y} with {-y} for TMS format
      xyzUrl = xyzUrl.replace('{y}', '{-y}');
    }
    
    return xyzUrl;
  };

  const handleCopyXYZ = async (e, assetHref) => {
    e.stopPropagation(); // Prevent card click
    
    // Format URL to XYZ template if needed
    const xyzUrl = formatXYZUrl(assetHref);
    
    try {
      await navigator.clipboard.writeText(xyzUrl);
      // Show temporary success feedback
      const button = e.target;
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      button.style.background = '#4caf50';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: select text in a temporary input
      const textArea = document.createElement('textarea');
      textArea.value = xyzUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        const button = e.target;
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.background = '#4caf50';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        alert('Failed to copy. URL: ' + xyzUrl);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopyQGISArcGIS = async (e, assetHref) => {
    e.stopPropagation(); // Prevent card click
    
    // Format URL to QGIS/ArcGIS TMS template
    const qgisUrl = formatQGISArcGISUrl(assetHref);
    
    try {
      await navigator.clipboard.writeText(qgisUrl);
      // Show temporary success feedback
      const button = e.target;
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      button.style.background = '#4caf50';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: select text in a temporary input
      const textArea = document.createElement('textarea');
      textArea.value = qgisUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        const button = e.target;
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.background = '#4caf50';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        alert('Failed to copy. URL: ' + qgisUrl);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <div className="header-content">
          <img 
            src={spectraLogo} 
            alt="SPECTRA Logo" 
            className="header-logo"
          />
          <div className="header-text">
            <h1>Data Catalog Browser</h1>
            <p>Browse and search Satellite Data</p>
          </div>
        </div>
        <div className="header-menu">
          <Link to="/how-to-use" className="menu-link">
            How to Use XYZ
          </Link>
        </div>
      </div>

      <div className="catalog-content">
        {/* Filters Panel */}
        <div className="filters-panel">
          <h2>Filters</h2>

          {/* Collection Filter */}
          <div className="filter-section">
            <div className="collection-header">
              <h3>Satellite Collections</h3>
              <div className="collection-actions">
                <button
                  className="btn-select-all"
                  onClick={handleSelectAllCollections}
                  disabled={loading || collections.length === 0}
                  title="Select all collections"
                >
                  Select All
                </button>
                <button
                  className="btn-deselect-all"
                  onClick={handleDeselectAllCollections}
                  disabled={loading || selectedCollections.length === 0}
                  title="Deselect all collections"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="collections-list">
              {loading && collections.length === 0 ? (
                <Skeleton variant="text" width="100%" height={20} />
              ) : (
                collections.map((collection) => (
                  <label key={collection.id} className="collection-item">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.id)}
                      onChange={(e) => handleCollectionChange(collection.id, e.target.checked)}
                    />
                    <span>{collection.title || collection.id}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="filter-section">
            <h3>Date Range</h3>
            <p className="filter-description">
              Keep blank to show all date/time
            </p>
            <div className="date-inputs">
              <div className="date-input-group">
                <label>From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label>To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Display Mode Filter */}
          <div className="filter-section">
            <h3>Display Mode</h3>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={showExtentOnly}
                onChange={(e) => setShowExtentOnly(e.target.checked)}
              />
              <span>Show extent only (no imagery)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="filter-actions">
            <button onClick={handleSearch} className="btn-search" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button onClick={handleClear} className="btn-clear">
              Clear
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
            </div>
          )}
        </div>

        {/* Map and Results */}
        <div className="map-results-container">
          {/* Map */}
          <div className="map-container">
            <MapContainer
              center={[-2.5, 118]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <MapRefSetter mapRef={mapRef} featureGroup={featureGroupRef.current} />
              <ZoomControlPosition />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                crossOrigin={true}
              />
              <DrawControl
                onDrawCreated={handleDrawCreated}
                onDrawEdited={handleDrawEdited}
                onDrawDeleted={handleDrawDeleted}
                featureGroup={featureGroupRef.current}
              />
              {/* Show all search result extents */}
              {items.length > 0 && (
                <AllItemsExtentLayer 
                  items={items}
                  onItemClick={handleItemClick}
                  selectedItemId={selectedItem?.id}
                  visible={showAllExtents}
                />
              )}
              {hoveredItem && hoveredItem.id !== selectedItem?.id && (
                <HoverExtentLayer item={hoveredItem} />
              )}
              {selectedItem && (
                <ItemAssetLayer 
                  item={selectedItem} 
                  selected={true} 
                  showGeometry={showExtentOnly}
                  showTiles={!showExtentOnly}
                  onLoadingChange={setTilesLoading}
                />
              )}
            </MapContainer>
            {tilesLoading && (
              <div className="map-loading-overlay">
                <div className="map-loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading tiles...</p>
                </div>
              </div>
            )}
            <div className="map-instructions">
              <p>Use the drawing tools to define an Area of Interest (AOI)</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Click on extent borders on the map to select data
              </p>
              {items.length > 0 && (
                <button
                  className="btn-toggle-extents"
                  onClick={() => setShowAllExtents(!showAllExtents)}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    background: showAllExtents ? '#3388ff' : '#ccc',
                    color: showAllExtents ? '#fff' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                >
                  {showAllExtents ? 'Hide Extents' : 'Show Extents'}
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="results-panel" ref={resultsPanelRef}>
            <div style={{ marginBottom: '0.75rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>Search Results ({items.length})</h2>
              <p className="filter-description" style={{ margin: 0 }}>
                Click on items in the list or on extent borders on the map to select data
              </p>
            </div>
            {loading ? (
              <div className="loading-results">
                <Skeleton variant="text" width="100%" height={60} />
                <Skeleton variant="text" width="100%" height={60} />
                <Skeleton variant="text" width="100%" height={60} />
              </div>
            ) : items.length === 0 ? (
              <div className="no-results">
                <p>No items found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="items-list">
                {items.map((item) => {
                  const thumbnail = item.assets?.thumbnail?.href || item.assets?.visual?.href;
                  const date = item.properties?.datetime || item.properties?.created || 'Unknown';
                  
                  const isSelected = selectedItem?.id === item.id;
                  
                  return (
                    <div 
                      key={item.id} 
                      ref={(el) => (itemRefs.current[item.id] = el)}
                      className={`item-card ${isSelected ? 'item-card-selected' : ''}`}
                      onClick={() => handleItemClick(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      {thumbnail && (
                        <div className="item-thumbnail">
                          <img src={thumbnail} alt={item.id} />
                        </div>
                      )}
                      <div className="item-content">
                        <h3>{item.id}</h3>
                        <p className="item-date">{new Date(date).toLocaleDateString()}</p>
                        {item.properties?.description && (
                          <p className="item-description">{item.properties.description}</p>
                        )}
                        <div className="item-assets">
                          <strong>XYZ Address:</strong>
                          <ul>
                            {Object.keys(item.assets || {})
                              .filter((assetKey) => {
                                const asset = item.assets[assetKey];
                                const roles = asset?.roles || [];
                                return roles.includes('tiles') || roles.includes('data');
                              })
                              .map((assetKey) => {
                                const asset = item.assets[assetKey];
                                const xyzUrl = formatXYZUrl(asset.href);
                                const qgisUrl = formatQGISArcGISUrl(asset.href);
                                return (
                                  <li 
                                    key={assetKey}
                                    className="asset-item"
                                    onMouseEnter={() => setHoveredItem(item)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                  >
                                    <div className="asset-content">
                                      <span 
                                        className="asset-name"
                                        onClick={(e) => handleAssetClick(e, item)}
                                        title="Click to zoom | Hover to show extent"
                                      >
                                        {assetKey}
                                      </span>
                                      <div className="xyz-address">
                                        <span className="xyz-label">Address XYZ:</span>
                                        <span className="xyz-url" title={xyzUrl}>{xyzUrl}</span>
                                      </div>
                                      <div className="xyz-address" style={{ marginTop: '0.5rem' }}>
                                        <span className="xyz-label">Address XYZ (QGIS/ArcGIS):</span>
                                        <span className="xyz-url" title={qgisUrl}>{qgisUrl}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      <button
                                        className="copy-xyz-btn"
                                        onClick={(e) => handleCopyXYZ(e, asset.href)}
                                        title="Copy XYZ URL to clipboard"
                                      >
                                        Copy XYZ
                                      </button>
                                      <button
                                        className="copy-xyz-btn"
                                        onClick={(e) => handleCopyQGISArcGIS(e, asset.href)}
                                        title="Copy QGIS/ArcGIS TMS URL to clipboard"
                                        style={{ background: '#28a745' }}
                                      >
                                        Copy QGIS/ArcGIS
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            {Object.keys(item.assets || {}).filter((assetKey) => {
                              const asset = item.assets[assetKey];
                              const roles = asset?.roles || [];
                              return roles.includes('tiles') || roles.includes('data');
                            }).length === 0 && (
                              <li className="no-tiles">No XYZ address available</li>
                            )}
                          </ul>
                        </div>
                        {isSelected && (
                          <div className="item-selected-indicator">
                            ✓ Displayed on map
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;

