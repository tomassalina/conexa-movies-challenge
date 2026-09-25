#!/bin/sh
# Production entrypoint: run pending migrations, then start the server.
# Invoked directly by the deploy platform's startup command (no shell
# quoting gymnastics needed there, since the whole sequence lives here).
set -e

./node_modules/.bin/tsx ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.ts

exec node dist/main.js
