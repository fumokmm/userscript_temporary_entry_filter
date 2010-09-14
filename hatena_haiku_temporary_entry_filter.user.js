// ==UserScript==
// @name           temporary_entry_filter
// @namespace      http://d.hatena.ne.jp/fumokmm/
// @description    add temporary entry filter for Hatena Haiku
// @include        http://h.hatena.ne.jp/*
// @include        http://h.hatena.com/*
// @author         fumokmm
// @date           2009-05-21
// @version        0.03
// ==/UserScript==

(function() {

	// --------------------------------------------------------------
	// 定数定義

	// IDのプレフィックス
	var ID_PREFIX     = '___ENTRY_FILTER_BUTTON___';
	var startIdPrefix = new RegExp('^' + ID_PREFIX);

	// 開くアイコン
	var ICON_ENTRY_OPEN  = [ 'data:image/png;base64,',
	    'iVBORw0KGgoAAAANSUhEUgAAAA0AAAALCAIAAAAr0JA2AAAAaklEQVR4nGP4jwE2Z7diCjIxoIIt',
	    'OW1wEhkwYSrCZKOowzQDWYTx////WOV8plThtBcPIFYdC7Ij0OxCcd/m7Fb75CgGBgY2CQF2SQFk',
	    'dT+ff/j14gMDA8PBuctY4KIQIWSALMICUU7QfQA7NkxqR+oohAAAAABJRU5ErkJggg=='
	].join("");

	// 閉じるアイコン
	var ICON_ENTRY_CLOSE = [ 'data:image/png;base64,',
	    'iVBORw0KGgoAAAANSUhEUgAAAA0AAAALCAIAAAAr0JA2AAAAf0lEQVR4nIVQsQ2AMAxzUc/jk3IB',
	    'e7mgKysPlAd4gBfYYAQxwWQGpAilBTLFjuPIMSSRVF810pehBlB8iwRqnRJJ2Swr51793haM5Mhe',
	    'FNcipbKMVS8Q+OwBIDq/j9M+Tse8HvNKMjpP8ob3KDqvc5zLVob6XDbFWwBD2/2FxgXfrklKbTsl',
	    '1AAAAABJRU5ErkJggg=='
	].join("");

	// --------------------------------------------------------------
	// 変数定義

	// ステータスごとにどの番号をつけたか保持しておく
	var statusIdNumMap = {};

	// --------------------------------------------------------------
	// メイン処理

	/**
	 * メイン処理
	 */
	var main = function(nodes) {
		var nowTime = new Date().getTime(); // 現在時刻のシリアル値

		nodes.forEach(function(node){
			var titles = xpath("descendant-or-self::div[@class='entry']/div[@class='list-body']/h2[@class='title']", node);
			var num = 0;

			titles.forEach(function(titleNode) {

				// キーワードタイトル
				var title = getTitle(titleNode);

				// 閉じるアイコン
				var icon_close          = document.createElement('img');
				icon_close.id           = toCloseId(num, nowTime);
				icon_close.src          = ICON_ENTRY_CLOSE;
				icon_close.style.cursor = 'pointer';
				icon_close.style.margin = '0px 5px';
				icon_close.addEventListener('click',  function() {
					closeTitle(title);
					addFilterKeyword(title);
				}, false);

				// 開くアイコン
				var icon_open           = document.createElement('img');
				icon_open.id            = toOpenId(num, nowTime);
				icon_open.src           = ICON_ENTRY_OPEN;
				icon_open.style.cursor  = 'pointer';
				icon_open.style.margin  = '0px 5px';
				icon_open.style.display = 'none';
				icon_open.addEventListener('click',  function() {
					openTitle(title);
					removeFilterKeyword(title);
				}, false);

				// アイコンが追加されていなければ追加する
				var iconId = titleNode.firstChild.getAttribute('id');
				if ( iconId == null || iconId.search(startIdPrefix) < 0) {
					if (typeof(statusIdNumMap[title]) == 'undefined') {
						statusIdNumMap[title] = [];
					}

					statusIdNumMap[title].push({'num': num++, 'nowTime': nowTime});
					titleNode.insertBefore(icon_open,  titleNode.firstChild);
					titleNode.insertBefore(icon_close, titleNode.firstChild);
				}
			});

			// キーワードすべてについてフィルタを適用してまわる
			applyFilterByKeyword(loadFilterKeyword())
		});
	}

	//メイン処理を実行
	main([document]);

	// AutoPagerizeで継ぎ足されたページでもメイン処理を実行できるように登録
	// (by http://os0x.g.hatena.ne.jp/os0x/20080131/1201762604)
	setTimeout(function() {
		if (window.AutoPagerize && window.AutoPagerize.addFilter) {
			window.AutoPagerize.addFilter(main);
		} else {
			window.addEventListener('GM_AutoPagerizeLoaded', function(){
				window.AutoPagerize.addFilter(main);
			}, false);
		}
	}, 0);

	// --------------------------------------------------------------
	// メイン処理から呼ばれる関数

	/**
	 * 開くボタンのIDへ変換
	 * @param num     番号
	 * @param nowTime 現在時刻のシリアル値
	 */
	function toOpenId(num, nowTime) {
		return ID_PREFIX + nowTime  + '_' + num + '_open';
	}

	/**
	 * 閉じるボタンのIDへ変換
	 * @param num     番号
	 * @param nowTime 現在時刻のシリアル値
	 */
	function toCloseId(num, nowTime) {
		return ID_PREFIX + nowTime  + '_' + num + '_close';
	}

	/**
	 * キーワードすべてについてフィルタを適用してまわる
	 * @param keywordList キーワードリスト
	 */
	function applyFilterByKeyword(keywordList) {
		for (var i = 0; i < keywordList.length; i++) {
			var keyword = keywordList[i];
			if (keyword == null) continue;
			for (key in statusIdNumMap) {
				if (key == keyword) {
					closeTitle(keyword);
					break;
				}
			}
		}
	}

	/**
	 * ノードのタイトル(キーワード)を取得する
	 * @param node ノード
	 */
	function getTitle(node) {
		// ===========NOTE===========
		// NodeType 1 : 要素
		// NodeType 3 : テキストノード
		// ===========NOTE===========

		var children = node.childNodes;
		for (var i = 0; i < children.length; i++) {
			if (children[i].nodeType == 1 && children[i].nodeName == 'A') {
				// プロフィール画像などが入るとテキストノードでない場合があるため
				if (children[i].firstChild.nodeType == 3) {
					return children[i].firstChild.nodeValue;
				}
			}
		}
	}

	/**
	 * キーワードタイトルを閉じる
	 * @param titleName 閉じるキーワードタイトル名
	 */
	function closeTitle(titleName) {
		statusIdNumMap[titleName].forEach(function(it) {
			var openBtn  = document.getElementById(toOpenId (it.num, it.nowTime));
			var closeBtn = document.getElementById(toCloseId(it.num, it.nowTime));
			closeBtn.style.display = 'none';
			openBtn.style.display  = 'inline';

			// 一つ親の子要素のうち、クラスがbodyのものを取得する
			for (var titleBody = closeBtn.parentNode.nextSibling.nextSibling;
				titleBody != null; titleBody = titleBody.nextSibling) {
				if (titleBody.className == 'body' ) {
					titleBody.style.display = 'none'; // noneにして消す
					break;
				}
			}

			// entryBodyを半透明にしておく
			var entryBody = closeBtn.parentNode.parentNode.parentNode;
			entryBody.style.opacity = "0.5";
		})
	}

	/**
	 * キーワードタイトルを開く
	 * @param titleName 開くキーワードタイトル名
	 */
	function openTitle(titleName) {
		statusIdNumMap[titleName].forEach(function(it) {
			var openBtn  = document.getElementById(toOpenId (it.num, it.nowTime));
			var closeBtn = document.getElementById(toCloseId(it.num, it.nowTime));
			openBtn.style.display  = 'none';
			closeBtn.style.display = 'inline';

			// 一つ親の子要素のうち、クラスがbodyのものを取得する
			for (var titleBody = closeBtn.parentNode.nextSibling.nextSibling;
				titleBody != null; titleBody = titleBody.nextSibling) {
				if (titleBody.className == 'body' ) {
					titleBody.style.display = 'block'; // blockにして再表示
					break;
				}
			}

			// entryBodyを不透明にしておく
			var entryBody = closeBtn.parentNode.parentNode.parentNode;
			entryBody.style.opacity = "1.0";
		})
	}

	/**
	 * フィルタキーワードにキーワードを追加する
	 * @param keyword 追加するキーワード
	 */
	function addFilterKeyword(keyword) {
		var storedList = loadFilterKeyword();
		for (var i = 0; i < storedList.length; i++) {
			if (storedList[i] == keyword) {
				return;
			}
		}
		storedList.push(keyword);
		saveFilterKeyword(storedList);
	}

	/**
	 * フィルタキーワードからキーワードを削除する
	 * @param keyword 削除するキーワード
	 */
	function removeFilterKeyword(keyword) {
		var storedList = loadFilterKeyword();
		var newList = [];
		for (var i = 0; i < storedList.length; i++) {
			if (storedList[i] != keyword) {
				newList.push(storedList[i]);
			}
		}
		saveFilterKeyword(newList);
	}

	// --------------------------------------------------------------
	// Greasemonkey依りの関数

	/**
	 * 永続化されたキーワードのリストを取得
	 */
	function loadFilterKeyword() {
		return eval(GM_getValue('filterKeyword', '([])')) || [];
	}

	/**
	 * フィルタキーワードの永続化
	 * @param keywordList 永続化するキーワードのリスト
	 */
	function saveFilterKeyword(keywordList) {
		GM_setValue('filterKeyword', keywordList.toSource());
	}

	// --------------------------------------------------------------
	// XPath処理の関数

	/**
	 * XPathを便利に扱う関数 (by http://yamanoue.sakura.ne.jp/blog/coding/68)
	 * @param query
	 * @param context
	 */
	function xpath(query, context) {
	    context || (context = document);
		var results = document.evaluate(query, context, null,
			XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		var nodes = [];
		for (var i = 0; i < results.snapshotLength; i++) {
			nodes.push(results.snapshotItem(i));
		}
		return nodes;
	}

	// --------------------------------------------------------------

})()
