---
title: 为什么我不喜欢使用 Java 的 .stream() 接口
date: 2025-10-13 12:33:01
permalink: /post/why-i-do-not-like-stream-api
description: 主要是因为存在性能问题
categories:
  - Java
tags: 
  - 编程
  - Java
sidebar: auto
---

Java 8 加入了 Stream API，使用链式调用的方式来处理集合 (`Collection`) 中的元素，例如筛选 (`filter`)、转换 (`map`)、合并 (`join`) 等等。

```java
list.stream()
    .filter(it -> !it.isEmpty())
    .map(it -> manager.getById(it))
    .toList();
```

它写起来很方便，也很直观。但是它的性能开销是不容小觑的，对于数据量较小的应用场景，或者 (特别是) 需要频繁调用的场景，尽可能不要使用 Stream API。

## 性能问题

我是写 Bukkit 插件的，最近因为在代码中使用了 Stream API，而这部分代码会被频繁调用 (更新虚拟实体对各个玩家的可视情况)，把测试服的主线程卡死了，最后崩了。

```
------------------------------
Server thread dump (Look for plugins here before reporting to Purpur!):
------------------------------
Current Thread: Server thread
	PID: 43 | Suspended: false | Native: false | State: RUNNABLE
	Stack:
		java.base@17.0.16/java.util.stream.AbstractPipeline.wrapSink(Unknown Source)
		java.base@17.0.16/java.util.stream.AbstractPipeline.wrapAndCopyInto(Unknown Source)
		java.base@17.0.16/java.util.stream.ForEachOps$ForEachOp.evaluateSequential(Unknown Source)
		java.base@17.0.16/java.util.stream.ForEachOps$ForEachOp$OfRef.evaluateSequential(Unknown Source)
		java.base@17.0.16/java.util.stream.AbstractPipeline.evaluate(Unknown Source)
		java.base@17.0.16/java.util.stream.ReferencePipeline.forEach(Unknown Source)
		VectorDisplays-plugin-1.0.0.jar//top.mrxiaom.hologram.vector.displays.hologram.AbstractEntity.updateAffectedPlayers(AbstractEntity.java:204)
// 剩下的部分不重要
```

让我们来看看这部分的代码长什么样吧

```java
new ArrayList<>(viewers).stream() // 超出可视范围自动销毁实体
        .filter(player -> player.isOnline() && (player.getWorld() != this.location.getWorld() || player.getLocation().distance(this.location) > viewDistance))
        .forEach(player -> { // 堆栈提示位置 - 第 204 行
            if (this.renderMode == RenderMode.NEARBY) {
                removeViewer(player);
            } else {
                PacketWrapper<?> packet = new WrapperPlayServerDestroyEntities(this.entityID);
                sendPacket(player, packet);
                if (this.renderMode == RenderMode.VIEWER_LIST && !leftViewers.contains(player)) {
                    leftViewers.add(player);
                }
            }
        });
```

实际上，viewers 的数据是非常少的，最多只能达到当前服务器的在线人数，没有必要使用 Stream API。

最后，事实证明也的确是因为 Stream API 开销过大，导致主线程卡死。在实体更新这一块，把 Stream API 改成 for 循环就不卡了。

```java
// toArray() 会复制一份 ArrayList 内部维护的数组，而且执行效率较高
// 复制一份再遍历，以免出现并行操作问题
for (Object o : viewers.toArray()) { // 超出可视范围自动销毁实体
    Player player = (Player) o;
    if (player.isOnline() && (player.getWorld() != this.location.getWorld() || player.getLocation().distance(this.location) > viewDistance)) {
        if (this.renderMode == RenderMode.NEARBY) {
            removeViewer(player);
        } else {
            PacketWrapper<?> packet = new WrapperPlayServerDestroyEntities(this.entityID);
            sendPacket(player, packet);
            if (this.renderMode == RenderMode.VIEWER_LIST && !leftViewers.contains(player)) {
                leftViewers.add(player);
            }
        }
    }
}
```

使用 Stream API 的代码来自 Hologram API 旧版本 (新版本已改名为 HologramLib)，由于之前一直运行正常，我没发现它存在性能问题。

直到我把几十个虚拟实体同时放置到世界上之后，这部分在主线程被连续调用了几十次，问题才开始显现出来。

如果只是一下调用几十次还算好，不过这个方法可是每隔 3 秒又会调用一次，以便更新可视状态。每 3 秒调用几十次，才最终导致主线程卡死。用 for 循环就不会。

