import type { Bot } from '../Bot';
import type { CommandInteraction, Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { Command } from '../interfaces';

export default class extends Command {
    public constructor(public override readonly client: Bot) {
        super(client, {
            name: 'ping',
            description: 'Give the bot ping to you.',
        });
    }

    public async run(interaction: CommandInteraction<'cached'>): Promise<Message> {
        const i = await interaction.reply({ embeds: [{ color: 'RANDOM', title: 'Now loading...', description: 'Please wait...' }], fetchReply: true });
        return i.edit({ embeds: [
            new MessageEmbed()
                .setColor('RANDOM')
                .setTitle('Done!')
                .setDescription(`⌛ ${this.client.ws.ping}ms \n\n💬 ${Date.now() - i.createdTimestamp}ms`),
        ] });
    }
}
