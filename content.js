// Consts

const UITags = ['input', 'textarea'];

// Clipboard

const PastePad = document.createElement('div');
PastePad.style.display = 'block';
PastePad.style.opacity = '0';
PastePad.style.position = 'absolute';
document.body.appendChild(PastePad);

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

const Actions = { rearrange: true };
syncstore.get('MosaicType', option => {
	Actions.replace = option.replace;
	Actions.rearrange = option.rearrange;
	Actions.encrypt = option.encrypt;
});

var currentEditor = null;
const ToggleMosaic = async () => {
	var ele = findElement(document);
	if (!ele) return;
	currentEditor = ele;

	var content = getContent(ele).trim();
	if (content.length === 0) return;

	chrome.runtime.sendMessage({ 'event': 'TextMosaic', content });
};

chrome.runtime.onMessage.addListener(msg => {
	if (msg.action === 'launch') {
		Actions.replace = !! msg.option.replace;
		Actions.rearrange = !! msg.option.rearrange;
		Actions.encrypt = !! msg.option.encrypt;

		ToggleMosaic();
	} else if (msg.action === 'mosaic') {
		setContent(currentEditor, msg.content);
	}
});

RegiestKeySeq('ctrl+ctrl+ctrl', ToggleMosaic);