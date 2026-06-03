// 解决代码选项卡无法加载的问题
import Vue from 'vue'
import CodeBlock from "@theme/global-components/CodeBlock.vue"
import CodeGroup from "@theme/global-components/CodeGroup.vue"
// Register the Vue global component
Vue.component(CodeBlock)
Vue.component(CodeGroup)

import Prism from 'prismjs'
import 'prismjs/components/prism-diff'
import 'prismjs/components/prism-batch'
import 'prismjs/plugins/diff-highlight/prism-diff-highlight.js'
import 'prismjs/plugins/match-braces/prism-match-braces.js'

//  注：此文件在浏览器端运行
import postsMixin from '@theme/mixins/posts'
export default ({
  Vue, // VuePress 正在使用的 Vue 构造函数
  options, // 附加到根实例的一些选项
  router, // 当前应用的路由实例
  siteData // 站点元数据
}) => {
  const exemptRoutes = __EXEMPT_ROUTES__ || [];

  router.beforeEach((to, from, next) => {
    if (exemptRoutes.includes(to.path)) {
      window.location.href = to.fullPath;
      return next(false);
    }
    next();
  });

  // 修复ISO8601时间格式为普通时间格式，以及添加作者信息
  siteData.pages.map(item => {
    const { frontmatter: { date, author } } = item
    if (typeof date === 'string' && date.charAt(date.length - 1) === 'Z') {
      item.frontmatter.date = repairUTCDate(date)
    }
    if (author) {
      item.author = author
    } else {
      if (siteData.themeConfig.author) {
        item.author = siteData.themeConfig.author
      }
    }
  })

  // 将对文章数据的处理结果混入Vue实例
  Vue.mixin(postsMixin)
  
  if (typeof window !== 'undefined') {
    router.onReady(() => {
      window.setTimeout(startCodeBlockEnhancer, 0)
    })
    router.afterEach(() => {
      window.setTimeout(scheduleEnhanceCodeBlocks, 0)
    })
  }
}


// 修复ISO8601时间格式为普通时间格式
function repairUTCDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return `${date.getUTCFullYear()}-${zero(date.getUTCMonth() + 1)}-${zero(date.getUTCDate())} ${zero(date.getUTCHours())}:${zero(date.getUTCMinutes())}:${zero(date.getUTCSeconds())}`;
}
// 小于10补0
function zero(d) {
  return d.toString().padStart(2, '0')
}

let codeBlockEnhanceScheduled = false

function startCodeBlockEnhancer() {
  scheduleEnhanceCodeBlocks()
  observeCodeBlockChanges()
  observeCodeCopy()
  window.addEventListener('DOMContentLoaded', scheduleEnhanceCodeBlocks)
  window.addEventListener('load', scheduleEnhanceCodeBlocks)
  window.addEventListener('pageshow', scheduleEnhanceCodeBlocks)

  let runs = 0
  const timer = window.setInterval(() => {
    scheduleEnhanceCodeBlocks()
    runs += 1
    if (runs >= 10 || document.querySelector('div[class*="language-"] > pre')) {
      window.clearInterval(timer)
    }
  }, 120)
}

function scheduleEnhanceCodeBlocks() {
  if (codeBlockEnhanceScheduled) return
  codeBlockEnhanceScheduled = true

  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        codeBlockEnhanceScheduled = false
        enhanceCodeBlocks()
      })
    })
  }, 0)
}

