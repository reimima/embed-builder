import type { Bot } from '../Bot';
import type { Message, SelectMenuInteraction, GuildTextBasedChannel, EmbedFieldData, CommandInteraction, Interaction, ColorResolvable, MessageEmbedAuthor, MessageEmbedFooter, ButtonInteraction } from 'discord.js';
import { MessageEmbed, MessageActionRow, MessageSelectMenu, InteractionCollector, MessageButton, MessageAttachment } from 'discord.js';
import { Command } from '../interfaces';

export default class extends Command {
    private readonly embed: MessageEmbed;
    private note!: Message;
    private baseInteraction!: SelectMenuInteraction<'cached'>;
    private channel!: GuildTextBasedChannel;
    private fields!: EmbedFieldData[];
    private isTimestamp = true;

    public constructor(public override readonly client: Bot) {
        super(client, {
            name: 'build',
            description: 'Let\'s make your own embed!',
            defaultPermission: true,
        });

        this.fields = [{ name: 'Some name.', value: 'Some value.' }];

        this.embed = new MessageEmbed()
            .setColor('#000000')
            .setTitle('Some title.')
            .setURL('https://discord.com/')
            .setDescription('Some description.')
            .setAuthor({ name: 'Some name.', url: 'https://discord.com/', iconURL: 'https://cdn.discordapp.com/embed/avatars/2.png' })
            .setThumbnail('https://cdn.discordapp.com/embed/avatars/2.png')
            .setImage('https://cdn.discordapp.com/embed/avatars/2.png')
            .setFooter({ text: 'Some text.', iconURL: 'https://cdn.discordapp.com/embed/avatars/2.png' })
            .addFields(this.fields)
            .setTimestamp();
    }

    public run(interaction: CommandInteraction<'cached'>) {
        const customId = Math.random().toString(36).substring(7);

        const selectmenu = new MessageActionRow().addComponents(new MessageSelectMenu()
            .setCustomId(customId)
            .setOptions({
                label: 'color',
                description: 'Setting color of embed',
                value: 'color',
            }, {
                label: 'title',
                description: 'Setting title of embed.',
                value: 'title',
            }, {
                label: 'titleUrl',
                description: 'Setting url of title.',
                value: 'titleUrl',
            }, {
                label: 'description',
                description: 'Setting description of embed.',
                value: 'description',
            }, {
                label: 'timestamp',
                description: 'Setting timestamp on/off.',
                value: 'timestamp',
            }, {
                label: 'author',
                description: 'Setting author options of embed.',
                value: 'author',
            }, {
                label: 'thumbnail',
                description: 'Setting thumbnail image of embed.',
                value: 'thumbnail',
            }, {
                label: 'iamge',
                description: 'Setting normal image of embed.',
                value: 'image',
            }, {
                label: 'footer',
                description: 'Setting footer options of embed.',
                value: 'footer',
            }, {
                label: 'fields',
                description: 'Setting filed options of embed.',
                value: 'fields',
            }, {
                label: 'channel',
                description: 'Setting channel you want to send.',
                value: 'channel',
            }, {
                label: 'export',
                description: 'Export the embed source.',
                value: 'export',
            }, {
                label: 'exit',
                description: 'Exit from here.',
                value: 'exit',
            }, {
                label: 'delete',
                description: 'Delete options menu and messages.',
                value: 'delete',
            }));

        interaction.reply({
            embeds: [this.embed],
            components: [selectmenu],
        });

        const collecter = new InteractionCollector(this.client, {
            filter: collected => collected.isSelectMenu() && customId.includes(collected.customId),
            time: 300000,
        });

        collecter.on('collect', async (selectMenuI: Interaction<'cached'>) => {
            if (!selectMenuI.isSelectMenu()) return;
            this.baseInteraction = selectMenuI; await this.onSelectMenuI();
        });
    }

