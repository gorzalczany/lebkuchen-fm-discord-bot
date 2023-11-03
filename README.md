# Discord Bot for [LebkuchenFM](https://github.com/Deseteral/lebkuchen-fm) service

Provides functionalities for voice channels:
 - invite bot to any voice channel
 - listen to XSounds

## Configuration
Application requires following environment variables (can be provided in .env file):
- DISCORD_TOKEN=
- DISCORD_GUILD_ID=
- LEBKUCHEN_FM_SOCKET_ADDRESS=
- LEBKUCHEN_FM_SOCKET_TOKEN=(check `/api/auth` [endpoint]https://github.com/Deseteral/lebkuchen-fm#rest-endpoints)

## Development
Start by installing dependencies:
```sh
npm install
```

To build application run:
```sh
npm run build
```

If you already provided configuration then you can just start the application:
```sh
npm run start
```

## License
This project is licensed under the [MIT license](LICENSE.md).