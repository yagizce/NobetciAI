# Contributing to Fine-Kinney Core

This component lives at `packages/fine-kinney-core/` in
[yagizce/NobetciAI](https://github.com/yagizce/NobetciAI).
Use that repository's issues and PRs, with a "Fine-Kinney Core:" title prefix.
Read the [root contribution guide](../../CONTRIBUTING.md) and
[licensing scope](../../LICENSING.md). Only this component is Apache-2.0.

## Development

From this directory, use Node.js 24:

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run example
npm run audit:dependencies
npm pack --dry-run
node tools/verify-upstream.mjs ../../src/constants/fineKinney.js
```

Keep the core free of dependencies, I/O, application services and UI content.
Use English documentation and focused tests. Preserve factor scales, threshold
inclusivity, multiplication order, precision, and documented invalid-input
behavior. Contract changes require explicit review and migration notes.
The parity check must match the application engine; do not weaken it to hide drift.

Both application and component CI must pass. Preserve dependency-security
policy; do not extend exceptions to pass a check. Do not include secrets or real
workplace records. Record source references and review third-party rights.

Only submit work you own or are authorized to contribute under Apache-2.0
for this directory. No copyright assignment or required CLA is introduced.
This does not authorize relicensing or reusing files outside the component.

## Releases

There is no npm publication or independent release yet. Keep `private: true`
until separately authorized. Use semantic versions; during 0.x incompatible
changes require a minor version and migration notes, compatible fixes a patch.
Review package contents, LICENSE/NOTICE, security, parity and CI before release.
CI does not publish, tag, merge, or deploy.
