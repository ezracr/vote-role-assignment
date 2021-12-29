# vote-role-assignment
Assigns a role automatically provided enough votes

- Records likes and dislikes, it's possible to undo your vote.
- Allows only users with the roles to vote in `allowedRoleIds`.
- Once `votesThreshold` is met, assigns `awardedRoleId`.

## Setup
- On Windows some commands need adjustment, e.g. `build:start` needs to be modified to `npm run build & npm run start:prod`.
- In `config.ts` you need to specify guild (server) id and which role ids can use the commands, everything else is customized in `local.env`

### DB
If `pgdata` does not exists, it will be created and automatically populated with `src/db/sql/init.sql`

### `local.env` structure
DISCORD_TOKEN=YourBotsToken  
POSTGRES_PASSWORD=PickAnyPsqlPass  
DB_CONNECTION_STRING=postgres://postgres:PickAnyPsqlPass@postgres:5432/bot
BASE_URL=http://your-url:your-port/voting-bot

### `docker-compose.override`
#### Example of `docker-compose.override` in development
```yml
version: "3.3"
services:
  postgres:
    restart: unless-stopped
    volumes:
      - /home/user/dev/vote-role-assignment/pgdata:/var/lib/postgresql/data/pgdata    
  app:
    restart: unless-stopped
    build: .
```

#### Example of `docker-compose.override` in production
```yml
version: "3.3"
services:
  postgres:
    volumes:
      - /opt/votedocbot/db:/var/lib/postgresql/data/pgdata

  app:
    image: registry.gitlab.com/my-corp/votedocbot/votedocbotapp:latest
```
