import './SearchBar.css'

function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search movies..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
      />
      {value && (
        <button className="clear-btn" onClick={() => onChange('')}>
          ✕
        </button>
      )}
    </div>
  )
}

export default SearchBar
