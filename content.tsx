import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import cssText from 'data-text:~content.css';
import { ICON_WEB_ITEM } from './icons'
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}
export const getStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};


function getPageInfo() {
  const pageText = document.body.innerText.trim()
  const pageIcon = document.querySelector('link[rel="icon"]')?.getAttribute('href')
  const pageUrl = window.location.href
	const pageTitle = document.title
  return {
    text: pageText,
    icon: pageIcon,
    url: pageUrl,
		title: pageTitle,
		time: new Date().getTime(),
  }
}



function debounce(func: Function, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: any[]) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
      timer = null
    }, delay)
  }
}



function formatDate(date: Date, fmt: string) {
  const o: { [key: string]: number } = {
    "M+": date.getMonth() + 1, //月份   
    "d+": date.getDate(), //日   
    "h+": date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, //小时   
    "H+": date.getHours(), //小时   
    "m+": date.getMinutes(), //分   
    "s+": date.getSeconds(), //秒   
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度   
    S: date.getMilliseconds() //毫秒   
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (let k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1
          ? o[k] + ""
          : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
}



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
					<div cmdk-root="" >
						<input cmdk-input=""  onKeyDown={handleKeyDown} autoFocus onChange={handleSearch} placeholder="Search content or title or url" />
					<div cmdk-list="">
						{
							Object.keys(displayData).length <= 0 
								? <div cmdk-empty="">No results found.</div>
								: Object.keys(displayData).map(item =><>
									 {
										displayData[item].length === 0 
											? null
											: <div cmdk-group="">
												<div cmdk-group-heading="">{item}</div> 
												{
													displayData[item].map(({ title, url,  icon, searchTags, text}) =>
															<div onClick={() => window.open(url, '_blank')} cmdk-item="">
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
																			{searchTags.map((tag) => <div className="tag" >{tag[0]} <span>{tag[1]}</span> {tag[2]}</div>) }
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
					<div cmdk-motionshot-footer="">
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