function observeCodeBlockChanges() {
  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.addedNodes.length > 0)) {
      scheduleEnhanceCodeBlocks()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

function enhanceCodeBlocks() {
  document.querySelectorAll('div[class*="language-"] > pre, .tabs-component-panel pre').forEach(pre => {
    if (!isEnhanceableCodeBlock(pre)) return

    try {
      enhanceCodeBlock(pre)
    } catch (error) {
      console.error('[code-block-enhancer] Failed to enhance code block.', error)
    }
  })
}

function enhanceCodeBlock(pre) {
  const code = pre.querySelector(':scope > code')
  if (!code) return

  const lang = normalizeCodeLang(getLanguage(pre, code, pre.parentElement))
  const wrapper = ensureCodeBlockWrapper(pre, lang)
  wrapper.classList.add('line-numbers-mode')
  pre.classList.add(`language-${lang}`)
  code.classList.add(`language-${lang}`)

  highlightCodeBlock(code, lang)

  if (!wrapper.querySelector(':scope > .code-lang')) {
    const langNode = document.createElement('span')
    langNode.className = 'code-lang'
    langNode.textContent = lang
    wrapper.insertBefore(langNode, wrapper.firstChild)
  }

  wrapCodeLines(code)
  ensureCopyButton(wrapper, code)
}

function isEnhanceableCodeBlock(pre) {
  const code = pre.querySelector(':scope > code')

  if (!pre.parentElement || !code) return false
  if (pre.closest('.theme-code-group, .theme-code-block')) return false
  if (pre.closest('.tabs-component-panel')) return isMountedTabCodeBlock(pre)
  if (!pre.parentElement.matches('div[class*="language-"]')) return false
  if (!Array.from(pre.parentElement.classList).some(className => className.indexOf('language-') === 0)) return false

  return true
}

function isMountedTabCodeBlock(pre) {
  const tabs = pre.closest('.tabs-component')
  return !tabs || !!tabs.__vue__
}

function ensureCodeBlockWrapper(pre, lang) {
  if (pre.parentElement.matches('div[class*="language-"]')) {
    pre.parentElement.classList.add(`language-${lang}`, 'extra-class')
    return pre.parentElement
  }

  const wrapper = document.createElement('div')
  wrapper.className = `language-${lang} extra-class`
  pre.parentNode.insertBefore(wrapper, pre)
  wrapper.appendChild(pre)
  return wrapper
}

function highlightCodeBlock(code, lang) {
  if (code.dataset.prismHighlighted === 'true' || code.dataset.lineWrapped === 'true') return

  const grammar = Prism.languages[lang]
  if (grammar) {
    code.innerHTML = Prism.highlight(code.textContent, grammar, lang)
  }
  code.dataset.prismHighlighted = 'true'
}

function getLanguage(...nodes) {
  for (const node of nodes) {
    const className = Array.from(node.classList).find(item => item.indexOf('language-') === 0)
    if (className) return className.replace(/^language-/, '')
  }
  return 'text'
}

function normalizeCodeLang(lang) {
  const aliases = {
    javascript: 'js',
    typescript: 'ts',
    markup: 'html',
    markdown: 'md',
    ruby: 'rb',
    python: 'py',
    bash: 'sh'
  }
  return aliases[lang] || lang || 'text'
}

function wrapCodeLines(code) {
  if (code.dataset.lineWrapped === 'true') return

  const fragment = document.createDocumentFragment()
  const lines = [createCodeLine()]
  Array.from(code.childNodes).forEach(node => {
    appendNodeByLines(node, lines)
  })
  removeTrailingEmptyLine(lines)

  lines.forEach((line, index) => {
    const lineNumber = document.createElement('span')
    lineNumber.className = 'line-number'
    lineNumber.textContent = String(index + 1)
    line.insertBefore(lineNumber, line.firstChild)
    fragment.appendChild(line)
  })

  code.textContent = ''
  code.appendChild(fragment)
  code.dataset.lineWrapped = 'true'
}

function appendNodeByLines(node, lines) {
  splitNodeByLines(node).forEach((lineNode, index) => {
    if (index > 0) {
      lines.push(createCodeLine())
    }
    if (lineNode && canAppendChild(lines[lines.length - 1])) {
      lines[lines.length - 1].appendChild(lineNode)
    }
  })
}

function splitNodeByLines(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.split('\n').map(part => part ? document.createTextNode(part) : null)
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [document.createTextNode(node.textContent || '')]
  }

  if (!canAppendChild(node)) {
    return [node.cloneNode(true)]
  }

  const lineNodes = [node.cloneNode(false)]
  Array.from(node.childNodes).forEach(child => {
    splitNodeByLines(child).forEach((childLine, index) => {
      if (index > 0) {
        lineNodes.push(node.cloneNode(false))
      }
      const currentLine = lineNodes[lineNodes.length - 1]
      if (childLine && canAppendChild(currentLine)) {
        currentLine.appendChild(childLine)
      }
    })
  })
  return lineNodes
}

function canAppendChild(node) {
  return node && node.nodeType === Node.ELEMENT_NODE
    && typeof node.appendChild === 'function'
    && !['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'].includes(node.nodeName)
}

function removeTrailingEmptyLine(lines) {
  if (lines.length > 1 && isCodeLineEmpty(lines[lines.length - 1])) {
    lines.pop()
  }
}

function isCodeLineEmpty(line) {
  return !Array.from(line.childNodes).some(node => node.textContent.length > 0)
}

