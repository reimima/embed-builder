import type { Bot } from '../Bot';
import type { CommandInteraction } from 'discord.js';
import fetch from 'node-fetch';
import { Command } from '../interfaces';

export default class extends Command {
    public constructor(public override readonly client: Bot) {
        super(client, {
            name: 'import',
            description: 'Load the embed source.',
            defaultPermission: true,
            options: [{
                name: 'source',
                description: 'Embed source.',
                type: 'ATTACHMENT',
                required: true,
            }],
        });
    }

    public run(interaction: CommandInteraction<'cached'>) {
        const attachment = interaction.options.getAttachment('source');
        if (!attachment) return interaction.reply({ content: 'Sorry, I can\'t found the file.', ephemeral: true });
        if (!attachment.url.endsWith('.json')) return interaction.reply({ content: 'You must send only json file.', ephemeral: true });
        fetch(attachment.url).then(async file => {
            interaction.reply({ embeds: [await file.json()] });
        });
    }
}
