---
title: 在 Blockbench 中，将网格(mesh)转换为方块(cube)
date: 2025-11-30 00:56:43
permalink: /post/blockbench-convert-mesh-to-cube
description: 导入 glTF 模型，并转换为 Java 版方块/物品模型
categories: 
  - 开发
tags: 
  - BlockBench
  - 模型
  - Minecraft
  - 我的世界
  - glTF
sidebar: auto
---

这件事要从《半条命》，或者说《半衰期》这部作品说起。我是在 24 年，也就是《Half-Life 2》二十周年庆入坑的，后劲的确很大，我也庆幸我入坑得晚，不用等十几年还在骂G胖为什么还不出 `3`。

![](https://pic1.imgdb.cn/item/692b3152aae9ff4455b2e717.webp)

近期我需要一个 Half Life 风格的医疗包物品模型，放到 Minecraft 里面，于是在一个通用模型网站里搜到了 [hatThing](https://sketchfab.com/hatt_) 大佬的医疗包模型资产。看到那个 `Uploaded with Blockbench` 提示我就觉得稳了，但等我把模型原件下载下来以后才发现，事情没那么简单。

## mesh 是不能用的

当你点击 `Download 3D Model` 之后，显示的格式净是些做 BlockBench 模型时没见过的格式，但是最上面还是有显示  
`gltf (Original format)` 可以下载作者上传的原格式，下载之后才意识到，BlockBench 是不支持导入这个格式的。

通过一番资料搜索，终于找到了 BlockBench 可以通过安装 `glTF Importer` 这个插件来导入这种格式的模型。

要注意的是，这个插件只支持`通用模型`，先要创建一个通用模型，然后才能在 `文件→导入` 里面看到 `Import glTF Model` 的选项。

![](https://pic1.imgdb.cn/item/692b30e6aae9ff4455b2e710.webp)

模型成功导入了，然后当你满怀欣喜地一点一点调好位置，调好缩放，点击转换项目，将其转换为 Java 版方块/物品模型，或者是转换为基岩版模型之后，只剩下纹理了！

是的，Minecraft 原版的模型是不能用网格(mesh)的，只能用方块(cube)，当你转换项目后，不支持的元素类型就会消失。

看截图，右侧元素列表全都是“钻石”图标，说明那些元素全都是网格！哪有分享 BlockBench 模型全用网格的喵，这根本不是噶啦Bench，我不接受！

## 可以转换为 cube 吗

隐藏所有网格，只看其中的一个网格的时候，发现它们的形状居然是一个长方形？！

![](https://pic1.imgdb.cn/item/692b30e6aae9ff4455b2e711.webp)

而且使用 VSCode 编辑保存的 `.bbmodel` 文件，查看一个网格的属性的时候，也是只有8个顶点和12个面（每个面是一个三角形，长方体由十二个面组成是正常的）。

所以我们有理由怀疑，这个模型就是使用 BlockBench 自带的方块转网格方法导出的，而实现代码就在 [js/modeling/mesh_editing.js](https://github.com/JannisX11/blockbench/blob/c319129649e1cf43ca5f6287648c190250136e4b/js/modeling/mesh_editing.js#L1978-L2087) 里面。

接下来只要将方块转网格的实现代码喂给 AI，让它帮我写出将网格(mesh)逆向转换成方块(cube)的方法不就好了吗？

事情开始变得简单起来了，但也没这么简单…

想要让 AI 写出能跑的代码，要给出充足的条件，最后，我把这些东西都喂给了 AI：
+ `convert_to_mesh` 的实现代码
+ `mesh.d.ts` 定义代码
+ 要告诉它 mesh 有多少个顶点，多少个面，一个面有多少个顶点，cube 有多少个顶点，多少个面… 这些条件它是的真不知道，它在不知道的时候还会乱猜 mesh 有4个顶点，看到了报错我才反应过来应该提醒它这些条件

搞了我几个小时，还开了几个上下文分开修 BUG，才终于成功了。

最终成果在我的 [convert-to-cube](https://github.com/MrXiaoM/blockbench/compare/master...MrXiaoM:blockbench:convert-to-cube) 分支这里。
> 只支持使用 BlockBench 从 cube 转为 mesh 再转回 cube，不保证使用其它建模软件导出的 mesh 也能成功转为 cube。

![](https://pic1.imgdb.cn/item/692b30e6aae9ff4455b2e70f.webp)

最后，调整一下显示效果，导出就好啦。

## 尾声

在寻找解决方案的时候，在医疗包模型的简介发现了 HatThing 的项目 Combat 17，那个模型是 Combat 17 的物品模型资产之一。

只可惜那个项目最后因为 HatThing 对其不再感兴趣而烂尾了，试玩宣传片也改为了不公开，[项目官方网站](https://greenhats201x.wixsite.com/combat17)也写明了在 2023年7月30日 停止开发，试玩视频中的数据包也无法下载了。

好在 HatThing 的模型资产依然公开，没有成为失传媒体，这些模型的制作可谓十分精良。
