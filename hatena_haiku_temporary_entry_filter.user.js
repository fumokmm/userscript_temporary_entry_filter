// ==UserScript==
// @name           temporary-entry-filter
// @namespace      http://d.hatena.ne.jp/fumokmm/
// @description    add temporary entry filter for Hatena Haiku
// @include        http://h.hatena.ne.jp/*
// @author         fumokmm
// @date           2009-05-17
// @version        0.01
// ==/UserScript==

var ICON_ENTRY_OPEN  = [ 'data:image/png;base64,',
    'iVBORw0KGgoAAAANSUhEUgAAAA0AAAALCAIAAAAr0JA2AAAAaklEQVR4nGP4jwE2Z7diCjIxoIIt',
    'OW1wEhkwYSrCZKOowzQDWYTx////WOV8plThtBcPIFYdC7Ij0OxCcd/m7Fb75CgGBgY2CQF2SQFk',
    'dT+ff/j14gMDA8PBuctY4KIQIWSALMICUU7QfQA7NkxqR+oohAAAAABJRU5ErkJggg=='
].join("")

var ICON_ENTRY_CLOSE = [ 'data:image/png;base64,',
    'iVBORw0KGgoAAAANSUhEUgAAAA0AAAALCAIAAAAr0JA2AAAAf0lEQVR4nIVQsQ2AMAxzUc/jk3IB',
    'e7mgKysPlAd4gBfYYAQxwWQGpAilBTLFjuPIMSSRVF810pehBlB8iwRqnRJJ2Swr51793haM5Mhe',
    'FNcipbKMVS8Q+OwBIDq/j9M+Tse8HvNKMjpP8ob3KDqvc5zLVob6XDbFWwBD2/2FxgXfrklKbTsl',
    '1AAAAABJRU5ErkJggg=='
].join("")

var ID_PREFIX = '_FILTER_ENTRY_BUTTON_'

var statusIdNumMap = {}

var titles = xpath("//div[@class='entry']/div[@class='list-body']/h2[@class='title']")
var num = 0
titles.forEach(function(titleNode){
	var title = getTitle(titleNode)
	var icon_close          = document.createElement('img')
	icon_close.id           = ID_PREFIX + 'close' + num
	icon_close.src          = ICON_ENTRY_CLOSE
	icon_close.style.cursor = 'pointer'
	icon_close.style.margin = '0px 5px'
	icon_close.addEventListener('click',  function() {
		closeTitle(title)
		addFilterKeyword(title)
	}, false)

	var icon_open           = document.createElement('img')
	icon_open.id            = ID_PREFIX + 'open' + num
	icon_open.src           = ICON_ENTRY_OPEN
	icon_open.style.cursor  = 'pointer'
	icon_open.style.margin  = '0px 5px'
	icon_open.style.display = 'none'
	icon_open.addEventListener('click',  function() {
		openTitle(title)
		removeFilterKeyword(title)
	}, false)

	if (typeof(statusIdNumMap[title]) == 'undefined') {
		statusIdNumMap[title] = []
	}
	statusIdNumMap[title].push(num++)
	titleNode.insertBefore(icon_open,  titleNode.firstChild)
	titleNode.insertBefore(icon_close, titleNode.firstChild)
})

function getTitle(node) {
	var children = node.childNodes
	for (var i = 0; i < children.length; i++) {
		if (children[i].nodeType == 1 && children[i].nodeName == 'A') {
			return children[i].firstChild.nodeValue
		}
	}
}

applyFilterByKeyword(loadFilterKeyword())
function applyFilterByKeyword(keywordList) {
	for (var i = 0; i < keywordList.length; i++) {
		var keyword = keywordList[i]
		if (keyword == null) continue
		for (key in statusIdNumMap) {
			if (key == keyword) {
				closeTitle(keyword)
				break
			}
		}
	}
}

function closeTitle(titleName) {
	statusIdNumMap[titleName].forEach(function(num){
		var openBtn  = document.getElementById(ID_PREFIX + 'open'  + num)
		var closeBtn = document.getElementById(ID_PREFIX + 'close' + num)
		closeBtn.style.display = 'none'
		openBtn.style.display  = 'inline'

		// 一つ親の子要素のうち、クラスがbodyのものを取得する
		var titleBody = openBtn.parentNode.nextSibling.nextSibling
		if (titleBody.className == 'body') {
			titleBody.style.display = 'none'
		} else {
			titleBody = titleBody.nextSibling
			if (titleBody.className == 'body') {
				titleBody.style.display = 'none'
			}
		}
	})
}

function openTitle(titleName) {
	statusIdNumMap[titleName].forEach(function(num){
		var openBtn  = document.getElementById(ID_PREFIX + 'open'  + num)
		var closeBtn = document.getElementById(ID_PREFIX + 'close' + num)
		openBtn.style.display  = 'none'
		closeBtn.style.display = 'inline'

		// 一つ親の子要素のうち、クラスがbodyのものを取得する
		var titleBody = closeBtn.parentNode.nextSibling.nextSibling
		if (titleBody.className == 'body') {
			titleBody.style.display = 'block'
		} else {
			titleBody = titleBody.nextSibling
			if (titleBody.className == 'body') {
				titleBody.style.display = 'block'
			}
		}
	})
}

function addFilterKeyword(keyword) {
	var storedList = loadFilterKeyword()
	for (var i = 0; i < storedList.length; i++) {
		if (storedList[i] == keyword) {
			return
		}
	}
	storedList.push(keyword)
	saveFilterKeyword(storedList)
}

function removeFilterKeyword(keyword) {
	var storedList = loadFilterKeyword()
	var newList = []
	for (var i = 0; i < storedList.length; i++) {
		if (storedList[i] != keyword) {
			newList.push(storedList[i])
		}
	}
	saveFilterKeyword(newList)
}

// --------------------------------------------------------------

function loadFilterKeyword() {
	return eval(GM_getValue('filterKeyword', '([])')) || []
}

function saveFilterKeyword(keywordList) {
	GM_setValue('filterKeyword', keywordList.toSource())
}

// xpath
function xpath(query) {
	var results = document.evaluate(query, document, null,
		XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null)
	var nodes = []
	for (var i = 0; i < results.snapshotLength; i++) {
		nodes.push(results.snapshotItem(i))
	}
	return nodes
}

// --------------------------------------------------------------
