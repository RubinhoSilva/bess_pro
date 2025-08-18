/* eslint-env worker */

// Placeholder for suncalc library, will be loaded via importScripts
let SunCalc;

// Utility functions for vector math
const vec3 = {
  create: () => new Float32Array(3),
  fromValues: (x, y, z) => new Float32Array([x, y, z]),
  subtract: (out, a, b) => {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  },
  cross: (out, a, b) => {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  },
  normalize: (out, a) => {
    const x = a[0], y = a[1], z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
  },
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
};

// Ray-triangle intersection function (Möller–Trumbore algorithm)
const rayIntersectsTriangle = (rayOrigin, rayVector, triangle) => {
  const [v0, v1, v2] = triangle;
  const edge1 = vec3.create();
  const edge2 = vec3.create();
  const h = vec3.create();
  const s = vec3.create();
  const q = vec3.create();

  vec3.subtract(edge1, v1, v0);
  vec3.subtract(edge2, v2, v0);
  vec3.cross(h, rayVector, edge2);
  const a = vec3.dot(edge1, h);

  if (a > -1e-6 && a < 1e-6) {
    return null; // Ray is parallel to the triangle.
  }

  const f = 1.0 / a;
  vec3.subtract(s, rayOrigin, v0);
  const u = f * vec3.dot(s, h);

  if (u < 0.0 || u > 1.0) {
    return null;
  }

  vec3.cross(q, s, edge1);
  const v = f * vec3.dot(rayVector, q);

  if (v < 0.0 || u + v > 1.0) {
    return null;
  }

  const t = f * vec3.dot(edge2, q);
  if (t > 1e-6) { // Intersection
    return t;
  }

  return null;
};

onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === 'init') {
    importScripts(payload.suncalcPath);
    // eslint-disable-next-line no-global-assign, no-self-assign
    SunCalc = SunCalc;
    postMessage({ type: 'initialized' });
  } else if (type === 'calculate') {
    if (!SunCalc) {
      postMessage({ type: 'error', payload: 'SunCalc not initialized.' });
      return;
    }
    const { modules, obstacles, date, location } = payload;
    const { latitude, longitude } = location;

    const sunPos = SunCalc.getPosition(new Date(date), latitude, longitude);
    const sunDirection = vec3.fromValues(
      -Math.cos(sunPos.azimuth) * Math.cos(sunPos.altitude),
      -Math.sin(sunPos.azimuth) * Math.cos(sunPos.altitude),
      -Math.sin(sunPos.altitude)
    );
    vec3.normalize(sunDirection, sunDirection);

    const shadedModules = modules.map(module => {
      const center = module.center;
      for (const obstacle of obstacles) {
        for (let i = 0; i < obstacle.indices.length; i += 3) {
          const triangle = [
            obstacle.vertices.slice(obstacle.indices[i] * 3, obstacle.indices[i] * 3 + 3),
            obstacle.vertices.slice(obstacle.indices[i + 1] * 3, obstacle.indices[i + 1] * 3 + 3),
            obstacle.vertices.slice(obstacle.indices[i + 2] * 3, obstacle.indices[i + 2] * 3 + 3),
          ];
          if (rayIntersectsTriangle(center, sunDirection, triangle)) {
            return { ...module, isShaded: true };
          }
        }
      }
      return { ...module, isShaded: false };
    });

    postMessage({ type: 'result', payload: shadedModules });
  }
};