import type { CommandInteraction, EmbedAuthorData, Interaction, Message, SelectMenuInteraction } from 'discord.js';
import type { Bot } from 'src/Bot';
import { InteractionCollector, MessageActionRow, MessageEmbed, MessageSelectMenu } from 'discord.js';
import { Command } from '../interfaces';

export default class extends Command {
    private title: string;
    private description: string;
    private readonly author: EmbedAuthorData;
    private isTimestamp: boolean;
    private titleUrl: string;
    private noteMessage!: Message;

    public constructor(public override readonly client: Bot) {
        super(client, {
            name: 'build',
            description: 'Let\'s build your own embed!',
        });

        this.title = 'Some title.';
        this.description = 'Some description';
        this.author = {
            name: 'Some name.',
            iconURL: 'https://cdn.discordapp.com/embed/avatars/2.png',
            url: 'https://discord.com/',
        };
        this.isTimestamp = false;
        this.titleUrl = 'https://discord.com/';
    }

    public run(interaction: CommandInteraction<'cached'>) {
        const customId = Math.random().toString(36).substring(7);

        interaction.reply({
            embeds: this.buildEmbeds(
                this.title,
                this.titleUrl,
                this.description,
                this.author,
                this.isTimestamp,
            ),
            components: this.buildComponents(customId),
        });

        const collecter = new InteractionCollector(this.client, {
            filter: i => i.isSelectMenu() && customId.includes(i.customId),
        });

        collecter.on('collect', (i: Interaction<'cached'>) => {
            if (!i.isSelectMenu()) return;
            this.onInteraction(i);
        });
    }

    private async onInteraction(i: SelectMenuInteraction<'cached'>) {
        await i.update({ content: undefined });
        const target = i.values[0];

        if (target === 'author') {
            this.onAuthor(i);
            return;
        }

        if (target === 'timestamp') {
            this.onTimestamp();
            i.editReply({
                embeds: this.buildEmbeds(
                    this.title,
                    this.titleUrl,
                    this.description,
                    this.author,
                    this.isTimestamp,
                ),
            });
            return;
        }

        const message = await i.channel?.send({ embeds: [
            new MessageEmbed()
                .setDescription('Send your choice word.'),
        ] }) as Message;

        const filter = (res: Message) => i.user.id === res.author.id;
        const collected = await i.channel?.awaitMessages({ filter: filter, max: 1 });
        const res = collected?.first() as Message;

        switch (target) {
            case 'title':
                await i.editReply({
                    embeds: this.buildEmbeds(
                        res.content,
                        this.titleUrl,
                        this.description,
                        this.author,
                        this.isTimestamp,
                    ),
                }).then(() => {
                    this.deleteTarget(message, res);
                    this.title = res.content;
                });
                break;

            case 'description':
                await i.editReply({
                    embeds: this.buildEmbeds(
                        this.title,
                        this.titleUrl,
                        res.content,
                        this.author,
                        this.isTimestamp,
                    ),
                }).then(() => {
                    this.deleteTarget(message, res);
                    this.description = res.content;
                });
                break;

            case 'titleUrl':
                if (this.checkUrl(res.content)) {
                    await i.editReply({
                        embeds: this.buildEmbeds(
                            this.title,
                            res.content,
                            this.description,
                            this.author,
                            this.isTimestamp,
                        ),
                    }).then(() => {
                        this.deleteTarget(message, res);
                        this.titleUrl = res.content;
                    });
                } else {
                    const announce = await i.channel?.send({ content: `${i.user.toString()}, It is not an URL.` }) as Message;
                    this.deleteTarget(message, res);
                    await this.sleep(3000).then(() => announce.delete());
                }
                break;
        }
    }

    private onTimestamp() {
        if (this.isTimestamp) {
            this.isTimestamp = false;
        } else {
            this.isTimestamp = true;
        }
    }

    private async onAuthor(baseI: SelectMenuInteraction<'cached'>) {
        const customId = Math.random().toString(36).substring(7);

        const embed = new MessageEmbed()
            .setTitle('Set an author options.')
            .addFields(
                { name: 'Name', value: 'Set a author\'s name.' },
                { name: 'Icon?', value: 'Set a author\'s icon. You can delete this option.' },
                { name: 'NameUrl?', value: 'Name\'s url. You can delete this option.' },
            );

        const selectMenu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId(customId)
                .setOptions(
                    {
                        label: 'name',
                        description: 'Set a author\'s name',
                        value: 'name',
                    },
                    {
                        label: 'icon',
                        description: 'Set a author\'s icon. You can delete this option.',
                        value: 'icon',
                    },
                    {
                        label: 'nameUrl',
                        description: 'Name\'s url. You can delete this option.',
                        value: 'nameUrl',
                    },
                ),
        );

        await baseI.channel?.send({
            embeds: [embed],
            components: [selectMenu],
        });

        const collecter = new InteractionCollector(this.client, {
            filter: authorI => authorI.isSelectMenu() && customId.includes(authorI.customId),
        });

