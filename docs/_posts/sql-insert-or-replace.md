---
title: 关于在 MySQL/SQLite 将数据表当成 Map 来用的记录
date: 2025-12-13 23:18:54
permalink: /post/sql-insert-or-replace
description: 之前没怎么研究，查查官方文档，写篇博文总结一下
categories: 
  - 开发
tags: 
  - Java
  - MySQL
  - SQLite
sidebar: auto
---

虽然说 [redis](http://redis.io/) 可能会更合适在数据库里存`键值对`并随时更新，但是我不想额外开一个 redis，我想我的插件用户也不会想要额外开一个 redis，所以有了这一篇博文。

## 数据表定义

仅用作示例，凑合着看吧。
```sql
--- 我比较喜欢用 ` 来包裹表名、列名等等名称，以免跟关键字冲突。
CREATE TABLE if NOT EXISTS `example`(
  `key` VARCHAR(48) PRIMARY KEY,
  `foo` VARCHAR(64),
  `bar` VARCHAR(64)
);
```

## 读取

直接用 `SELECT` 语句查询，这个没有任何争议。
```sql
SELECT * FROM `example` WHERE `key`=?;
```

## 写入

因为有主键的原因，如果你直接 `INSERT` 的话会因为主键重复而报错，直接 `UPDATE` 的话会因为找不到条目而无法更新，这是争议比较严重的地方。

MySQL 和 SQLite 各家都有各家的解决方案，如下所示。在实际编写代码时，按连接的数据库类型执行不同语句即可。

### MySQL

使用 `ON DUPLICATE KEY UPDATE` 语句即可，该语句即使在 MySQL 5.7 都可以使用，文档如下：
+ [MySQL 5.7: INSERT ... ON DUPLICATE KEY UPDATE Statement](https://dev.mysql.com/doc/refman/5.7/en/insert-on-duplicate.html)

> 在 `ON DUPLICATE KEY UPDATE` 子句中的赋值表达式中，您可以使用 `VALUES(col_name)` 用于在 `INSERT ... ON DUPLICATE KEY UPDATE` 语句中，作为引用 `INSERT` 列值的函数。换句话说，`ON DUPLICATE KEY UPDATE` 子句中的 `VALUES( col_name )` 指的是 `col_name` 的值。使得插入时不会发生重复键冲突。该函数在插入多行数据时尤其有用。
> 

```sql
INSERT INTO `example`(`key`,`foo`,`bar`) VALUES(?,?,?)
  ON DUPLICATE KEY UPDATE `foo`=VALUES(`foo`), `bar`= VALUES(`bar`);
```
 
至关重要的是 `ON DUPLICATE KEY UPDATE` 后面的东西，你可以填 `column=?`，手动传入值来更新，也可以填 `column=VALUES(column)` 自动获取值来更新，总之要填你需要更新哪些列的值。

### SQLite

使用 `INSERT OR REPLACE INTO` 语句即可，该语句在 SQLite 3.0.0 (2004年) 以前就有了，文档如下：
+ [SQLite: The ON CONFLICT Clause](https://sqlite.org/lang_conflict.html)

> 对于 `INSERT` 和 `UPDATE` 命令，关键字 `ON CONFLICT` 被替换为 `OR`，以使语法更易读。例如，不再使用`INSERT ON CONFLICT IGNORE`，而是使用 `INSERT OR IGNORE` 。关键字虽然不同，但子句的含义保持不变。
>
> 当发生唯一键 (`UNIQUE`) 或主键 (`PRIMARY KEY`) 约束冲突时，`REPLACE` 算法会在插入或更新当前行之前删除导致约束冲突的现有行，然后命令继续正常执行。如果发生非空 (`NOT NULL`) 约束冲突，`REPLACE` 冲突解决机制会将 `NULL` 值替换为该列的默认值；如果该列没有默认值，则使用 `ABORT` 算法。如果发生检查键 (`CHECK`) 约束或外键约束冲突，`REPLACE` 冲突解决机制与 `ABORT` 算法类似。
> 

换句话说，使用这个语句，SQLite 只会给你自动处理冲突情况，无法跟 MySQL 一样选择冲突时只更新哪些列，不过这也好，通常情况下不需要选择只更新哪些列，全部更新就完事了。

```sql
INSERT OR REPLACE INTO `example`(`key`,`foo`,`bar`) VALUES(?,?,?);
```

是的，这就是全部。SQLite 的冲突处理跟 MySQL 比起来感觉很糙，但很实用。

## 删除

依然没有争议，使用 `DELETE` 语句进行删除即可。
```sql
DELETE FROM `example` WHERE `key`=?;
```
