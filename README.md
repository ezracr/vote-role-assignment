# vote-role-assignment
A discord bot that assigns the specified role automatically provided enough votes and saves the submitted document.

- Available commands: `enable`, `disable`, `update`, `info`, `migrate`.
- Records likes and dislikes, it's possible to undo your vote. But it won't cancel the awarded role if the threshold was met.
- Allows only users with the roles `allowed-to-vote-roles` to vote. If `allowed-to-vote-role` is not set, anyone can vote.
- Once `voting-threshold` is met, assigns `awarded-role` and saves the document to the db.
- If the user already has the role, then it will be immediately saved to the db.
- The page's url with the list of documents can be accessed with the info command.

## Setup
- On Windows some commands need an adjustment, e.g. `build:start` needs to be modified to `npm run build & npm run start:prod`.
- In `config.ts` you need to specify guild (server) id and which role ids can use the commands, everything else is customized in `local.env`.
- Necessary bot permissions (a url can be generated in OAuth2 -> URL Generator): Scopes: `bot`, `applications.commands`, Bot permissions: `Send messages`, `Manage Roles`, `Manage Messages`.
- In the roles hierarchy move the bot's role above the roles it should be able to assign.

### DB
If `pgdata` does not exists, it will be created and automatically populated with `bot/src/db/sql/init.sql`

### `local.env` structure
```
DISCORD_TOKEN=YourBotsToken  
POSTGRES_PASSWORD=PickAnyPsqlPass  
DB_CONNECTION_STRING=postgres://postgres:PickAnyPsqlPass@postgres:5432/bot  
BASE_URL=http://your-url:5000
```

If the port is different, then you need to modify it in `docker-compose.yml` and replace `5000` in `"5000:3000"` with something else.

### `.env.bot.development` structure
If you want to test the project, in addition to the fields above add (name should be user's server name without `@`):
```bash
TEST_USER_NAME1=     # how the name is displayed on the server, for example 'ezra (test)'
TEST_USER_ID1=       # for example '858792788937801728'
TEST_MAIL1=
TEST_PASS1=
TEST_USER_NAME2=
TEST_USER_ID2=
TEST_MAIL2=
TEST_PASS2=
NODE_ENV=test-vote-discord-bot
```

### Docker
- Docker image can be public, as environmental variables are not stored in images.
- To fetch new images automatically on the server, you can install tools like `containrrr/watchtower`.

Useful commands:
- `docker ps` - shows running containers
- To build all containers: `docker-compose build`.
- To build an individual container, e.g. to build the db container: `docker-compose build postgres`.
- Starting all containers: `docker-compose up`, starting in the background: `docker-compose up -d`.
- Starting an individual container `docker-compose up postgres`.
- Stopping those that run in the background: `docker-compose down` 
- Building and starting: `docker-compose up -d --build`.
- To view the terminal output of a container running in the bg: `docker logs <First few characters from the container's id>`. You can find the container's id with the help of `docker ps`.
- If you want to enter a container: `docker exec it <First few characters from the container's id> bash`. Sometimes bash might not be installed, then try `sh`.
- Pushing/pulling
  - Don't forget to login first, e.g.: `docker login repo.treescale.com --username myusername `. 
  - `docker push registry.gitlab.com/my-corp/votedocbot/votedocbotdb:latest`
  - `docker pull registry.gitlab.com/my-corp/votedocbot/votedocbotdb:latest`

#### `docker-compose.override`
#### Example of `docker-compose.override` in development
```yml
version: "3.3"
services:
  postgres:
    restart: unless-stopped
    build:
      context: .
      dockerfile: DockerfilePostgres
    volumes:
      - /home/user/dev/vote-role-assignment/pgdata:/var/lib/postgresql/data/pgdata    
    # ports: # Open the ports if you want to access the DB outside of the app container, 
    #        # then the DB connection string will be `localhost:5447` instead of `postgres:5432`
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
