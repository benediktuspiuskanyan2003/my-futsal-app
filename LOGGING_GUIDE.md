// LOGGING SETUP GUIDE

## Setup Selesai! ✅

Sistem logging Anda sudah siap. Berikut cara menggunakannya:

---

## 1. IMPORT LOGGER

Di file mana pun Anda ingin menambah logging, cukup import:

```javascript
import logger from '../../lib/logger'
```

---

## 2. LOG LEVELS (5 Tingkatan)

### DEBUG (Paling Detail)
Gunakan untuk informasi development yang sangat detail.
```javascript
logger.debug('User clicked button', { userId, buttonId })
```

### INFO (Informasi Normal)
Untuk mencatat events penting yang berjalan normal.
```javascript
logger.info('User login success', { email, timestamp })
```

### WARNING (Peringatan)
Untuk situasi tidak wajar tapi aplikasi masih berjalan.
```javascript
logger.warn('Database query slow', { queryTime: 5000 })
```

### ERROR (Error)
Untuk error yang terjadi tapi aplikasi tidak crash.
```javascript
logger.error('Payment failed', { error: err.message, orderId })
```

### CRITICAL (Paling Serius)
Untuk error severe yang bisa membuat aplikasi down.
```javascript
logger.critical('Database connection lost', { error: err.message })
```

---

## 3. CONTOH REAL USAGE

### Login Page (src/app/login/page.jsx)
```javascript
import logger from '../../lib/logger'

const handleLogin = async (e) => {
  try {
    logger.info('Login attempt', { email, page: 'login' })
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    logger.info('Login success', { email, page: 'login' })
    router.push('/dashboard')
  } catch (error) {
    logger.error('Login failed', { email, error: error.message, page: 'login' })
  }
}
```

### API Route (Server-Side)
```javascript
import logger from '@/lib/logger'

export async function POST(request) {
  try {
    logger.info('API call: create match', { userId })
    
    const data = await request.json()
    // Process...
    
    logger.info('Match created successfully', { matchId, teamId })
    return Response.json({ success: true })
  } catch (error) {
    logger.error('Match creation failed', { error: error.message, userId })
  }
}
```

---

## 4. OUTPUT FILES

Semua logs disimpan di folder `logs/`:

- **logs/app.log** → Semua logs (INFO, WARNING, ERROR, DEBUG)
- **logs/error.log** → Hanya ERROR logs
- **logs/warning.log** → Hanya WARNING logs

### Format Log:
```
[2026-05-10 14:23:45] [INFO]: User login success | {"email":"user@email.com","page":"login"}
[2026-05-10 14:25:12] [ERROR]: Login failed | {"email":"user@email.com","error":"Invalid password","page":"login"}
[2026-05-10 14:26:33] [WARNING]: Slow query | {"queryTime":5000}
```

---

## 5. FITUR AUTO-ROTATION

Logger otomatis akan:
- Membuat file baru saat log mencapai 5MB
- Keep maksimal 5 files backup
- Jadi tidak akan disk full

---

## 6. SUDAH TERINTEGRASI DI:

✅ Login page (`src/app/login/page.jsx`)
✅ Register page (`src/app/register/page.jsx`)
✅ Forgot Password page (`src/app/forgot-password/page.jsx`)
✅ Update Password page (`src/app/update-password/page.jsx`)
✅ Auth Callback (`src/app/auth/callback/route.js`)
✅ Dashboard (`src/app/dashboard/page.jsx`)

---

## 7. TIPS BEST PRACTICE

### DO ✅
```javascript
// Baik: Descriptive message + context
logger.info('User uploaded team logo', { userId, teamId, fileSize })

// Baik: Include page/route name
logger.error('Match creation failed', { error, matchData, page: 'matches/create' })
```

### DON'T ❌
```javascript
// Jelek: Terlalu generic
logger.info('Something happened')

// Jelek: Sensitive data
logger.info('User password', { password: '12345' })
```

---

## 8. MONITORING LOGS

Untuk melihat real-time logs saat development:
```bash
# Lihat semua logs
tail -f logs/app.log

# Lihat hanya error logs
tail -f logs/error.log
```

---

## 9. PRODUCTION TIPS

Saat di production, Anda bisa:
- Set `LOG_LEVEL=info` di `.env` (skip debug messages)
- Upload logs ke external service (CloudWatch, Sentry, etc)
- Setup alert jika ERROR lebih dari X dalam Y minutes

---

**Semua sudah siap! Mulai gunakan logger di project Anda.** 🚀
