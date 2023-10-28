import { VoiceConnectionStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice';
import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { CommandProtocol } from 'interfaces/Command';

export const inviteToVoiceChannel: CommandProtocol = {
  data: new SlashCommandBuilder()
    .setName('wheeze_with_us') // <------------- think about nice name for slash command
    .setDescription('invite bot to play lebkuchenFM sounds on voice channel')
    .addChannelOption((option) => option
      .setName('channel')
      .setDescription('channel where sounds will be played')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildVoice)),
  run: async (interaction) => {
    await interaction.deferReply();
    if (!interaction.isChatInputCommand()) { // <---------------- not sure about that casting
      interaction.editReply({ content: 'Something went wrong' });
      return;
    }
    const voiceChannel = interaction.options.getChannel('channel');
    const { guild, guildId, commandName: name } = interaction;
    if (voiceChannel && guild && guildId && name === 'wheeze_with_us') {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: guild.voiceAdapterCreator,
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        const player = createAudioPlayer();
        connection.subscribe(player);

        const resource = createAudioResource('https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg');
        player.play(resource);
      });
    } else {
      interaction.editReply({ content: 'VoiceChannel connection error' });
    }
  },
};
