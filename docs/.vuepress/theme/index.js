const fs = require('fs')
const path = require('path')
const Config = require('markdown-it-chain')
const { removePlugin } = require('@vuepress/markdown')
const { PLUGINS } = require('@vuepress/markdown/lib/constant')
const setFrontmatter = require('./node_utils/setFrontmatter')
const getSidebarData = require('./node_utils/getSidebarData')
const { createPage, deletePage } = require('./node_utils/handlePage')
const chalk = require('chalk') // 命令行打印美化
const yaml = require('js-yaml') // yaml转js
const log = console.log

const Prism = require('prismjs')
require('prismjs/components/prism-diff')
require('prismjs/components/prism-yaml')
const markdownItPrism = require('markdown-it-prism')
const MarkdownItTaskLists = require('markdown-it-task-lists')

// md容器名
const CARD_LIST = 'cardList'
const CARD_IMG_LIST = 'cardImgList'

// siteConfig base 配置
let base = ''

function scanPublicForHtmlRoutes(publicDir) {
  let exemptRoutes = [];
  if (!fs.existsSync(publicDir)) return exemptRoutes;

  function scan(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath);
      } else if (file === 'index.html') {
        // 将绝对路径转换为路由路径，例如：
        // /Users/xxx/.vuepress/public/index.html -> /
        // /Users/xxx/.vuepress/public/demo/index.html -> /demo/
        let routePath = fullPath
          .replace(publicDir, '') // 剥离 base 路径
          .replace(/\\/g, '/')     // 兼容 Windows 路径
          .replace(/\/index\.html$/, '/'); // 将 index.html 替换为 /
        
        if (routePath === '/index.html') routePath = '/';
        exemptRoutes.push(routePath);
      }
    }
  }
  
  scan(publicDir);
  return exemptRoutes;
}

