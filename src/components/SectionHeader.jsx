import './SectionHeader.css'

export default function SectionHeader({ title, genres, activeGenre, onGenre }) {
  return (
    <div className="section-head">
      <h2 className="section-title">{title}</h2>
      {genres && (
        <div className="genre-scroll">
          {genres.map(g => (
            <button
              key={g.value ?? g}
              className={`genre-pill ${activeGenre === (g.value ?? g) ? 'active' : ''}`}
              onClick={() => onGenre(g.value ?? g)}
            >
              {g.label ?? g}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
