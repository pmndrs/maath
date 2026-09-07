# math benches

Performance benchmarks powered by [`@pmndrs/labs`](https://github.com/pmndrs/labs) — statistically rigorous benchmarking (fresh-process blocks, Mann-Whitney U on block medians, Hodges-Lehmann effect size) with baseline comparison and output snapshots.

Benches import directly from `../src`, so no build step is needed.

## Usage

Run from the repo root:

```sh
pnpm bench                # run all benches, save results with auto timestamp
pnpm bench "vec3"         # filter by file/bench name
pnpm bench "@core"        # filter by tag (@core, @noise, @algo, ...)
pnpm bench -n "v1.0.0" -b # save with a name and set as baseline
pnpm bench compare        # compare latest run against the baseline
pnpm bench --no-save      # run without saving
```

## Layout

- `core/`, `noise/` — micro benches of individual functions in tight loops (`@core`, `@noise`)
- `algorithms/` — composite benches (`@algo`) that implement a complete minimal feature from
  navigation/collision-style libraries, exercising many math functions together: funnel string
  pulling (`@nav`), frustum culling (`@culling`), closest-hit raycasting (`@raycast`), transform
  hierarchy propagation (`@scene`), and a full sphere physics step (`@physics`)
- `three/` — the math + three.js bridge experiment (`@three`): the same frame of work written
  with three's own API and with math writing into three's storage in place, outputs asserted
  equal. See [three/README.md](./three/README.md)

The composite benches run 100+ µs per iteration, which keeps them well above this machine's
micro-bench noise floor — prefer them for regression comparisons; use the micro benches to
localize a regression once one shows up.

Results are saved to `.labs/` (gitignored). Comparisons only report a change when it is statistically significant and the effect size is meaningful — see the labs README for details.

## Writing a bench

Benches use a generator: code before `yield` is setup, the yielded function is measured, code after is teardown. Each sample starts with a forced GC by default; chain `.gc(false)` to opt out.

`yield` hands back the result of the first untimed call, so teardown can check it. Return it from the generator and labs snapshots it against the baseline: a compare then reports `output changed` (and exits 1) if a refactor altered the result, alongside the speed verdict. Use `assert` from labs for hard invariants.

```ts
import { assert, bench, group } from '@pmndrs/labs';

group('my group @mytag', () => {
  bench('my bench', function* () {
    // setup
    const result = yield () => {
      // measured; return something that depends on the work
      return 42;
    };
    // teardown: check invariants, then return the result to snapshot it
    assert(Number.isFinite(result), 'result must be finite');
    return result;
  });
});
```
