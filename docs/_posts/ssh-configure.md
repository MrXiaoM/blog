---
title: 为 SSH 配置私钥登录
date: 2025-11-03 14:24:05
permalink: /post/ssh-configure
description: 免得每次都要去找教程，写一份方便自己以后参考
categories: 
  - 开发
tags: 
  - Linux
  - Debian
  - SSH
sidebar: auto
---

我通常会去租 Debian 12 系统的云服务器，相对稳定且兼容性较好。我开发使用的电脑是 Windows 11，使用 WindTerm 来连接 SSH。

主要是因为 WindTerm 可以随时把 SSH 会话打包带走，方便在我电脑损坏时迁移数据我才使用的。

## 新建密钥对

首先检查依赖有没有安装好
```shell
sudo apt install openssh-server
```

然后新建一个密钥

```shell
cd ~
ssh-keygen -t ed25519
```
这里的 `-t` 后面可以选择以下密钥类型: `dsa`, `ecdsa`, `ecdsa-sk`, `ed25519`, `ed25519-sk`, `rsa`。  
建议使用 `ed25519` 或 `rsa`。([参考资料](https://www.cnblogs.com/librarookie/p/15389876.html))

按提示新建密钥之后，进入 `.ssh` 文件夹，将新建的公钥写入成信任的公钥。  
注意！这里的文件名取决于**上面用了什么密钥类型**，如果你使用的密钥类型与本文不同，请勿照抄！

```shell
cd ~/.ssh
touch authorized_keys
cat id_ed25519.pub >> authorized_keys
```

并且需要给予这些文件/文件夹相应的权限
```shell
chmod 600 authorized_keys
chmod 700 ~/.ssh
```

将私钥文件 `id_ed25519` (不带 `.pub` 后缀的那个) 下载到本地，将其保存到 WindTerm 目录下的 `keys` 文件夹（或者其它文件夹也行，随你），并按云服务器来源进行重命名，例如：`WindTerm/keys/extravm-japan`。

## 配置 SSH

打开 ssh 配置文件
```shell
sudo nano /etc/ssh/sshd_config
```

添加以下配置，以启用密钥登录，并添加信任的公钥到配置中
```bash
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys .ssh/authorized_keys2
```

配置好后，重启 SSH 服务
```shell
systemctl restart ssh
```

## 连接测试

对于 WindTerm，右键你的 SSH 会话，点击`属性`，在 `SSH -> 验证` 那里，`身份验证文件` 输入私钥的相对路径即可。

例如 `./keys/extravm-japan`

保存并连接，输入用户名，应该就可以使用私钥连接到你的 SSH 会话了。

## 后期修改

测试能够成功连接之后，就可以进行后期修改了，打开 ssh 配置文件

```shell
sudo nano /etc/ssh/sshd_config
```

修改以下配置，改掉默认的 `22` 端口，并禁止密码登录

```bash
Port 2222
PasswordAuthentication no
```

配置好后，重启 SSH 服务
```shell
systemctl restart ssh
```
