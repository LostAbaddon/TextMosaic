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
const ToggleSimpleDecryptForSelection = () => {
	var content = document.getSelection();
	content = content.toString().trim();
	if (content.length === 0) return;
	chrome.runtime.sendMessage({ 'event': 'SimpleDecrypt', content }, text => {
		ShowCryption(content, text);
	});
};

var backgroundUI;
var cryptionUI;
const ShowCryption = async (en, de) => {
	if (!backgroundUI || !document.body.hasChildNodes(backgroundUI)) {
		if (!backgroundUI) {
			backgroundUI = newEle('div');
			backgroundUI.style.position = 'fixed';
			backgroundUI.style.display = 'none';
			backgroundUI.style.top = '0';
			backgroundUI.style.bottom = '0';
			backgroundUI.style.left = '0';
			backgroundUI.style.right = '0';
			backgroundUI.style.zIndex = '999999';
			backgroundUI.style.background = 'rgba(0, 0, 0, 0.1)';
			backgroundUI.style.transition = 'opacity 300ms ease-in-out';
			backgroundUI.style.pointerEvents = 'none';
			backgroundUI.addEventListener('click', async () => {
				backgroundUI.style.opacity = '0';
				cryptionUI.style.opacity = '0';
				await wait(300);
				backgroundUI.style.pointerEvents = 'none';
				backgroundUI.style.display = 'block';
				cryptionUI.style.pointerEvents = 'none';
				cryptionUI.style.display = 'block';
			});
		}
		document.body.appendChild(backgroundUI);
	}
	if (!cryptionUI || !document.body.hasChildNodes(cryptionUI)) {
		if (!cryptionUI) {
			cryptionUI = newEle('div');
			cryptionUI.style.position = 'fixed';
			cryptionUI.style.display = 'none';
			cryptionUI.style.zIndex = '1000000';
			cryptionUI.style.top = '50%';
			cryptionUI.style.left = '50%';
			cryptionUI.style.transform = 'translate(-50%, -50%)';
			cryptionUI.style.width = '500px';
			cryptionUI.style.height = '630px';
			cryptionUI.style.background = 'white';
			cryptionUI.style.boxShadow = '2px 2px 3px 3px rgba(53, 53, 53, 0.4)';
			cryptionUI.style.fontSize = '0px';
			cryptionUI.style.pointerEvents = 'none';
			cryptionUI.style.transition = 'opacity 300ms ease-in-out';

			cryptionUI.encryptionUI = newEle('textarea');
			cryptionUI.encryptionUI.style.boxSizing = 'border-box';
			cryptionUI.encryptionUI.style.border = '1px solid rgb(53, 53, 53)';
			cryptionUI.encryptionUI.style.borderRadius = '5px';
			cryptionUI.encryptionUI.style.padding = '5px';
			cryptionUI.encryptionUI.style.margin = '0px';
			cryptionUI.encryptionUI.style.outline = 'none';
			cryptionUI.encryptionUI.style.resize = 'none';
			cryptionUI.encryptionUI.style.width = '100%';
			cryptionUI.encryptionUI.style.height = '300px';
			cryptionUI.encryptionUI.style.fontSize = '14px';
			cryptionUI.appendChild(cryptionUI.encryptionUI);

			cryptionUI.btnEncrypt = newEle('button');
			cryptionUI.btnEncrypt.innerHTML = '编码';
			cryptionUI.btnEncrypt.style.display = 'inline-block';
			cryptionUI.btnEncrypt.style.width = '50%';
			cryptionUI.btnEncrypt.style.height = '30px';
			cryptionUI.btnEncrypt.style.fontSize = '15px';
			cryptionUI.btnEncrypt.style.cursor = 'pointer';
			cryptionUI.btnEncrypt.addEventListener('click', () => {
				chrome.runtime.sendMessage({ 'event': 'TextMosaic', content: cryptionUI.encryptionUI.value }, content => {
					cryptionUI.decryptionUI.value = content;
				});
			});
			cryptionUI.appendChild(cryptionUI.btnEncrypt);

			cryptionUI.btnDecrypt = newEle('button');
			cryptionUI.btnDecrypt.innerHTML = '解码';
			cryptionUI.btnDecrypt.style.display = 'inline-block';
			cryptionUI.btnDecrypt.style.width = '50%';
			cryptionUI.btnDecrypt.style.height = '30px';
			cryptionUI.btnDecrypt.style.fontSize = '15px';
			cryptionUI.btnDecrypt.style.cursor = 'pointer';
			cryptionUI.btnDecrypt.addEventListener('click', () => {
				chrome.runtime.sendMessage({ 'event': 'SimpleDecrypt', content: cryptionUI.encryptionUI.value }, content => {
					cryptionUI.decryptionUI.value = content;
				});
			});
			cryptionUI.appendChild(cryptionUI.btnDecrypt);

			cryptionUI.decryptionUI = newEle('textarea');
			cryptionUI.decryptionUI.style.boxSizing = 'border-box';
			cryptionUI.decryptionUI.style.border = '1px solid rgb(53, 53, 53)';
			cryptionUI.decryptionUI.style.borderRadius = '5px';
			cryptionUI.decryptionUI.style.padding = '5px';
			cryptionUI.decryptionUI.style.margin = '0px';
			cryptionUI.decryptionUI.style.outline = 'none';
			cryptionUI.decryptionUI.style.resize = 'none';
			cryptionUI.decryptionUI.style.width = '100%';
			cryptionUI.decryptionUI.style.height = '300px';
			cryptionUI.decryptionUI.style.fontSize = '14px';
			cryptionUI.appendChild(cryptionUI.decryptionUI);
		}
		document.body.appendChild(cryptionUI);
	}

	cryptionUI.encryptionUI.value = en;
	cryptionUI.decryptionUI.value = de;
	backgroundUI.style.pointerEvents = 'all';
	backgroundUI.style.display = 'block';
	backgroundUI.style.opacity = '0';
	cryptionUI.style.pointerEvents = 'all';
	cryptionUI.style.display = 'block';
	cryptionUI.style.opacity = '0';

	await wait(100);

	backgroundUI.style.opacity = 1;
	cryptionUI.style.opacity = 1;
};

chrome.runtime.onMessage.addListener(msg => {
	if (msg.action === 'launch') {
		Actions.replace = !! msg.option.replace;
		Actions.rearrange = !! msg.option.rearrange;
		Actions.encrypt = !! msg.option.encrypt;

		ToggleMosaic();
	} else if (msg.action === 'SimpleDecryptLaunchFromContextMenu') {
		ToggleSimpleDecryptForSelection();
	}
});

RegiestKeySeq('ctrl+ctrl+ctrl', ToggleMosaic);

// const RegTarget = /[a-zA-Z0-9\+=]{10,}/g;
const RegTarget = new RegExp('[' + BaseX.join('') + ']{10,}', "g");
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
						// let codes = content.split('').map(w => w.charCodeAt(0));
						// let notValid = codes.some((c, i) => {
						// 	if (c < 0 || c > 256) return false;
						// 	if (c >= 127 || (c < 32 && c !== 10 & c !== 13)) return true;
						// 	return false;
						// });
						// if (!notValid) map[reg] = content;
						map[reg] = content;
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

RegiestKeySeq('ctrl+ctrl+ctrl+d', () => {
	findTargets(document.body);
});
RegiestKeySeq('ctrl+ctrl+d', () => {
	ToggleSimpleDecryptForSelection();
});
RegiestKeySeq('ctrl+ctrl+x', () => {
	ShowCryption('', '');
});