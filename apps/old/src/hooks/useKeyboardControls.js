import { useEffect, useCallback } from 'react';
import * as THREE from 'three';

export const useKeyboardControls = (isEnabled, onMove, area) => {
    const handleKeyDown = useCallback((event) => {
        if (!isEnabled || !area?.geometria || area.geometria.length < 3) return;

        const step = event.shiftKey ? 0.01 : 0.1;
        let delta = new THREE.Vector3();

        const points = area.geometria.map(p => new THREE.Vector3(p.x, p.y, p.z));
        const plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2]);
        const normal = plane.normal.clone();

        const worldUp = new THREE.Vector3(0, 1, 0);
        let right = new THREE.Vector3().crossVectors(worldUp, normal).normalize();

        if (right.lengthSq() < 0.001) {
            right.crossVectors(new THREE.Vector3(0, 0, -1), normal).normalize();
        }
        
        let up = new THREE.Vector3().crossVectors(normal, right).normalize();

        switch (event.key) {
            case 'ArrowUp':
                delta.add(up.multiplyScalar(step));
                break;
            case 'ArrowDown':
                delta.sub(up.multiplyScalar(step));
                break;
            case 'ArrowLeft':
                delta.sub(right.multiplyScalar(step));
                break;
            case 'ArrowRight':
                delta.add(right.multiplyScalar(step));
                break;
            default:
                return;
        }

        if (delta.lengthSq() > 0) {
            event.preventDefault();
            onMove(delta);
        }

    }, [isEnabled, onMove, area]);

    useEffect(() => {
        if (isEnabled) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isEnabled, handleKeyDown]);
};