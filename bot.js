const express = require("express");
const discord = require("discord.js");
const config = require("./config.json");
const cat = require("some-random-cat").Random;
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const fetch = require("node-fetch");
const mineflayer = require("mineflayer");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const autoeat = require("mineflayer-auto-eat");
const pvp = require("mineflayer-pvp").plugin;
const goalFollow = goals.GoalFollow;

var Attack = false;

var bot = new discord.Client();

const prefix = "!";

bot.login(config.BOT_TOKEN);

function sendFunc(message, args) {
  var arg = args[0];
  console.log(`send func arg: ${arg}`);
  switch (arg) {
    case "cat": {
      cat.getCat().then((res) => {
        console.log(res);
        message.channel.send("New Cat", {
          files: [res],
        });
      });
      return;
    }
    case "dog": {
      cat.getDog().then((res) => {
        console.log(res);
        //
        message.channel.send("New Dog", {
          files: [res],
        });
      });
    }
  }
}

async function PlayMusic(message, args) {
  const voiceChannel = message.member.voice.channel;
  console.log(voiceChannel);
  if (!voiceChannel) message.channel.send("Вы не в голосовом чате");
  const connection = await voiceChannel.join();
  const validURL = (str) => {
    var regex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  };

  if (validURL(args[0])) {
    message.channel.send("Корректная ссылка");
    const connect = await voiceChannel.join();
    const stream = ytdl(args[0], { filter: "audioonly" });
    connect.play(stream, { seek: 0, volume: 1 }).on("finish", () => {
      voiceChannel.leave();
    });
    return;
  }

  const videoFinder = async (query) => {
    const videoResults = await ytSearch(query);
    return videoResults.videos.length > 1 ? videoResults.videos[0] : null;
  };
  const video = await videoFinder(args.join(" "));

  if (video) {
    const stream = ytdl(video.url, { filter: "audioonly" });
    connection.play(stream, { seek: 0, volume: 1 }).on("finish", () => {
      voiceChannel.leave();
    });

    await message.reply(":thumbsup: сейчас играет " + video.title);
  } else {
    message.channel.send("Нет таких видео");
  }
}

async function StopMusic(message, args) {
  var voice = message.member.voice.channel;
  if (!voice) return message.reply("Вы не в голосовом чате");
  await voice.leave();
}

async function translateText(message, args) {
  console.log(args);
  var text = args.slice(2).join(" ");
  console.log(text);
  const res = await fetch("https://libretranslate.com/translate", {
    method: "POST",
    body: JSON.stringify({
      q: text,
      source: args[0],
      target: args[1],
    }),
    headers: { "Content-Type": "application/json" },
  });

  console.log(await res.json());
  console.log(translated);
}

bot.on("message", (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(" ");
  const command = args.shift().toLowerCase();

  console.log(commandBody);
  console.log(command);
  console.log(args);
  switch (command) {
    case "send": {
      sendFunc(message, args);
      break;
    }
    case "play": {
      PlayMusic(message, args);
      break;
    }

    case "tr": {
      translateText(message, args);
      break;
    }

    case "stop": {
      StopMusic(message, args);
      break;
    }
    case "clear-messages": {
      async function wipe() {
        var message_size = 100;
        while (message_size == 100) {
          await message.channel
            .bulkDelete(100)
            .then((messages) => (message_size = messages.size))
            .catch(console.error);
        }
      }
      wipe();
      break;
    }
    case "help": {
      message.reply(
       `\n!send cat - отправляет случайную картинку кота\n
         !send dog - отправляет случайную картинку собаки\n
        !play "название" - включает музыку\n
        !stop - выключение музыки\n
         !clear-messages - очищает чат`
       );
      break;
    }
    default: {
      message.channel.send("неизвестная команда");
    }
  }
});

bot.once("ready", () => {
  console.log("Ready!");
  bot.channels.cache.get("844661050662060138").send(`Я включился`);
});
bot.once("reconnecting", () => {
  console.log("Reconnecting!");
});
bot.once("disconnect", () => {
  console.log("Disconnect!");
});

if (process.argv.length > 2) {
  const minecraft_bot = mineflayer.createBot({
    host: "localhost",
    port: process.argv[2],
    username: "minecraft_bot",
    version: "1.16.5",
  });

  minecraft_bot.loadPlugin(pathfinder);
  minecraft_bot.loadPlugin(pvp);
  minecraft_bot.loadPlugin(autoeat);

  minecraft_bot.once("spawn", () => {
    mineflayerViewer(minecraft_bot, { port: 3007, firstPerson: true });
  });

  function customminecraft_bot() {
    setInterval(() => {
      timeInteval++;
      console.log("Прошло %s минут", timeInteval);
    }, 60000);
    setTimeout(() => {
      minecraft_bot.quit("Timeout");
      process.exit(1);
    }, timeout);
  }

  minecraft_bot.on("chat", (username, message) => {
    if (username == "PowerfulDepik" && message == "follow") {
      followPlayer(username);
      return;
    }

    if (username == "PowerfulDepik" && message == "attack start") {
      console.log("attack start");
      Attack = true;
      return;
    }

    if (username == "PowerfulDepik" && message == "attack stop") {
      console.log("attack stop");
      Attack = false;
      return;
    }
    if (username == "PowerfulDepik" && message == "follow stop") {
      minecraft_bot.pathfinder.setGoal(null);
      return;
    }
    bot.channels.cache
      .get("844661050662060138")
      .send(`<${username}> ${message}`);
  });

  minecraft_bot.on("physicsTick", () => {
    AttackNearEntity();
    LeaveIfHealth();
    Eat();
  });

  minecraft_bot.on("kicked", console.log);
  minecraft_bot.on("error", console.log);

  function Eat() {
    if (minecraft_bot.food < 19) {
      minecraft_bot.autoEat.enable();
    } else if (minecraft_bot.food === 20) {
      minecraft_bot.autoEat.disable();
    }
  }

  function AttackNearEntity() {
    if (!Attack) return;
    const mobFilter = (e) =>
      e.type == "mob" &&
      (e.mobType == "Zombie" ||
        e.mobType === "Drowned" ||
        e.mobType === "Skeleton");
    const mob = minecraft_bot.nearestEntity(mobFilter);
    if (!mob) return;
    if (minecraft_bot.entity.position.distanceTo(mob.position) > 7) {
      minecraft_bot.pvp.stop();
      return;
    } else {
      minecraft_bot.pvp.attack(mob);
    }
  }

  function LeaveIfHealth() {
      if (minecraft_bot.health < 4) {
        //minecraft_bot.quit('Health');
    }
  }

  function followPlayer(username) {
    console.log("start follow");
    const player = minecraft_bot.players[username];
    if (!player) {
      console.log("jopa");
      return;
    }

    const mcData = require("minecraft-data")(minecraft_bot.version);
    var move = new Movements(minecraft_bot, mcData);
    minecraft_bot.pathfinder.setMovements(move);
    const g = new goalFollow(player.entity, 2);

    minecraft_bot.pathfinder.setGoal(g, true);
  }
}
