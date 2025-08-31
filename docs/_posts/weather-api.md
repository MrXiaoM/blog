---
title: 中国气象局 天气预报API汇总
date: 2025-08-31 11:19:35
permalink: /post/weather-api
description: 部分接口靠猜测并测试得到，可能具有时效性，仅保证在文章发布时有效
categories: 
  - 开发
tags: 
  - 编程
  - 接口
  - 天气
sidebar: auto
---

中国气象局的官网是 [weather.cma.cn](https://weather.cma.cn/)。感谢气象局能够使用 json 格式的接口释出天气预报和气象信息！气象信息一般十几分钟更新一次，不推荐频繁访问，以免对气象局的服务器造成较大压力。

这里的大部分接口都收集自网络，以及从网页上抓取调用的接口，并使用常用单词猜测链接格式，测试得到。

接口基本都在 `https://weather.cma.cn/api/` 下。

::: tip 注意事项
+ 调用格式里的 `${}` 是参数的意思，例如你想设置 `days` 为 `1`，`${days}` 应该替换为 `1`，而**不是** `${1}`。
+ 监测站ID会存在字母，不要使用整数类型储存。
+ 如无特殊说明，图标链接都在 `https://weather.cma.cn` 域名下面，反正域名都一样的，就省略域名了。
+ 图标一般不会变，如果你打算拿这个接口制作本地应用程序，建议将图标存到程序内进行调用，而不是通过网络获取。
:::

## 全国天气预报

调用格式
```
GET https://weather.cma.cn/api/map/weather/${days}?t=${timestamp}

days - 天数，其中 1 为今天，2 为明天。范围 [1-7]
timestamp - 当前毫秒时间戳
```
返回格式示例
```json5
{
  "msg": "success",
  "code": 0,
  "data": {
    "lastUpdate": "2025/08/31 12:00",
    "date": "2025/09/01",
    "city": [
      [
        "59279", // 监测站ID
        "三水", // 城市
        "中国", // 国家
        3, // 地图显示天气图标 /static/img/w/icon/w数值.png
        23.2, // 纬度
        112.88, // 经度
        34.0, // 日间温度
        "阴", // 日间天气
        2, // 日间天气图标 /static/img/w/icon/w数值.png
        "无持续风向", // 日间风向
        "微风", // 日间风速
        27.0, // 夜间温度
        "小雨", // 夜间天气
        7, // 夜间天气图标 /static/img/w/icon/w数值.png
        "无持续风向", // 夜间风向
        "微风", // 夜间风速
        "AGD", // 省份代码
        "440607" // 行政区划代码
      ],
      // ...
    ]
  }
}
```

## 搜索监测站

调用格式
```
GET https://weather.cma.cn/api/autocomplete?q=${string}&limit=${limit}&timestamp=${timestamp}

string - 要搜索的内容，需要 URL 编码
limit - 限制返回数量，建议使用 10
timestamp - 当前毫秒时间戳
```

返回格式示例
```json5
{
    "msg": "success",
    "code": 0,
    "data": [
        // "监测站ID|中文名|英文名|国家"
        "59279|三水|Sanshui|中国",
        "M1068|三亚|Sanya|中国",
        // ...
    ]
}
```

## 获取省份/外国的监测站列表

调用格式
```
GET https://weather.cma.cn/api/dict/province/${proviceId}
GET https://weather.cma.cn/api/dict/country/${countryId}

proviceId - 省份ID，填写则显示省份下的监测站列表，不填写则显示省份列表
countryId - 国家或地区ID，填写则显示国家或地区下的监测站列表，不填写则显示国家或地区列表
```

返回格式示例
```json5
{
  "msg": "success",
  "code": 0,
  // 用 | 分隔，其中每一份可以有以下格式
  // 国家或地区ID,名称
  // 省份ID,名称
  // 检测站ID,名称
  "data": "003772,伦敦|003334,曼彻斯特"
}
```

## 指定城市天气预报

调用格式
```
GET https://weather.cma.cn/api/weather/${stationId}
GET https://weather.cma.cn/api/weather/view?stationid=${stationId}

stationId - 监测站ID，如果为空，则查询IP属地的监测站
```

返回格式示例
```json5
{
  "msg": "success",
  "code": 0,
  "data": {
    "location": {
      "id": "59279", // 监测站ID
      "name": "三水", // 监测站名称
      "path": "中国, 广东, 三水", // 检测站位置
      "longitude": 112.88, // 经度
      "latitude": 23.2, // 纬度
      "timezone": 8 // 时区 (正东负西)
    },
    "daily": [
      {
        "date": "2025/08/31", // 日期
        "high": 33.0, // 最高气温
        "dayText": "阵雨", // 日间天气
        "dayCode": 3, // 日间天气图标
        "dayWindDirection": "无持续风向", // 日间风向
        "dayWindScale": "微风", // 日间风的强度
        "low": 26.0, // 最低气温
        "nightText": "多云", // 夜间天气
        "nightCode": 1, // 夜间天气图标
        "nightWindDirection": "无持续风向", // 夜间风向
        "nightWindScale": "微风" // 夜间风的强度
      },
      // ...
    ],
    "now": {
      "precipitation": 0.0, // 降雨量 (mm)
      "temperature": 31.7, // 温度 (℃)
      "pressure": 1008.0, // 气压 (hPa)
      "humidity": 60.0, // 湿度 (%)
      "windDirection": "东北风", // 风向
      "windDirectionDegree": 21.0, // 风向角
      "windSpeed": 3.1, // 风速 (m/s)
      "windScale": "微风", // 风的强度
      "feelst": 34.8 // 体感温度 (℃)
    },
    // 没有 /view 的接口不返回 jieQi 和 alarm
    "jieQi": "",
    "alarm": [
      
    ],
    "lastUpdate": "2025/08/31 11:15" // 最后更新时间
  }
}
```

## 指定城市当前气象数据

调用格式
```
GET https://weather.cma.cn/api/now/${stationId}

stationId - 监测站ID，如果为空，则查询IP属地的监测站
```

返回格式示例
```json5
{
    "msg": "success",
    "code": 0,
    "data": {
        "location": {
            "id": "59279", // 监测站ID
            "name": "三水", // 监测站名称
            "path": "中国, 广东, 三水" // 监测站位置
        },
        "now": {
            "precipitation": 0.0, // 降雨量 (mm)
            "temperature": 31.9, // 温度 (℃)
            "pressure": 1008.0, // 气压 (hPa)
            "humidity": 60.0, // 湿度 (%)
            "windDirection": "东北风", // 风向
            "windDirectionDegree": 7.0, // 风向角
            "windSpeed": 3.6, // 风速 (m/s)
            "windScale": "3级", // 风级
            "feelst": 34.7 // 体感温度 (℃)
        },
        "alarm": [],
        "jieQi": "",
        "lastUpdate": "2025/08/31 11:35" // 最后更新时间
    }
}
```

## 指定城市一天内的气象数据

可能未进行前后端分离，暂未找到接口。

只能访问 `https://weather.cma.cn/web/weather/${stationId}.html`，在控制台执行 `document.getElementsByClassName('hour-table')` 获取。

其中一个 table 的示例如下

::: details 折叠示例
```html
<table class="hour-table" id="hourTable_0" style=""> 
 <tbody>
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-time"></i> 时间</td> 
   <td>14:00</td> 
   <td>17:00</td> 
   <td>20:00</td> 
   <td>23:00</td> 
   <td>02:00</td> 
   <td>05:00</td> 
   <td>08:00</td> 
   <td>11:00</td> 
  </tr> 
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-tianqi"></i> 天气</td> 
   <td class="wicon"><img src="/static/img/w/icon/w3.png"></td> 
   <td class="wicon"><img src="/static/img/w/icon/w3.png"></td> 
   <td class="wicon"><img src="/static/img/w/icon/w3.png"></td> 
   <td class="wicon"><img src="/static/img/w/icon/w1.png"></td> 
   <td class="wicon"><img src="/static/img/w/icon/w1.png"></td> 
   <td class="wicon"><img src="/static/img/w/icon/w1.png"></td> 
   <td class="wicon"><img src="/static/img/w/icon/w1.png"></td> 
   <td class="wicon"><img src="/static/img/w/icon/w3.png"></td> 
  </tr> 
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-temp"></i> 气温</td> 
   <td>32.8℃</td> 
   <td>31.4℃</td> 
   <td>28.4℃</td> 
   <td>28.1℃</td> 
   <td>26.5℃</td> 
   <td>26.2℃</td> 
   <td>28.1℃</td> 
   <td>31.8℃</td> 
  </tr> 
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-raindrops"></i> 降水</td> 
   <td>2.3mm</td> 
   <td>2.3mm</td> 
   <td>2.3mm</td> 
   <td>无降水</td> 
   <td>无降水</td> 
   <td>无降水</td> 
   <td>无降水</td> 
   <td>0.1mm</td> 
  </tr> 
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-Windpower"></i> 风速</td> 
   <td>3.3m/s</td> 
   <td>3.1m/s</td> 
   <td>2.9m/s</td> 
   <td>3.2m/s</td> 
   <td>3.1m/s</td> 
   <td>3m/s</td> 
   <td>3.3m/s</td> 
   <td>3.3m/s</td> 
  </tr> 
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-fengxiang"></i> 风向</td> 
   <td>东南风</td> 
   <td>东南风</td> 
   <td>东南风</td> 
   <td>东南风</td> 
   <td>西南风</td> 
   <td>东北风</td> 
   <td>东南风</td> 
   <td>东南风</td> 
  </tr> 
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-qiya"></i> 气压</td> 
   <td>1004.7hPa</td> 
   <td>1002.9hPa</td> 
   <td>1004.1hPa</td> 
   <td>1005.7hPa</td> 
   <td>1004.9hPa</td> 
   <td>1004.4hPa</td> 
   <td>1005.2hPa</td> 
   <td>1005.2hPa</td> 
  </tr> 
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-humidity"></i> 湿度</td> 
   <td>63.5%</td> 
   <td>66.7%</td> 
   <td>71.9%</td> 
   <td>79.9%</td> 
   <td>89.8%</td> 
   <td>91.4%</td> 
   <td>80.7%</td> 
   <td>60.2%</td> 
  </tr> 
  <tr> 
   <td style="background-color:#eee;"><i class="iconfont icon-yunliang_huabanfuben"></i> 云量</td> 
   <td>70%</td> 
   <td>70%</td> 
   <td>70%</td> 
   <td>10.1%</td> 
   <td>10.1%</td> 
   <td>10.1%</td> 
   <td>10.1%</td> 
   <td>65%</td> 
  </tr> 
 </tbody>
</table>
```
:::

在 Java 可以使用 [Jsoup](https://jsoup.org/) 来解析 HTML 文档。

```java
String stationId = "59279";
Document doc = Jsoup.connect("https://weather.cma.cn/web/weather/" + stationId + ".html").get();
Elements tables = doc.getElementsByClass("hour-table");
for (int days = 0; days < tables.size(); days++) {
    Element table = tables.get(days);
    Elements rows = table.getElementsByTag("tr");
    if (rows.isEmpty()) continue;
    List<Map<String, String>> list = new ArrayList<>();
    int size = rows.get(0).childrenSize();
    for (int col = 1; col < size; col++) {
        Map<String, String> attributes = new HashMap<>();
        for (Element row : rows) {
            Elements columns = row.getElementsByTag("td");
            if (col >= columns.size()) continue;
            String key = columns.get(0).text().trim();
            Element element = columns.get(col);
            Elements img = element.getElementsByTag("img");
            String value = img.isEmpty()
                    ? element.text().trim()
                    : img.get(0).attr("src");
            if (key.isEmpty() || value.isEmpty()) continue;
            attributes.put(key, value);
        }
        list.add(attributes);
    }
    LocalDate date = LocalDate.now().plusDays(days);
    for (Map<String, String> attributes : list) {
        String time = attributes.get("时间");
        String weatherIcon = attributes.get("天气");
        String temperature = attributes.get("气温");
        String precipitation = attributes.get("降水");
        String windSpeed = attributes.get("风速");
        String windDirection = attributes.get("风向");
        String pressure = attributes.get("气压");
        String humidity = attributes.get("湿度");
        String cloud = attributes.get("云量");
        // TODO: 按照你的需要处理数据
    }
}
```

## 气象预警信息

调用格式
```
GET https://weather.cma.cn/api/map/alarm?adcode=${code}

code - 省份的行政区划代码，取省份的两位即可，例如广东是 44。留空则查看全国预警信息
```
**行政区划代码**可以到[民政部网站](https://www.mca.gov.cn/n156/n186/index.html)查询，如果不想查的话，你的身份证前两位就是所在省份的行政区划代码。

返回格式示例
```json5
{
  "msg": "success",
  "code": 0,
  "data": [
    {
      // 预警ID，可以通过 https://weather.cma.cn/web/alarm/${id}.html 查看详细信息
      "id": "44082541600000_20250831115755",
      // 详细信息的标题
      "headline": "徐闻县气象台发布雷雨大风黄色预警[III级/较重]",
      // 发布时间
      "effective": "2025/08/31 11:54",
      // 预警描述
      "description": "受雷雨云团影响，预计未来6小时内，徐闻及附近海面阵风将达8级以上，并伴有雷电和短时强降水，从8月31日11时54分起，徐闻县雷雨大风黄色预警信号生效，请注意防御。徐闻县气象台发布",
      // 经度
      "longitude": 110.1757,
      // 纬度
      "latitude": 20.3261,
      // 预警类型，其图标为 /assets/img/alarm/${type}.png
      "type": "p0015003",
      // 标题
      "title": "广东省湛江市徐闻县发布雷雨大风黄色预警"
    },
    // ...
  ]
}
```
