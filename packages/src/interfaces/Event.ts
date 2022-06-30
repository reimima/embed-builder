import type { Bot } from '../Bot';
import type { ClientEvents } from 'discord.js';

export abstract class Event {
    public readonly name: keyof ClientEvents;
    public readonly once: boolean;

    protected constructor(
        protected readonly client: Bot,
        name: keyof ClientEvents,
        once: boolean,
    ) {
        this.name = name;
        this.once = once;
    }

    public abstract run(...args: unknown[]): void;
}
