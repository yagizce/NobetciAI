# Verification record

The initial extraction passed 272 tests on Windows, Node.js 24.19.0 and npm 11.17.0.
All 252 scale combinations, 19 classification edges and 7 arithmetic edges matched
the source engine. The runtime, declarations and complete test file are unchanged
when added to `packages/fine-kinney-core/` in the existing repository.

See the [root evidence record](../../docs/OSS_READINESS.md) for integration
results and actual PR CI links. A workflow file alone is not hosted success.
Run the commands in CONTRIBUTING.md to reproduce the checks.

The optional trusted-source comparison is:
`node tools/verify-upstream.mjs ../../src/constants/fineKinney.js`.
It executes the supplied source module; never pass untrusted code. Normal package
tests do not import the application. The application retains its own engine.

No new repository, npm publication, merge or deployment is part of this change.
No independent adoption, physical-device validation, live AI, TypeScript
consumer compilation or regulatory methodology certification is claimed.
Provenance and title-review limits are in PROVENANCE.md.
