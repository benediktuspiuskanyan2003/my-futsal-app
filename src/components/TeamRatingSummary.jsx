// src/components/TeamRatingSummary.jsx
'use client'

import { getRatingBadge, getRatingPercentage } from '@/lib/ratings'

export default function TeamRatingSummary({ team }) {
  if (!team || !team.avg_rating) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
        <p className="text-gray-600 text-sm">Belum ada rating untuk tim ini</p>
      </div>
    )
  }

  const badge = getRatingBadge(team.avg_rating, team.total_ratings)
  const positivePercentage = getRatingPercentage([
    ...Array(team.positive_count).fill({ rating_type: 'positive' }),
    ...Array(team.negative_count).fill({ rating_type: 'negative' })
  ])

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Rating Tim</h3>
          <p className="text-sm text-gray-600">
            Berdasarkan {team.total_ratings} rating
          </p>
        </div>
        {badge && (
          <div className={`text-center p-3 rounded-lg ${badge.color}`}>
            <p className="text-2xl mb-1">{badge.icon}</p>
            <p className="text-xs font-bold">{badge.label}</p>
          </div>
        )}
      </div>

      {/* Average Rating */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
        <div className="text-center">
          <div className="text-5xl font-black text-yellow-500">
            {team.avg_rating}
          </div>
          <p className="text-xs text-gray-600 mt-1">dari 5.0</p>
        </div>

        <div className="flex-1">
          <div className="flex gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-5 h-5 ${
                  i < Math.round(team.avg_rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-300 text-gray-300'
                }`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            {team.positive_count} positif, {team.negative_count} negatif
          </p>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-gray-700">👍 Positif</span>
            <span className="text-sm font-bold text-green-600">
              {team.positive_count}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{
                width: `${positivePercentage}%`
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-gray-700">👎 Negatif</span>
            <span className="text-sm font-bold text-red-600">
              {team.negative_count}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{
                width: `${100 - positivePercentage}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Trust Indicator */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <span className="font-bold">✓ Tim Terpercaya</span> — Tim ini memiliki track record yang baik
          dalam bermain futsal
        </p>
      </div>
    </div>
  )
}