// Theme API.
module.exports = (options, ctx) => {
  const { sourceDir, themeConfig, siteConfig } = ctx

  // base路径
  base = siteConfig.base || ''

  const publicPath = path.resolve(ctx.sourceDir || process.cwd(), '.vuepress/public'); 
  const exemptRoutes = scanPublicForHtmlRoutes(publicPath);
  console.log('✅ 已扫描到以下物理 HTML 路由进行豁免:', exemptRoutes);

  // 自动设置front matter
  setFrontmatter(sourceDir, themeConfig)

  // 自动生成结构化侧边栏
  const sidebar = themeConfig.sidebar
  if (sidebar === 'structuring' || sidebar && sidebar.mode === 'structuring') {
    const collapsable = themeConfig.sidebar.collapsable === false ? false : true
    const sidebarData = getSidebarData(sourceDir, collapsable)
    if (sidebarData) {
      themeConfig.sidebar = sidebarData
      log(chalk.blue('tip ') + chalk.green('add sidebar data. 成功生成侧边栏数据。'))
    } else {
      themeConfig.sidebar = 'auto'
      log(chalk.yellow('warning: fail to add sidebar data, switch to "auto". 未能添加侧边栏数据，将切换为“auto”。'))
    }
  }

  // 分类页
  if (themeConfig.category !== false) {
    createPage(sourceDir, 'categoriesPage')
  } else {
    deletePage(sourceDir, 'categoriesPage')
  }

  // 标签页
  if (themeConfig.tag !== false) {
    createPage(sourceDir, 'tagsPage')
  } else {
    deletePage(sourceDir, 'tagsPage')
  }

  // 归档页
  if (themeConfig.archive !== false) {
    createPage(sourceDir, 'archivesPage')
  } else {
    deletePage(sourceDir, 'archivesPage')
  }

  const enableSmoothScroll = themeConfig.smoothScroll === true

  return {
    alias() {
      return {}
    },

    define() {
      return {
        __EXEMPT_ROUTES__: JSON.stringify(exemptRoutes)
      }
    },

    plugins: [
      (options, context) => ({
        name: 'my-internal-plugin',
        
        /**
         * @param {Config} config 
         */
        chainMarkdown(config) {
          removePlugin(config, PLUGINS.HIGHLIGHT_LINES)
          removePlugin(config, PLUGINS.PRE_WRAPPER)
          removePlugin(config, PLUGINS.SNIPPET)
          config
            .plugin('taskLists')
              .use(MarkdownItTaskLists, [Object.assign({
                label: true,
                enabled: true
              })])
              .end()
            .plugin('prismjs')
              .use(markdownItPrism, [Object.assign({
                highlightInlineCode: false,
                plugins: ['diff-highlight', 'autolinker'],
                init(prism) {
                  Object.keys(prism.languages).forEach(lang => {
                    if (!lang.startsWith('diff-') && prism.languages[lang] && prism.languages.diff) {
                      prism.languages[`diff-${lang}`] = prism.languages.diff
                    }
                  })
                },
              })])
              .end()
            .plugin(PLUGINS.PRE_WRAPPER)
              .use(codeBlockWrapper)
              .end()
        }

      }),
      ['@vuepress/active-header-links', options.activeHeaderLinks],
      '@vuepress/plugin-nprogress',
      ['smooth-scroll', enableSmoothScroll],

      ['container', {
        type: 'note',
        defaultTitle: {
          '/': '笔记',
          '/en/': 'NOTE'
        }
      }],
      ['container', {
        type: 'tip',
        defaultTitle: {
          '/': '提示',
          '/en/': 'TIP'
        }
      }],
      ['container', {
        type: 'warning',
        defaultTitle: {
          '/': '注意',
          '/en/': 'WARNING'
        }
      }],
      ['container', {
        type: 'danger',
        defaultTitle: {
          '/': '警告',
          '/en/': 'WARNING'
        }
      }],
      ['container', {
        type: 'right',
        defaultTitle: ''
      }],
      ['container', {
        type: 'theorem',
        before: info => `<div class="custom-block theorem"><p class="title">${info}</p>`,
        after: '</div>'
      }],
      ['container', {
        type: 'details',
        before: info => `<details class="custom-block details">${info ? `<summary>${info}</summary>` : ''}\n`,
        after: () => '</details>\n',
        defaultTitle: {
          '/': '点击查看',
          '/en/': 'DETAILS'
        }
      }],
      ['container', {
        type: 'detail',
        before: info => `<details class="custom-block details details1">${info ? `<summary>${info}</summary>` : ''}\n`,
        after: () => '</details>\n',
        defaultTitle: {
          '/': '点击查看',
          '/en/': 'DETAILS'
        }
      }],

      // 内容居中容器
      ['container', {
        type: 'center',
        before: info => `<div class="center-container">`,
        after: () => '</div>'
      }],

      // 卡片列表
      [
        'container',
        {
          type: CARD_LIST,
          render: (tokens, idx) => {
            // tokens 是整个md文件的虚拟dom结构数组
            // idx 是tokens中':::' 所在的索引，而且是当前指定type的':::'，分别有开始和结束两次的idx
            // if (tokens[idx].nesting === 1) { // 开头的 ':::' 标记
            // } else { // 结束的 ':::' 标记
            // }
            // 注意：修改这里面的代码后需要在md文件保存一下才会重新执行渲染
            return renderCardList(tokens, idx, CARD_LIST)
          }
        },
      ],

      // 图文卡片列表
      [
        'container',
        {
          type: CARD_IMG_LIST,
          render: (tokens, idx) => {
            return renderCardList(tokens, idx, CARD_IMG_LIST)
          }
        },
      ],


    ]
  }
}

function codeBlockWrapper(md) {
  const wrap = (wrapped) => (...args) => {
    const [tokens, idx] = args
    const token = tokens[idx]
    const rawCode = wrapped(...args)
    const lang = getCodeLang(token.info)
    const langClass = lang ? `language-${lang}` : 'language-text'
    const displayLang = escapeHtml(normalizeDisplayLang(lang))

    return `<!--beforebegin--><div class="${langClass} extra-class line-numbers-mode">`
      + `<!--afterbegin--><span class="code-lang">${displayLang}</span>${rawCode}<!--beforeend--></div><!--afterend-->`
  }
  const { fence, code_block: codeBlock } = md.renderer.rules
  md.renderer.rules.fence = wrap(fence)
  md.renderer.rules.code_block = wrap(codeBlock)
}

