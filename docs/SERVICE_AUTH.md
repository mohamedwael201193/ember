# Service HMAC authentication

`/v1/executions` and `/check` require these headers:

- `x-ember-timestamp`: Unix time in milliseconds
- `x-ember-nonce`: unique request nonce
- `x-ember-body-sha256`: lowercase SHA-256 of the exact UTF-8 request body
- `x-ember-signature`: lowercase HMAC-SHA256 of `<timestamp>.<nonce>.<body-sha256>`

The receiving service accepts timestamps within 60 seconds and rejects a nonce when it has already been used inside that window. The names are exported by `@ember/mission-core` as `HMAC_*_HEADER`.
