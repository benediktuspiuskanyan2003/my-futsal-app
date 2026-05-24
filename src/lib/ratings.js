// src/lib/ratings.js
// Helper functions untuk rating operations

export async function createRating({
  rater_team_id,
  rated_team_id,
  match_id,
  rating_score,
  rating_type,
  comment,
  punctuality_rating,
  skill_rating,
  fairness_rating
}) {
  try {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rater_team_id,
        rated_team_id,
        match_id,
        rating_score,
        rating_type,
        comment,
        punctuality_rating,
        skill_rating,
        fairness_rating
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create rating')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating rating:', error)
    throw error
  }
}

export async function getRatingsForTeam(ratedTeamId) {
  try {
    const response = await fetch(`/api/ratings?ratedTeamId=${ratedTeamId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch ratings')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching ratings:', error)
    throw error
  }
}

export async function getRatingsForMatch(matchId) {
  try {
    const response = await fetch(`/api/ratings?matchId=${matchId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch ratings')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching ratings:', error)
    throw error
  }
}

export async function updateRating({
  id,
  rating_score,
  rating_type,
  comment,
  punctuality_rating,
  skill_rating,
  fairness_rating
}) {
  try {
    const response = await fetch('/api/ratings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        rating_score,
        rating_type,
        comment,
        punctuality_rating,
        skill_rating,
        fairness_rating
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update rating')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating rating:', error)
    throw error
  }
}

export async function deleteRating(ratingId) {
  try {
    const response = await fetch(`/api/ratings?id=${ratingId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete rating')
    }

    return await response.json()
  } catch (error) {
    console.error('Error deleting rating:', error)
    throw error
  }
}

// Utility functions
export function getAverageRating(ratings) {
  if (!ratings || ratings.length === 0) return 0
  const sum = ratings.reduce((acc, rating) => acc + rating.rating_score, 0)
  return (sum / ratings.length).toFixed(1)
}

export function getPositiveCount(ratings) {
  if (!ratings) return 0
  return ratings.filter(r => r.rating_type === 'positive').length
}

export function getNegativeCount(ratings) {
  if (!ratings) return 0
  return ratings.filter(r => r.rating_type === 'negative').length
}

export function getRatingPercentage(ratings) {
  if (!ratings || ratings.length === 0) return 0
  const positiveCount = getPositiveCount(ratings)
  return Math.round((positiveCount / ratings.length) * 100)
}

// Get badge berdasarkan rating
export function getRatingBadge(avgRating, totalRatings) {
  if (totalRatings < 5) return null // Perlu minimal 5 rating

  if (avgRating >= 4.5) {
    return { label: 'Highly Rated', color: 'bg-yellow-100 text-yellow-700', icon: '🏆' }
  }
  if (avgRating >= 4.0) {
    return { label: 'Great Team', color: 'bg-green-100 text-green-700', icon: '⭐' }
  }
  if (avgRating >= 3.0) {
    return { label: 'Good Team', color: 'bg-blue-100 text-blue-700', icon: '👍' }
  }
  if (avgRating < 2.5) {
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-700', icon: '⚠️' }
  }

  return null
}
