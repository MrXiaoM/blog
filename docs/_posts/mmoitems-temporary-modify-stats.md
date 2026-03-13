---
title: 临时修改 MMOItems 的数值属性，实现不同玩家不同属性功能
date: 2026-03-13 08:00:49
permalink: /post/mmoitems-temporary-modify-stats
description: 
categories: 
  - Minecraft
  - 开发
tags: 
  - MMOItems
  - 插件
  - 属性
sidebar: auto
---

我服管理员想要实现一些功能，比如
+ 绑定玩家持有武器/穿戴装备时，攻击力和防御力正常
+ 非绑定玩家持有武器/穿戴装备时，攻击力/防御力减半

头疼的是，MMOItems 并没有给相关的接口可以实现，如果你去询问 AI 如何实现的话，大概率会让你去监听 EntityDamageByEntity 事件，这实现起来最简单，但是误伤也是真大，把别的插件的伤害、绑定自己的物品的伤害也给扣掉了。

所以，写一篇博客记录一下我折腾这个功能的过程。

## 属性的原理

可能你刚上手摸 MMOItems 源码会觉得很奇怪，监听器就只有那么几个，护甲值、伤害 这些属性压根就没有被引用。所以 MMOItems 是怎么实现物品属性的呢？

不要忘了 MMOItems 还有一个依赖插件，MythicLib。没错，MMOItems 的物品属性 ID 跟 MythicLib 的玩家属性 ID 完全一致，为玩家应用物品属性就是往玩家的属性实例（StatInstance）里面注册一个属性修饰器（StatModifier），玩家不持有物品的时候再给它注销掉，就这么简单。
> 具体查看 [`InventoryResolver#applyModifiers`](https://gitlab.com/phoenix-dvpmt/mmoitems/-/blob/d98831a1a239580563ccdda7e8c962d06baf6465/MMOItems-API/src/main/java/net/Indyuce/mmoitems/inventory/InventoryResolver.java#L224-243) 的实现。

是的，应用给玩家的属性值是临时的，玩家装备上这个物品（手持/穿戴护甲），属性就会生效，取消装备这个物品（切换其它物品/脱下护甲），属性就会失效。

很可惜，MMOItems 没有给我们编辑“应用物品属性给玩家”这部分的机会，所以我们只能自己修改 MMOItems 源码来实现这个功能。

## 放出一点接口

核心修改是在应用属性的这里插一段代码，放出一些接口，就可以实现不同玩家不同属性功能了。
```diff
            // TODO MI7 do a full stat lookup and lookup stat by nbtpath
            double statValue = equippedItem.getItem().getStat(stat.getId());
            if (statValue == 0) continue;
+
+           // 在这里修改 statValue 的值
+
            StatInstance statInstance = playerData.getMMOPlayerData().getStatMap().getInstance(stat.getId());
            final ModifierSource modifierSource = equippedItem.getModifierSource();
```
+ `this.getPlayerData().getPlayer()` 可以取得玩家实例
+ `equippedItem.getNBT().getItem()` 可以取得物品实例
+ 在 for 循环有 `itemStat` 可以取得属性类型
+ 在前面两行有 `statValue` 可以取得物品储存的属性值

没打过这么富裕的仗，该有的数据全都有了，有什么理由不给它封装成一个接口呢？

::: details 需要修改的部分
[phoenix-dvpmt/mmoitems#1970](https://gitlab.com/phoenix-dvpmt/mmoitems/-/work_items/1970)
```diff
diff --git a/MMOItems-API/src/main/java/net/Indyuce/mmoitems/MMOItems.java b/MMOItems-API/src/main/java/net/Indyuce/mmoitems/MMOItems.java
index 7efe0ddb..8cc7d9d8 100644
--- a/MMOItems-API/src/main/java/net/Indyuce/mmoitems/MMOItems.java
+++ b/MMOItems-API/src/main/java/net/Indyuce/mmoitems/MMOItems.java
@@ -747,4 +747,11 @@ public class MMOItems extends MMOPlugin {
         return plugin.getServer().getConsoleSender();
     }
     //endregion
+
+    // MCIO start: Add extension API.
+    private final top.mrxiaom.mmoitems.api.MMOItemsExt ext = new top.mrxiaom.mmoitems.api.MMOItemsExt(this);
+    public top.mrxiaom.mmoitems.api.MMOItemsExt ext() {
+        return ext;
+    }
+    // MCIO end: Add extension API.
 }
\ No newline at end of file
diff --git a/MMOItems-API/src/main/java/net/Indyuce/mmoitems/inventory/InventoryResolver.java b/MMOItems-API/src/main/java/net/Indyuce/mmoitems/inventory/InventoryResolver.java
index 77564989..ddca7974 100644
--- a/MMOItems-API/src/main/java/net/Indyuce/mmoitems/inventory/InventoryResolver.java
+++ b/MMOItems-API/src/main/java/net/Indyuce/mmoitems/inventory/InventoryResolver.java
@@ -230,6 +230,12 @@ public class InventoryResolver {
             double statValue = equippedItem.getItem().getStat(stat.getId());
             if (statValue == 0) continue;

+            // MCIO start: Inject into numeric stat values.
+            for (top.mrxiaom.mmoitems.api.INumericStatsInjector injector : MMOItems.plugin.ext().getNumericStatsInjectors()) {
+                statValue = injector.applyModifier(this, equippedItem, stat, statValue);
+            }
+            // MCIO end: Inject into numeric stat values.
+
             StatInstance statInstance = playerData.getMMOPlayerData().getStatMap().getInstance(stat.getId());
             final ModifierSource modifierSource = equippedItem.getModifierSource();

diff --git a/MMOItems-API/src/main/java/top/mrxiaom/mmoitems/api/INumericStatsInjector.java b/MMOItems-API/src/main/java/top/mrxiaom/mmoitems/api/INumericStatsInjector.java
new file mode 100644
index 00000000..1d371241
--- /dev/null
+++ b/MMOItems-API/src/main/java/top/mrxiaom/mmoitems/api/INumericStatsInjector.java
@@ -0,0 +1,24 @@
+package top.mrxiaom.mmoitems.api;
+
+import net.Indyuce.mmoitems.inventory.EquippedItem;
+import net.Indyuce.mmoitems.inventory.InventoryResolver;
+import net.Indyuce.mmoitems.stat.type.ItemStat;
+
+/**
+ * 临时属性值注入器
+ */
+public interface INumericStatsInjector {
+    default int getPriority() {
+        return 1000;
+    }
+
+    /**
+     * 处理应用属性值注入逻辑
+     * @param resolver 物品栏解析器实例，可以获取到玩家数据等信息
+     * @param equippedItem 要应用属性的武器装备
+     * @param stat 要应用的属性类型
+     * @param statValue 从物品获取到的属性值
+     * @return 修改后的属性值
+     */
+    double applyModifier(InventoryResolver resolver, EquippedItem equippedItem, ItemStat<?, ?> stat, double statValue);
+}
diff --git a/MMOItems-API/src/main/java/top/mrxiaom/mmoitems/api/MMOItemsExt.java b/MMOItems-API/src/main/java/top/mrxiaom/mmoitems/api/MMOItemsExt.java
new file mode 100644
index 00000000..19f49e2c
--- /dev/null
+++ b/MMOItems-API/src/main/java/top/mrxiaom/mmoitems/api/MMOItemsExt.java
@@ -0,0 +1,30 @@
+package top.mrxiaom.mmoitems.api;
+
+import net.Indyuce.mmoitems.MMOItems;
+
+import java.util.ArrayList;
+import java.util.Collections;
+import java.util.Comparator;
+import java.util.List;
+
+public class MMOItemsExt {
+    public final MMOItems plugin;
+    private final List<INumericStatsInjector> numericStatsInjectorRegistry = new ArrayList<>();
+    public MMOItemsExt(MMOItems plugin) {
+        this.plugin = plugin;
+    }
+
+    public List<INumericStatsInjector> getNumericStatsInjectors() {
+        return Collections.unmodifiableList(numericStatsInjectorRegistry);
+    }
+
+    public void registerNumericStatsInjector(INumericStatsInjector injector) {
+        numericStatsInjectorRegistry.add(injector);
+        numericStatsInjectorRegistry.sort(Comparator.comparingInt(INumericStatsInjector::getPriority));
+    }
+
+    public void unregisterNumericStatsInjector(INumericStatsInjector injector) {
+        numericStatsInjectorRegistry.add(injector);
+        numericStatsInjectorRegistry.sort(Comparator.comparingInt(INumericStatsInjector::getPriority));
+    }
+}
```
:::

用法很简单
```java
MMOItems.plugin.ext().registerNumericStatsInjector(/* 自行实现 injector */);
```
