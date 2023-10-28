import { Client, GatewayIntentBits, Interaction } from 'discord.js';
import { CommandProtocol } from 'interfaces/Command';
import { Service } from 'typedi';
import { Configuration } from './configuration';
import { inviteToVoiceChannel } from './commands/inviteToVoiceChannel';

@Service()
class DiscordClient {
  private client: Client;
  private commandList: CommandProtocol[];

  constructor(private configuration: Configuration) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });
    this.client.on('interaction', (interaction) => this.onInteraction(interaction));
    this.commandList = [inviteToVoiceChannel];
    // TODO: Registering Commands
    // could be done as a part of deploy process
    //
    //      import { REST } from "@discordjs/rest";
    //      import { Routes } from "discord-api-types/v9";
    //      import { Client } from "discord.js";

    //      export const onReady = async (BOT: Client) => {
    //      const rest = new REST({ version: "9" }).setToken(
    //          process.env.BOT_TOKEN as string
    //      );

    //      const commandData = commandList.map((command) => command.data.toJSON());

    //      await rest.put(
    //          Routes.applicationGuildCommands(
    //          BOT.user?.id || "missing id",
    //          process.env.GUILD_ID as string
    //          ),
    //          { body: commandData }
    //      );

    //      console.log("Discord ready!");
    //      };
  }

  public async setUp(): Promise<void> {
    if (!this.configuration.DISCORD_TOKEN) {
      console.log('Missing discord token');
      return;
    }

    await this.client.login(this.configuration.DISCORD_TOKEN);
    console.log('Bot connected with Discord');
  }

  private async onInteraction(interaction: Interaction): Promise<void> {
    try {
      if (interaction.isCommand()) {
        this.commandList.find((command) => interaction.commandName === command.data.name)?.run(interaction);
      }
    } catch (err) {
      // some error
    }
  }
}

export { DiscordClient };
