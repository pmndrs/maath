import type { TypedArray } from "../ctypes";

const TAU = Math.PI * 2;

export class FlashGen {
  nextBurstTime = 0;
  nextFlashEndTime = 0;
  flashesDone = 0;
  isFlashing = false;
  currentCount = 0;
  flashIntensity = 0;
  isDecaying = false;
  autoBurst = true;
  decaySpeed = 40;

  minInterval = 5000;
  maxInterval = 10000;
  minDuration = 50;
  maxDuration = 300;
  count = 5;

  constructor(props: {
    decaySpeed?: number;
    minInterval?: number;
    maxInterval?: number;
    minDuration?: number;
    maxDuration?: number;
    count?: number;
  }) {
    Object.assign(this, props);
  }

  scheduleNextBurst(currentTime: number) {
    const burstInterval =
      Math.random() * (this.maxInterval - this.minInterval) + this.minInterval;
    this.nextBurstTime = currentTime + burstInterval / 1000;
    this.flashesDone = 0;
    this.isFlashing = false;
  }

  burst() {
    this.nextBurstTime = 0;
    this.flashesDone = 0;
    this.isFlashing = false;
  }

  update(currentTime: number, delta: number) {
    if (currentTime > this.nextBurstTime && this.currentCount === 0) {
      this.currentCount = Math.floor(Math.random() * this.count) + 1;
    }

    if (
      this.flashesDone < this.currentCount &&
      currentTime > this.nextBurstTime
    ) {
      if (!this.isFlashing) {
        this.isFlashing = true;
        this.flashIntensity = 1;
        const flashDuration =
          Math.random() * (this.maxDuration - this.minDuration) +
          this.minDuration;
        this.nextFlashEndTime = currentTime + flashDuration / 1000;
      } else if (this.isFlashing && currentTime > this.nextFlashEndTime) {
        this.isFlashing = false;
        this.isDecaying = true;
        this.flashesDone++;
        if (this.flashesDone >= this.currentCount) {
          this.currentCount = 0;
          if (this.autoBurst) this.scheduleNextBurst(currentTime);
        }
      }
    }

    if (this.isDecaying) {
      this.flashIntensity -= delta * this.decaySpeed;
      this.flashIntensity = Math.max(0, Math.min(1, this.flashIntensity));
      if (this.flashIntensity <= 0) {
        this.isDecaying = false;
        this.flashIntensity = 0;
      }
    }

    return this.flashIntensity;
  }
}

// Credits @kchapelier https://github.com/kchapelier/wavefunctioncollapse/blob/master/example/lcg.js#L22-L30
function normalizeSeed(seed: number | string) {
  if (typeof seed === "number") {
    seed = Math.abs(seed);
  } else if (typeof seed === "string") {
    const string = seed;
    seed = 0;
    for (let i = 0; i < string.length; i++) {
      seed = (seed + (i + 1) * (string.charCodeAt(i) % 96)) % 2147483647;
    }
  }
  if (seed === 0) {
    seed = 311;
  }
  return seed;
}

function lcgRandom(seed: number | string) {
  let state = normalizeSeed(seed);
  return function () {
    const result = (state * 48271) % 2147483647;
    state = result;
    return result / 2147483647;
  };
}

export class Generator {
  seed: string | number = 0;

  constructor(seed: string | number) {
    this.init(seed);
  }

  init = (seed: number | string) => {
    this.seed = seed;
    this.value = lcgRandom(seed);
  };

  value = lcgRandom(this.seed);
}

const defaultGen = new Generator(Math.random());

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

// random on surface of sphere
// - https://twitter.com/fermatslibrary/status/1430932503578226688
// - https://mathworld.wolfram.com/SpherePointPicking.html
export function onSphere<T extends TypedArray>(
  buffer: T,
  sphere?: Sphere,
  rng: Generator = defaultGen
): T {
  const { radius, center } = {
    ...defaultSphere,
    ...sphere,
  };

  for (let i = 0; i < buffer.length; i += 3) {
    const u = rng.value();
    const v = rng.value();

    const theta = Math.acos(2 * v - 1);
    const phi = TAU * u;

    buffer[i] = Math.sin(theta) * Math.cos(phi) * radius + center[0];
    buffer[i + 1] = Math.sin(theta) * Math.sin(phi) * radius + center[1];
    buffer[i + 2] = Math.cos(theta) * radius + center[2];
  }

  return buffer;
}