        collecter.on('collect', (authorI: SelectMenuInteraction<'cached'>) => {
            if (!authorI.isSelectMenu) return;
            this.onAuthorInteraction(authorI, baseI);
        });
    }

    private async onAuthorInteraction(authorI: SelectMenuInteraction<'cached'>, baseI: SelectMenuInteraction<'cached'>) {
        authorI.update({ content: undefined });
        const target = authorI.values[0];

        if (target === 'icon') {
            const noteEmbed = new MessageEmbed()
                .setTitle('Note.')
                .setDescription(`
                - You can send image file or image url.
                - Don't send another url.
                - If you want to delete this option, send \`delete\`.
            `);

            this.noteMessage = await authorI.channel?.send({
                embeds: [noteEmbed],
            }) as Message;
        }

        if (target === 'nameUrl') {
            const noteEmbed = new MessageEmbed()
                .setTitle('Note.')
                .setDescription(`
                - If you want to delete this option, send \`delete\`.
            `);

            this.noteMessage = await authorI.channel?.send({
                embeds: [noteEmbed],
            }) as Message;
        }

        const message = await authorI.channel?.send({ embeds: [
            new MessageEmbed()
                .setDescription('Send your choice word.'),
        ] }) as Message;

        const filter = (res: Message) => authorI.user.id === res.author.id;
        const collected = await authorI.channel?.awaitMessages({ filter: filter, max: 1 });
        const res = collected?.first() as Message;

        switch (target) {
            case 'name':
                this.author.name = res.content;
                baseI.editReply({
                    embeds: this.buildEmbeds(
                        this.title,
                        this.titleUrl,
                        this.description,
                        this.author,
                        this.isTimestamp,
                    ),
                }).then(() => this.deleteTarget(message, res));
                break;

            case 'icon':
                this.onIconURL(baseI, authorI, message, res);
                break;

            case 'nameUrl':
                if (this.checkUrl(res.content)) {
                    this.author.url = res.content;
                    await baseI.editReply({
                        embeds: this.buildEmbeds(
                            this.title,
                            this.titleUrl,
                            this.description,
                            this.author,
                            this.isTimestamp,
                        ),
                    }).then(() => this.deleteTarget(message, res, this.noteMessage));
                } else {
                    if (res.content === 'delete') {
                        this.author.url = undefined;
                        await baseI.editReply({
                            embeds: this.buildEmbeds(
                                this.title,
                                this.titleUrl,
                                this.description,
                                this.author,
                                this.isTimestamp,
                            ),
                        }).then(() => this.deleteTarget(message, res, this.noteMessage));
                        return;
                    }
                    const announce = await authorI.channel?.send({ content: `${authorI.user.toString()}, It is not an URL.` }) as Message;
                    this.deleteTarget(message, res);
                    await this.sleep(3000).then(() => announce.delete());
                }
                break;
        }
    }

    private async onIconURL(
        baseI: SelectMenuInteraction<'cached'>,
        authorI: SelectMenuInteraction<'cached'>,
        message: Message,
        res: Message,
    ) {
        const file = res.attachments.first();

        if (file) {
            this.author.iconURL = file.url;
            baseI.editReply({
                embeds: this.buildEmbeds(
                    this.title,
                    this.titleUrl,
                    this.description,
                    this.author,
                    this.isTimestamp,
                ),
            }).then(() => this.deleteTarget(message, res, this.noteMessage));
        } else if (!file) {
            if (this.isImageUrl(res.content)) {
                this.author.iconURL = res.content;
                baseI.editReply({
                    embeds: this.buildEmbeds(
                        this.title,
                        this.titleUrl,
                        this.description,
                        this.author,
                        this.isTimestamp,
                    ),
                }).then(() => this.deleteTarget(message, res, this.noteMessage));
            } else {
                if (res.content === 'delete') {
                    this.author.iconURL = undefined;
                    baseI.editReply({
                        embeds: this.buildEmbeds(
                            this.title,
                            this.titleUrl,
                            this.description,
                            this.author,
                            this.isTimestamp,
                        ),
                    }).then(() => this.deleteTarget(message, res, this.noteMessage));
                    return;
                }
                const announce = await authorI.channel?.send({ content: `${authorI.user.toString()}, It is not an image URL or image.` }) as Message;
                this.deleteTarget(message, res, this.noteMessage);
                await this.sleep(3000).then(() => announce.delete());
            }
        }
    }

    private checkUrl(str: string) {
        // eslint-disable-next-line no-useless-escape
        if (str.match(/(http[s]?|ftp):\/\/[^\/\.]+?\..+\w$/i) === null) {
            return false;
        } else {
            return true;
        }
    }

    private isImageUrl(str: string) {
        return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(str);
    }

    private deleteTarget(...target: Message[]): Promise<Message>[] {
        return target.map(t => t.delete());
    }

    private buildEmbeds(
        title: string,
        titleUrl: string,
        description: string,
        author: EmbedAuthorData,
        isTimestamp: boolean,
    ) {
        if (isTimestamp) {
            return [
                new MessageEmbed()
                    .setTitle(title)
                    .setURL(titleUrl)
                    .setDescription(description)
                    .setAuthor(author)
                    .setTimestamp(),
            ];
        } else {
            return [
                new MessageEmbed()
                    .setTitle(title)
                    .setURL(titleUrl)
                    .setDescription(description)
                    .setAuthor(author),
            ];
        }
    }

    private buildComponents(
        customId: string,
    ) {
        return [
            new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId(customId)
                    .addOptions(
                        {
                            label: 'title',
                            description: 'Your embed\'s title.',
                            value: 'title',
                        },
                        {
                            label: 'description',
                            description: 'Your embed\'s description.',
                            value: 'description',
                        },
                        {
                            label: 'titleUrl',
                            description: 'Change a title\'s url.',
                            value: 'titleUrl',
                        },
                        {
                            label: 'author',
                            description: 'Set a author options.',
                            value: 'author',
                        },
                        {
                            label: 'timestamp',
                            description: 'Add a timestamp.',
                            value: 'timestamp',
                        },
                    ),
            ),
        ];
    }

    private readonly sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
}
