import { useState, useEffect, useRef } from 'react';

interface VenueMapPickerProps {
    lat: string;
    long: string;
    address: string;
    onLocationChange: (lat: string, long: string) => void;
    onCityResolved?: (city: string) => void;
    height?: number;
}

const DEFAULT_CENTER: [number, number] = [-23.55, -46.63]; // São Paulo

// Lazily initialized leaflet modules (only in browser)
let _L: any = null;
let _RL: any = null;

function getLeaflet() {
    if (!_L) {
        _L = require('leaflet');
        delete (_L.Icon.Default.prototype as any)._getIconUrl;
        _L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }
    return _L;
}

function getRL() {
    if (!_RL) _RL = require('react-leaflet');
    return _RL;
}

// --- Sub-components defined at module level so React keeps stable references ---

function DraggableMarker({ position, onChange }: { position: [number, number]; onChange: (lat: string, lng: string) => void }) {
    const { Marker } = getRL();
    const markerRef = useRef<any>(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker) {
                const pos = marker.getLatLng();
                onChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
            }
        },
    };

    return <Marker draggable position={position} ref={markerRef} eventHandlers={eventHandlers} />;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const { useMap } = getRL();
    const map = useMap();

    useEffect(() => {
        map.invalidateSize();
    }, []);

    useEffect(() => {
        map.flyTo(center, map.getZoom(), { duration: 0.5 });
    }, [center[0], center[1]]);

    return null;
}

function ClickHandler({ onChange }: { onChange: (lat: string, lng: string) => void }) {
    const { useMapEvents } = getRL();
    useMapEvents({
        click(e: any) {
            onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
        },
    });
    return null;
}

// --- Main component ---

export default function VenueMapPicker({ lat, long, address, onLocationChange, onCityResolved, height = 200 }: VenueMapPickerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        setMounted(true);
    }, []);

    // Geocode address via Nominatim
    useEffect(() => {
        if (!mounted || !address || address.length < 5) return;

        const controller = new AbortController();
        const timer = setTimeout(() => {
            fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
                { signal: controller.signal, headers: { 'Accept-Language': 'pt-BR,pt,en' } }
            )
                .then((r) => r.json())
                .then((data) => {
                    if (data && data.length > 0) {
                        const result = data[0];
                        onLocationChange(
                            parseFloat(result.lat).toFixed(6),
                            parseFloat(result.lon).toFixed(6)
                        );
                        if (onCityResolved && result.address) {
                            const city = result.address.city || result.address.town || result.address.municipality;
                            if (city) onCityResolved(city);
                        }
                    }
                })
                .catch(() => {});
        }, 800);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [address, mounted]);

    if (!mounted) {
        return <div style={{ height }} className="w-full rounded-lg bg-gray-100 animate-pulse" />;
    }

    getLeaflet();
    const { MapContainer, TileLayer } = getRL();

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(long);
    const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng);
    const center: [number, number] = hasCoords ? [parsedLat, parsedLng] : DEFAULT_CENTER;

    return (
        <div style={{ height }} className="relative z-0 w-full rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
                center={center}
                zoom={hasCoords ? 15 : 12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={center} />
                <ClickHandler onChange={onLocationChange} />
                {hasCoords && (
                    <DraggableMarker position={[parsedLat, parsedLng]} onChange={onLocationChange} />
                )}
            </MapContainer>
        </div>
    );
}
