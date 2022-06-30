import type { Bot } from '../Bot';
import type { Interaction } from 'discord.js';
import { Event } from '../interfaces';

export default class extends Event {
    public constructor(protected override readonly client: Bot) {
        super(client, 'interactionCreate', false);
    }

    public async run(interaction: Interaction<'cached'>): Promise<void> {
        if (interaction.isCommand()) {
            if (!interaction.guild) return interaction.reply({ content: 'You must execution this command in server.', ephemeral: true });

            await this.client.commandManager.get(interaction.commandName)?.run(interaction);
        }
    }
}
