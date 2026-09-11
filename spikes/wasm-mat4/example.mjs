import { createTree, fmaSupported } from './tree.mjs';

// a 4-ary scene graph, parents before children
const tree = createTree(4096);
console.log('relaxed simd available:', fmaSupported());

tree.parent[0] = -1;
for (let i = 1; i < tree.capacity; i++) tree.parent[i] = (i - 1) >> 2;
console.log('parent order valid:', tree.validate() === -1);

// each node translates one unit along x from its parent
for (let i = 0; i < tree.capacity; i++) {
    tree.local.set([1,0,0,0, 0,1,0,0, 0,0,1,0, 1,0,0,1], i * 16);
}
tree.local[12] = 0; // root sits at the origin

tree.update();

// depth 0, 1, 2 and 3 should land at x = 0, 1, 2, 3
for (const i of [0, 1, 5, 21]) console.log(`node ${String(i).padStart(2)} x = ${tree.world[i * 16 + 12]}`);
