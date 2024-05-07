function getSnapSeekData() {
	return new Promise(resolve => {
		chrome.runtime.sendMessage( { action: 'GET_SNAP',},).then( async (data) => {
			if (data && data.data) {
				resolve(data.data)
			} else {
				resolve({})
			}
		}).catch((err) => {
			console.log('error', err)
			resolve({})
		})
	})	
}

export {
	getSnapSeekData
}