    private async onSelectMenuI() {
        await this.baseInteraction.update({ content: undefined });
        const value = this.baseInteraction.values[0] as string;

        const channel = this.channel = this.baseInteraction.channel as GuildTextBasedChannel;

        switch (value) {
            case 'titleUrl': this.note = await channel.send({ embeds: [{ description: 'If you want to delete this option, you can send `delete`.' }] }); break;

            case 'timestamp': if (this.isTimestamp) {
                this.isTimestamp = false; this.baseInteraction.editReply({ embeds: [this.embed.setTimestamp(null)] });
            } else {
                this.isTimestamp = true; this.baseInteraction.editReply({ embeds: [this.embed.setTimestamp()] });
            } return;

            case 'author': this.onCaseAuthor(); return;

            case 'thumbnail': this.note = await this.channel.send({ embeds: [{ description: `
                - You can only send image attachments or image urls.
                - Don't send anything other url.
                - If you want to delete this option, you can send \`delete\`.
            ` }] }); break;

            case 'image': this.note = await this.channel.send({ embeds: [{ description: `
                - You can only send image attachments or image urls.
                - Don't send anything other url.
                - If you want to delete this option, you can send \`delete\`.
            ` }] }); break;

            case 'footer': this.onCaseFooter(); return;

            case 'fields': this.onCaseFields(); return;

            case 'channel': this.note = await this.channel.send({ embeds: [{ description: `- You must send only channel mentions.` }] }); break;

            case 'export': this.onExport(); return;

            case 'exit': this.baseInteraction.deleteReply(); this.baseInteraction.channel?.send({ embeds: [this.baseInteraction.message.embeds[0] as MessageEmbed] });
                return;

            case 'delete': this.baseInteraction.deleteReply();
                return;
        }

        const sent = await channel.send({ content: 'Please send messages. ' }),
            collected = await channel.awaitMessages({ filter: (res: Message) => res.author.id === this.baseInteraction.user.id, max: 1 }),
            res = collected.first() as Message;

        switch (value) {
            case 'color':
                if (!this.isHEX(res.content)) return this.onIsNot(this.baseInteraction, 'Don\'t send anything other than the HEX code.', sent, res);
                await this.baseInteraction.editReply({ embeds: [this.embed.setColor(res.content as ColorResolvable)] });
                this.deleteMessages(sent, res);
                break;

            case 'title':
                if (res.content.length > 256) return this.onIsNot(this.baseInteraction, 'The title should be 256 characters or less.', sent, res);
                await this.baseInteraction.editReply({ embeds: [this.embed.setTitle(res.content)] });
                this.deleteMessages(sent, res);
                break;

            case 'titleUrl':
                if (res.content === 'delete') return Promise.all([this.baseInteraction.editReply({ embeds: [this.embed.setURL('')] }), this.deleteMessages(sent, res, this.note)]);
                if (!this.isURL(res.content)) return this.onIsNot(this.baseInteraction, 'This url isn\'t a valid.', sent, res, this.note);
                await this.baseInteraction.editReply({ embeds: [this.embed.setURL(res.content)] });
                this.deleteMessages(sent, res, this.note);
                break;

            case 'description':
                await this.baseInteraction.editReply({ embeds: [this.embed.setDescription(res.content)] });
                this.deleteMessages(sent, res);
                break;

            case 'thumbnail': this.onImage(this.baseInteraction, res, sent, value); break;

            case 'image': this.onImage(this.baseInteraction, res, sent, value); break;

            case 'channel': this.onChannel(sent, res); break;
        }
    }

