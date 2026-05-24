// src/app/api/send-email/route.js
import { supabase } from '../../../lib/supabase'

export async function POST(req) {
  try {
    const { matchId, teamName, teamCity, playDate, playTime, locationName, creatorEmail } = await req.json()

    // Validasi API key
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Brevo API key not configured' }, { status: 500 })
    }

    // Cari semua tim di kota yang sama (kecuali tim yang membuat)
    const { data: otherTeams } = await supabase
      .from('teams')
      .select('id, name, manager_id')
      .eq('homebase', teamCity)
      .neq('name', teamName)

    if (!otherTeams || otherTeams.length === 0) {
      return Response.json({ success: true, emailsSent: 0 })
    }

    // Ambil email dari profiles untuk setiap manager
    const managerIds = otherTeams.map(t => t.manager_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', managerIds)

    if (!profiles || profiles.length === 0) {
      return Response.json({ success: true, emailsSent: 0 })
    }

    // Buat email content
    const matchLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/matches/${matchId}`
    
    const emailContent = `
      <h2>Jadwal Futsal Baru di ${teamCity}!</h2>
      <p><strong>${teamName}</strong> telah membuat jadwal pertandingan baru.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📅 Tanggal:</strong> ${playDate}</p>
        <p><strong>⏰ Jam:</strong> ${playTime}</p>
        <p><strong>📍 Lokasi:</strong> ${locationName}</p>
      </div>
      
      <p>
        <a href="${matchLink}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
          Lihat Detail & Terima Tantangan
        </a>
      </p>
      
      <p style="color: #666; font-size: 12px;">Balasan email otomatis. Jangan reply email ini.</p>
    `

    // Kirim email ke setiap tim
    let emailsSent = 0
    const emailErrors = []

    for (const profile of profiles) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: 'My Futsal App',
              email: 'noreply@myfutsalapp.com'
            },
            to: [
              {
                email: profile.email,
                name: profile.id
              }
            ],
            subject: `🏆 Jadwal Baru dari ${teamName} di ${teamCity}`,
            htmlContent: emailContent
          })
        })

        const responseData = await response.json()

        if (response.ok) {
          emailsSent++
        } else {
          emailErrors.push({ email: profile.email, error: responseData.message })
        }
      } catch (error) {
        emailErrors.push({ email: profile.email, error: error.message })
      }
    }

    return Response.json({
      success: true,
      emailsSent,
      errors: emailErrors.length > 0 ? emailErrors : null
    })

  } catch (error) {
    console.error('Send email error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
