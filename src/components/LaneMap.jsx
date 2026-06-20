import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// CartoDB basemaps, matched to the app's light/dark mode.
const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTRIB = '&copy; OpenStreetMap &copy; CARTO';

function FitBounds({ from, to }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([from, to], { padding: [40, 40] });
  }, [map, from[0], from[1], to[0], to[1]]);
  return null;
}

// A dot that travels origin -> destination on a loop, showing lane direction.
function DirectionDot({ from, to, color }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    let start;
    const dur = 3200;
    const step = (ts) => {
      if (start == null) start = ts;
      setT(((ts - start) % dur) / dur);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from[0], from[1], to[0], to[1]]);

  // Ease-in-out so the dot clearly launches from origin toward destination.
  const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  const lat = from[0] + (to[0] - from[0]) * e;
  const lng = from[1] + (to[1] - from[1]) * e;
  return (
    <CircleMarker
      center={[lat, lng]}
      radius={6}
      pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }}
    />
  );
}

export default function LaneMap({ lane }) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  if (lane.originLat == null || lane.destLat == null) return null;

  const from = [lane.originLat, lane.originLng];
  const to = [lane.destLat, lane.destLng];
  const primary = theme.palette.primary.main;
  const success = theme.palette.success.main;
  const warning = theme.palette.warning.main;

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', px: 2, pt: 1.5 }}>
        Lane route — {lane.originCity}, {lane.originState} → {lane.destCity}, {lane.destState} · {lane.miles.toLocaleString()} mi
      </Typography>
      <MapContainer
        style={{ height: 260, width: '100%', background: theme.palette.background.default }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer key={mode} url={TILES[mode]} attribution={ATTRIB} />
        <FitBounds from={from} to={to} />
        <Polyline positions={[from, to]} pathOptions={{ color: primary, weight: 3, opacity: 0.7 }} />
        <CircleMarker center={from} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: success, fillOpacity: 1 }}>
          <Tooltip permanent direction="top">Origin · {lane.originCity}</Tooltip>
        </CircleMarker>
        <CircleMarker center={to} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: warning, fillOpacity: 1 }}>
          <Tooltip permanent direction="top">Dest · {lane.destCity}</Tooltip>
        </CircleMarker>
        <DirectionDot from={from} to={to} color={primary} />
      </MapContainer>
    </Paper>
  );
}