    private async onCaseAuthor() {
        const customId = Math.random().toString(36).substring(7),
            selectmenu = new MessageActionRow().addComponents(new MessageSelectMenu()
                .setCustomId(customId)
                .addOptions(
                    { label: 'name', description: 'Set a name of author.', value: 'name' },
                    { label: 'url?', description: 'Set a url of author name. You can delete this option.', value: 'url' },
                    { label: 'iconURL', description: 'Set a url of author icon. You can delete this option.', value: 'icon' },
                    { label: 'exit', description: 'Exit from here.', value: 'exit' }));

        await this.channel.send({ embeds: [new MessageEmbed().setTitle('Options of author.').addFields(
            { name: 'name', value: 'Set a name of author.' }, { name: 'url?', value: 'Set a url of author name. You can delete this option.' },
            { name: 'iconURL?', value: 'Set a url of author icon. You can delete this option.' }, { name: 'exit', value: 'Exit from here.' },
        )], components: [selectmenu] });

        const collecter = new InteractionCollector(this.client, { filter: collected => collected.isSelectMenu() && customId.includes(collected.customId) });

        collecter.on('collect', async (interaction: Interaction<'cached'>) => {
            if (!interaction.isSelectMenu()) return;
            await this.onAuthorCollected(interaction);
        });
    }

    private async onCaseFooter() {
        const customId = Math.random().toString(36).substring(7),
            selectmenu = new MessageActionRow().addComponents(new MessageSelectMenu()
                .setCustomId(customId)
                .addOptions(
                    { label: 'text', description: 'Set a text of footer.', value: 'text' },
                    { label: 'iconURL', description: 'Set a url of footer icon. You can delete this option.', value: 'icon' },
                    { label: 'exit', description: 'Exit from here.', value: 'exit' }));

        await this.channel.send({ embeds: [new MessageEmbed().setTitle('Options of footer.').addFields(
            { name: 'text', value: 'Set a text of footer.' }, { name: 'iconURL?', value: 'Set a url of footer icon. You can delete this option.' }, { name: 'exit', value: 'Exit from here.' },
        )], components: [selectmenu] });

        const collecter = new InteractionCollector(this.client, { filter: collected => collected.isSelectMenu() && customId.includes(collected.customId) });

        collecter.on('collect', async (interaction: Interaction<'cached'>) => {
            if (!interaction.isSelectMenu()) return;
            await this.onFooterCollected(interaction);
        });
    }

    private async onCaseFields() {
        const customId = Math.random().toString(36).substring(7),
            selectmenu = new MessageActionRow().addComponents(new MessageSelectMenu()
                .setCustomId(customId)
                .addOptions(
                    { label: 'individual', description: 'Set for each field.', value: 'individual' },
                    { label: 'inline', description: 'Setting inline on.', value: 'inline' },
                    { label: 'uninline', description: 'Setting inline off.', value: 'uninline' },
                    { label: 'number', description: 'Sets the number of fields. You can choose from `1 ~ 25`', value: 'number' },
                    { label: 'exit', description: 'Exit from here.', value: 'exit' }));
        await this.channel.send({ embeds: [new MessageEmbed().setTitle('Options of fields.').addFields(
            { name: 'individual', value: 'Set for each field.' }, { name: 'inline', value: 'Setting inline on.' }, { name: 'uninline', value: 'Setting inline off.' },
            { name: 'number', value: 'Sets the number of fields. You can choose from `1 ~ 25`' }, { name: 'exit', value: 'Exit from here.' },
        )], components: [selectmenu] });

        const collecter = new InteractionCollector(this.client, { filter: collected => collected.isSelectMenu() && customId.includes(collected.customId) });

        collecter.on('collect', async (interaction: Interaction<'cached'>) => {
            if (!interaction.isSelectMenu()) return;
            await this.onFieldsCollected(interaction);
        });
    }

