import { time } from "console"
import { url } from "inspector"
import { title } from "process"
import { useEffect, useState } from "react"
import Command from "~components/command"
import { ICON_WEB_ITEM } from "~icons"
import { getSnapSeekData } from "~model"

const HistorySeek = () => {
	const [displayData, setDisplayData] = useState({})

	useEffect( () => {
		getSnapSeekData().then((data) => {
			setDisplayData(data)
		})
	}, [])

	return (<>
			<Command.Root>
					<Command.Search></Command.Search>
					<Command.List>
						<Command.Empty mode={false} content="No results found."></Command.Empty>
						{
							Object.keys(displayData).length <= 0 
							? <Command.Empty mode={true} content="Data Empty"></Command.Empty>
							: Object.keys(displayData).map(item => <>
								{
											displayData[item].length === 0 
											? null
											: <Command.Group heading={item}>
												{
														displayData[item].map(({ title, url, icon, text, time}) => <>
																<Command.InfoItem
																	id={time}  
																	key={time}
																	icon={icon 
																		? <img className="snap-seek-item-img" src={icon.replace(/http[s]:/, '') }></img> 
																		: <ICON_WEB_ITEM/> } 
																	right={url} 
																	onSelect= { ()=> { window.open(url, '_blank') }} 
																	title={title} 
																	keywords={[ url, title, text]} 
																	subtitle={text}>
																</Command.InfoItem>
														</>
														)
												}
											</Command.Group>
								}
							</>)
						}
					</Command.List>
			</Command.Root>
	</>)
}

export default HistorySeek