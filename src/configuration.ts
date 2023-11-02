import { Service } from 'typedi';

@Service()
class Configuration {
  public readonly DISCORD_GUILD_ID: string | null;
  public readonly DISCORD_TOKEN: string | null;
  public readonly UNAUTHORIZED_SOCKET: string | null;
  public readonly LOCALE: string;
  public readonly PORT: string;

  private constructor(
    DISCORD_GUILD_ID: string | null,
    DISCORD_TOKEN: string | null,
    UNAUTHORIZED_SOCKET: string | null,
    LOCALE: string,
    PORT: string,
  ) {
    this.DISCORD_GUILD_ID = DISCORD_GUILD_ID;
    this.DISCORD_TOKEN = DISCORD_TOKEN;
    this.UNAUTHORIZED_SOCKET = UNAUTHORIZED_SOCKET;
    this.LOCALE = LOCALE;
    this.PORT = PORT;
  }

  public static readFromEnv(): Configuration {
    return new Configuration(
      process.env.DISCORD_GUILD_ID || null,
      process.env.DISCORD_TOKEN || null,
      process.env.UNAUTHORIZED_SOCKET || null,
      process.env.LOCALE || 'pl',
      process.env.PORT || '9000',
    );
  }
}

export { Configuration };
