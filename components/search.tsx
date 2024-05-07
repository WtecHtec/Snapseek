

const Search =({
	onSearch,
	placeholder = 'Search content or title or url',
}) => {
	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if ([27, 37, 38, 39, 40, 13].includes(event.keyCode)) {
				return;
		}
		if (event.metaKey) return;
		event.stopPropagation();
	};
	const handleSearch = (e) => {
		typeof onSearch === 'function' &&  onSearch(e);
	}
	return <input snap-seek-cmdk-input=""  onKeyDown={handleKeyDown} autoFocus onChange={handleSearch} placeholder={placeholder} />
}

export default Search