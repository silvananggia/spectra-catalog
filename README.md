# SPECTRA STAC Catalog Browser

A React application for browsing and searching STAC (SpatioTemporal Asset Catalog) items from the SPECTRA STAC API.

## Features

- **Draw AOI (Area of Interest)**: Use Leaflet Draw tools to define a geographic area on the map
- **Filter by Date Range**: Filter STAC items by start and end dates
- **Filter by Collection**: Select one or more satellite collections to search
- **Search STAC Items**: Search and display STAC items based on filters
- **Display Results**: View STAC items with thumbnails, metadata, and asset information

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
REACT_APP_STAC_API_URL=https://spectra.brin.go.id/stac
```

3. Start the development server:
```bash
npm start
```

## Project Structure

```
src/
├── api/
│   └── axios.js              # Axios instance for STAC API
├── components/
│   ├── Catalog.js            # Main catalog component
│   ├── Catalog.scss          # Styles for catalog
│   ├── Skeleton.js           # Loading skeleton component
│   └── Skeleton.scss          # Skeleton styles
├── redux/
│   ├── slices/
│   │   └── stacCatalog.js    # Redux slice for STAC catalog state
│   ├── rootReducer.js        # Root reducer
│   └── store.js              # Redux store configuration
├── router/
│   └── index.js              # React Router configuration
├── services/
│   └── stac.service.js       # STAC API service functions
├── App.js                    # Main App component
└── index.js                  # Entry point
```

## Usage

### Drawing AOI

1. Click on the drawing tools in the map (rectangle or polygon)
2. Draw your area of interest on the map
3. The drawn geometry will be used as a spatial filter for STAC search

### Filtering by Collection

1. Check one or more satellite collections from the list
2. Only items from selected collections will be returned

### Filtering by Date

1. Select a start date (From)
2. Select an end date (To)
3. Only items within the date range will be returned

### Searching

1. Set your filters (collections, date range, AOI)
2. Click the "Search" button
3. Results will be displayed in the results panel below the map

### Clearing Filters

Click the "Clear" button to reset all filters and clear the search results.

## API Integration

The application connects to the STAC API at `https://spectra.brin.go.id/stac` and uses the following endpoints:

- `GET /collections` - Fetch all collections
- `GET /collections/{collectionId}` - Fetch a specific collection
- `POST /search` - Search STAC items with filters

## Technologies Used

- React 19
- Redux Toolkit
- React Router
- Leaflet & React Leaflet
- Leaflet Draw
- Axios
- SCSS

## Development

The project structure follows the same patterns as the main SPECTRA application:

- Redux for state management
- Service layer for API calls
- Component-based architecture
- SCSS for styling

## License

This project is part of the SPECTRA platform.
