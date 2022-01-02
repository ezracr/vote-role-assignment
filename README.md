# vote-role-assignment
Assigns a role automatically provided enough votes

- Available commands: enable, disable, update, info.
- Records likes and dislikes, it's possible to undo your vote. But it won't cancel the awarded role if the threshold was met.
- Allows only users with the roles to vote in `allowedRoleIds`.
- Once `votesThreshold` is met, assigns `awardedRoleId` and saves the document to the db.
- If the user already has the role, then it will be immediately saved to the db.
- The page with the documents can be accessed with the info command.

## Setup
- On Windows some commands need an adjustment, e.g. `build:start` needs to be modified to `npm run build & npm run start:prod`.
- In `config.ts` you need to specify guild (server) id and which role ids can use the commands, everything else is customized in `local.env`.
- Docker image can be public, as environmental variables are not stored in images.
- To fetch new images automatically on the server, you can install tools like `containrrr/watchtower`.

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
    # ports: # Open the ports if you want to access the DB outside of the app container, then the DB connection string will be `localhost:5447` instead of `postgres:5432`
    #   - "5447:5432"
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
    image: registry.gitlab.com/my-corp/votedocbot/votedocbotdb:latest

  app:
    image: registry.gitlab.com/my-corp/votedocbot/votedocbotapp:latest
```