function getCodeLang(info = '') {
  let code = (info.trim().split(/\s+/)[0] || 'text').replace(/\{.*$/, '')
  if (code.startsWith('diff-')) {
    return code.substring(5).toLowerCase();
  } else {
    return code.toLowerCase()
  }
}

function normalizeDisplayLang(lang) {
  if (!lang) return 'text'
  const aliases = {
    javascript: 'js',
    typescript: 'ts',
    markup: 'html',
    markdown: 'md',
    ruby: 'rb',
    python: 'py',
    bash: 'sh'
  }
  return aliases[lang] || lang
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&' + 'amp;')
    .replace(/"/g, '&' + 'quot;')
    .replace(/</g, '&' + 'lt;')
    .replace(/>/g, '&' + 'gt;')
}

// 渲染md容器的卡片列表
function renderCardList(tokens, idx, type) {
  const END_TYPE = `container_${type}_close`,
    _tokens$idx = tokens[idx],
    nesting = _tokens$idx.nesting,
    info = _tokens$idx.info;

  if (nesting === 1) { // 渲染开头的 ':::' 标记
    let yamlStr = '';

    for (let i = idx; i < tokens.length; i++) {
      let _tokens$i = tokens[i],
        type = _tokens$i.type,
        content = _tokens$i.content,
        _info = _tokens$i.info;
      if (type === END_TYPE) break; // 遇到结束的 ':::' 时
      if (!content) continue;
      if (type === 'fence' && _info === 'yaml') { // 是代码块类型，并且是yaml代码
        yamlStr = content
      }
    }

    if (yamlStr) { // 正确解析出yaml字符串后
      const dataObj = yaml.safeLoad(yamlStr) // 将yaml字符串解析成js对象
      let dataList = []
      let config = {}

      if (dataObj) { // 正确解析出数据对象
        if (Array.isArray(dataObj)) {
          dataList = dataObj
        } else {
          config = dataObj.config
          dataList = dataObj.data
        }
      }

      if (dataList && dataList.length) { // 有列表数据

        // 每行显示几个
        let row = Number(info.split(' ').pop())
        if (!row || row > 4 || row < 1) {
          row = 3 // 默认 3
        }

        let listDOM = ''
        if (type === CARD_LIST) { // 普通卡片列表
          listDOM = getCardListDOM(dataList, row, config)
        } else if (type === CARD_IMG_LIST) { // 卡片图片列表
          listDOM = getCardImgListDOM(dataList, row, config)
        }

        return `<div class="${type}Container"><div class="card-list">${listDOM}</div>`
      }
    }
  } else { // 渲染':::' 结尾
    return '</div>'
  }
}


// 将数据解析成DOM结构 - 普通卡片列表
function getCardListDOM(dataList, row, config) {
  const { target = '_blank' } = config
  let listDOM = ''
  dataList.forEach(item => {
    listDOM += `
      <${item.link ? 'a href="' + withBase(item.link) + '" target="' + target + '"' : 'span'} class="card-item ${row ? 'row-' + row : ''}"
         style="${item.bgColor ? 'background-color:' + item.bgColor + ';--randomColor:' + item.bgColor + ';' : '--randomColor: var(--bodyBg);'}${item.textColor ? 'color:' + item.textColor + ';' : ''}"
      >
        ${item.avatar ? '<img src="' + withBase(item.avatar) + '" class="no-zoom">' : ''}
        <div>
          <p class="name">${item.name}</p>
          <p class="desc">${item.desc}</p>
        </div>
      </${item.link ? 'a' : 'span'}>
    `
  })
  return listDOM
}


// 将数据解析成DOM结构 - 图文卡片列表
function getCardImgListDOM(dataList, row, config) {
  const { imgHeight = 'auto', objectFit = 'cover', lineClamp = 1, target = '_blank' } = config

  let listDOM = ''
  dataList.forEach(item => {
    listDOM += `
      <div class="card-item ${row ? 'row-' + row : ''}" >
        <a href="${withBase(item.link)}" target="${target}">
          <div class="box-img" style="height: ${imgHeight}">
              <img src="${withBase(item.img)}" class="no-zoom" style="object-fit: ${objectFit}">
          </div>
          <div class="box-info">
              <p class="name">${item.name}</p>
              ${item.desc ? `<p class="desc" style="-webkit-line-clamp: ${lineClamp}">${item.desc}</p>` : ''}
          </div>

          ${item.avatar || item.author ? `<div class="box-footer">
              ${item.avatar ? `<img src="${withBase(item.avatar)}" class="no-zoom">` : ''}
              ${item.author ? `<span>${item.author}</span>` : ''}
          </div>`: ''}
        </a>
      </div>
    `
  })
  return listDOM
}

// 添加base路径
function withBase(path) {
  if (!path) return '';
  if (base && path.charAt(0) === '/') {
    return base + path.slice(1);
  } else {
    return path;
  }
}
