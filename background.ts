import { Storage } from "@plasmohq/storage"
const MAX_TIME = 7 * 24 * 60 * 60 * 1000
const storage = new Storage({
	area: 'local',
});
const SNAPSEEK_KEY = "snapseek"

/**
 *  监听快捷指令
 */
chrome.commands.onCommand.addListener((command) => {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			// 向content.js发送消息
			chrome.tabs.sendMessage(tabs[0].id, { action: command }, function (response) {
					console.log(response?.result);
			});
	});
});

async function getSnapSeekData(sendResponse) {
	// 过滤过期数据
	let snapData = await storage.get(SNAPSEEK_KEY)

	const result = {}
	if (snapData && Object.keys(snapData).length) {
		const keys = Object.keys(snapData).filter(item => {
			return new Date(item).getTime() + MAX_TIME >= new Date().getTime()
		})
		keys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(key => {
			snapData[key] && snapData[key].sort(( a, b) => b.time - a.time)
			result[key] = snapData[key]
		})
	}
	console.log(snapData, result)
	sendResponse({ data: result, statue: true})
}

async function saveSnapSeekData(request, sendResponse) { 
	await storage.set(SNAPSEEK_KEY, request.data)
	sendResponse({ statue: true})
}

chrome.runtime.onMessage.addListener(  (request, sender, sendResponse) => {
	// 获取插件列表
	const { action, } = request;
	switch(action){
		case 'SAVE':
			saveSnapSeekData(request, sendResponse)
			break
		case 'GET_SNAP':
			getSnapSeekData(sendResponse)
			break
		default:
			console.log(`no action: ${action}`)
	}
	return true; // 表示我们将异步发送响应
});