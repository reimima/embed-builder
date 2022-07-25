import { Client } from 'discord.js';
import { EventManager, CommandManager } from './managers';

export class Bot extends Client {
    private readonly eventManager: EventManager;
    public readonly commandManager: CommandManager;

    public constructor() {
        super({
            intents: ['GUILDS', 'GUILD_INTEGRATIONS', 'GUILD_MESSAGES', 'GUILD_WEBHOOKS'],
            restTimeOffset: 0,
            http: { api: 'https://canary.discord.com/api' },
        });

        this.eventManager = new EventManager(this);
        this.commandManager = new CommandManager(this);
    }

    public override async login(token: string | undefined): Promise<string> {
        await this.eventManager.registerAll().catch(e => console.error(e));
        await this.commandManager.registerAll().catch(e => console.error(e));

        return super.login(token);
    }
}
