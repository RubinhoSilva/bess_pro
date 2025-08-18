import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const AreaSelectionTool = ({ targetModel, onSelectionComplete, isEnabled }) => {
    const { camera, raycaster, scene, mouse } = useThree();
    const [points, setPoints] = useState([]);
    const [isClosed, setIsClosed] = useState(false);
    const visualElementsRef = useRef({ spheres: [], lines: [], polygon: null });

    const cleanupVisuals = useCallback(() => {
        const { spheres, lines, polygon } = visualElementsRef.current;
        spheres.forEach(s => scene.remove(s));
        lines.forEach(l => scene.remove(l));
        if (polygon) scene.remove(polygon);
        visualElementsRef.current = { spheres: [], lines: [], polygon: null };
    }, [scene]);

    const handlePointerDown = useCallback((event) => {
        if (!isEnabled || isClosed || !targetModel) return;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(targetModel, true);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            const newPoint = intersect.point;
            const faceNormal = intersect.face.normal.clone().transformDirection(targetModel.matrixWorld).normalize();

            if (points.length > 0 && newPoint.distanceTo(points[0].point) < 0.5) {
                setIsClosed(true);
                
                const finalPoints = points.map(p => p.point);
                const finalPolygon = { points: finalPoints, normal: faceNormal };
                
                const tempVector = new THREE.Vector3();
                let area = 0;
                for (let i = 0; i < finalPoints.length; i++) {
                    const p1 = finalPoints[i];
                    const p2 = finalPoints[(i + 1) % finalPoints.length];
                    tempVector.crossVectors(p1, p2);
                    area += tempVector.dot(faceNormal);
                }
                finalPolygon.area = Math.abs(area / 2);

                const inclination = (Math.acos(Math.abs(faceNormal.y)) * 180 / Math.PI);
                finalPolygon.inclination = parseFloat(inclination.toFixed(1));

                const orientation = ((Math.atan2(faceNormal.x, faceNormal.z) * 180 / Math.PI) + 360) % 360;
                finalPolygon.orientation = parseFloat(orientation.toFixed(1));

                if (onSelectionComplete) {
                    onSelectionComplete(finalPolygon);
                }
            } else {
                setPoints(prev => [...prev, { point: newPoint, normal: faceNormal }]);
            }
        }
    }, [isEnabled, isClosed, mouse, camera, raycaster, targetModel, points, onSelectionComplete]);

    useEffect(() => {
        cleanupVisuals();

        points.forEach(p => {
            const sphereGeo = new THREE.SphereGeometry(0.1, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({ color: '#00aaff', transparent: true, depthTest: false, renderOrder: 999 });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.copy(p.point);
            scene.add(sphere);
            visualElementsRef.current.spheres.push(sphere);
        });

        if (points.length > 1) {
            for (let i = 0; i < points.length - 1; i++) {
                const lineGeo = new THREE.BufferGeometry().setFromPoints([points[i].point, points[i + 1].point]);
                const lineMat = new THREE.LineBasicMaterial({ color: '#00aaff', linewidth: 2, transparent: true, depthTest: false, renderOrder: 999 });
                const line = new THREE.Line(lineGeo, lineMat);
                scene.add(line);
                visualElementsRef.current.lines.push(line);
            }
        }

        if (isClosed && points.length > 2) {
            const vertices = points.map(p => p.point);
            const shape = new THREE.Shape(vertices.map(v => new THREE.Vector2(v.x, v.z))); // Simplified for visualization
            const geometry = new THREE.ShapeGeometry(shape);

            // Remap vertices to 3D space
            const pos = geometry.attributes.position;
            const mappedVertices = [];
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const z = pos.getY(i); // In ShapeGeometry, Y is our Z
                const correspondingPoint = vertices.find(v => Math.abs(v.x - x) < 1e-5 && Math.abs(v.z - z) < 1e-5);
                const y = correspondingPoint ? correspondingPoint.y : 0;
                mappedVertices.push(x, y, z);
            }
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(mappedVertices, 3));
            geometry.computeVertexNormals();

            const material = new THREE.MeshBasicMaterial({ color: '#00aaff', side: THREE.DoubleSide, transparent: true, opacity: 0.4, depthTest: false, renderOrder: 998 });
            
            const polygonMesh = new THREE.Mesh(geometry, material);
            scene.add(polygonMesh);
            visualElementsRef.current.polygon = polygonMesh;
        }

    }, [points, isClosed, scene, cleanupVisuals]);

    useEffect(() => {
        if (!isEnabled) {
            cleanupVisuals();
            setPoints([]);
            setIsClosed(false);
            return;
        }

        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.addEventListener('pointerdown', handlePointerDown);
        }
        
        return () => {
            if (canvas) {
                canvas.removeEventListener('pointerdown', handlePointerDown);
            }
            cleanupVisuals();
        };
    }, [isEnabled, handlePointerDown, cleanupVisuals]);

    return null;
};

export default AreaSelectionTool;