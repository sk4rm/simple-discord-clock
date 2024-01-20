require('dotenv').config()

// Require Discord.js and define discord TOKEN
const TOKEN = process.env['DISCORD_TOKEN'];
console.log(TOKEN)
const clientID = process.env['CLIENT_ID'];
const guildID = process.env['SAO_GUILD_ID'];
// const ytdl = require('ytdl-core');
const { createServer } = require('http');
const { createReadStream } = require('fs');
const { Client, Collection, Events, IntentsBitField, SlashCommandBuilder, REST, Routes } = require('discord.js');
// const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

// ================================================================================================

// Create a new client instance
// const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const myIntents = new IntentsBitField();
myIntents.add(IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildVoiceStates);
const client = new Client({ intents: myIntents });
// const player = createAudioPlayer();

// Change time function
async function changeChannelName(mytChannel, pstChannel) {
    const date = new Date();
    const options = {
        weekday: 'short',
        hour: 'numeric',
        hour12: true,
        timeZoneName: 'longGeneric',
        timeZone: 'Asia/Kuala_Lumpur'
    };

    const mytString = date.toLocaleString('en-US', options);
    options.timeZone = 'America/Los_Angeles';
    const pstString = date.toLocaleString('en-US', options);

    mytChannel.setName(mytString);
    pstChannel.setName(pstString);
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    // Update voice channel name every minute to reflect time zone
    const mytChannel = await client.channels.fetch(process.env['MYT_CHANNEL_ID']);
    const pstChannel = await client.channels.fetch(process.env['PST_CHANNEL_ID']);

    changeChannelName(mytChannel, pstChannel);
    setInterval(() => {
        changeChannelName(mytChannel, pstChannel);
    }, 5 * 60 * 1000); // Rate limit: 2 requests per 10 min
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Log in to Discord with your client's TOKEN
client.login(TOKEN);

// ================================================================================================

client.commands = new Collection();
const commands = [];

/*
const cmdJoin = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Summons the bot into a voice channel'),
    async execute(interaction) {
        if (!interaction.member.voice.channelId)
            return await interaction.reply('You are not connected to a voice channel!', true);

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false,
        });

        return await interaction.reply('Joined channel successfully!', true);
    }
};
client.commands.set(cmdJoin.data.name, cmdJoin);
commands.push(cmdJoin.data.toJSON());

const cmdStop = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops music playback and asks the bot to leave the voice channel'),
    async execute(interaction) {
        if (!interaction.member.voice.channelId)
            return await interaction.reply('You are not connected to a voice channel!', true);

        const connection = getVoiceConnection(interaction.guild.id);
        connection.destroy();

        return await interaction.reply('Left the channel.', true);
    }
};
client.commands.set(cmdStop.data.name, cmdStop);
commands.push(cmdStop.data.toJSON());

const cmdPlay = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays the audio from a YouTube video')
        .addStringOption(option => option
            .setName('link')
            .setDescription('The YouTube link to be played')
            .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.voice.channelId)
            return await interaction.reply('You are not connected to a voice channel!', true);

        const link = interaction.options.getString('link');
        if (!ytdl.validateURL(link))
            return await interaction.reply('Invalid YouTube URL!', true);

        let connection = getVoiceConnection(interaction.guild.id);
        if (!connection) {
            await cmdJoin.execute();
            connection = getVoiceConnection(interaction.guild.id);
        }

        const stream = ytdl(link, { filter: 'audioonly' })

        const audio = createAudioResource(stream, {
            seek: 0,
            volume: 1
        });

        player.play(audio);
        connection.subscribe(player);
        player.unpause();

        return await interaction.reply('Playing...', true);
    }
};
client.commands.set(cmdPlay.data.name, cmdPlay);
commands.push(cmdPlay.data.toJSON());
*/
// ================================================================================================

// Register slash commands
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(clientID, guildID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();

// ================================================================================================

const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    createReadStream('index.html').pipe(res);
})
server.listen(process.env.PORT || 3000);