// from "Another Method" https://datagenetics.com/blog/january32020/index.html
export function inSphere<T extends TypedArray>(
  buffer: T,
  sphere?: Sphere,
  rng: Generator = defaultGen
): T {
  const { radius, center } = {
    ...defaultSphere,
    ...sphere,
  };
  for (let i = 0; i < buffer.length; i += 3) {
    const u = Math.pow(rng.value(), 1 / 3);

    let x = rng.value() * 2 - 1;
    let y = rng.value() * 2 - 1;
    let z = rng.value() * 2 - 1;

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
export function inCircle<T extends TypedArray>(
  buffer: T,
  circle?: Circle,
  rng: Generator = defaultGen
): T {
  const { radius, center } = {
    ...defaultCircle,
    ...circle,
  };

  for (let i = 0; i < buffer.length; i += 2) {
    const r = radius * Math.sqrt(rng.value());
    const theta = rng.value() * TAU;

    buffer[i] = Math.sin(theta) * r + center[0];
    buffer[i + 1] = Math.cos(theta) * r + center[1];
  }

  return buffer;
}

export function onCircle<T extends TypedArray>(
  buffer: T,
  circle?: Circle,
  rng: Generator = defaultGen
): T {
  const { radius, center } = {
    ...defaultCircle,
    ...circle,
  };

  for (let i = 0; i < buffer.length; i += 2) {
    const theta = rng.value() * TAU;

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
  center: [0, 0],
};

export function inRect<T extends TypedArray>(
  buffer: T,
  rect?: Rect,
  rng: Generator = defaultGen
): T {
  const { sides, center } = {
    ...defaultRect,
    ...rect,
  };

  const sideX = typeof sides === "number" ? sides : sides[0];
  const sideY = typeof sides === "number" ? sides : sides[1];

  for (let i = 0; i < buffer.length; i += 2) {
    buffer[i] = (rng.value() - 0.5) * sideX + center[0];
    buffer[i + 1] = (rng.value() - 0.5) * sideY + center[1];
  }

  return buffer;
}

export function onRect<T extends TypedArray>(
  buffer: T,
  rect?: Rect,
  rng: Generator = defaultGen
): T {
  return buffer;
}

/***
 * [3D] Box
 */
export function inBox<T extends TypedArray>(
  buffer: T,
  box?: Box,
  rng: Generator = defaultGen
): T {
  const { sides, center } = {
    ...defaultBox,
    ...box,
  };

  const sideX = typeof sides === "number" ? sides : sides[0];
  const sideY = typeof sides === "number" ? sides : sides[1];
  const sideZ = typeof sides === "number" ? sides : sides[2];

  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = (rng.value() - 0.5) * sideX + center[0];
    buffer[i + 1] = (rng.value() - 0.5) * sideY + center[1];
    buffer[i + 2] = (rng.value() - 0.5) * sideZ + center[2];
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

export function onBox<T extends TypedArray>(
  buffer: T,
  box?: Box,
  rng: Generator = defaultGen
): T {
  const { sides, center } = {
    ...defaultBox,
    ...box,
  };

  const sideX = typeof sides === "number" ? sides : sides[0];
  const sideY = typeof sides === "number" ? sides : sides[1];
  const sideZ = typeof sides === "number" ? sides : sides[2];

  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = (rng.value() - 0.5) * sideX + center[0];
    buffer[i + 1] = (rng.value() - 0.5) * sideY + center[1];
    buffer[i + 2] = (rng.value() - 0.5) * sideZ + center[2];
  }

  return buffer;
}

export * as noise from "./noise";
