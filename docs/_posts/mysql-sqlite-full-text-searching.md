---
title: 在 MySQL/SQLite 上使用中文全文搜索功能
date: 2026-02-18 22:55:24
permalink: /post/mysql-sqlite-full-text-searching
description: 教你如何在你的项目上添加搜索功能
categories: 
  - 开发
tags: 
  - 数据库
  - MySQL
  - SQLite
  - Java
sidebar: auto
---

在网上冲浪时，我们经常从搜索引擎中受益，从中检索自己想要的信息。而当你在编写 Minecraft 服务器插件时，有时也会有从数据库检索文本的需求。

例如我的插件 [SweetPlayerMarket](https://plugins.mcio.dev/docs/playermarket/intro)，一个全球市场插件，需要添加“搜索指定物品”功能，就需要用到搜索了，搜索物品名称、Lore 等等。

找全文搜索的教程也是找死我了，所以写一篇文章整理一下，给数据表添加全文搜索索引的操作步骤。

目前我是使用多表查询的方案来实现搜索的，如果你要同时兼容 MySQL 和 SQLite，我比较推荐使用多表查询，等你读到 SQLite 部分就知道为什么了。

## MySQL

> 参考文档:
> + [MySQL 5.7 :: Full-Text Search Functions](https://dev.mysql.com/doc/refman/5.7/en/fulltext-search.html)
> + [MySQL 5.7 :: Natural Language Full-Text Searches](https://dev.mysql.com/doc/refman/5.7/en/fulltext-natural-language.html)
> + [MySQL 5.7 :: ngram Full-Text Parser](https://dev.mysql.com/doc/refman/5.7/en/fulltext-search-ngram.html)

首先介绍一下 MySQL 全文搜索的实现方式，先为数据表添加 `FULLTEXT` 来建立索引：
```sql
CREATE TABLE `search_index` (
   `shop_id` VARCHAR(48) PRIMARY KEY,
   `content` TEXT,
   FULLTEXT (`content`) WITH PARSER ngram
)
```

### 声明索引

比较重要的就是这一段
```sql
FULLTEXT (列名) WITH PARSER 解析器
```
列名可以通过逗号分隔以添加多个列，由于我使用多表查询方案，仅新建一个“索引表”（逻辑上的索引表，不是真的实现上的索引表），仅储存 ID 和可搜索文本 `content`，所以只添加一个列就足够了。

如果你想修改现有的表，也可以这样
```sql
ALTER TABLE `search_index` ADD FULLTEXT INDEX ft_index (`content`) WITH PARSER ngram;
```

::: tip 踩坑
如果你需要搜索的**内容包含中文**，则一定要添加 `ngram` 解析器，否则将**无法搜索出结果**。
:::

### 条件匹配

添加一点测试数据进去吧
```sql
INSERT INTO `search_index` (`shop_id`, `content`) VALUES
    ('093c2f99-41e7-4adc-928e-4d5a470e8619','在本教程中我将向你展示如何管理数据库'),
    ('c2379085-0f9c-43c6-acd9-947105ce48bd','学习开发数据库应用程序');
```

需要搜索的时候，在查询语句添加以下条件即可，该条件可用 `AND`、`OR` 等操作符连接
```sql
MATCH (列名) AGAINST (关键词 [修饰符])
```
列表依然可以通过逗号分隔添加多个列，关键词即字符串，可在 `PrepareStatement` 中使用 `?` 作为占位符。修饰符是可选的，可以使用以下值
+ `IN NATURAL LANGUAGE MODE`
+ `IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION`
+ `IN BOOLEAN MODE`
+ `WITH QUERY EXPANSION`

它们的区别就在上述参考文档中有，我懒得全部读，就用第一个修饰符好了。

```sql
SELECT * FROM `search_index` MATCH (`content`) AGAINST('教程');
```

这样会查出 `shop_id` 为 `093c2f99-41e7-4adc-928e-4d5a470e8619` 的那一条数据。

### 跨表查询

这个 `search_index` 表是我拿来当做索引的，与实际数据表建立联系，同时也方便我更新插件，可以在升级插件后自动建立索引。

```sql
SELECT m.* FROM
  --- 按 shop_id 连接数据表和索引表，分别设置别名
  `marketplace` m INNER JOIN `search_index` si ON m.`shop_id` = si.`shop_id`
  --- 搜索关键词，使用占位符代替
  WHERE MATCH(si.`content`) AGAINST(? IN NATURAL LANGUAGE MODE)
  --- 其它条件
  AND `amount`>0 
  --- 分页
  LIMIT 0, 10;
```
列名还是跟之前跨表查询一样，照样用 `别名.列名` 来代替即可。

## SQLite

> 参考文档:
> + [The Virtual Table Mechanism Of SQLite](https://sqlite.org/vtab.html)
> + [SQLite FTS5 Extension](https://sqlite.org/fts5.html)
> + [Simple: 一个支持中文和拼音搜索的 sqlite fts5插件](https://www.wangfenjin.com/posts/simple-tokenizer/)

SQLite 实现全文搜索的方式是 FTS5 虚拟表，由于虚拟表的性质比较特殊，会损失 `PRIMARY KEY` 等特性，所以仅推荐使用“索引表”设计方案。

```sql
CREATE VIRTUAL TABLE `search_index` USING FTS5(`shop_id`,`content`)
```

这个功能从 3.9.0 版本（2015-10-14）起开始支持，用之前最好检查一下 SQLite 版本。

我**强烈建议**先看完关于 SQLite 的这一整章再进行操作，**以免踩坑**。

### 声明虚拟表

创建 FTS5 虚拟表的基本格式是

```sql
CREATE VIRTUAL TABLE 表名 USING FTS5(列名1, 列名2, 列名3, 参数=值);
```

可用参数请参考 [FTS5 表的创建与初始化](https://sqlite.org/fts5.html#fts5_table_creation_and_initialization)

::: tip 踩坑
注意到 `tokenize` 参数了吗？这是用于索引分词的模块名称，而 SQLite 自带的所有分词器全都不支持中文。

这就是参考资料中存在一个中文文档的原因，如果你需要搜索中文，则需要用一种*很麻烦*的方式载入一个 `native` 库，给 SQLite 安装扩展。

这一部分将会在最后介绍。
:::

### 条件匹配

跟之前一样，添加一点测试数据进去吧
```sql
INSERT INTO `search_index` (`shop_id`, `content`) VALUES
    ('093c2f99-41e7-4adc-928e-4d5a470e8619','在本教程中我将向你展示如何管理数据库'),
    ('c2379085-0f9c-43c6-acd9-947105ce48bd','学习开发数据库应用程序');
```
需要注意的是，由于不支持主键等特性，如果你需要 `shop_id` 不重复，你需要先 `DELETE FROM` 再 `INSERT INTO`，个人认为效率会比较高。

需要搜索的时候，在查询语句添加以下条件即可，该条件可用 `AND`、`OR` 等操作符连接
```sql
列名 MATCH 关键词
```
这就没什么好说的了
```sql
SELECT * FROM `select_index` WHERE `content` MATCH '教程';
```
这样会查出 `shop_id` 为 `093c2f99-41e7-4adc-928e-4d5a470e8619` 的那一条数据…吗？不，什么也查不到。

### 添加分词器扩展

正如前面所说，SQLite 的 FTS5 默认 tokenizer 是不支持中文的，导致无法通过中文关键词搜索，所以我们需要添加分词器扩展。

首先需要添加参数，让 SQLite 支持加载扩展
```java
// 比较正式的方式
SQLiteConfig config = new SQLiteConfig();
config.enableLoadExtension(true);
Properties sqliteProps = config.toProperties();

// 无需引用依赖的方式
Properties sqliteProps = new Properties();
sqliteProps.put("enable_load_extension", "true");

// 原生 JDBC 添加配置方法
String url = "jdbc:sqlite:database.db"
/*Connection conn = */DriverManager.getConnection(url, config.toProperties());

// HikariCP 添加配置方法
HikariConfig hikariConfig = new HikariConfig();
hikariConfig.setDataSourceProperties(sqliteProps);
```

然后到 Simple Tokenizer 的 [Releases](https://github.com/wangfenjin/simple/releases/latest) 下载合适自己系统架构的发行版。  
下载的压缩包里面有一个动态链接库（`.dll`/`.so`/`.dylib`）和一个 `dict` 文件夹，解压，然后通过以下语句加载，自行替换路径（最好使用绝对路径）
```sql
----------------- 以下两种选一种 -------------------
--- Linux/MacOS，无需输入后缀名
SELECT load_extension('/path/to/libsimple', 'sqlite3_simple_init');
--- Windows，无需输入后缀名
SELECT load_extension('/path/to/simple', 'sqlite3_simple_init');
---------------------------------------------------

--- 加载词典
SELECT jieba_dict('/path/to/dict');
```

::: tip 踩坑
`statement` 一关，扩展就不在了，真有你的 SQLite。  
我专门写了个 [SQLiteLibSimple](https://github.com/MrXiaoM/SweetPlayerMarket/blob/636a8c2cb23721ded72655cb9ff1a2ba20ccd585/src/main/java/top/mrxiaom/sweet/playermarket/database/SQLiteLibSimple.java)，用于将 `libsimple` 加载到 SQLite 扩展，每次需要调用 `search_index` 数据表时都要加载一次，不然你就等着报错吧（`[SQLITE_ERROR] SQL error or missing database (no such tokenizer: simple)`）。
::: details 显示/隐藏代码块
```java
private SQLiteLibSimple libSimple;

/**
 * 初始化 libsimple
 */
void init(File sqliteFolder) throws SQLException {
    Connection conn = getConnection(); // 获取数据库连接
    try (Statement stat = conn.createStatment()) {
        libSimple = SQLiteLibSimple.init(sqliteFolder, stat);
    } catch (Exception e) {
        // TODO: 提醒用户应该下载 libsimple
    }
    // TODO: 管理数据库连接
}

/**
 * 示例操作: 插入数据到索引表中
 */
void put(String shopId, String content) throws SQLException {
    Connection conn = getConnection();
    try (Statement stat = conn.createStatement()) {
        // 加载扩展
        libSimple.apply(stat);
        // 对数据表进行操作
        String sql = "INSERT INTO `search_index` (`shop_id`, `content`) VALUES(?, ?);";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, shopId);
            ps.setString(2, content);
            ps.execute();
        }
    }
    // TODO: 管理数据库连接
}
```
:::

做完上面这些之后，你终于可以给数据表添加 `tokenize='simple'` 参数了。

```sql
CREATE VIRTUAL TABLE `search_index` USING FTS5(`shop_id`,`content`,tokenize='simple')
```

我没找到哪能修改虚拟表的选项，如果你很不幸没有看到我的提示就进行操作了，自行删除表再创建
```sql
DROP TABLE `search_index`;
CREATE VIRTUAL TABLE `search_index` USING FTS5(`shop_id`,`content`,tokenize='simple')
```
（如果删表了）再次添加测试数据
```sql
INSERT INTO `search_index` (`shop_id`, `content`) VALUES
    ('093c2f99-41e7-4adc-928e-4d5a470e8619','在本教程中我将向你展示如何管理数据库'),
    ('c2379085-0f9c-43c6-acd9-947105ce48bd','学习开发数据库应用程序');
```
再执行查询语句
```sql
SELECT * FROM `select_index` WHERE `content` MATCH '教程';
```

这样*应该*会查出 `shop_id` 为 `093c2f99-41e7-4adc-928e-4d5a470e8619` 的那一条数据了。  
我也没底，要是没输出或者报错，自行检查扩展有没有挂上去。

### 跨表查询

> 与 MySQL 章节的语句基本相同，仅仅是“搜索关键词”部分有变化

```sql
SELECT m.* FROM
  --- 按 shop_id 连接数据表和索引表，分别设置别名
  `marketplace` m INNER JOIN `search_index` si ON m.`shop_id` = si.`shop_id`
  --- 搜索关键词，使用占位符代替
  WHERE si.`content` MATCH ?
  --- 其它条件
  AND `amount`>0 
  --- 分页
  LIMIT 0, 10;
```

列名还是跟之前跨表查询一样，照样用 `别名.列名` 来代替即可。

## 尾声

最后基本完成任务，将 SweetPlayerMarket 的搜索功能给做好了。详见[提交记录](https://github.com/MrXiaoM/SweetPlayerMarket/compare/2c7c70a31fc2ea69fec941980ff0f407d50bd8b7...eb9518c7fe7bd6822ed4df858812bf591b2e6361#diff-04c09c8637e8153d94b936e7426227fe791673d3d57f62b35bb850691a95517c)中 `MarketplaceDatabase` 的变更。

时间基本都耗在 SQLite 上面去了，测试了好久才发现是扩展没挂上的问题。

最后还有一个坑，如果你要在 `Navicat`（Windows）上打开这个 SQLite 数据库，`search_index` 表是不能用 GUI 看的，一看就是个 `no such tokenizer: simple` 报错。只能新建查询，然后使用以下代码查询
```sql
SELECT load_extension('/path/to/libsimple', 'sqlite3_simple_init');
SELECT * FROM `search_index`;
```

干得好 SQLite。
