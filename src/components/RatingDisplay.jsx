// src/components/RatingDisplay.jsx
'use client'

import { getRatingBadge } from '@/lib/ratings'

export default function RatingDisplay({ rating, raterTeamName = 'Tim' }) {
  const getRatingColor = (score) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCategoryColor = (score) => {
    if (score >= 4) return 'bg-green-100 text-green-700'
    if (score >= 3) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-900">{raterTeamName}</h4>
          <p className="text-xs text-gray-500">
            {new Date(rating.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${
                i < rating.rating_score
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-300 text-gray-300'
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Rating Type Badge */}
      <div className="mb-3">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
            rating.rating_type === 'positive'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {rating.rating_type === 'positive' ? '👍 Positif' : '👎 Negatif'}
        </span>
      </div>

      {/* Category Ratings */}
      {(rating.punctuality_rating || rating.skill_rating || rating.fairness_rating) && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {rating.punctuality_rating && (
            <div className={`text-center p-2 rounded ${getCategoryColor(rating.punctuality_rating)}`}>
              <p className="text-xs">⏰</p>
              <p className="text-sm font-bold">{rating.punctuality_rating}/5</p>
            </div>
          )}
          {rating.skill_rating && (
            <div className={`text-center p-2 rounded ${getCategoryColor(rating.skill_rating)}`}>
              <p className="text-xs">⚽</p>
              <p className="text-sm font-bold">{rating.skill_rating}/5</p>
            </div>
          )}
          {rating.fairness_rating && (
            <div className={`text-center p-2 rounded ${getCategoryColor(rating.fairness_rating)}`}>
              <p className="text-xs">🤝</p>
              <p className="text-sm font-bold">{rating.fairness_rating}/5</p>
            </div>
          )}
        </div>
      )}

      {/* Comment */}
      {rating.comment && (
        <p className="text-sm text-gray-700 italic border-l-4 border-gray-300 pl-3">
          "{rating.comment}"
        </p>
      )}
    </div>
  )
}