    private async onAuthorCollected(interaction: SelectMenuInteraction<'cached'>) {
        await interaction.update({ content: undefined });
        const value = interaction.values[0] as string;

        switch (value) {
            case 'url': this.note = await this.channel.send({ embeds: [{ description: 'If you want to delete this option, you can send `delete`.' }] }); break;

            case 'icon': this.note = await this.channel.send({ embeds: [{ description: `
                - You can only send image attachments or image urls.
                - Don't send anything other url.
                - If you want to delete this option, you can send \`delete\`.
            ` }] }); break;

            case 'exit': interaction.deleteReply(); return;
        }

        const sent = await this.channel.send({ content: 'Please send messages. ' }),
            collected = await this.channel.awaitMessages({ filter: (res: Message) => res.author.id === interaction.user.id, max: 1 }),
            res = collected.first() as Message,
            author = this.embed.author as MessageEmbedAuthor;

        switch (value) {
            case 'name':
                if (res.content.length > 256) return this.onIsNot(interaction, 'The name should be 256 characters or less.', sent, res);
                await this.baseInteraction.editReply({ embeds: [this.embed.setAuthor({ name: res.content, url: author.url, iconURL: author.iconURL })] });
                this.deleteMessages(sent, res);
                break;

            case 'url':
                if (res.content === 'delete') return Promise.all([this.baseInteraction.editReply({ embeds: [this.embed.setAuthor({ name: author.name, url: '', iconURL: author.iconURL })] }), this.deleteMessages(sent, res, this.note)]);
                if (!this.isURL(res.content)) return this.onIsNot(interaction, 'This url isn\'t a valid.', sent, res, this.note);
                await this.baseInteraction.editReply({ embeds: [this.embed.setAuthor({ name: author.name, url: res.content, iconURL: author.iconURL })] });
                this.deleteMessages(sent, res, this.note);
                break;

            case 'icon': this.onImage(interaction, res, sent, value); break;
        }
    }

    private async onFooterCollected(interaction: SelectMenuInteraction<'cached'>) {
        await interaction.update({ content: undefined });
        const value = interaction.values[0] as string;

        switch (value) {
            case 'icon': this.note = await this.channel.send({ embeds: [{ description: `
                - You can only send image attachments or image urls.
                - Don't send anything other url.
                - If you want to delete this option, you can send \`delete\`.
            ` }] }); break;

            case 'exit': interaction.deleteReply(); return;
        }

        const sent = await this.channel.send({ content: 'Please send messages. ' }),
            collected = await this.channel.awaitMessages({ filter: (res: Message) => res.author.id === interaction.user.id, max: 1 }),
            res = collected.first() as Message,
            footer = this.embed.footer as MessageEmbedFooter;

        switch (value) {
            case 'text':
                if (res.content.length > 2048) return this.onIsNot(interaction, 'The text should be 2048 characters or less.', sent, res);
                await this.baseInteraction.editReply({ embeds: [this.embed.setFooter({ text: res.content, iconURL: footer.iconURL })] });
                this.deleteMessages(sent, res);
                break;

            case 'icon': this.onImage(interaction, res, sent, value); break;
        }
    }

    private async onFieldsCollected(interaction: SelectMenuInteraction<'cached'>) {
        await interaction.update({ content: undefined });
        const value = interaction.values[0];

        switch (value) {
            case 'individual': this.onFieldsIndividual(); break;

            // eslint-disable-next-line no-return-assign
            case 'inline': this.fields = this.fields.map(x => Object.assign(x, x.inline = true));
                this.baseInteraction.editReply({ embeds: [this.embed.setFields(this.fields)] });
                break;

            // eslint-disable-next-line no-return-assign
            case 'uninline': this.fields = this.fields.map(x => Object.assign(x, x.inline = false));
                this.baseInteraction.editReply({ embeds: [this.embed.setFields(this.fields)] });
                break;

            case 'number': this.onFieldsNumber(); break;

            case 'exit': interaction.deleteReply(); break;
        }
    }

