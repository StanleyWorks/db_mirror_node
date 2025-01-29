# DB Sync 
 > A tool to sync DB between environments

## Setup
- Add your config to the .env
- If the env does exist, copy .env example
- The first section is the primary DB
- Install deps with pnpm

```.env
PRIMARY_DB_HOST=
PRIMARY_DB_PORT=
PRIMARY_DB_USER=
PRIMARY_DB_PASSWORD=
PRIMARY_DB_SCHEMA=

SECONDARY_DB_HOST=
SECONDARY_DB_PORT=
SECONDARY_DB_USER=
SECONDARY_DB_PASSWORD=
SECONDARY_DB_SCHEMA=
```

## Running
- First build it with `npm run build`
- The run npm start. Your DB with
