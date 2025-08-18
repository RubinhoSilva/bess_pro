import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const AreaOutline = ({ area, isSelected, isHovered }) => {
    const { points } = useMemo(() => {
        if (!area.geometria || area.geometria.length < 3) return { points: [] };

        const areaPoints = area.geometria.map(p => new THREE.Vector3(p.x, p.y, p.z));
        const closedPoints = [...areaPoints, areaPoints[0]];

        return { points: closedPoints };
    }, [area.geometria]);

    if (!points.length) return null;

    const color = isSelected ? '#3b82f6' : isHovered ? '#f59e0b' : '#00FFFF'; // Blue for selected, Amber for hovered, Cyan for default

    return (
        <group>
            <Line
                points={points}
                color={color}
                lineWidth={3}
                dashed={false}
                renderOrder={999} // Render lines on top of surfaces but behind modules
            />
        </group>
    );
};

const MountingAreaVisualizer = ({ areas, selectedAreaId, hoveredAreaId }) => {
    return (
        <group>
            {areas.map(area => (
                <AreaOutline
                    key={area.id}
                    area={area}
                    isSelected={area.id === selectedAreaId}
                    isHovered={area.id === hoveredAreaId}
                />
            ))}
        </group>
    );
};

export default MountingAreaVisualizer;