    private async onFieldsIndividual() {
        const sent = await this.channel.send({ embeds: [{ description: 'Make individual settings for the fields. You can choose from 1 ~ 25.' }] }),
            collected = await this.channel.awaitMessages({ filter: (res: Message) => res.author.id === this.baseInteraction.user.id, max: 1 }),
            res = collected.first() as Message,
            customId = Math.random().toString(36).substring(7);

        this.deleteMessages(res, sent);
        if (!((Number(res.content) - 1) * (Number(res.content) - this.fields.length) <= 0)) return this.onIsNot(this.baseInteraction, 'Sorry, I can\'t found the field.');

        this.note = await this.channel.send({ embeds: [new MessageEmbed().setTitle(`Individual setting menu`).addFields(
            { name: 'name', value: 'Set a name of field.' }, { name: 'value', value: 'Set a value of field.' }, { name: 'exit', value: 'Exit from here.' },
        )], components: [new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId(customId).addOptions(
            { label: 'name', description: 'Set a name of field.', value: 'name' },
            { label: 'value', description: 'Set a value of field.', value: 'field' },
            { label: 'exit', description: 'Exit from here.', value: 'exit' },
        ))] });

        const collecter = new InteractionCollector(this.client, { filter: interactionCollected => interactionCollected.isSelectMenu() && customId.includes(interactionCollected.customId) });

