import { VoiceConnectionStatus, joinVoiceChannel } from '@discordjs/voice';
import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandProtocol } from 'interfaces/Command';
import { Container } from 'typedi';
import { DiscordClient } from '../discordClient';

const commandName = 'wheeze_with_us'; // <------------- think about nice name for slash command
const channelOptionName = 'channel';

async function joinSelectedVoiceChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  const voiceChannel = interaction.options.getChannel(channelOptionName);
  const { guild, guildId, commandName: name } = interaction;
  if (!voiceChannel || !guild || !guildId || name !== commandName) {
    await interaction.editReply('something went wrong');
    return;
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    const discordClient = Container.get(DiscordClient);
    connection.subscribe(discordClient.player);
    interaction.editReply({ content: `I've joined ${voiceChannel.name} voice channel` });
  });
}

export const inviteToVoiceChannel: CommandProtocol = {
  data: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription('invite bot to play sounds in selected voice channel')
    .addChannelOption((option) => option
      .setName(channelOptionName)
      .setDescription('channel where sounds will be played')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildVoice)),

  run: async (interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.isChatInputCommand()) {
        await interaction.editReply('something went wrong');
        return;
      }
      await joinSelectedVoiceChannel(interaction);
    } catch (err) { console.log('Error during interaction:', err); }
  },
};
