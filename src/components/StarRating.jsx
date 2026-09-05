export default function StarRating({ rating, max = 5, size = 'md', interactive = false, onChange }) {
  const sizes = { sm: 'w-3 h-3', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const starSize = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        const pct = partial ? Math.round((rating - Math.floor(rating)) * 100) : 0;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(i + 1)}
            className={`relative ${starSize} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            aria-label={`${i + 1} star`}
          >
            {/* Background star (empty) */}
            <svg viewBox="0 0 24 24" className={`absolute inset-0 ${starSize} text-gray-300 dark:text-gray-600`} fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {/* Filled star */}
            <svg
              viewBox="0 0 24 24"
              className={`absolute inset-0 ${starSize} text-yellow-400`}
              fill="currentColor"
              style={partial ? { clipPath: `inset(0 ${100 - pct}% 0 0)` } : undefined}
            >
              {(filled || partial) && (
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              )}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
