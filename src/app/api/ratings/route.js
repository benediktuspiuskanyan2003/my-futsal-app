import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch ratings for a team or specific match
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const matchId = searchParams.get('matchId')
    const ratedTeamId = searchParams.get('ratedTeamId')

    if (!teamId && !matchId && !ratedTeamId) {
      return Response.json(
        { error: 'Please provide teamId, matchId, or ratedTeamId' },
        { status: 400 }
      )
    }

    let query = supabase.from('team_ratings').select('*')

    if (ratedTeamId) {
      query = query.eq('rated_team_id', ratedTeamId)
    }
    if (matchId) {
      query = query.eq('match_id', matchId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ratings:', error)
      return Response.json({ error: 'Failed to fetch ratings' }, { status: 500 })
    }

    // Enrich dengan info tim yang memberi rating
    const enrichedData = await Promise.all(
      data.map(async (rating) => {
        const { data: raterTeam } = await supabase
          .from('teams')
          .select('id, name, avg_rating')
          .eq('id', rating.rater_team_id)
          .single()

        return {
          ...rating,
          rater_team: raterTeam
        }
      })
    )

    return Response.json(enrichedData)
  } catch (error) {
    console.error('GET /api/ratings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new rating
export async function POST(req) {
  try {
    const {
      rater_team_id,
      rated_team_id,
      match_id,
      rating_score,
      rating_type,
      comment,
      punctuality_rating,
      skill_rating,
      fairness_rating
    } = await req.json()

    // Validasi input
    if (!rater_team_id || !rated_team_id || !rating_score || !rating_type) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rater_team_id === rated_team_id) {
      return Response.json(
        { error: 'Tim tidak bisa rating dirinya sendiri' },
        { status: 400 }
      )
    }

    // Cek apakah sudah ada rating dari tim ini ke tim lain untuk match yang sama
    if (match_id) {
      const { data: existingRating } = await supabase
        .from('team_ratings')
        .select('id')
        .eq('rater_team_id', rater_team_id)
        .eq('rated_team_id', rated_team_id)
        .eq('match_id', match_id)
        .single()

      if (existingRating) {
        return Response.json(
          { error: 'Rating sudah ada untuk match ini' },
          { status: 400 }
        )
      }
    }

    // Insert rating
    const { data: newRating, error } = await supabase
      .from('team_ratings')
      .insert([
        {
          rater_team_id,
          rated_team_id,
          match_id,
          rating_score,
          rating_type,
          comment: comment || null,
          punctuality_rating: punctuality_rating || null,
          skill_rating: skill_rating || null,
          fairness_rating: fairness_rating || null
        }
      ])
      .select()

    if (error) {
      console.error('Error creating rating:', error)
      return Response.json({ error: 'Failed to create rating' }, { status: 500 })
    }

    // Update team average rating
    const { data: allRatings } = await supabase
      .from('team_ratings')
      .select('rating_score, rating_type')
      .eq('rated_team_id', rated_team_id)

    if (allRatings && allRatings.length > 0) {
      const avgRating = (
        allRatings.reduce((sum, r) => sum + r.rating_score, 0) / allRatings.length
      ).toFixed(1)

      const positiveCount = allRatings.filter(r => r.rating_type === 'positive').length
      const negativeCount = allRatings.filter(r => r.rating_type === 'negative').length

      await supabase
        .from('teams')
        .update({
          avg_rating: parseFloat(avgRating),
          total_ratings: allRatings.length,
          positive_count: positiveCount,
          negative_count: negativeCount
        })
        .eq('id', rated_team_id)
    }

    return Response.json(newRating[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/ratings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update existing rating
export async function PUT(req) {
  try {
    const {
      id,
      rating_score,
      rating_type,
      comment,
      punctuality_rating,
      skill_rating,
      fairness_rating
    } = await req.json()

    if (!id) {
      return Response.json({ error: 'Rating ID required' }, { status: 400 })
    }

    const { data: updatedRating, error } = await supabase
      .from('team_ratings')
      .update({
        rating_score,
        rating_type,
        comment: comment || null,
        punctuality_rating: punctuality_rating || null,
        skill_rating: skill_rating || null,
        fairness_rating: fairness_rating || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating rating:', error)
      return Response.json({ error: 'Failed to update rating' }, { status: 500 })
    }

    // Update team average rating
    const { rated_team_id } = updatedRating[0]
    const { data: allRatings } = await supabase
      .from('team_ratings')
      .select('rating_score, rating_type')
      .eq('rated_team_id', rated_team_id)

    if (allRatings && allRatings.length > 0) {
      const avgRating = (
        allRatings.reduce((sum, r) => sum + r.rating_score, 0) / allRatings.length
      ).toFixed(1)

      const positiveCount = allRatings.filter(r => r.rating_type === 'positive').length
      const negativeCount = allRatings.filter(r => r.rating_type === 'negative').length

      await supabase
        .from('teams')
        .update({
          avg_rating: parseFloat(avgRating),
          total_ratings: allRatings.length,
          positive_count: positiveCount,
          negative_count: negativeCount
        })
        .eq('id', rated_team_id)
    }

    return Response.json(updatedRating[0])
  } catch (error) {
    console.error('PUT /api/ratings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove rating
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'Rating ID required' }, { status: 400 })
    }

    // Get the rating first to know which team was rated
    const { data: ratingData } = await supabase
      .from('team_ratings')
      .select('rated_team_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('team_ratings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting rating:', error)
      return Response.json({ error: 'Failed to delete rating' }, { status: 500 })
    }

    // Update team average rating
    if (ratingData) {
      const { data: allRatings } = await supabase
        .from('team_ratings')
        .select('rating_score, rating_type')
        .eq('rated_team_id', ratingData.rated_team_id)

      if (allRatings && allRatings.length > 0) {
        const avgRating = (
          allRatings.reduce((sum, r) => sum + r.rating_score, 0) / allRatings.length
        ).toFixed(1)

        const positiveCount = allRatings.filter(r => r.rating_type === 'positive').length
        const negativeCount = allRatings.filter(r => r.rating_type === 'negative').length

        await supabase
          .from('teams')
          .update({
            avg_rating: parseFloat(avgRating),
            total_ratings: allRatings.length,
            positive_count: positiveCount,
            negative_count: negativeCount
          })
          .eq('id', ratingData.rated_team_id)
      } else {
        // No ratings left, reset
        await supabase
          .from('teams')
          .update({
            avg_rating: null,
            total_ratings: 0,
            positive_count: 0,
            negative_count: 0
          })
          .eq('id', ratingData.rated_team_id)
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/ratings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
