/* eslint-disable import/first */
import 'reflect-metadata';

import { config as configDotenv } from 'dotenv';
import io from 'socket.io-client';
import Container from 'typedi';
import { DiscordClient } from './discordClient';
import { EventData } from './interfaces/events';
import { Configuration } from './configuration';

async function main(): Promise<void> {
  configDotenv();
  const config = Configuration.readFromEnv();
  Container.set(Configuration, config);

  // /* Connect to Discord */
  const discordClient = Container.get(DiscordClient);
  await discordClient.setUp();

  /* Create WebSocket server */
  const socketAddress = config.UNAUTHORIZED_SOCKET;
  if (!socketAddress) {
    console.log('missing unauthorized socket config');
    return;
  }
  const unauthorizedSocket = io(socketAddress);
  unauthorizedSocket.on('connect', () => console.log('Connected to unauthorized namespace'));
  unauthorizedSocket.on('message', (eventData: EventData) => {
    switch (eventData.id) {
      case 'PlayXSoundEvent':
        discordClient.playAudioResource(eventData);
        break;

      case 'SayEvent':
        //
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
