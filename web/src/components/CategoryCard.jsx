export default function CategoryCard({ label, emoji, image, color, active, onClick }) {
  return (
    <button
      type="button"
      className={`category-card${active ? " active" : ""}`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(10,11,13,0.35), rgba(10,11,13,0.82)), url(${image})`,
        borderColor: active ? color : undefined,
        boxShadow: active ? `0 10px 26px ${color}4d` : undefined
      }}
      onClick={onClick}
    >
      <div className="category-icon">{emoji}</div>
      <strong>{label}</strong>
      <span className="category-accent-bar" style={{ background: color }} />
    </button>
  );
}