::: details 另外
连续几十次调用 Stream API，在崩服之前，因为内存没有及时释放，还给我爆内存了。
```
[00:02:25] [Server thread/WARN]: [VectorDisplays] Task #6514298 for VectorDisplays v1.0.0 generated an exception
java.lang.OutOfMemoryError: Cannot reserve 4194304 bytes of direct buffer memory (allocated: 4291325330, limit: 4294967296)
	at java.nio.Bits.reserveMemory(Unknown Source) ~[?:?]
	at java.nio.DirectByteBuffer.<init>(Unknown Source) ~[?:?]
	at java.nio.ByteBuffer.allocateDirect(Unknown Source) ~[?:?]
	at io.netty.buffer.PoolArena$DirectArena.allocateDirect(PoolArena.java:721) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.PoolArena$DirectArena.newChunk(PoolArena.java:696) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.PoolArena.allocateNormal(PoolArena.java:215) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.PoolArena.tcacheAllocateSmall(PoolArena.java:180) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.PoolArena.allocate(PoolArena.java:137) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.PoolArena.allocate(PoolArena.java:129) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.PooledByteBufAllocator.newDirectBuffer(PooledByteBufAllocator.java:396) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.AbstractByteBufAllocator.directBuffer(AbstractByteBufAllocator.java:188) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.AbstractByteBufAllocator.directBuffer(AbstractByteBufAllocator.java:174) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.netty.buffer.AbstractByteBufAllocator.buffer(AbstractByteBufAllocator.java:108) ~[netty-buffer-4.1.97.Final.jar:4.1.97.Final]
	at io.github.retrooper.packetevents.netty.channel.ChannelOperatorModernImpl.pooledByteBuf(ChannelOperatorModernImpl.java:115) ~[packetevents-spigot-2.9.5.jar:?]
	at com.github.retrooper.packetevents.netty.channel.ChannelHelper.pooledByteBuf(ChannelHelper.java:97) ~[packetevents-spigot-2.9.5.jar:?]
	at com.github.retrooper.packetevents.wrapper.PacketWrapper.prepareForSend(PacketWrapper.java:241) ~[packetevents-spigot-2.9.5.jar:?]
	at com.github.retrooper.packetevents.wrapper.PacketWrapper.prepareForSend(PacketWrapper.java:264) ~[packetevents-spigot-2.9.5.jar:?]
	at com.github.retrooper.packetevents.manager.protocol.ProtocolManager.transformWrappers(ProtocolManager.java:111) ~[packetevents-spigot-2.9.5.jar:?]
	at com.github.retrooper.packetevents.manager.protocol.ProtocolManager.sendPacket(ProtocolManager.java:121) ~[packetevents-spigot-2.9.5.jar:?]
	at com.github.retrooper.packetevents.manager.player.PlayerManager.sendPacket(PlayerManager.java:57) ~[packetevents-spigot-2.9.5.jar:?]
	at top.mrxiaom.hologram.vector.displays.hologram.AbstractEntity.sendPacket(AbstractEntity.java:242) ~[VectorDisplays-plugin-1.0.0.jar:?]
	at top.mrxiaom.hologram.vector.displays.hologram.AbstractEntity.removeViewer(AbstractEntity.java:171) ~[VectorDisplays-plugin-1.0.0.jar:?]
	at top.mrxiaom.hologram.vector.displays.hologram.AbstractEntity.lambda$updateAffectedPlayers$4(AbstractEntity.java:206) ~[VectorDisplays-plugin-1.0.0.jar:?]
	at java.util.stream.ForEachOps$ForEachOp$OfRef.accept(Unknown Source) ~[?:?]
	at java.util.stream.ReferencePipeline$2$1.accept(Unknown Source) ~[?:?]
	at java.util.ArrayList$ArrayListSpliterator.forEachRemaining(Unknown Source) ~[?:?]
	at java.util.stream.AbstractPipeline.copyInto(Unknown Source) ~[?:?]
	at java.util.stream.AbstractPipeline.wrapAndCopyInto(Unknown Source) ~[?:?]
	at java.util.stream.ForEachOps$ForEachOp.evaluateSequential(Unknown Source) ~[?:?]
	at java.util.stream.ForEachOps$ForEachOp$OfRef.evaluateSequential(Unknown Source) ~[?:?]
	at java.util.stream.AbstractPipeline.evaluate(Unknown Source) ~[?:?]
	at java.util.stream.ReferencePipeline.forEach(Unknown Source) ~[?:?]
	at top.mrxiaom.hologram.vector.displays.hologram.AbstractEntity.updateAffectedPlayers(AbstractEntity.java:204) ~[VectorDisplays-plugin-1.0.0.jar:?]
```
:::

## 总结

除非你需要对大量数据进行筛选、转换操作，否则不要使用 Stream API。它的性能开销可能比你想象中的大。
