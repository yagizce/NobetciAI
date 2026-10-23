# Provenance, rights review, and scope

Prepared 2026-10-23 from
[yagizce/NobetciAI](https://github.com/yagizce/NobetciAI). This component is added
at `packages/fine-kinney-core/` in that existing repository, following its local
preparation. No independent history was invented. The root
[licensing scope](../../LICENSING.md) separates it from the commercial application.

## Exact source references

| Reference | Observed role |
| --- | --- |
| [`871eeab5f3b88a3da10de52eae79b204fefff75a`](https://github.com/yagizce/NobetciAI/commit/871eeab5f3b88a3da10de52eae79b204fefff75a) | Local HEAD and open PR #14 head inspected; extraction baseline |
| [`eb26b5ad7b1d41f0bae8776677238e769220160b`](https://github.com/yagizce/NobetciAI/commit/eb26b5ad7b1d41f0bae8776677238e769220160b) | Current main reference inspected; not modified |
| [`17f468a325a2807da7c556a3a34ebf2ab30d443e`](https://github.com/yagizce/NobetciAI/commit/17f468a325a2807da7c556a3a34ebf2ab30d443e) | Source moved into `src/constants/fineKinney.js` |
| [`80997a67de6dfd74b4c52bb1b0d37a9f787a09f5`](https://github.com/yagizce/NobetciAI/commit/80997a67de6dfd74b4c52bb1b0d37a9f787a09f5) | First source introduction, at `nobetci-saas47-phase6-vision-ai 2/src/constants/fineKinney.js` |

At extraction baseline the Git blob ID for `src/constants/fineKinney.js` is
`67d6c4c9e8d7f4eb8f743a290ff4a6453924d11a`. The local file's SHA-256 is
`52f2c9507feff142cf61c591fffaea8e4f1ccdc3688c94a364b2103ba1bbae1f`.
The Git blob ID is SHA-1 over Git's blob header and content; the SHA-256 above
is over raw file bytes. They are different identifiers, not interchangeable
content hashes. The verification report records the actual comparisons.

## Historical license finding

The initial commit
[`c7e0bc07c51e2d7bb7b5d380f0109b56604421bc`](https://github.com/yagizce/NobetciAI/commit/c7e0bc07c51e2d7bb7b5d380f0109b56604421bc)
contained an MIT LICENSE with `Copyright (c) 2026 yagizce`. Its tree contained only
`.gitignore`, `LICENSE`, and `README.md`; the calculation source was absent.
Commit `80997a6` deleted LICENSE in the same commit that first introduced the
calculation file. The inspected baseline has no root license file.

Therefore this preparation does not rely on the historical MIT file as a grant
for the later engine. Nor does removal retroactively revoke any MIT rights
already granted for material actually covered by it. This review does not
conclude that the entire commercial application has never been licensed.

None of the three files from the initial MIT-covered tree was imported into
this project; its README and configuration were prepared separately. No MIT
notice was removed from imported engine code. If MIT-covered material is added
later, its copyright and permission notice must be retained; Apache-2.0 does not
erase that obligation. See the [MIT text](https://spdx.org/licenses/MIT.html).

## Attribution and third-party review

`git log --follow` for the source file shows the introduction and relocation
above under the author handle `yagizce`. The file has no imports or embedded
license notice. The extracted subset contains multiplication, numerical scales,
threshold comparisons, and risk keys. There are no npm dependencies in this
project, including development dependencies.

The parent source cites Euronorm.net for its UI color ordering. No palettes,
Turkish labels, explanatory prose, images, reference tables as presentation, or
other expressive third-party content were copied into this project. Numerical
values and the arithmetic are documented as the parent's contract, not as an
independently certified standard. New English prose, tests, declarations, and
configuration were prepared with Codex assistance. Upstream application tests
are not bundled; this project has its own numerical tests.

Available repository history and the reviewed subset disclosed no additional
third-party code notices or separate contributors for that subset. Git author
metadata alone cannot establish legal title, employment agreements, or undisclosed
third-party rights. No external contracts or contributor assignments were
provided or independently verified. The requesting maintainer explicitly
authorized Apache-2.0 for this standalone extraction. That instruction is the
authorization relied on here, in addition to the technical provenance review;
it is not independent evidence of ownership or an assignment of rights. The
`yagizce` copyright attribution preserves the recorded upstream attribution,
not a finding that every line has legally established sole ownership. Any
applicable employment, contractor, or third-party agreements must be checked
by the rights holder before a public release; none was supplied for this review.

## Apache-2.0 compatibility assessment

The reviewed runtime is standalone: it neither imports nor bundles the parent
application or its dependencies. No MIT-covered files, incompatible licensed
packages, or third-party expressive content were identified in this subset.
There is therefore no identified license incompatibility in the reviewed
contents, subject to the title-review limits above. This is a scoped assessment,
not a certificate that undisclosed rights do not exist.

LICENSE contains the unmodified official Apache-2.0 text; NOTICE carries the
upstream attribution and extraction changes. The adapted runtime file states
that it was changed. Apache-2.0 Sections 2–4 govern copyright/patent grants and
redistribution; Section 6 excludes a general trademark grant. See the
[official license](https://www.apache.org/licenses/LICENSE-2.0) and
[application guidance](https://www.apache.org/foundation/license-faq.html#Apply-My-Software).
Using this license does not make the project an Apache Software Foundation
project or imply ASF endorsement. Grants are limited to rights the contributors
can actually license; no rights in unrelated commercial application files are
created by this extraction.

## Changes and license boundary

- Retained `computeFineKinneyScore` with its exact arithmetic evaluation order.
- Converted source scale objects to frozen numeric arrays, excluding UI fields.
- Exposed `classifyFineKinneyRisk` as a new key-only API using the same threshold
  comparisons as `getFineKinneyRiskLevel(score).key`. No UI-returning function is
  exported; this is an intentional API boundary, not an application integration.
- Added independent tests, English examples/docs, types, packaging, and CI.
- Applied Apache-2.0 only to this new directory, with NOTICE attribution.

Apache-2.0 grants reuse rights, including commercial and relevant patent rights
under its terms; it is not an ownership transfer. The commercial application,
its assets/brand, PR #7/#14, main, and deployment configuration are outside this
grant and unchanged. Separately consuming this library does not require opening
the entire application under Apache-2.0, but library redistribution obligations
still apply. Publicly available parent source is not made private by extraction.

This component is added to the existing PR #14 branch as a real new change.
No new repository, artificial history, npm publication, release, merge, deployment,
or support application is part of this integration. Apache-2.0 applies only within
this component directory, not to the original src engine, root CI or application.
Earlier MIT grants and third-party rights remain unaffected. No concrete
conflicting ownership claim or incompatible third-party code was found in the
reviewed subset; stop distribution if such a conflict emerges.
