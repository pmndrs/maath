import type { TypedArray } from "../ctypes";

const TAU = Math.PI * 2;

// Credits @kchapelier https://github.com/kchapelier/wavefunctioncollapse/blob/master/example/lcg.js#L22-L30
function normalizeSeed (seed: number | string) {
  if (typeof seed === 'number') {
    seed = Math.abs(seed);
  } else if (typeof seed === 'string') {
    const string = seed;
    seed = 0;

    for(let i = 0; i < string.length; i++) {
      seed = (seed + (i + 1) * (string.charCodeAt(i) % 96)) % 2147483647;
    }
  }

  if (seed === 0) {
    seed = 311;
  }

  return seed;
}

function lcgRandom (seed: number | string) {
  let state = normalizeSeed(seed);

  return function () {
    const result = (state * 48271) % 2147483647;
    state = result;
    return result / 2147483647;
  };
}

/***
 * [3D] Sphere
 */
type Sphere = {
  radius?: number;
  center?: number[];
};

const defaultSphere = {
  radius: 1,
  center: [0, 0, 0],
};

class Random {
  seed: string | number = 0;

  init = (seed: number | string) => {
    this.seed = seed;
    this.get = lcgRandom(seed)
  }

  get = lcgRandom(this.seed)
}

const random = new Random();

export function distribute(buffer: TypedArray, stride: number = 2, amp = 1) {

  for (let i = 0; i < buffer.length; i += 3) {

    buffer[i] = buffer[i] + 0 * amp
    buffer[i] = buffer[i + 1] + 0 * amp

    if (stride === 3) {
      buffer[i + 2] = buffer[i+2] + 0 * amp;
    }
  }
  
  return buffer;

}
// random on surface of sphere
// - https://twitter.com/fermatslibrary/status/1430932503578226688
// - https://mathworld.wolfram.com/SpherePointPicking.html
export function onSphere(buffer: TypedArray, sphere?: Sphere) {
  const { radius, center } = {
    ...defaultSphere,
    ...sphere,
  };

  for (let i = 0; i < buffer.length; i += 3) {
    const u = random.get();
    const v = random.get();

    const theta = Math.acos(2 * v - 1);
    const phi = TAU * u;

    buffer[i] = Math.sin(theta) * Math.cos(phi) * radius + center[0];
    buffer[i + 1] = Math.sin(theta) * Math.sin(phi) * radius + center[1];
    buffer[i + 2] = Math.cos(theta) * radius + center[2];
  }

  return buffer;
}

// from "Another Method" https://datagenetics.com/blog/january32020/index.html
export function inSphere(buffer: TypedArray, sphere?: Sphere) {
  const { radius, center } = {
    ...defaultSphere,
    ...sphere,
  };
  for (let i = 0; i < buffer.length; i += 3) {
    const u = Math.pow(random.get(), 1 / 3);

    let x = random.get() * 2 - 1;
    let y = random.get() * 2 - 1;
    let z = random.get() * 2 - 1;

    const mag = Math.sqrt(x * x + y * y + z * z);

    x = (u * x) / mag;
    y = (u * y) / mag;
    z = (u * z) / mag;

    buffer[i] = x * radius + center[0];
    buffer[i + 1] = y * radius + center[1];
    buffer[i + 2] = z * radius + center[2];
  }

  return buffer;
}

/***
 * [2D] Circle
 */
type Circle = {
  radius?: number;
  center?: number[];
};

const defaultCircle = {
  radius: 1,
  center: [0, 0],
};

// random circle https://stackoverflow.com/a/50746409
export function inCircle(buffer: TypedArray, circle?: Circle): TypedArray {
  const { radius, center } = {
    ...defaultCircle,
    ...circle,
  };

  for (let i = 0; i < buffer.length; i += 2) {
    const r = radius * Math.sqrt(random.get());
    const theta = random.get() * TAU;

    buffer[i] = Math.sin(theta) * r + center[0];
    buffer[i + 1] = Math.cos(theta) * r + center[1];
  }

  return buffer;
}

export function onCircle(buffer: TypedArray, circle?: Circle) {
  const { radius, center } = {
    ...defaultCircle,
    ...circle,
  };

  for (let i = 0; i < buffer.length; i += 2) {
    const theta = random.get() * TAU;

    buffer[i] = Math.sin(theta) * radius + center[0];
    buffer[i + 1] = Math.cos(theta) * radius + center[1];
  }

  return buffer;
}

/**
 * [2D] Plane
 */
type Rect = {
  sides: number | number[];
};

const defaultRect = {
  sides: 1,
  center: [0, 0]
};

export function inRect<T extends TypedArray>(buffer: T, rect?: Rect): T {
  const { sides, center } = {
    ...defaultRect,
    ...rect,
  };

  const sideX = typeof sides === "number" ? sides : sides[0]
  const sideY = typeof sides === "number" ? sides : sides[1]
  
  
  for (let i = 0; i < buffer.length; i += 2) {
    buffer[i] = (random.get() - 0.5) * sideX + center[0];
    buffer[i + 1] = (random.get() - 0.5) * sideY + center[1];
  }
  
  
  return buffer;
}

export function onRect(buffer: TypedArray, rect?: Rect) {
  return buffer;
}

/***
 * [3D] Box
 */
export function inBox(buffer: TypedArray, box?: Box) {
  const { sides, center } = {
    ...defaultBox,
    ...box,
  };

  const sideX = typeof sides === "number" ? sides : sides[0];
  const sideY = typeof sides === "number" ? sides : sides[1];
  const sideZ = typeof sides === "number" ? sides : sides[2];

  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = (random.get() - 0.5) * sideX + center[0];
    buffer[i + 1] = (random.get() - 0.5) * sideY + center[1];
    buffer[i + 2] = (random.get() - 0.5) * sideZ + center[2];
  }

  return buffer;
}

type Box = {
  sides?: number[] | number;
  center?: number[];
};

const defaultBox = {
  sides: 1,
  center: [0, 0, 0],
};

export function onBox(buffer: TypedArray, box?: Box) {
  const { sides, center } = {
    ...defaultBox,
    ...box,
  };

  const sideX = typeof sides === "number" ? sides : sides[0];
  const sideY = typeof sides === "number" ? sides : sides[1];
  const sideZ = typeof sides === "number" ? sides : sides[2];

  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = (random.get() - 0.5) * sideX + center[0];
    buffer[i + 1] = (random.get() - 0.5) * sideY + center[1];
    buffer[i + 2] = (random.get() - 0.5) * sideZ + center[2];
  }

  return buffer;
}
