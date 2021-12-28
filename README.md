# vote-role-assignment
Assigns a role automatically provided enough votes

- Records likes and dislikes, it's possible to undo your vote.
- Allows only users with the roles to vote in `allowedRoleIds`.
- Once `votesThreshold` is met, assigns `awardedRoleId`.

## Setup

### DB
If `pgdata` does not exists, it will be created and automatically populated with `src/db/sql/init.sql`

### `local.env` structure
DISCORD_TOKEN=YourBotsToken  
POSTGRES_PASSWORD=PickAnyPsqlPass  
DB_CONNECTION_STRING=postgres://postgres:PickAnyPsqlPass@localhost:5447/bot

### `docker-compose.override`
#### Example of `docker-compose.override` in development
```yml
version: "3.3"
services:
  postgres:
    restart: unless-stopped
    volumes:
      - /home/user14/dev/ezracr/vote-role-assignment/pgdata:/var/lib/postgresql/data/pgdata
    ports:
      - "5447:5432"

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
