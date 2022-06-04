import type { Bot } from '../Bot';
import type { ApplicationCommandData, Interaction } from 'discord.js';

export abstract class Command {
    protected constructor(
        protected readonly client: Bot,
        public readonly data: ApplicationCommandData,
    ) {}

    public abstract run(interaction: Interaction): unknown;
}
