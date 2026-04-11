# Google Maps MCP Server

MCP server for [Google Maps Platform](https://developers.google.com/maps) APIs — geocoding, places, routing, maps, elevation, air quality, pollen, solar, and more.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Yes | Google Maps Platform API key |

## Tools (28)

### Geocoding
- **geocode** — Convert an address to geographic coordinates
- **reverse_geocode** — Convert coordinates to a human-readable address
- **validate_address** — Validate and standardize a postal address

### Places
- **search_places_text** — Search for places using a text query
- **search_places_nearby** — Search for nearby places by location
- **get_place_details** — Get detailed information about a place
- **autocomplete_places** — Get place predictions from partial text

### Routing
- **get_directions** — Get directions between two points
- **distance_matrix** — Calculate travel distance and time for multiple origins/destinations
- **compute_routes** — Compute routes with advanced options
- **optimize_tours** — Optimize multi-stop tours for fleet routing
- **snap_to_roads** — Snap GPS coordinates to the nearest road

### Maps & Imagery
- **embed_map** — Generate an embedded map URL
- **create_map_tile_session** — Create a map tile session
- **get_map_tile_url** — Get a map tile URL
- **static_map** — Generate a static map image URL
- **street_view_image** — Get a Street View image URL

### Aerial Views
- **lookup_aerial_view** — Look up aerial view availability
- **render_aerial_view** — Render an aerial view video

### Environment
- **get_air_quality** — Get current air quality for a location
- **get_air_quality_history** — Get air quality history
- **get_pollen_info** — Get pollen forecast
- **get_solar_info** — Get solar potential for a building

### Location Services
- **get_elevation** — Get elevation for coordinates
- **get_elevation_along_path** — Get elevation along a path
- **get_timezone** — Get timezone for a location
- **geolocate** — Geolocate via cell towers and WiFi
- **compute_area_insights** — Compute insights for a geographic area

## Usage

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your-google-maps-api-key"
      }
    }
  }
}
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```
