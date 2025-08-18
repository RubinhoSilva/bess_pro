import React, { useMemo } from 'react';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';

const AzimuthGrid = ({ 
    position = [0, 0.01, 0], 
    rotation = { x: 0, y: 0, z: 0 },
    radius = 100, 
    sectors = 12, 
    rings = 5 
}) => {
  const { circles, lines, angleLabels, distanceLabels, cardinalLabels } = useMemo(() => {
    const c = [];
    const dLabels = [];
    for (let i = 1; i <= rings; i++) {
      const r = (i / rings) * radius;
      const points = [];
      for (let j = 0; j <= 128; j++) {
        const angle = (j / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
      }
      c.push(points);
      dLabels.push({
        pos: [r, 0.01, 0],
        text: `${Math.round(r)}m`
      });
    }

    const l = [];
    const aLabels = [];
    const cardLabels = [];
    const cardinalPoints = {
        'N': Math.PI / 2,
        'L': 0,
        'S': 3 * Math.PI / 2,
        'O': Math.PI
    };

    for (let i = 0; i < sectors; i++) {
      const angle = (i / sectors) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      l.push({ start: [0, 0, 0], end: [x, 0, z] });

      const displayAngle = (450 - (angle * 180 / Math.PI)) % 360;
      const textRadius = radius * 1.05;
      const textX = textRadius * Math.cos(angle);
      const textZ = textRadius * Math.sin(angle);
      
      const cardinalMatch = Object.entries(cardinalPoints).find(([, val]) => Math.abs(val - angle) < 0.01);

      if (cardinalMatch) {
        cardLabels.push({
            pos: [textX, 0.01, textZ],
            text: cardinalMatch[0],
            color: cardinalMatch[0] === 'N' ? '#ff6b6b' : '#ffffff'
        });
      } else {
        aLabels.push({
            pos: [textX, 0.01, textZ],
            text: `${Math.round(displayAngle)}°`
        });
      }
    }

    return { circles: c, lines: l, angleLabels: aLabels, distanceLabels: dLabels, cardinalLabels: cardLabels };
  }, [radius, sectors, rings]);

  const fontProps = {
    fontSize: radius / 25,
    color: 'white',
    anchorX: 'center',
    anchorY: 'middle',
  };
  
  const lineMaterialProps = {
    color: "#FFFFFF",
    lineWidth: 1.5,
    transparent: true,
    opacity: 0.35,
    depthTest: true,
  };
  
  const lineMaterialPropsBold = {
      ...lineMaterialProps,
      lineWidth: 2.5,
      opacity: 0.5,
  };

  const eulerRotation = new THREE.Euler(
    THREE.MathUtils.degToRad(rotation.x),
    THREE.MathUtils.degToRad(rotation.y),
    THREE.MathUtils.degToRad(rotation.z),
    'XYZ'
  );

  return (
    <group position={position} rotation={eulerRotation}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {circles.map((points, i) => (
          <Line key={`circle-${i}`} points={points} {...lineMaterialProps} />
        ))}
        {lines.map((line, i) => (
          <Line key={`line-${i}`} points={[line.start, line.end]} {...lineMaterialPropsBold} />
        ))}
        
        {angleLabels.map((label, i) => (
          <Text key={`angle-label-${i}`} position={label.pos} {...fontProps} rotation={[0, 0, 0]}>
            {label.text}
          </Text>
        ))}

        {distanceLabels.map((label, i) => (
          <Text key={`dist-label-${i}`} position={label.pos} {...fontProps} fontSize={radius / 30} rotation={[0, 0, -Math.PI / 2]}>
            {label.text}
          </Text>
        ))}

        {cardinalLabels.map((label, i) => (
            <Text
                key={`cardinal-label-${i}`}
                position={label.pos}
                {...fontProps}
                color={label.color}
                fontSize={radius / 18}
                rotation={[0, 0, 0]}
            >
                {label.text}
            </Text>
        ))}
      </group>
    </group>
  );
};

export default AzimuthGrid;