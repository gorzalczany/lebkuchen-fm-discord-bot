/* eslint-disable import/first */
import 'reflect-metadata';

import { config as configDotenv } from 'dotenv';
import io from 'socket.io-client';
import Container from 'typedi';
import { Configuration } from './configuration';
import { DiscordClient } from './discord-client';
import { EventData } from './interfaces/events';

async function main(): Promise<void> {
  configDotenv();
  const config = Configuration.readFromEnv();
  Container.set(Configuration, config);

  // /* Connect to Discord */
  const discordClient = Container.get(DiscordClient);
  await discordClient.setUp();

  /* Create WebSocket server */
  if (!config.LEBKUCHEN_FM_SOCKET_ADDRESS || !config.LEBKUCHEN_FM_SOCKET_TOKEN) {
    console.log('Missing lebkuchenFM socket configuration.');
    return;
  }
  const unauthorizedSocket = io(config.LEBKUCHEN_FM_SOCKET_ADDRESS, {
    extraHeaders: {
      Authorization: `Basic ${config.LEBKUCHEN_FM_SOCKET_TOKEN}`,
    },
  });
  unauthorizedSocket.on('connect', () => console.log('Connected to lebkuchenFM events stream.'));
  unauthorizedSocket.on('message', (eventData: EventData) => {
    switch (eventData.id) {
      case 'PlayXSoundEvent':
        discordClient.playAudioResource(eventData);
        break;
      case 'SayEvent':
        // ...
        break;
      default:
        break;
    }
  });
}

try {
  main();
} catch (err) {
  console.log(err);
}
