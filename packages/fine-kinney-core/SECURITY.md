# Security policy for Fine-Kinney Core

Follow the repository's [security reporting policy](../../SECURITY.md).
Use private reporting if available; otherwise request a private contact without
posting exploit details or sensitive data. This file does not claim the private
reporting setting is enabled or promise a response time. Identify the component
path and affected commit/version.

Version 0.1.0 is an unreleased component preparation. The runtime has no npm
dependencies, filesystem/network access, dynamic evaluation, storage, or
authentication. Node.js, npm, Actions and packaging still require maintenance.

Validate finite numeric values and the selected scales before calling the core.
It deliberately retains source artifacts for negative values and NaN; see README.
Arithmetic and threshold errors can affect safety decisions. Report minimal
reproductions with expected/actual results. Qualified human assessment is required;
this library is not a safety certification.

The application's dependency vulnerabilities and exceptions remain in the root
policy and are neither inherited nor fixed by this extraction. The component's
dependency audit has no exception list. CI uses read-only permissions and does
not publish or deploy.
