var MosaicType = { rearrange: true };

const DefaultSensitiveWords = {
	"政府": "振幅",
	"警察": "敬茶",
	"自由": ["汁油", "职友"],
	"民主": ["冥珠", "明竹"]
};

syncstore.get('MosaicType', type => {
	MosaicType = type;
});
syncstore.get('SensitiveWords', type => {
	if (!type || Object.keys(type).length === 0) syncstore.set({'SensitiveWords': DefaultSensitiveWords});
});

const ToggleMosaic = tabID => {
	chrome.tabs.getSelected(tab => {
		chrome.tabs.sendMessage(tab.id, {
			action: "launch",
			option: MosaicType
		});
	});
};

chrome.commands.onCommand.addListener(cmd => {
	if (cmd === 'toggle-mosaic') {
		ToggleMosaic();
	}
});

chrome.runtime.onMessage.addListener((msg, sender, response) => {
	if (msg.event === 'ChangeMosaicType') {
		MosaicType[msg.option] = msg.value;
		response();
	} else if (msg.event === 'ToggleMosaic') {
		ToggleMosaic();
	}
});