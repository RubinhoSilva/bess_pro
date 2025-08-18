import React, { useState, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';

const MeasurementTool = ({ targetModel, onMeasureComplete }) => {
    const { camera, raycaster, scene, mouse } = useThree();
    const [currentPoints, setCurrentPoints] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const measurementRef = useRef({ spheres: [], lines: [], labels: [] });

    const handlePointerDown = (event) => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(targetModel, true);

        if (intersects.length > 0) {
            const newPoint = intersects[0].point;
            const newPoints = [...currentPoints, newPoint];
            setCurrentPoints(newPoints);

            if (newPoints.length === 2) {
                const distance = newPoints[0].distanceTo(newPoints[1]);
                setMeasurements([...measurements, { points: newPoints, distance }]);
                if (onMeasureComplete) {
                    onMeasureComplete(distance);
                }
                setCurrentPoints([]);
            }
        }
    };

    const handleUndo = () => {
        setMeasurements(measurements.slice(0, -1));
    };

    const handleClear = () => {
        setMeasurements([]);
        setCurrentPoints([]);
    };

    useEffect(() => {
        // Limpa esferas, linhas e labels anteriores
        measurementRef.current.spheres.forEach(s => scene.remove(s));
        measurementRef.current.lines.forEach(l => scene.remove(l));
        measurementRef.current.labels.forEach(lbl => scene.remove(lbl));
        measurementRef.current = { spheres: [], lines: [], labels: [] };

        // Renderiza todas as medições
        measurements.forEach(({ points }, idx) => {
            points.forEach((point, index) => {
                const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
                const sphereMaterial = new THREE.MeshBasicMaterial({ color: '#ff0000', transparent: true, depthTest: false });
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.position.copy(point);
                scene.add(sphere);
                measurementRef.current.spheres.push(sphere);
            });
            if (points.length === 2) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const lineMaterial = new THREE.LineBasicMaterial({ color: '#ff0000', linewidth: 2, transparent: true, depthTest: false });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
                measurementRef.current.lines.push(line);
            }
        });

        // Renderiza pontos atuais (em andamento)
        currentPoints.forEach((point, index) => {
            const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: '#00ff00', transparent: true, depthTest: false });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(point);
            scene.add(sphere);
            measurementRef.current.spheres.push(sphere);
        });
        if (currentPoints.length === 2) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(currentPoints);
            const lineMaterial = new THREE.LineBasicMaterial({ color: '#00ff00', linewidth: 2, transparent: true, depthTest: false });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(line);
            measurementRef.current.lines.push(line);
        }
    }, [measurements, currentPoints, scene]);

    useEffect(() => {
        document.addEventListener('pointerdown', handlePointerDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            measurementRef.current.spheres.forEach(s => scene.remove(s));
            measurementRef.current.lines.forEach(l => scene.remove(l));
            measurementRef.current.labels.forEach(lbl => scene.remove(lbl));
            measurementRef.current = { spheres: [], lines: [], labels: [] };
        };
    }, [raycaster, mouse, camera, targetModel, currentPoints, measurements]);
    
    return (
        <>
            {/* Botões de desfazer/cancelar */}
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
                <button onClick={handleUndo} disabled={measurements.length === 0} style={{ marginRight: 8 }}>Desfazer</button>
                <button onClick={handleClear} disabled={measurements.length === 0 && currentPoints.length === 0}>Limpar</button>
            </div>
            {/* Renderiza labels das medições */}
            {measurements.map(({ points, distance }, idx) => (
                <Html
                    key={idx}
                    position={points[0].clone().lerp(points[1], 0.5)}
                    className="pointer-events-none"
                    occlude
                >
                    <div className="bg-slate-800 text-white text-xs font-bold p-1 rounded-md shadow-lg">
                        {distance.toFixed(2)}m<br />
                        <span style={{ fontSize: '10px' }}>
                            ({points[0].x.toFixed(2)}, {points[0].y.toFixed(2)}, {points[0].z.toFixed(2)}) →<br />
                            ({points[1].x.toFixed(2)}, {points[1].y.toFixed(2)}, {points[1].z.toFixed(2)})
                        </span>
                    </div>
                </Html>
            ))}
            {/* Renderiza label da medição atual */}
            {currentPoints.length === 2 && (
                <Html
                    position={currentPoints[0].clone().lerp(currentPoints[1], 0.5)}
                    className="pointer-events-none"
                    occlude
                >
                    <div className="bg-slate-800 text-white text-xs font-bold p-1 rounded-md shadow-lg">
                        {currentPoints[0].distanceTo(currentPoints[1]).toFixed(2)}m<br />
                        <span style={{ fontSize: '10px' }}>
                            ({currentPoints[0].x.toFixed(2)}, {currentPoints[0].y.toFixed(2)}, {currentPoints[0].z.toFixed(2)}) →<br />
                            ({currentPoints[1].x.toFixed(2)}, {currentPoints[1].y.toFixed(2)}, {currentPoints[1].z.toFixed(2)})
                        </span>
                    </div>
                </Html>
            )}
        </>
    );
};

export default MeasurementTool;