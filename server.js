const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

var data = require("./data.json");

const setRegex = /^!set/i;
const testRegex = /^!test/i;
const delRegex = /^!deltoggle/i;

let key_gen = (guild) => {
    return new Promise((resolve, reject) => {
        if (guild.id) {
            resolve(`${guild.id}`);
        } else {
            reject(`Guild has no id`);
        }
    });
};

let json_dump = () => {
    return new Promise((resolve, reject) => {
        fs.writeFile(
            "./data.json",
            JSON.stringify(data, null, 4),
            (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
};

client.once("ready", () => {
    console.log(
        `Logged in as: ${client.user.username} with id: ${client.user.id}`
    );
    client.user.setPresence({
        activity: { type: "WATCHING", name: "for bruh moments" },
    });
});

let send_message = async (member) => {
    key_gen(member.guild).then(async (key) => {
        if (key in data && data[key].channel) {
            client.channels
                .fetch(data[key].channel)
                .then(async (channel) => {
                    console.log(
                        `Sending a message in: ${channel}, in guild: ${member.guild}`
                    );
                    await channel.send(
                        Math.floor(Math.random() * 2) == 0 ? "bruh" : "Bruh"
                    );
                })
                .catch((reason) => {
                    throw new Error(reason);
                });
        } else {
            throw new Error(`No channel ID set in server ${member.guild}`);
        }
    });
};

client.on("guildMemberRemove", async (member) => {
    send_message(member).catch((reason) => {
        console.error(`Failed: ${reason}`);
    });
});

client.on("guildCreate", async (guild) => {
    console.log(`Added to Guild: ${guild}`);
    if (guild.systemChannel) {
        await guild.systemChannel.send(
            "Hi, thanks for adding BruhBot! Use `!set` to set which channel to send to."
        );
    }
    data[key_gen(guild)] = { channel: null, delete_message: false };
    await json_dump().catch((reason) => {
        console.error(`Failed: ${reason}`);
    });
});

client.on("guildDelete", async (guild) => {
    console.log(`Removed from Guild: ${guild}`);
    key_gen(guild)
        .then(async (key) => {
            delete data[key];
            await json_dump();
        })
        .catch((reason) => {
            console.error(`Failed: ${reason}`);
        });
});

client.on("messageDelete", async (message) => {
    if (data[await key_gen(message.guild)].delete_message) {
        const audit = await message.guild.fetchAuditLogs({
            type: 72,
            limit: 10,
        });
        for (entry in Array.from(audit.entries)) {
            if (entry.target.id == message.author.id && !message.author.bot) {
                console.log(
                    `Sending delete message in channel: ${message.channel} in guild: ${message.guild}`
                );
                await message.channel.send(
                    `${message.author} had a bruh moment`
                );
                break;
            }
        }
    }
});

client.on("message", async (message) => {
    console.log("Message event dispatched");
    key_gen(message.guild)
        .then(async (key) => {
            if (message.member.hasPermission("MANAGE_CHANNELS")) {
                if (
                    message.content.match(setRegex) &&
                    (!data[key].channel ||
                        data[key].channel !== message.channel.id)
                ) {
                    data[key] = message.channel.id;
                    console.log(
                        `Dumping json for: ${message.channel}, in Guild: ${message.guild}`
                    );
                    json_dump()
                        .then(
                            message.channel.send(
                                `Set message channel to ${message.channel}!`
                            )
                        )
                        .catch((reason) => {
                            throw new Error(err);
                        });
                } else if (message.content.match(testRegex)) {
                    await send_message(message.member);
                } else if (message.content.match(delRegex)) {
                    data[key].delete_message = !data[key].delete_message;
                    console.log(
                        `Toggled the delete message in: ${message.guild}`
                    );
                    json_dump().then(
                        await message.channel.send(
                            data[key].delete_message
                                ? "Turned delete message on"
                                : "Turned delete message off"
                        )
                    );
                }
            }
        })
        .catch((reason) => {
            console.error(`Failed: ${reason}`);
        });
});

client.login(process.env.TOKEN);
