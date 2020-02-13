// Settings

const Shortcuts = {
	"mosaic": "ctrl+ctrl+ctrl"
};

// Consts

const UITags = ['input', 'textarea'];
const ExpSep = /[ \t\r　，。‘’“”《》【】：；—（）￥！？、<>\(\)\[\]\{\}\.,\\\/\?!\&\-\+=$@#`~·…\d的地得a-zA-Z]/gi;

// Common Functions

const wait = () => new Promise(res => setTimeout(res, 0));
const now = () => Date.now();

// Clipboard

const PastePad = document.createElement('div');
PastePad.style.display = 'block';
PastePad.style.opacity = '0';
PastePad.style.position = 'absolute';
document.body.appendChild(PastePad);

// Shortcuts

const ShortcutMap = {};
Object.keys(Shortcuts).forEach(name => {
	var keys = Shortcuts[name];
	if (!(keys instanceof Array)) keys = keys.split('+');
	keys = keys.map(key => key.trim().toLowerCase()).filter(key => key.length > 0).join('+');
	Shortcuts[name] = keys;
	ShortcutMap[keys] = name;
});

const ShortcutManager = {};
const RegiestShortcut = (event, callback) => ShortcutManager[event] = callback;

const ShortcutDelay = 300;
const ShortcutMin = 2;
const ShortcutMax = 5;
const KeyChain = [];
var lastKeyTime = 0;
document.body.addEventListener("keydown", evt => {
	var stamp = now();
	if (stamp - lastKeyTime > ShortcutDelay) KeyChain.splice(0, KeyChain.length);
	lastKeyTime = stamp;
	var key = evt.key.toLowerCase();
	if (key === 'control') key = 'ctrl';
	KeyChain.push(key);
	if (KeyChain.length > ShortcutMax) KeyChain.splice(0, KeyChain.length - ShortcutMax);
});
document.body.addEventListener("keyup", evt => {
	var max = KeyChain.length;
	if (max < ShortcutMin) return;

	var keys = KeyChain[max - 1];
	for (let i = 2; i < ShortcutMin; i ++) {
		keys = KeyChain[max - i] + '+' + keys;
	}
	for (let i = ShortcutMin; i <= max; i ++) {
		keys = KeyChain[max - i] + '+' + keys;
		let action = ShortcutMap[keys];
		if (!!action) {
			KeyChain.splice(0, KeyChain.length);
			let cb = ShortcutManager[action];
			if (!!cb) cb();
			break;
		}
	}
});

// Text-Mosaic

const randomize = list => {
	var len = list.length;
	if (len <= 3) return list;
	var bra = list.substr(0, 1), ket = list.substr(len - 1, 1), mid = list.substring(1, len - 1);
	len -= 2;
	var ready = [];
	for (let i = 0; i < len; i ++) ready.push(i);
	var parts = [];
	for (let i = 0; i < len; i ++) {
		let k = Math.floor(Math.random() * ready.length);
		parts.push(ready.splice(k, 1)[0]);
	}
	var result = '';
	for (let i = 0; i < len; i ++) result += mid.substr(parts[i], 1);
	return bra + result + ket;
};
const findElement = () => {
	var ele = document.activeElement;
	if (ele.isContentEditable) return ele;
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
		content = '<p>' + content.split('\n').join('</p><p>') + '</p>';
		PastePad.innerHTML = content;
		let temp = document.createRange();
		temp.selectNodeContents(PastePad);
		selection.removeAllRanges();
		selection.addRange(temp);
		await wait();
		document.execCommand('copy');
		await wait();
		selection.removeAllRanges();
		selection.addRange(range);
		document.execCommand('paste');
		PastePad.innerHTML = '';
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

var Mosaic1 = () => {
	var ele = findElement();

	var content = getContent(ele);
	content = content.split('\n').map(line => {
		var result = '';
		var parts = line.split(ExpSep);
		parts.forEach(l => {
			var len = l.length;
			if (len > 0) l = randomize(l);
			var sep = line.substr(result.length + len, 1);
			result = result + l + sep;
		});
		result = result.replace(/[a-zA-Z]+/gi, match => {
			return randomize(match);
		});
		return result;
	});
	content = content.join('\n');

	setContent(ele, content);
};

const Actions = {
	"1": Mosaic1,
};
var lastAction = '1';

chrome.runtime.onMessage.addListener(msg => {
	if (msg.action !== "launch") return;
	var action = Actions[msg.level || '1'];
	if (!action) return;
	lastAction = msg.level;
	action();
});

RegiestShortcut('mosaic', () => {
	var action = Actions[lastAction];
	if (!action) return;
	action();
});