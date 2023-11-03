import { Service } from 'typedi';

@Service()
class Configuration {
  public readonly DISCORD_GUILD_ID: string | null;
  public readonly DISCORD_TOKEN: string | null;
  public readonly LEBKUCHEN_FM_SOCKET_ADDRESS: string | null;
  public readonly LEBKUCHEN_FM_SOCKET_TOKEN: string | null;
  public readonly PORT: string;

  private constructor(
    DISCORD_GUILD_ID: string | null,
    DISCORD_TOKEN: string | null,
    LEBKUCHEN_FM_SOCKET_ADDRESS: string | null,
    LEBKUCHEN_FM_SOCKET_TOKEN: string | null,
    PORT: string,
  ) {
    this.DISCORD_GUILD_ID = DISCORD_GUILD_ID;
    this.DISCORD_TOKEN = DISCORD_TOKEN;
    this.LEBKUCHEN_FM_SOCKET_ADDRESS = LEBKUCHEN_FM_SOCKET_ADDRESS;
    this.LEBKUCHEN_FM_SOCKET_TOKEN = LEBKUCHEN_FM_SOCKET_TOKEN;
    this.PORT = PORT;
  }

  public static readFromEnv(): Configuration {
    return new Configuration(
      process.env.DISCORD_GUILD_ID || null,
      process.env.DISCORD_TOKEN || null,
      process.env.LEBKUCHEN_FM_SOCKET_ADDRESS || null,
      process.env.LEBKUCHEN_FM_SOCKET_TOKEN || null,
      process.env.PORT || '9000',
    );
  }
}

export { Configuration };
