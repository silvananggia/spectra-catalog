import React from 'react';
import { Link } from 'react-router-dom';
import spectraLogo from '../assets/images/logo/spectra/spectra-merah.png';
import './HowToUse.scss';

const HowToUse = () => {
  return (
    <div className="how-to-use-container">
      <div className="how-to-use-header">
        <div className="header-content">
          <img 
            src={spectraLogo} 
            alt="SPECTRA Logo" 
            className="header-logo"
          />
          <div className="header-text">
            <h1>How to Use XYZ Tiles</h1>
            <p>Guide for QGIS and ArcGIS</p>
          </div>
        </div>
        <Link to="/catalog" className="back-button">
          ← Back to Catalog
        </Link>
      </div>

      <div className="how-to-use-content">
        <div className="tutorial-section">
          <h2>Using XYZ Tiles in QGIS</h2>
          
          <div className="step">
            <h3>Step 1: Get the XYZ URL</h3>
            <p>From the catalog, copy the <strong>"Address XYZ (QGIS/ArcGIS)"</strong> URL. The format will be:</p>
            <div className="code-block">
              <code>https://spectra.brin.go.id/tiles/.../{'{z}'}/{'{x}'}/{'{'}-y{'}'}.png</code>
            </div>
            <p className="note">Note: QGIS/ArcGIS format uses <code>{'{'}-y{'}'}</code> instead of <code>{'{y}'}</code> for TMS (Tile Map Service) format.</p>
          </div>

          <div className="step">
            <h3>Step 2: Add XYZ Tiles Layer in QGIS</h3>
            <ol>
              <li>Open QGIS</li>
              <li>Go to <strong>Layer</strong> → <strong>Add Layer</strong> → <strong>Add XYZ Layer...</strong></li>
              <li>Click <strong>"New"</strong> button</li>
              <li>Enter a name for the layer (e.g., "SPECTRA Satellite Data")</li>
              <li>Paste the XYZ URL in the <strong>"URL"</strong> field</li>
              <li>Make sure <strong>"Tile Map Service (TMS)"</strong> is checked</li>
              <li>Click <strong>"OK"</strong></li>
              <li>Select the new layer from the list and click <strong>"Add"</strong></li>
            </ol>
          </div>

          <div className="step">
            <h3>Step 3: Configure TMS Settings</h3>
            <p>In the XYZ Layer dialog, ensure:</p>
            <ul>
              <li><strong>Tile Map Service (TMS)</strong> checkbox is checked</li>
              <li>Min Zoom Level: <code>0</code></li>
              <li>Max Zoom Level: <code>18</code> (or as specified in the asset metadata)</li>
            </ul>
          </div>

          <div className="step">
            <h3>Step 4: Verify the Layer</h3>
            <p>After adding the layer, you should see the satellite imagery tiles displayed on the map. You can:</p>
            <ul>
              <li>Zoom in/out to see different zoom levels</li>
              <li>Pan around to explore the area</li>
              <li>Adjust layer opacity if needed</li>
            </ul>
          </div>
        </div>

        <div className="tutorial-section">
          <h2>Using XYZ Tiles in ArcGIS</h2>
          
          <div className="step">
            <h3>Step 1: Get the XYZ URL</h3>
            <p>From the catalog, copy the <strong>"Address XYZ (QGIS/ArcGIS)"</strong> URL. The format will be:</p>
            <div className="code-block">
              <code>https://spectra.brin.go.id/tiles/.../{'{z}'}/{'{x}'}/{'{'}-y{'}'}.png</code>
            </div>
            <p className="note">Note: ArcGIS uses TMS format with <code>{'{'}-y{'}'}</code> for Y coordinate.</p>
          </div>

          <div className="step">
            <h3>Step 2: Add XYZ Tiles Layer in ArcGIS Pro</h3>
            <ol>
              <li>Open ArcGIS Pro</li>
              <li>Go to <strong>Map</strong> tab → <strong>Add Data</strong> → <strong>Data from Path</strong></li>
              <li>In the <strong>"Path"</strong> field, paste the XYZ URL</li>
              <li>Select <strong>"Raster Tile Layer"</strong> as the data type</li>
              <li>Click <strong>"OK"</strong></li>
            </ol>
          </div>

          <div className="step">
            <h3>Step 3: Add XYZ Tiles Layer in ArcGIS Desktop (ArcMap)</h3>
            <ol>
              <li>Open ArcMap</li>
              <li>Right-click on <strong>"Layers"</strong> in the Table of Contents</li>
              <li>Select <strong>"Add Data"</strong> → <strong>"Add Data from ArcGIS Online"</strong></li>
              <li>Or use <strong>"Add Data"</strong> → <strong>"Add Data from Path"</strong></li>
              <li>Enter the XYZ URL in the path field</li>
              <li>For TMS format, you may need to use a custom script or tool</li>
            </ol>
            <p className="note">Note: ArcMap has limited support for XYZ tiles. Consider using ArcGIS Pro for better compatibility.</p>
          </div>

          <div className="step">
            <h3>Step 4: Configure TMS Settings</h3>
            <p>In ArcGIS Pro:</p>
            <ul>
              <li>Right-click the layer → <strong>"Properties"</strong></li>
              <li>Go to <strong>"Source"</strong> tab</li>
              <li>Verify the URL format includes <code>{'{'}-y{'}'}</code></li>
              <li>Check the coordinate system (usually WGS84 Web Mercator - EPSG:3857)</li>
            </ul>
          </div>

          <div className="step">
            <h3>Step 5: Verify the Layer</h3>
            <p>After adding the layer, you should see the satellite imagery tiles. You can:</p>
            <ul>
              <li>Zoom and pan to explore the data</li>
              <li>Adjust layer transparency in the layer properties</li>
              <li>Use the layer in your maps and layouts</li>
            </ul>
          </div>
        </div>

        <div className="tutorial-section">
          <h2>Important Notes</h2>
          <div className="notes">
            <div className="note-item">
              <strong>Format Difference:</strong>
              <ul>
                <li><strong>Standard XYZ:</strong> Uses <code>{'{z}/{x}/{y}.png'}</code> format</li>
                <li><strong>QGIS/ArcGIS TMS:</strong> Uses <code>{'{z}/{x}/'}{'{'}-y{'}'}{'.png'}</code> format</li>
              </ul>
              <p>The negative Y coordinate (<code>{'{'}-y{'}'}</code>) is required for TMS (Tile Map Service) format used by QGIS and ArcGIS.</p>
            </div>

            <div className="note-item">
              <strong>Coordinate System:</strong>
              <p>XYZ tiles typically use <strong>Web Mercator (EPSG:3857)</strong> coordinate system. Make sure your map project uses a compatible coordinate system.</p>
            </div>

            <div className="note-item">
              <strong>Performance:</strong>
              <p>XYZ tiles are loaded on-demand as you zoom and pan. For best performance:</p>
              <ul>
                <li>Use appropriate zoom levels for your analysis</li>
                <li>Consider caching tiles for offline use if needed</li>
                <li>Be aware of data usage when working with large areas</li>
              </ul>
            </div>

            <div className="note-item">
              <strong>Troubleshooting:</strong>
              <ul>
                <li>If tiles don't load, check your internet connection</li>
                <li>Verify the URL format is correct (especially the <code>{'{'}-y{'}'}</code> part)</li>
                <li>Check that TMS option is enabled in QGIS</li>
                <li>In ArcGIS Pro, ensure the layer type is set to "Raster Tile Layer"</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2>Example URLs</h2>
          <div className="example-urls">
            <div className="example">
              <strong>Standard XYZ (for Leaflet/OpenLayers):</strong>
              <div className="code-block">
                <code>https://spectra.brin.go.id/tiles/Planet/20251201_processed/20251201_041655_23_24da_3B_AnalyticMS_SR_file_format/{'{z}'}/{'{x}'}/{'{y}'}.png</code>
              </div>
            </div>
            <div className="example">
              <strong>QGIS/ArcGIS TMS Format:</strong>
              <div className="code-block">
                <code>https://spectra.brin.go.id/tiles/Planet/20251201_processed/20251201_041655_23_24da_3B_AnalyticMS_SR_file_format/{'{z}'}/{'{x}'}/{'{'}-y{'}'}.png</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;