function createCodeLine() {
  const line = document.createElement('span')
  line.className = 'code-line'
  return line
}

function ensureCopyButton(wrapper, code) {
  wrapper.querySelectorAll('.toolbar, .toolbar-item, .copy-to-clipboard-button, i.code-copy').forEach(node => {
    node.parentNode.removeChild(node)
  })

  let button = wrapper.querySelector(':scope > .code-copy-button')
  if (!button) {
    button = document.createElement('button')
    button.className = 'code-copy-button'
    button.type = 'button'
    button.setAttribute('aria-label', '复制代码')

    const label = document.createElement('span')
    label.textContent = '复制'
    button.appendChild(label)
    wrapper.appendChild(button)
  }

  button.onclick = () => {
    copyText(getCleanCodeText(code))
      .then(() => setCopyState(button, 'copy-success', '已复制!'))
      .catch(() => setCopyState(button, 'copy-error', 'Press Ctrl+C to copy'))
  }
}

function observeCodeCopy() {
  if (document.body.dataset.cleanCodeCopyAttached === 'true') return

  document.body.dataset.cleanCodeCopyAttached = 'true'
  document.addEventListener('copy', event => {
    const selection = window.getSelection()
    const code = getSelectedCodeElement(selection)
    if (!code) return

    event.preventDefault()
    event.clipboardData.setData('text/plain', getCleanSelectionText(selection, code))
  }, true)
}

function getCleanCodeText(code) {
  const lines = code.querySelectorAll(':scope > .code-line')
  if (!lines.length) {
    return getNodeText(code)
  }
  return Array.from(lines).map(line => getNodeText(line)).join('\n')
}

function getSelectedCodeElement(selection) {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null

  const startCode = getClosestCodeElement(selection.anchorNode)
  const endCode = getClosestCodeElement(selection.focusNode)
  return startCode && startCode === endCode ? startCode : null
}

function getClosestCodeElement(node) {
  const element = node && (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement)
  return element && element.closest('pre > code')
}

function getCleanSelectionText(selection, code) {
  if (!code.querySelector(':scope > .code-line')) {
    return getCleanTextFromSelection(selection)
  }
  return getCleanTextFromSelectedLines(selection, code)
}

function getCleanTextFromSelection(selection) {
  const fragment = cloneSelectionFragment(selection)
  removeDecorations(fragment)
  return fragment.textContent
}

function getCleanTextFromSelectedLines(selection, code) {
  const range = selection.getRangeAt(0)
  return Array.from(code.querySelectorAll(':scope > .code-line'))
    .filter(line => range.intersectsNode(line))
    .map(line => getSelectedLineText(line, range))
    .join('\n')
}

function getSelectedLineText(line, range) {
  const lineRange = document.createRange()
  lineRange.selectNodeContents(line)

  if (range.compareBoundaryPoints(Range.START_TO_START, lineRange) > 0) {
    lineRange.setStart(range.startContainer, range.startOffset)
  }
  if (range.compareBoundaryPoints(Range.END_TO_END, lineRange) < 0) {
    lineRange.setEnd(range.endContainer, range.endOffset)
  }

  const fragment = lineRange.cloneContents()
  lineRange.detach()
  removeDecorations(fragment)
  return fragment.textContent
}

function cloneSelectionFragment(selection) {
  const fragment = document.createDocumentFragment()
  for (let index = 0; index < selection.rangeCount; index += 1) {
    fragment.appendChild(selection.getRangeAt(index).cloneContents())
  }
  return fragment
}

function removeDecorations(fragment) {
  fragment.querySelectorAll('.line-number, .token.prefix').forEach(node => {
    node.parentNode.removeChild(node)
  })
}

function getNodeText(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }
  if (node.classList.contains('line-number') || node.classList.contains('prefix')) {
    return ''
  }
  return Array.from(node.childNodes).map(getNodeText).join('')
}

function copyText(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }

  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy') ? resolve() : reject(new Error('Copy failed'))
    } catch (error) {
      reject(error)
    } finally {
      document.body.removeChild(textArea)
    }
  })
}

function setCopyState(button, state, text) {
  const label = button.querySelector('span')
  if (label) {
    label.textContent = text
  }
  button.setAttribute('data-copy-state', state)

  window.setTimeout(() => {
    if (label) {
      label.textContent = '复制'
    }
    button.setAttribute('data-copy-state', 'copy')
  }, 5000)
}
