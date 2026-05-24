# Migration Guide: Add opponent_team_id Field

## Overview
Menambahkan kolom `opponent_team_id` ke tabel `matches` untuk memungkinkan tracking tim yang di-challenge dan memverifikasi konfirmasi match.

## Langkah-langkah Implementasi

### 1. Jalankan SQL Migration di Supabase
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Login dengan akun Supabase Anda
3. Pilih project "futsal"
4. Pergi ke tab **SQL Editor**
5. Klik **"New Query"**
6. Copy & Paste SQL dari file `001_add_opponent_team_id.sql`:

```sql
-- Add opponent_team_id column to matches table
ALTER TABLE matches 
ADD COLUMN opponent_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX idx_matches_opponent_team_id ON matches(opponent_team_id);

COMMENT ON COLUMN matches.opponent_team_id IS 'The team that was challenged for this match. Set when the opponent accepts the challenge.';
```

7. Klik **Run** (atau Ctrl+Enter)
8. Tunggu sampai berhasil ✓

### 2. Verifikasi Kolom Ditambahkan
1. Pergi ke **Database** tab
2. Pilih tabel **matches**
3. Cek apakah kolom `opponent_team_id` sudah ada dengan tipe `uuid`

### 3. Update RLS Policy (Jika Diperlukan)
Jika Anda memiliki RLS policy yang strict, pastikan:
- SELECT queries bisa membaca kolom `opponent_team_id`
- UPDATE queries bisa mengubah nilai `opponent_team_id` saat user accept challenge

Contoh policy untuk match update:
```sql
-- Hanya tim owner atau opponent yang bisa update status & opponent_team_id
CREATE POLICY "Allow opponent to confirm match"
ON matches
FOR UPDATE
USING (auth.uid() = user_id OR opponent_team_id IN (
  SELECT id FROM teams WHERE manager_id = auth.uid()
))
WITH CHECK (auth.uid() = user_id OR opponent_team_id IN (
  SELECT id FROM teams WHERE manager_id = auth.uid()
));
```

## Alur Sistem Setelah Migration

### Timeline Match Confirmation:
```
1. TEAM A CREATES MATCH
   ├─ team_id = Team A
   ├─ opponent_team_id = NULL  ← Belum ada lawan
   └─ status = 'Open'

2. TEAM A CONTACTS TEAM B (via WhatsApp)
   └─ Manual communication via WhatsApp

3. TEAM B ACCEPTS CHALLENGE
   ├─ opponent_team_id = Team B  ← SET when accept
   ├─ status = 'Confirmed'
   └─ System verifies: hanya tim ini yg bisa confirm

4. MATCH CONFIRMED
   └─ Both teams ready for sparring
```

## Rollback (Jika Diperlukan)
Jika perlu undo migration:

```sql
-- Drop index
DROP INDEX IF EXISTS idx_matches_opponent_team_id;

-- Drop column
ALTER TABLE matches DROP COLUMN opponent_team_id;
```

## Verifikasi Kode Update
Kode sudah di-update di:
- ✅ `src/app/matches/[id]/page.jsx` - `handleChallengeResponse` function

Perubahan:
- Saat Team B accept: `opponent_team_id` di-set ke `Team B.id`
- Validasi: jika `opponent_team_id` sudah ada, error ditampilkan
- Status berubah dari "Open" ke "Confirmed"
