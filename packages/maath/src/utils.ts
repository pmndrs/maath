export function remap(x: number, [low1, high1]: number[], [low2, high2]: number[]) {
  return low2 + (x - low1) * (high2 - low2) / (high1 - low1)
}

export function lerp(v0: number, v1: number, t: number) {
  return v0*(1-t)+v1*t
}