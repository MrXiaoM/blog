---
title: 使用 HAProxy 转发来自不同域名的地址到不同服务器
date: 2026-04-03 10:46:11
permalink: /post/minecraft-haproxy-redirect-by-domain
description: 节省反向代理节点数量，像 WEB 一样根据域名来转发流量
categories: 
  - 开发
tags:
  - Minecraft
  - 反向代理
  - HAProxy
sidebar: auto
---

书接上回: [我在防 DDoS 网络攻击这块的一些个人见解](/post/mc-ddos)

因为 hopper-rs 已经不更新了，所以另寻他路，用久经验证的 HAProxy 做反向代理也许是个好选择。我也已经用了有小半年了，最近才有按域名转发的需求，就把折腾过程给分享一下。

本文示例配置中，不含优化参数，自己去查资料做针对性优化。

## 配置反代

依然是需要在代理端开启 proxy-protocol 选项，配置好防火墙，只允许反向代理服务器访问，然后再在反向代理服务器上安装 HAProxy，编辑配置：

```shell
nano /etc/haproxy/haproxy.cfg
```

我的配置如下，以供参考

> 注意：`bind :::25565` 是绑定 IPv6 地址，如果不需要可以删掉。

```apache
global
        log stdout format raw local0
        maxconn 4096

defaults
        log     global
        mode    tcp
        option  tcplog
        timeout connect 5s
        timeout client  30s
        timeout server  30s

frontend tcp_proxy_front
        bind *:25565
        bind :::25565
        mode tcp

        default_backend tcp_proxy_back

backend tcp_proxy_back
        mode tcp
        server target_server <源站IP>:<源站端口> send-proxy-v2
```

改完之后检查一下配置是否正确，然后重启 HAProxy 即可。

```shell
haproxy -c -f /etc/haproxy/haproxy.cfg
systemctl restart haproxy
```

## 按域名转发

你点进这篇文章肯定不是想看上面这个这么简单的配置的，以下方案由 Claude 生成，目前测试可用。

按 Claude 的说法，需要解析 Minecraft 客户端握手包，获取发送过来的服务器地址，判定客户端要连接到服务器地址来使用不同的后端。

HAProxy 并没有 Minecraft 握手包协议支持，所以需要自行实现解析握手包功能，先写一个 lua 脚本用于解析握手包：

::: details minecraft.lua
```shell
nano /etc/haproxy/minecraft.lua
```

```lua
-- /etc/haproxy/minecraft.lua
-- 解析 Minecraft Java 版握手包，提取玩家连接时使用的域名

local function read_varint(data, pos)
    local result = 0
    local shift  = 0
    repeat
        if pos > #data then return nil, pos end
        local b = string.byte(data, pos)
        result = result | ((b & 0x7F) << shift)
        shift  = shift + 7
        pos    = pos + 1
        if shift >= 35 then return nil, pos end   -- VarInt 最多 5 字节
    until (b & 0x80) == 0
    return result, pos
end

core.register_action("mc_handshake", { "tcp-req" }, function(txn)
    local data = txn.req:dup()

    if #data < 5 then
        txn:set_var("req.mc_host", "")
        return
    end

    local pos = 1

    -- 1) Packet Length (VarInt)
    local pkt_len
    pkt_len, pos = read_varint(data, pos)
    if not pkt_len then txn:set_var("req.mc_host", ""); return end

    -- 2) Packet ID (VarInt, 握手包 = 0x00)
    local pkt_id
    pkt_id, pos = read_varint(data, pos)
    if not pkt_id or pkt_id ~= 0 then txn:set_var("req.mc_host", ""); return end

    -- 3) Protocol Version (VarInt)
    local proto_ver
    proto_ver, pos = read_varint(data, pos)
    if not proto_ver then txn:set_var("req.mc_host", ""); return end

    -- 4) Server Address 字符串长度 (VarInt)
    local str_len
    str_len, pos = read_varint(data, pos)
    if not str_len or str_len <= 0 or (pos + str_len - 1) > #data then
        txn:set_var("req.mc_host", "")
        return
    end

    -- 5) 提取域名
    local host = string.sub(data, pos, pos + str_len - 1)

    -- 去掉 Forge/FML 追加的标记 (例如 "hostname\0FML\0")
    host = (host:match("^([^%z]+)") or host)

    -- 转小写，便于后续匹配
    host = host:lower()

    txn:set_var("req.mc_host", host)
end)
```
:::

然后编辑 haproxy.cfg 配置，进行如下修改

```diff
global
        log stdout format raw local0
        maxconn 4096
+       lua-load /etc/haproxy/minecraft.lua
 
defaults
```
```diff
frontend tcp_proxy_front
        bind *:25565
        mode tcp

+       tcp-request inspect-delay 5s
+       tcp-request content lua.mc_handshake if { req.len ge 10 }
+       tcp-request content accept if { req.len gt 10 }
+
+       use_backend 后端名 if { var(req.mc_host) -m str -i 你的域名 }
+
        default_backend tcp_proxy_back
```

然后再在配置最后面添加后端就好了，示例如下

```apache
frontend tcp_proxy_front
        # 仅作示例，这里仅编写需要添加的内容

        # 添加使用后端的条件为域名匹配
        # 如果需要更多域名转发，复制这一条 use_backend 往下粘贴修改即可
        use_backend my_proxy_1 if { var(req.mc_host) -m str -i mc.example.com }

        # 默认后端配置保持不变
        default_backend tcp_proxy_back
        
# 添加新的后端，代理转发到另一个源站
backend my_proxy_1
        mode tcp
        server target_server <源站IP>:<源站端口> send-proxy-v2
```

省流，完整示例如下

::: details haproxy.cfg
```apache
global
        log stdout format raw local0
        maxconn 4096
        lua-load /etc/haproxy/minecraft.lua

defaults
        log     global
        mode    tcp
        option  tcplog
        timeout connect 5s
        timeout client  30s
        timeout server  30s

frontend tcp_proxy_front
        bind *:25565
        bind :::25565
        mode tcp

        tcp-request inspect-delay 5s
        tcp-request content lua.mc_handshake if { req.len ge 10 }
        tcp-request content accept if { req.len gt 10 }

        use_backend my_proxy_1 if { var(req.mc_host) -m str -i mc.example.com }

        default_backend tcp_proxy_back

backend tcp_proxy_back
        mode tcp
        server target_server 192.168.0.2:10000 send-proxy-v2

backend my_proxy_1
        mode tcp
        server target_server 192.168.0.3:10000 send-proxy-v2
```
:::
