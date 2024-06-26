import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import cssText from 'data-text:~content.css';
import { ICON_WEB_ITEM } from './icons'
import { debounce, formatDate, getPageInfo } from "~uitls";
import Command from "~components/command";
import { getSnapSeekData } from "~model";
import HistorySeek from "~historyseek";
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}
export const getStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};




async function SaveSnapSeek() {
	const info = getPageInfo()
	if (!info.title || !info.text || !info.url) return;
	const snapsDataObj = await getSnapSeekData()
		const dateKey = formatDate(new Date(), 'yyyy-MM-dd')
		if (!snapsDataObj[dateKey]) {
			snapsDataObj[dateKey] = []
		}
		const fidx = snapsDataObj[dateKey].findIndex(({ url }) => url === info.url)
		if (fidx > -1) {
			snapsDataObj[dateKey].splice(fidx, 1)
		}
		snapsDataObj[dateKey].push(info)
		chrome.runtime.sendMessage( { action: 'SAVE', data: snapsDataObj  },)
	return 
}

window.addEventListener("load", () => {
	const debounceLoad = debounce(() => {
		SaveSnapSeek();
	}, 500)
	debounceLoad()
	// 监听body中元素有更新
	let status = false
	const observer = new MutationObserver((mutationsList, observer) => {
		if (status) return;
		status = true;
		setTimeout(() => {
			debounceLoad()
		}, 1000);
		
	});
	observer.observe(document.body, { childList: true, subtree: false, attributes: false });
})

export default function InitContent() {
	const [open, setOpen] = useState(false)
	const [sourceData, setSourceData] = useState({})
	const [displayData, setDisplayData] = useState({})
	useEffect( () => {
		if (open) {
			getSnapSeekData().then((data) => {
				setDisplayData(data)
				setSourceData(data)
			})
		}
		const handelMsgBybg = (request, sender, sendResponse) => {
			const { action } = request;
			if (action === 'active_extention_launcher') {
					setOpen(!open);
			}
			// 发送响应
				sendResponse({ result: 'Message processed in content.js' });
		};
		chrome.runtime.onMessage.addListener(handelMsgBybg);
		return  () => {
			chrome.runtime.onMessage.removeListener(handelMsgBybg);
		}
	}, [open])


	const handleSearch = debounce(async (e) => { 
		const { value } = e.target
		if (value.trim()) {
			const snapsData = await getSnapSeekData()
			if (snapsData && Object.keys(snapsData).length) {
				const result = {}
				Object.keys(snapsData).map(key => {
					const datas = snapsData[key].filter(item => {
						return item.title.includes(value) || item.text.includes(value) || item.url.includes(value)
					}).map((item) => {
						const diff = 5
						let text = item.text
						let fidx =text.indexOf(value)
						item.searchTags = []
						while(fidx > -1) { 
							item.searchTags.push([text.substring(fidx - diff, fidx), value, text.substring(fidx + value.length , fidx + diff)])
							text = text.substring(fidx + value.length, text.length)
							fidx = text.indexOf(value)
						}
						return {
							...item,
						}
					})
					datas.length && (result[key] = datas);
				})
				setDisplayData(result)
			}
		} else {
			setDisplayData(sourceData)
		}
	}, 500)


	function closeMask(e) {
		e.target.className === 'snap-seek-mask' && setOpen(false);
	}

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {

		if ([27, 37, 38, 39, 40, 13].includes(event.keyCode)) {
				return;
		}
		if (event.metaKey) return;
		event.stopPropagation();
	};
	return ( <>
			
		 { !open ? null : <div className="snap-seek-mask" onClick={ closeMask }>
					<HistorySeek></HistorySeek>
					<div snap-seek-cmdk-root=""  style={{ display: 'none'}}>
						<input snap-seek-cmdk-input=""  onKeyDown={handleKeyDown} autoFocus onChange={handleSearch} placeholder="Search content or title or url" />
					<div snap-seek-cmdk-list="">
						{
							Object.keys(displayData).length <= 0 
								? <div snap-seek-cmdk-empty="">No results found.</div>
								: Object.keys(displayData).map(item =><>
									 {
										displayData[item].length === 0 
											? null
											: <div snap-seek-cmdk-group="">
												<div snap-seek-cmdk-group-heading="">{item}</div> 
												{
													displayData[item].map(({ title, url,  icon, searchTags, text}) =>
															<div onClick={() => window.open(url, '_blank')} snap-seek-cmdk-item="">
																<div className="snap-seek-item"> 
																{
																	icon 
																		? <img className="snap-seek-item-img" src={icon.replace(/http[s]:/, '') }></img> 
																		:  <ICON_WEB_ITEM/> 
																}
																	<div className="snap-seek-item-title">{title}</div>	
																	<a href={url} target="_blank" className="snap-seek-item-url"> { url }</a> 
																</div>
																{
																	searchTags  && searchTags.length
																		? <div className="snap-seek-item-search">
																			{searchTags.map((tag) => <div className="snap-seek-tag" >{tag[0]} <span>{tag[1]}</span> {tag[2]}</div>) }
																		</div>
																		: <div className="snap-seek-text-content">{text}</div>
																}
															</div>
														)
													}
											 </div>
									 	}
									 </>
									)
						}
					</div>
					<div snap-seek-cmdk-motionshot-footer="">
						<div>
							Latest Snapshot Data: 7 Days
						</div>
						<a  href="https://github.com/WtecHtec/Snapseek" target="_blank" rel="noopener noreferrer"> GitHub</a>
					</div>
				</div>
			</div>}
	 </>	
	)
}


