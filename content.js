// Consts

const UITags = ['input', 'textarea'];

// Text-Mosaic

const findElement = root => {
	var ele = root.activeElement;
	if (ele.tagName.toLowerCase() === 'iframe') {
		return findElement(ele.contentDocument);
	}
	else if (ele.isContentEditable) return ele;
	if (UITags.includes(ele.tagName.toLowerCase())) return ele;
	return null;
};
const getContent = ele => {
	var isEditable = true;
	if (UITags.includes(ele.tagName.toLowerCase())) isEditable = false;

	var content = '';
	if (isEditable) {
		let selection = document.getSelection();
		let range = selection.getRangeAt(0);
		content = range.toString().trim();
		if (content.length === 0) {
			content = ele.innerText;
		}
	} else {
		let text = ele.value.toString();
		if (ele.selectionStart === ele.selectionEnd) {
			content = text;
		} else {
			content = text.substring(ele.selectionStart, ele.selectionEnd);
		}
	}

	return content;
};
const setContent = async (ele, content) => {
	var isEditable = true;
	if (UITags.includes(ele.tagName.toLowerCase())) isEditable = false;

	if (isEditable) {
		let selection = document.getSelection();
		let range = selection.getRangeAt(0);
		if (range.toString().trim().length === 0) {
			range.selectNodeContents(ele);
		}

		await navigator.clipboard.writeText(content);
		document.execCommand('paste');
	} else {
		let start = ele.selectionStart, end = ele.selectionEnd;
		if (start === end) {
			ele.value = content;
		} else {
			let text = ele.value.toString();
			let bra = text.substring(0, start), ket = text.substring(end, text.length);
			ele.value = bra + content + ket;
		}
		ele.selectionStart = start;
		ele.selectionEnd = end;
	}
};

const Actions = { rearrange: true };
syncstore.get('MosaicType', option => {
	Actions.replace = option.replace;
	Actions.rearrange = option.rearrange;
	Actions.encrypt = option.encrypt;
});

const ToggleMosaic = async () => {
	var ele = findElement(document);
	if (!ele) return;

	var content = getContent(ele).trim();
	if (content.length === 0) return;

	chrome.runtime.sendMessage({ 'event': 'TextMosaic', content }, content => {
		setContent(ele, content);
	});
};

chrome.runtime.onMessage.addListener(msg => {
	if (msg.action === 'launch') {
		Actions.replace = !! msg.option.replace;
		Actions.rearrange = !! msg.option.rearrange;
		Actions.encrypt = !! msg.option.encrypt;

		ToggleMosaic();
	}
});

RegiestKeySeq('ctrl+ctrl+ctrl', ToggleMosaic);

const RegTarget = /[a-zA-Z0-9\+=]{10,}/g;
const TargetTag = ['div', 'p', 'span', 'article', 'section', 'blockquote'];
const findTargets = root => {
	[].forEach.call(root.children, ele => {
		if (!TargetTag.includes(ele.tagName.toLowerCase())) return;
		if (ele.children.length === 0) {
			let text = ele.innerHTML.replace(/^[ \n\r\t]+/gi, '').replace(/[ \n\r\t]+$/gi, '');
			if (text.length === 0) return;
			let match = text.match(RegTarget);
			if (!match) return;
			let tasks = match.length;
			if (tasks === 0) return;
			let map = {};
			match.forEach(reg => {
				chrome.runtime.sendMessage({ 'event': 'SimpleDecrypt', content: reg }, content => {
					if (!!content) {
						let codes = content.split('').map(w => w.charCodeAt(0));
						let notValid = codes.some(c => {
							if (c < 0 || c > 256) return false;
							if (c >= 127 || c < 32) return true;
							return false;
						});
						if (!notValid) map[reg] = content;
					}
					tasks --;
					if (tasks === 0) {
						match.forEach(line => {
							var rep = map[line];
							if (!rep) return;
							while (text.indexOf(line) >= 0) {
								text = text.replace(line, rep);
							}
						});
						ele.innerHTML = text;
					}
				});
			});
			console.log(text, match);
		} else {
			findTargets(ele);
		}
	});
};

syncstore.get('AutoDecrypt', auto => {
	if (auto === undefined) {
		auto = false;
		syncstore.set('AutoDecrypt', false);
	}

	if (auto) findTargets(document.body);
});