import type { Bot } from '../Bot';
import type { CommandInteraction } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { Command } from '../interfaces';

export default class extends Command {
    public constructor(public override readonly client: Bot) {
        super(client, {
            name: 'help',
            description: 'Learn more about Embed Builder.',
        });
    }

    public run(interaction: CommandInteraction<'cached'>) {
        interaction.reply({ embeds: [new MessageEmbed()
            .setTitle('About Embed Builder')
            .setDescription(`
                Hi! First of all, thank you for introducing this bot.

                I'm japanese, so maybe my english is bad. I'm sorry.

                This bot has just been developed.

                If you need help or have any ideas for Embed Builder, join the support server!

                I hope enjoy this bot!
            `).addFields(
                { name: 'author', value: 'reimima#3439' },
                { name: 'invite link', value: '[here](https://discord.com/api/oauth2/authorize?client_id=990063935308836864&permissions=414464732224&scope=bot%20applications.commands)' },
                { name: 'support server', value: '[here](https://discord.gg/3NbSVj9qSc)' },
                { name: 'github', value: '[here](https://github.com/reimima/embed-builder)' },
            )] });
    }
}
