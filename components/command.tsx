import React, { useEffect, useState } from "react";

import Search from "./search";
import { debounce } from "~uitls";


function useCommand(store, name): [any ,any, any] {
	const [searchResult, setSearchResult] = useState([])
	const [searchKey, setSearchKey] = useState('')
	const [searchIdMap, setSearchIdMap] = useState({})
	useEffect(() => {
		function refresh({ result, searchKey, searchIdMap}){
			setSearchResult(result);
			setSearchKey(searchKey);
			setSearchIdMap(searchIdMap)
		}
		store.on(name, refresh)
		return () => {
			store.off(name, refresh)
		}

	})
	return [searchResult, searchKey, searchIdMap]
}


const Command = () => {

	function Store() {
		const listers = {}
	
		const on = (name, fn) => {
			 if (!listers[name]) listers[name] = []
			 listers[name].push(fn)
		}
		const off = (name, fn) => {
			if (listers[name]) {
				listers[name] = listers[name].filter((item) => item !== fn)
			}
		}
		const emit = (name, ...args) => {
			if (listers[name]) {
				listers[name].forEach((fn) => fn(...args))
			}
		}
		return {
			listers,
			on,
			off,
			emit,
		}
	}

	let  searchDatas = []
	const store =  Store()
	const onSearch = debounce((e) => {
		const value = e.target.value.trim()
		let datas = []
		const searchIdMap = {}
		if ( value && searchDatas && searchDatas.length) {
			datas = searchDatas.filter(item => {
				const { keywords } = item;
				item.searchTags = []
				keywords.forEach(word => {
					const diff = 5
					let text = word
					let fidx =text.indexOf(value)
					while(fidx > -1) { 
						item.searchTags.push([text.substring(fidx - diff, fidx), value, text.substring(fidx + value.length , fidx + diff)])
						text = text.substring(fidx + value.length, text.length)
						fidx = text.indexOf(value)
					}
				})
				if (item.searchTags.length) searchIdMap[item.id] = 1
				return item.searchTags.length
			})
		}  
		if (store && store.listers &&  Object.keys(store.listers).length) {
			Object.keys(store.listers).forEach(key => {
				if (Array.isArray(store.listers[key])) {
					store.listers[key].forEach(fn => fn({ result: datas, searchKey: value, searchIdMap}))
				}
			})
		}
	}, 500) 

	

	const InfoItem = ({ id, key, onSelect, title , keywords, subtitle, right, icon }: {
		id: string,
		key?: any,
		onSelect?: any,
		title: string,
		keywords: string[],
		subtitle?: string,
		right?: string | JSX.Element,
		icon?: string | JSX.Element,
	}) => {
		const [results, searchKey] = useCommand(store, 'search')
		useEffect(() => {
			searchDatas = [ ...searchDatas, { id, key, title, keywords } ]
		}, []);
		const handleSelect = () => {
			typeof onSelect === 'function' && onSelect( id)
		}
		const getResultInfo = (results) => {
			const fd = results.find( item => item.id === id);
			return fd
		}


		const renderIcon = () => {
			if (!icon) return null;
			if (typeof icon === 'string') {
					return icon
			}
			if (React.isValidElement(icon)) {
					return icon;
			}
		};
		const renderRight = () => {
			if (!right) return null;
			if (typeof right === 'string') {
				return <div className="snap-seek-item-url" rel="noreferrer"> { right }</div>;
			}
			if (React.isValidElement(right)) {
				return right;
			}
		};

		const searchData = getResultInfo(results) 
	

		return  <>
		{
			searchKey && !searchData
			? null
			: <div key={key} onClick={ handleSelect } snap-seek-cmdk-item="">
					<div className="snap-seek-item"> 
						{renderIcon()}
						<div className="snap-seek-item-title">{title}</div>	
						{renderRight()}
					</div>
					<div className="snap-seek-item-search">
						{
							searchData && searchKey 
							? <> {searchData.searchTags.map((tag) => <div className="snap-seek-item-search-tag" >{tag[0]} <span>{tag[1]}</span> {tag[2]}</div>) }</>
							: <div className="snap-seek-text-content">{subtitle}</div>
						}
					</div>
			</div>
		}
		</>
	}


	const Empty = ({ content = 'No results found.', mode = false } )=> {
		const [results, searchKey] = useCommand(store, `search`)
		if (mode) return <div snap-seek-cmdk-empty="">{content}</div>
		return <> { searchKey &&  results.length === 0 ?  <div  snap-seek-cmdk-empty="">{content}</div> : '' } </>
	}

	const List = ({ children }) => {
		return 	<div snap-seek-cmdk-list=""> { children }</div>
	}
	
	const Root  = ({ children }) => {
		return 	<div snap-seek-cmdk-root=""> { children }</div>
	}

	const Group = ({ heading, children }) => {
		const [results, searchKey, searchIdMap] = useCommand(store, 'search')
		
		function getDisply() {
			if (!searchKey) return true
			const datas = children.filter(item => {
				return searchIdMap[item.props.children.props.id] 
			})
			if (searchKey && results.length && datas.length) {
				return true
			} 
			return false
		}
		return <>
		{
				getDisply() 
				? <div snap-seek-cmdk-group="">
						<div snap-seek-cmdk-group-heading="">{heading}</div>
					{ children }
					</div> 
				: null
			} 
		</>
	}
	return {
		Search: () => <Search onSearch={onSearch}></Search>,
		Empty,
		InfoItem,
		List,
		Root,
		Group,
	}
}
export default Command();