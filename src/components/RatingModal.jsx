// src/components/RatingModal.jsx
'use client'

import { useState } from 'react'
import { createRating } from '@/lib/ratings'

export default function RatingModal({
  isOpen,
  onClose,
  matchId,
  ratedTeamId,
  raterTeamId,
  ratedTeamName,
  onSuccess
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Form state
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingType, setRatingType] = useState('positive')
  const [punctualityRating, setPunctualityRating] = useState(5)
  const [skillRating, setSkillRating] = useState(5)
  const [fairnessRating, setFairnessRating] = useState(5)
  const [comment, setComment] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await createRating({
        rater_team_id: raterTeamId,
        rated_team_id: ratedTeamId,
        match_id: matchId,
        rating_score: ratingScore,
        rating_type: ratingType,
        comment: comment || null,
        punctuality_rating: punctualityRating,
        skill_rating: skillRating,
        fairness_rating: fairnessRating
      })

      // Reset form
      setRatingScore(5)
      setRatingType('positive')
      setPunctualityRating(5)
      setSkillRating(5)
      setFairnessRating(5)
      setComment('')

      // Close modal & callback
      onSuccess && onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal memberikan rating')
      console.error('Rating error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Beri Rating
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {ratedTeamName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Rating Keseluruhan
            </label>
            <div className="flex gap-2 justify-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-10 h-10 ${
                      star <= ratingScore
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-300 text-gray-300'
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-center text-sm font-semibold text-gray-700">
              {ratingScore} dari 5 bintang
            </p>
          </div>

          {/* Rating Type */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Tipe Rating
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRatingType('positive')}
                className={`p-3 rounded-lg font-bold transition ${
                  ratingType === 'positive'
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-green-500'
                }`}
              >
                👍 Positif
              </button>
              <button
                type="button"
                onClick={() => setRatingType('negative')}
                className={`p-3 rounded-lg font-bold transition ${
                  ratingType === 'negative'
                    ? 'bg-red-100 text-red-700 border-2 border-red-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-red-500'
                }`}
              >
                👎 Negatif
              </button>
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900">Detail Rating</h3>

            {/* Punctuality */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  ⏰ Ketepatan Waktu
                </label>
                <span className="text-sm font-bold text-blue-600">
                  {punctualityRating}/5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={punctualityRating}
                onChange={(e) => setPunctualityRating(parseInt(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Skill */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  ⚽ Kemampuan Bermain
                </label>
                <span className="text-sm font-bold text-blue-600">
                  {skillRating}/5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={skillRating}
                onChange={(e) => setSkillRating(parseInt(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Fairness */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  🤝 Sportivitas
                </label>
                <span className="text-sm font-bold text-blue-600">
                  {fairnessRating}/5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={fairnessRating}
                onChange={(e) => setFairnessRating(parseInt(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              💬 Komentar (Opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bagikan pengalaman bermain Anda..."
              maxLength={500}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              rows="3"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 karakter
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Mengirim...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Kirim Rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
