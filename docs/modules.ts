/* SNIPPET_START: modules */
import { mat4, quat, vec3 } from 'math'; // core: vectors, quats, matrices
import { simplex3d } from 'math/noise'; // perlin / simplex noise
import { mulberry32 } from 'math/random'; // seeded rng
import { easing, spring } from 'math/time'; // easings & springs
import { fabrik2, fabrik3 } from 'math/ik'; // inverse kinematics
// also: math/color, math/geometry, math/shapes — import only what you use
/* SNIPPET_END: modules */

// referenced so this doc module type-checks; not shown in the snippet
void [vec3, quat, mat4, mulberry32, easing, spring, simplex3d, fabrik2, fabrik3];
