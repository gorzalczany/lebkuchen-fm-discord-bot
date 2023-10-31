import { Client, Events, GatewayIntentBits, Interaction, REST, Routes } from 'discord.js';
import { CommandProtocol } from 'interfaces/Command';
import { Service } from 'typedi';
import { AudioPlayer, AudioResource, StreamType, createAudioPlayer, createAudioResource, generateDependencyReport } from '@discordjs/voice';
import { resolve } from 'path';
import fs from 'fs';
import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'child_process';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import nodeFetch from 'node-fetch'; // TODO: fetch vs node-fetch - better solution
import util from 'util';
import { Configuration } from './configuration';
import { inviteToVoiceChannel } from './commands/inviteToVoiceChannel';
import { PlayXSoundEvent } from './events';

@Service()
class DiscordClient {
  private client: Client;
  private commandList: CommandProtocol[];
  public player: AudioPlayer;

  constructor(private configuration: Configuration) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });
    this.player = createAudioPlayer();
    this.commandList = [inviteToVoiceChannel];

    const onReady: (bot: Client) => Promise<void> = async (bot: Client) => {
      const rest = new REST({ version: '9' }).setToken(this.configuration.DISCORD_TOKEN!!);
      const commandData = this.commandList.map((command) => command.data.toJSON());
      await rest.put( // TODO: find the easy (easier) way to register commands?
        Routes.applicationGuildCommands(
          bot.user?.id || 'missing',
          this.configuration.DISCORD_GUILD_ID || 'missing',
        ),
        { body: commandData },
      );
      console.log('bot ready');
    };

    this.client.on(Events.ClientReady, (client) => onReady(client));
    this.client.on(Events.InteractionCreate, (interaction) => this.onInteraction(interaction));
  }

  public async setUp(): Promise<void> {
    if (!this.configuration.DISCORD_TOKEN) {
      console.log('Missing discord token');
      return;
    }

    await this.client.login(this.configuration.DISCORD_TOKEN);
    console.log('Bot connected with Discord');
    // console.log(generateDependencyReport());
  }

  private async onInteraction(interaction: Interaction): Promise<void> {
    try {
      if (interaction.isCommand()) {
        this.commandList.find((command) => interaction.commandName === command.data.name)?.run(interaction);
      }
    } catch (err) {
      console.log(err);
    }
  }

  public async playAudioResource(from: PlayXSoundEvent): Promise<void> {
    const oggFile = await this.getFile(from);

    if (oggFile) {
      const stream = fs.createReadStream(oggFile);
      const oggResource = createAudioResource(stream, {
        inputType: StreamType.OggOpus,
      });
      this.player.play(oggResource);
      console.log('ogg played');
    } else {
      const resource = createAudioResource(from.soundUrl);
      this.player.play(resource);
      console.log('origin played');
    }
  }

  private async getFile(from: PlayXSoundEvent): Promise<string | null> {
    const url = new URL(from.soundUrl);
    const originName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
    const oggName = `${originName.substring(0, originName.lastIndexOf('.'))}.ogg`;

    const destination = resolve('./downloads', oggName);
    const fileExists = fs.existsSync(destination);

    console.log(originName, ' => ', oggName, ' [', destination, ' ]');

    if (fileExists) { return destination; }

    // download
    const res = await nodeFetch(url);
    if (!res.body) { return null; }
    if (!fs.existsSync('downloads')) await fs.promises.mkdir('downloads');
    const originFile = resolve('./downloads', originName);
    const fileStream = fs.createWriteStream(originFile, { flags: 'wx' });
    await finished(Readable.from(res.body).pipe(fileStream));

    // convert
    if (!ffmpegPath) { return null; }
    const args = [
      '-i', originFile,
      '-acodec', 'libopus',
      '-f', 'opus',
      '-ar', '48000',
      '-ac', '2',
      destination,
    ];

    const asyncExec = util.promisify(execFile);
    await asyncExec(ffmpegPath, args);

    fs.unlinkSync(originFile);

    return destination;
  }
}

export { DiscordClient };
