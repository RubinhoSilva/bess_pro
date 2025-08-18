import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';

const MapEvents = ({ onMapClick, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onMapClick(e.latlng);
        },
    });
    return null;
};

const MapSelector = ({ onSelect }) => {
    const [position, setPosition] = useState(null);
    const initialCenter = [-14.2350, -51.9253]; // Center of Brazil

    const displayPosition = useMemo(() => {
        return position ? position : null;
    }, [position]);

    const handleConfirm = () => {
        if (position) {
            onSelect(position);
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-grow h-full w-full">
                <MapContainer center={initialCenter} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents setPosition={setPosition} onMapClick={() => {}} />
                    {displayPosition && <Marker position={displayPosition}></Marker>}
                </MapContainer>
            </div>
            <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end">
                <Button onClick={handleConfirm} disabled={!position}>
                    Confirmar Localização
                </Button>
            </div>
        </div>
    );
};

export default MapSelector;