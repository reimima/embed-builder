import type { Bot } from '../Bot';
import { Event } from '../interfaces';

export default class extends Event {
    public constructor(protected override readonly client: Bot) {
        super(client, 'ready', true);
    }

    public async run(): Promise<void> {
        console.info('Succesfully logged in and is Ready.');
        console.info(`The bot is participating in ${this.client.guilds.cache.size ?? 'none'} servers.`);

        console.info('Starting to subscribe commands to Discord Server.');
        await this.client.commandManager.subscribe()
            .then(() => console.info('Succesfully subscribed commands to Discord Server.'))
            .catch(e => console.error('There was an error subscribing', e));
    }
}
