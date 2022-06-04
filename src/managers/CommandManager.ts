import type { Bot } from '../Bot';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Collection } from 'discord.js';
import { Command } from '../interfaces';

export class CommandManager extends Collection<string, Command> {
    public constructor(private readonly client: Bot) {
        super();
    }

    public register(command: Command): void {
        this.set(command.data.name, command);
    }

    public async registerAll(): Promise<void> {
        const dir = resolve(__dirname, '..', 'commands');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const modules = await Promise.all(readdirSync(dir).filter(file => /.js|.ts/.exec(file)).map(file => import(`${dir}/${file}`).then(a => new a.default(this.client))));
        const commands = modules.filter<Command>((value): value is Command => value instanceof Command);
        await Promise.all(commands.map(event => this.register(event)));
    }

    public async subscribe(): Promise<void> {
        const subscribed = await this.client.application?.commands.fetch() ?? new Collection();

        const diffAdded = this.filter(c => !subscribed.find(s => s.name === c.data.name));
        const diffRemoved = subscribed?.filter(s => !this.find(c => s.name === c.data.name));
        const diff = this.filter(c => !(subscribed.find(s => s.name === c.data.name)?.equals(c.data) ?? false));
        const guild = this.client.guilds.cache.get('975311610522505237');

        if (!guild) return;

        for (const add of diffAdded.values()) {
            await guild.commands.create(add.data);
        }
        for (const remove of diffRemoved.values()) {
            await guild.commands.delete(remove.id);
        }
        for (const change of diff.values()) {
            await guild.commands.edit(subscribed.find(s => s.name === change.data.name)?.id as string, change.data);
        }
    }
}
