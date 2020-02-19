const SensitiveWords = {};

const UpdateSensitiveWords = () => new Promise(res => {
	syncstore.set({'SensitiveWords': SensitiveWords}, res);
});
const UpdatePWD = () => {
	syncstore.set('SimplePassword', pwdUI.value);
};
const addNewItem = async () => {
	var item = document.querySelector('div.item.addnew > input');
	var word = item.value.toString().trim();
	if (word.length === 0) return;
	if (!!SensitiveWords[word]) return;
	SensitiveWords[word] = word;
	await UpdateSensitiveWords();
	generateWordItem(document.querySelector('div.list'), word, true);
	item.value = '';
};
const generateWordItem = (pad, key, focus=false) => {
	var line = document.createElement('div');
	line.classList.add('item');
	line.innerHTML = '<span class="title">' + key + '</span>';

	var input = document.createElement('input');
	input.value = (isString(SensitiveWords[key]) ? [SensitiveWords[key]] : SensitiveWords[key]).join(', ');
	var inputBlur = () => {
		var list = input.value.toString().split(/[, ，] */).map(w => w.trim()).filter(w => w.length > 0);
		var origin = SensitiveWords[key];
		if (isString(origin)) origin = [origin];
		if (origin.join(',') === list.join(',')) return;
		SensitiveWords[key] = list;
		UpdateSensitiveWords();
	};
	var inputChange = evt => {
		if (evt.key.toLowerCase() !== 'enter') return;
		inputBlur();
	};
	input.addEventListener('blur', inputBlur)
	input.addEventListener('keydown', inputChange)
	line.appendChild(input);

	var del = document.createElement('span');
	del.classList.add('btn');
	del.innerHTML = '—';
	var clickDel = async () => {
		delete SensitiveWords[key];
		await UpdateSensitiveWords();
		pad.removeChild(line);
	};
	del.addEventListener('click', clickDel);
	line.appendChild(del);

	pad.appendChild(line);
	if (focus) input.focus();
};
const pwdUI = document.querySelector('input[name=pwd]');

document.querySelector('div.item.addnew > input').addEventListener('keydown', evt => {
	if (evt.key.toLowerCase() !== 'enter') return;
	addNewItem();
});
document.querySelector('div.item.addnew > span.btn').addEventListener('click', addNewItem);

syncstore.get('SensitiveWords', words => {
	var pad = document.querySelector('div.list');
	Object.keys(words).forEach(key => {
		SensitiveWords[key] = words[key];
		generateWordItem(pad, key);
	});
});
syncstore.get('SimplePassword', pwd => {
	if (!pwd) pwd = '';
	pwdUI.value = pwd;
});
pwdUI.addEventListener('blur', UpdatePWD);
pwdUI.addEventListener('keydown', evt => {
	if (evt.key.toLowerCase() === 'enter') UpdatePWD();
});