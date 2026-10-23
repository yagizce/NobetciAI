# Fine-Kinney Core

A small, dependency-free JavaScript library for multiplying Fine-Kinney factors
and classifying the resulting score. Extracted from Nöbetçi AI into a separate
local project. No UI, storage, network calls, AI services, credentials, or
application data are included.

**Location:** `packages/fine-kinney-core/` in
[yagizce/NobetciAI](https://github.com/yagizce/NobetciAI).
Only this directory is Apache-2.0; see the [root scope](../../LICENSING.md).
The application is not licensed by this component. No npm publication or
independent adoption is claimed; `private: true` prevents npm publication.

## Run locally

Use Node.js 24 or later and npm. There is no compilation step. From the
repository root, first run `cd packages/fine-kinney-core`.

```sh
npm ci --ignore-scripts
npm test
npm run check
npm run example
```

To consume this folder from another local ESM project:

```sh
npm install /absolute/path/to/fine-kinney-core
```

```js
import {
  computeFineKinneyScore,
  classifyFineKinneyRisk,
  PROBABILITY_SCALE,
  FREQUENCY_SCALE,
  SEVERITY_SCALE,
} from "fine-kinney-core";

const inputs = [3, 6, 15];
if (!inputs.every(Number.isFinite) ||
    !PROBABILITY_SCALE.includes(inputs[0]) ||
    !FREQUENCY_SCALE.includes(inputs[1]) ||
    !SEVERITY_SCALE.includes(inputs[2])) {
  throw new RangeError("Select finite values from the documented scales");
}
const score = computeFineKinneyScore(...inputs); // 270
const level = classifyFineKinneyRisk(score); // "high"
```

The validation above belongs to the caller; the core deliberately retains the
source arithmetic without adding validation or changing its behavior. See the
[runnable example](examples/basic.js).

## API and exact behavior

| Export | Behavior |
| --- | --- |
| `computeFineKinneyScore(probability, frequency, severity)` | Left-to-right JavaScript multiplication, no rounding or clamping |
| `classifyFineKinneyRisk(score)` | Returns one of the keys below |
| `PROBABILITY_SCALE` | Frozen numeric array: 0.1, 0.2, 0.5, 1, 3, 6, 10 |
| `FREQUENCY_SCALE` | Frozen numeric array: 0.5, 1, 2, 3, 6, 10 |
| `SEVERITY_SCALE` | Frozen numeric array: 1, 3, 7, 15, 40, 100 |

| Score | Key |
| --- | --- |
| `< 20` | `low` |
| `>= 20` and `< 70` | `possible` |
| `>= 70` and `< 200` | `important` |
| `>= 200` and `< 400` | `high` |
| `>= 400` | `veryHigh` |

All 252 combinations of the supplied scales are tested. The valid combination
range is 0.05 through 10,000. Decimal results retain IEEE-754 precision.
TypeScript declarations describe numeric inputs; they do not validate runtime
data. The runtime core is standard ESM; the declared support and CI target are
Node.js 24. Browser compatibility has not been independently tested.

**Input limitations:** negative and zero values are not rejected; `NaN` propagates
through multiplication. Classification of `NaN` falls through to `veryHigh`, and
negative values fall into `low`. These are compatibility artifacts, not safe
assessment results. Reject invalid inputs before calling either function. There
is no unit conversion, factor selection advice, certification, or independent
validation of the underlying risk methodology. Qualified human assessment is
required for occupational safety decisions.

## Separation from the application

Only arithmetic, numeric scales, and threshold keys were retained. UI labels,
descriptions, palettes, attachments, workflows, and all other application code
were excluded. This is not a drop-in replacement for the application's
`getFineKinneyRiskLevel`, which returns UI metadata. The application has not been
integrated with this package or modified. Application history is repository context, not proof of independent package adoption.

For an optional differential check against your trusted upstream checkout, run
`node tools/verify-upstream.mjs /trusted/path/to/src/constants/fineKinney.js`.
This source-tree tool executes the supplied module and compares all scale
combinations and edge cases. It is not part of the published runtime package.

## Contributing, security, and licensing

Read [CONTRIBUTING](CONTRIBUTING.md), [SECURITY](SECURITY.md), and
[PROVENANCE](PROVENANCE.md) before making changes. The CI workflow is configured
for Linux and Windows in the root `.github/workflows/fine-kinney-core.yml`;
inspect actual PR runs for results.
See [VERIFICATION](VERIFICATION.md) for actual local results and
[OSS readiness](docs/OSS_READINESS.md) for evidence still needed before applying
to support programs.

This component uses the existing repository and its PR process. No separate
GitHub repository is planned. Cite only actual commit-specific CI results.

This standalone project is licensed under [Apache-2.0](LICENSE), with attribution
in [NOTICE](NOTICE). Apache-2.0 permits commercial use and proprietary consumers,
subject to its conditions; it also permits competitors to use this library.
It does not license the separate Nöbetçi AI application or assign ownership.
