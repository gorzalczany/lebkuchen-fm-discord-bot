import { AudioPlayer, StreamType, createAudioPlayer, createAudioResource, getVoiceConnection } from '@discordjs/voice';
import { Client, Events, GatewayIntentBits, Interaction, REST, Routes, VoiceState } from 'discord.js';
import fs from 'fs';
import { CommandProtocol } from 'interfaces/Command';
import { Service } from 'typedi';
import { inviteToVoiceChannel } from './commands/inviteToVoiceChannel';
import { Configuration } from './configuration';
import { PlayXSoundEvent } from './interfaces/events';
import { SoundsManager } from './soundsManager';

@Service()
class DiscordClient {
  private client: Client;
  private commandList: CommandProtocol[];
  public player: AudioPlayer;

  constructor(
    private configuration: Configuration,
    private soundsManager: SoundsManager,
  ) {
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

    this.client.once(Events.ClientReady, (client) => this.onReady(client));
    this.client.on(Events.InteractionCreate, (interaction) => this.onInteraction(interaction));
    this.client.on(Events.VoiceStateUpdate, (oldState, newState) => this.onVoiceStateUpdate(oldState, newState));
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

  public async playAudioResource(from: PlayXSoundEvent): Promise<void> {
    const oggFile = await this.soundsManager.getFile(from);

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

  private async onInteraction(interaction: Interaction): Promise<void> {
    try {
      if (interaction.isCommand()) {
        this.commandList.find((command) => interaction.commandName === command.data.name)?.run(interaction);
      }
    } catch (err) {
      console.log(err);
    }
  }

  private async onVoiceStateUpdate(oldState: VoiceState, _newState: VoiceState): Promise<void> {
    // leave channel when none other left
    if (!oldState.member || !oldState.channel) { return; }
    if (oldState.channel.members.last()?.id !== this.client.user?.id) { return; }
    if (oldState.channel.members.size <= 1) {
      const connection = getVoiceConnection(oldState.guild.id);
      connection?.destroy();
    }
  }

  private onReady: (bot: Client) => Promise<void> = async (bot: Client) => {
    console.log('Registering Commands');
    await this.registerCommands(this.commandList, bot);
    console.log('Bot ready');
  };

  private async registerCommands(commands: CommandProtocol[], bot: Client): Promise<void> {
    if (!bot.user?.id || !bot.guilds || !this.configuration.DISCORD_TOKEN || !this.configuration.DISCORD_GUILD_ID) { return; }
    const commandData = commands.map((command) => command.data.toJSON());
    const rest = new REST().setToken(this.configuration.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(
        bot.user?.id,
        this.configuration.DISCORD_GUILD_ID,
      ),
      { body: commandData },
    );
  }
}

export { DiscordClient };
