const MosaicType = {
	replace: false,
	rearrange: true,
	encrypt: false
};

const ChangeMosaicType = (type, checked) => new Promise(res => {
	MosaicType[type] = checked;
	syncstore.set('MosaicType', MosaicType, () => {
		chrome.runtime.sendMessage({'event': 'ChangeMosaicType', 'option': type, 'value': checked}, () => {
			res();
		});
	});
});

syncstore.get('MosaicType', type => {
	if (!type || Object.keys(type).length === 0) {
		type = {};
		type.rearrange = true;
	}
	MosaicType.replace = !!type.replace;
	MosaicType.rearrange = !!type.rearrange;
	MosaicType.encrypt = !!type.encrypt;

	[].forEach.call(document.querySelectorAll("p[name=MosaicType]"), (ele, i) => {
		var input = ele.querySelector('input');
		var name = Object.keys(MosaicType)[i];
		input.checked = MosaicType[name];
		ele.addEventListener('click', event => {
			if (event.target.tagName.toLowerCase() !== 'input') input.checked = !input.checked;
			ChangeMosaicType(name, input.checked);
		});
	});

	document.querySelector('button[name=ToggleMosaic]').addEventListener('click', () => {
		chrome.runtime.sendMessage({'event': 'ToggleMosaic'});
	});
});

syncstore.get('AutoDecrypt', auto => {
	if (auto === undefined) {
		auto = false;
		syncstore.set('AutoDecrypt', false);
	}
	var ele = document.querySelector('p[name=AutoDecrypt]>input');
	ele.checked = auto;
	document.querySelector('p[name=AutoDecrypt]').addEventListener('click', event => {
		if (event.target.tagName.toLowerCase() !== 'input') ele.checked = !ele.checked;
		syncstore.set('AutoDecrypt', ele.checked);
	});
});

document.querySelector('button[name=LaunchMosaic]').addEventListener('click', () => {
	var content = document.querySelector('textarea[name=inputter]').value;
	chrome.runtime.sendMessage({ 'event': 'TextMosaic', content }, content => {
		var ele = document.querySelector('textarea[name=result]');
		ele.value = content;
		ele.focus();
	});
});
document.querySelector('button[name=LaunchDecrypt]').addEventListener('click', () => {
	var content = document.querySelector('textarea[name=inputter]').value;
	chrome.runtime.sendMessage({ 'event': 'SimpleDecrypt', content }, content => {
		var ele = document.querySelector('textarea[name=result]');
		ele.value = content;
		ele.focus();
	});
});