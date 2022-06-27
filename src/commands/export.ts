import type { Bot } from '../Bot';
import type { CommandInteraction, Message } from 'discord.js';
import { MessageAttachment } from 'discord.js';
import { Command } from '../interfaces';

export default class extends Command {
    public constructor(public override readonly client: Bot) {
        super(client, {
            name: 'export',
            description: 'Send the embed source of the specified message.',
            options: [{
                name: 'id',
                description: 'ID of the specified message.',
                type: 'STRING',
                required: true,
            }, {
                name: 'number',
                description: 'Setting number of embeds.',
                type: 'NUMBER',
                required: true,
            }],
        });
    }

    public run(interaction: CommandInteraction<'cached'>) {
        interaction.channel?.messages.fetch(`${interaction.options.getString('id')}`)
            .then(message => this.onMessage(interaction, message))
            .catch(() => interaction.reply({ content: 'Sorry, I can\'t found the message.', ephemeral: true }));
    }

    private async onMessage(interaction: CommandInteraction<'cached'>, message: Message) {
        const number = interaction.options.getNumber('number') as number - 1;
        if (!message.embeds[number]) return interaction.reply({ content: 'Sorry, I can\'t found the embed of message.', ephemeral: true });
        await interaction.reply({ files: [new MessageAttachment(Buffer.from(JSON.stringify(message.embeds[number]?.toJSON())), 'embed.json')], ephemeral: true });
    }
}