        collecter.on('collect', async (interaction: Interaction<'cached'>) => {
            if (!interaction.isSelectMenu()) return;
            await this.onFieldsIndividualCollected(interaction, Number(res.content));
        });
    }

    private async onFieldsIndividualCollected(interaction: SelectMenuInteraction<'cached'>, number: number) {
        await interaction.update({ content: undefined });
        const value = interaction.values[0];

        if (value === 'exit') return interaction.deleteReply();

        const sent = await this.channel.send({ content: 'Please send messages. ' }),
            collected = await this.channel.awaitMessages({ filter: (res: Message) => res.author.id === interaction.user.id, max: 1 }),
            res = collected.first() as Message;

        switch (value) {
            case 'name':
                if (res.content.length > 256) return this.onIsNot(interaction, 'The name should be 256 characters or less.', sent, res);
                (this.fields[number - 1] as EmbedFieldData).name = res.content;
                await this.baseInteraction.editReply({ embeds: [this.embed.setFields(this.fields)] });
                this.deleteMessages(sent, res);
                break;

            case 'value':
                if (res.content.length > 1024) return this.onIsNot(interaction, 'The value should be 1024 characters or less.', sent, res);
                (this.fields[number - 1] as EmbedFieldData).value = res.content;
                await this.baseInteraction.editReply({ embeds: [this.embed.setFields(this.fields)] });
                this.deleteMessages(sent, res);
                break;
        }
    }

    private async onFieldsNumber() {
        const plusCustomId = Math.random().toString(36).substring(7),
            minusCustomId = Math.random().toString(36).substring(7),
            deleteCustomId = Math.random().toString(36).substring(7),
            button = new MessageActionRow().addComponents(
                new MessageButton().setCustomId(plusCustomId).setEmoji('➕').setStyle('SUCCESS'),
                new MessageButton().setCustomId(minusCustomId).setEmoji(`➖`).setStyle('DANGER'),
                new MessageButton().setCustomId(deleteCustomId).setEmoji('🗑️').setStyle('DANGER'));

        await this.channel.send({ embeds: [new MessageEmbed().setTitle('Number of fields').setDescription(`
            - Press ➕ if you want to add to the field.
            - Press ➖ if you want to delete to the filed.
            - If you want to delete this option menu, you can press \`🗑️\`.
        `)], components: [button] });

        const collecter = new InteractionCollector(this.client, { componentType: 'BUTTON', time: 300000 });

        collecter.on('collect', (interaction: Interaction<'cached'>) => {
            if (!interaction.isButton()) return;
            this.onNumberButtonCollected(interaction, plusCustomId, minusCustomId, deleteCustomId);
        });
    }

    private async onNumberButtonCollected(interaction: ButtonInteraction<'cached'>, plusCustomId: string, minusCustomId: string, deleteCustomId: string) {
        await interaction.update({ content: undefined });

        switch (interaction.customId) {
            case plusCustomId: this.fields.push({ name: 'Some name.', value: 'Some value.' });
                this.baseInteraction.editReply({ embeds: [this.embed.setFields(this.fields)] }); break;

            case minusCustomId: this.fields.pop();
                this.baseInteraction.editReply({ embeds: [this.embed.setFields(this.fields)] }); break;

            case deleteCustomId: interaction.deleteReply(); break;
        }
    }

    private async onImage(interaction: SelectMenuInteraction<'cached'>, res: Message, sent: Message, value: string) {
        const file = res.attachments.first(),
            author = this.embed.author as MessageEmbedAuthor;

        if (!file) {
            if (res.content === 'delete') {
                switch (value) {
                    case 'icon': await this.baseInteraction.editReply({ embeds: [this.embed.setAuthor({ name: author.name, url: author.url, iconURL: '' })] }); this.deleteMessages(res, sent, this.note);
                        break;

                    case 'thumbnail': await this.baseInteraction.editReply({ embeds: [this.embed.setThumbnail('')] }); this.deleteMessages(res, sent, this.note);
                        break;

                    case 'image': await this.baseInteraction.editReply({ embeds: [this.embed.setImage('')] }); this.deleteMessages(res, sent, this.note);
                        break;
                }
                return;
            }
            if (!this.isImageURL(res.content)) return this.onIsNot(interaction, 'This url isn\'t a valid.', res, sent, this.note);
            switch (value) {
                case 'icon': await this.baseInteraction.editReply({ embeds: [this.embed.setAuthor({ name: author.name, url: author.url, iconURL: res.content })] }); this.deleteMessages(res, sent, this.note);
                    break;

                case 'thumbnail': await this.baseInteraction.editReply({ embeds: [this.embed.setThumbnail(res.content)] }); this.deleteMessages(res, sent, this.note);
                    break;

                case 'image': await this.baseInteraction.editReply({ embeds: [this.embed.setImage(res.content)] }); this.deleteMessages(res, sent, this.note);
                    break;
            }
            return;
        }

        switch (value) {
            case 'icon': await this.baseInteraction.editReply({ embeds: [this.embed.setAuthor({ name: author.name, url: author.url, iconURL: file.url })] }); this.deleteMessages(res, sent, this.note);
                break;

            case 'thumbnail': await this.baseInteraction.editReply({ embeds: [this.embed.setThumbnail(file.url)] }); this.deleteMessages(res, sent, this.note);
                break;

            case 'image': await this.baseInteraction.editReply({ embeds: [this.embed.setImage(file.url)] }); this.deleteMessages(res, sent, this.note);
                break;
        }
    }

    private async onExport() {
        const file = new MessageAttachment(Buffer.from(JSON.stringify(this.baseInteraction.message.embeds[0]?.toJSON())), 'embed.json'),
            sent = await this.channel.send({ content: 'Delete message after 30 seconds.', files: [file] });
        await this.sleep(30000); sent.delete();
    }

    private readonly isHEX = (target: string) => !!target.match(/[0-9A-Fa-f]{6}/g);

    // eslint-disable-next-line no-useless-escape
    private readonly isURL = (target: string) => !!target.match(/https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#\u3000-\u30FE\u4E00-\u9FA0\uFF01-\uFFE3]+/g);

    private readonly isImageURL = (target: string) => !!target.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/);

    private readonly deleteMessages = (...messages: Message[]) => messages.map(message => message.delete());

    private readonly sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    private async onIsNot(interaction: SelectMenuInteraction<'cached'>, content: string, ...messages: Message[]) {
        const announce = await interaction.channel?.send({ content: content });
        this.deleteMessages(...messages);
        await this.sleep(3000).then(() => announce?.delete());
    }

    private async onChannel(sent: Message, res: Message) {
        const mention = res.mentions.channels.first();
        if (!mention) return this.onIsNot(this.baseInteraction, 'You must send only mentions.', sent, res, this.note);
        if (!mention.isText()) return this.onIsNot(this.baseInteraction, 'You must send only channel mentions.', sent, res, this.note);
        await mention.send({ embeds: [this.embed] });
        this.deleteMessages(sent, res, this.note);
    }
}
