---
title: 基于自定义生物群系，为你的服务器/单人地图添加区域背景音乐，无需 Mod
date: 2025-07-16 15:45:01
permalink: /post/mc-custom-biome-music
description: 只使用插件、数据包、资源包来实现在某一区域循环播放背景音乐
categories: 
  - Minecraft
tags: 
  - 插件
  - 数据包
  - 资源包
  - 音乐
sidebar: auto
---

::: tip
因为需要数据包，这个功能理论上在 `1.16.2+` 版本可用，建议在 `1.19.3+` 的版本使用以得到最佳效果。
:::

## 准备音乐，制作资源包

先准备好你的音乐，转换成 ogg（用[在线网站](https://www.aconvert.com/cn/audio/mp3-to-ogg/)或者[格式工厂](http://www.pcgeshi.com/download.html)之类的都行），放到资源包里。我这里就放在 `/assets/mrxiaom/sounds/music/lobby.ogg`

:::: tabs
::: 1.19.3 及以后
在 1.19.3 开始，必须要使用 SOUND_EVENT 固有注册表内的声音事件，才能正常播放背景音乐。
> 现在 `effects.additions_sound.sound`、`​effects.ambient_sound` 和 `​effects.music.sound` 参数仅接受声音事件，此前可直接接受资源包定义的声音事件引用。—— [Minecraft Wiki](https://zh.minecraft.wiki/w/%E7%94%9F%E7%89%A9%E7%BE%A4%E7%B3%BB%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?variant=zh-cn#%E5%8E%86%E5%8F%B2)

所以，现在我们需要找一个可以被替换掉的已注册声音事件。详见我的插件 [SweetSoundReplacer](https://github.com/MrXiaoM/SweetSoundReplacer)，我这里就挑 `block.note_block.imitate.piglin` 这个声音事件来放背景音乐。

创建文件 `/assets/minecraft/sounds.json`，并写入以下内容即可，需要覆盖更多声音事件请自行添加。
```json
{
  "block.note_block.imitate.piglin": {
    "replace": true,
    "sounds": [
      {
        "name": "mrxiaom:music/lobby"
      }
    ]
  }
}
```

资源包准备好之后，可以先测试一下。把资源包放到单人游戏里，执行命令
```
/playsound block.note_block.imitate.piglin music @s
```
看看能不能正常播放，可以播放再进行下一步
:::
::: 1.19.3 以前
在命名空间文件夹内（我这里是 `mrxiaom`）创建一个 `sounds.json` 文件，具体路径是 `/assets/mrxiaom/sounds.json`。

然后写入以下内容即可，需要更多声音事件可自行添加。
```json
{
  "music.lobby": {
    "sounds": [
      {
        "name": "mrxiaom:music/lobby"
      }
    ]
  }
}
```

资源包准备好之后，可以先测试一下。把资源包放到单人游戏里，执行命令
```
/playsound mrxiaom:music.lobby music @s
```
看看能不能正常播放，可以播放再进行下一步
:::
::::

准备好资源包并测试完成之后，你可以把它合并到 ItemsAdder 等资源包管理插件里，我的做法是把 `/assets/` 目录的内容复制到 `/plugins/ItemsAdder/contents/mrxiaom/resourcepack/` 里面。

## 制作数据包

对于 Spigot 及其衍生服务端，服务器的数据包通常在 `/world/datapacks/bukkit/` 目录里，修改后重启服务器生效。

接下来，我们在 `bukkit` 数据包里添加一个生物群系。先在上述的 `bukkit` 目录里依此创建这些文件夹：`/data/命名空间/worldgen/biome`，我这里命名空间是 `mrxiaom`，所以创建的是 `/data/mrxiaom/worldgen/biome`。再在 `biome` 文件夹里创建一个 json 文件，文件名即生物群系名，我这里使用 `example.json`，写入以下内容。（不同版本的格式各不相同，你可以尝试使用这个[网站](https://misode.github.io/worldgen/biome/)来生成，但这个网站的格式也可能存在问题，需要按实际情况修改。）

这里以 1.20.4 为例，请将其中的 `block.note_block.imitate.piglin` 替换为之前你使用 `/playsound` 命令测试时的参数。
```json
{
    "temperature": 0.8,
    "downfall": 0.4,
    "creature_spawn_probability": 0,
    "has_precipitation": true,
    "effects": {
        "sky_color": 10539261,
        "fog_color": 10539261,
        "water_color": 41430,
        "water_fog_color": 41430,
        "music": {
            "sound": "block.note_block.imitate.piglin",
            "min_delay": 10,
            "max_delay": 20,
            "replace_current_music": true
        }
    },
    "starts": [],
    "spawners": {},
    "spawn_costs": {},
    "carvers": {},
    "features": []
}
```

## 安装插件

上文提到过，由于 1.19.3+ 做了一点修改，不允许使用非注册表内的声音事件作为背景音乐，所以需要安装 [SweetSoundReplacer](https://github.com/MrXiaoM/SweetSoundReplacer) 来替换等效的音效，给一些声音事件腾出位置来放音乐。

单人地图的话，可以用命令方块来播放音效，避免使用涉及到音乐的音效事件。

使用 [WorldEdit](https://modrinth.com/plugin/worldedit/versions?l=bukkit) 或 [FastAsyncWorldEdit](https://modrinth.com/plugin/fastasyncworldedit/versions?l=paper) 选择区域，然后使用命令 `//setbiome 生物群系名称` 即可设置区域生物群系，重新进入服务器生效。玩家进入生物群系就会自动播放音乐。

以本文的数据包为例，使用 `//setbiome mrxiaom:example` 设置生物群系。

## 注意事项

1.20.4 的客户端源码是这样的 (yarn)
```java
  public MusicSound getMusicType() {
    // 如果打开的界面有音乐，优先播放
    MusicSound musicSound = (MusicSound)Nullables.map(this.currentScreen, Screen::getMusic);
    if (musicSound != null) {
       return musicSound;
    } else if (this.player != null) {
      // 如果在末地，播放 BOSS 音乐或者末地音乐
      if (this.player.getWorld().getRegistryKey() == World.END) {
         return this.inGameHud.getBossBarHud().shouldPlayDragonMusic() ? MusicType.DRAGON : MusicType.END;
      } else {
        // 获取玩家当前位置的生物群系信息
        RegistryEntry registryEntry = this.player.getWorld().getBiome(this.player.getBlockPos());
        // 如果当前正则播放水下音乐，或者玩家在水下且生物群系有播放水下音乐的标签，播放水下音乐
        if (this.musicTracker.isPlayingType(MusicType.UNDERWATER) || this.player.isSubmergedInWater() && registryEntry.isIn(BiomeTags.PLAYS_UNDERWATER_MUSIC)) {
          return MusicType.UNDERWATER;
        } else {
          // 【注意看这里】
          return this.player.getWorld().getRegistryKey() != World.NETHER && this.player.getAbilities().creativeMode && this.player.getAbilities().allowFlying
            ? MusicType.CREATIVE
            : (MusicSound)((Biome)registryEntry.value()).getMusic().orElse(MusicType.GAME);
        }
      }
    } else {
      // 没有玩家实例时，播放菜单音乐
      return MusicType.MENU;
    }
  }
```
翻译一下
+ 如果玩家当前不在地狱，且玩家当前是创造模式，且玩家当前允许飞行。`使用创造模式音乐`
+ 否则，`使用生物群系音乐`，或者如果获取不到的话，`使用游戏音乐`

所以，最终测试的时候**记得调生存模式**。
