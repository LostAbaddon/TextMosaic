var MosaicType = 1;

const ToggleMosaic = tabID => {
	chrome.tabs.sendMessage(tabID, {
		action: "launch",
		level: MosaicType
	});
};
const DefaultSensitiveWords = {
	"政府": "振幅",
	"警察": "敬茶",
	"自由": ["汁油", "职友"],
	"民主": ["冥珠", "明竹"]
};

syncstore.get('MosaicType', type => {
	if (!isNumber(type)) type = 1;
	else if (type < 1) type = 1;
	else if (type > 3) type = 3;
	MosaicType = type;
});
syncstore.set({'SensitiveWords': DefaultSensitiveWords});

chrome.browserAction.onClicked.addListener(tab => {
	ToggleMosaic(tab.id);
});

chrome.commands.onCommand.addListener(cmd => {
	if (cmd === 'toggle-mosaic') {
		chrome.tabs.getSelected(tab => {
			ToggleMosaic(tab.id);
		});
	}
});

chrome.runtime.onMessage.addListener((msg, sender, response) => {
	if (msg.event === 'ChangeMosaicType') {
		MosaicType = msg.value;
	}
	response();
});