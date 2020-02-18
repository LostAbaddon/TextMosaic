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
		ele.addEventListener('click', async () => {
			input.checked = !input.checked;
			await ChangeMosaicType(name, input.checked);
		});
	});

	document.querySelector('button[name=ToggleMosaic]').addEventListener('click', () => {
		chrome.runtime.sendMessage({'event': 'ToggleMosaic'});
	});
});