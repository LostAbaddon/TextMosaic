const UITags = ['input', 'textarea'];
const ExpSep = /[ \t\r　，。‘’“”《》【】：；—（）￥！？、<>\(\)\[\]\{\}\.,\\\/\?!\&\-\+=$@#`~·…\d的地得a-zA-Z]/gi;

const PastePad = document.createElement('div');
PastePad.style.display = 'block';
PastePad.style.opacity = '0';
PastePad.style.position = 'absolute';
document.body.appendChild(PastePad);

const wait = () => new Promise(res => setTimeout(res, 0));

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

chrome.runtime.onMessage.addListener(msg => {
	if (msg.action !== "launch") return;
	var action = Actions[msg.level || '1'];
	if (!action) return;
	action();
});