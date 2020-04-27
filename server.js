const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

var data = require("./data.json");

const setRegex = /^!set/i;
const testRegex = /^!test/i;

let key_gen = (guild) => {
    return new Promise((resolve, reject) => {
        if (guild.id) {
            resolve(`${guild.id}_channel`);
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
});

let send_message = async (member) => {
    key_gen(member.guild).then(async (key) => {
        if (key in data) {
            client.channels
                .fetch(data[key])
                .then(async (channel) => {
                    console.log(
                        `Sending a message in: ${channel}, in guild: ${member.guild.name}`
                    );
                    await channel.send(
                        Math.floor(Math.random() * 2) == 0 ? "bruh" : "Bruh"
                    );
                })
                .catch((reason) => {
                    throw new Error(reason);
                });
        } else {
            throw new Error(`No channel ID set in server ${member.guild.name}`);
        }
    });
};

client.on("guildCreate", async (guild) => {
    console.log(`Added to Guild: ${guild.name}`);
    if (guild.systemChannel) {
        await guild.systemChannel.send(
            "Hi, thanks for adding BruhBot! Use `!set` to set which channel to send to."
        );
    }
});

client.on("guildMemberRemove", async (member) => {
    send_message(member).catch((reason) => {
        console.error(`Failed: ${reason}`);
    });
});

client.on("message", async (message) => {
    console.log("Message event dispatched");
    key_gen(message.guild)
        .then(
            async (key) => {
                if (message.member.hasPermission("MANAGE_CHANNELS")) {
                    if (
                        message.content.match(setRegex) &&
                        (!(key in data) || data[key] !== message.channel.id)
                    ) {
                        data[key] = message.channel.id;
                        console
                            .log(
                                `Dumping json for: ${message.channel.name}, in Guild: ${message.guild.name}`
                            )
                            .then(json_dump)
                            .catch((reason) => {
                                throw new Error(err);
                            });
                        await message.channel.send(
                            `Set message channel to ${message.channel}!`
                        );
                    } else if (
                        message.content.match(testRegex) &&
                        key in data
                    ) {
                        await send_message(message.member);
                    }
                }
            },
            (reason) => {
                console.error(reason);
                throw 0;
            }
        )
        .catch((reason) => {
            if (reason != 0) {
                console.error(`Failed: ${reason}`);
            }
        });
});

client.login(process.env.TOKEN);
