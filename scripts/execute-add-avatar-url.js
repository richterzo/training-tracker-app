#!/usr/bin/env node

/**
 * Script per eseguire add-avatar-url.sql direttamente su Supabase
 * Usa le credenziali da .env.local
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL non trovato in .env.local')
  process.exit(1)
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY non trovato in .env.local')
  console.error('💡 Nota: Per eseguire ALTER TABLE, serve la SERVICE_ROLE_KEY (non l\'anon key)')
  console.error('💡 Alternativa: Esegui lo script manualmente in Supabase Dashboard → SQL Editor')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function executeScript() {
  try {
    const sqlFile = path.join(__dirname, 'add-avatar-url.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    console.log('📝 Eseguendo script SQL...')
    console.log('📄 File:', sqlFile)
    console.log('')

    // Esegui lo script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Se la funzione exec_sql non esiste, proviamo con query diretta
      // Ma ALTER TABLE richiede service role key
      console.log('⚠️  Tentativo con query diretta...')
      
      // Estrarre solo la parte ALTER TABLE
      const alterTableMatch = sql.match(/ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;/)
      if (alterTableMatch) {
        // Verifica prima se la colonna esiste
        const { data: checkData, error: checkError } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .limit(1)

        if (checkError && checkError.code === '42703') {
          // Colonna non esiste, proviamo ad aggiungerla
          console.log('✅ Colonna avatar_url non esiste, aggiungendo...')
          
          // Usa query diretta con service role
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify({ sql_query: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;' })
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`)
          }

          console.log('✅ Colonna avatar_url aggiunta con successo!')
        } else if (checkError && checkError.code !== '42703') {
          throw checkError
        } else {
          console.log('ℹ️  Colonna avatar_url già esistente')
        }
      }
    } else {
      console.log('✅ Script eseguito con successo!')
      console.log('📊 Risultato:', data)
    }

    console.log('')
    console.log('✅ Completato!')
  } catch (err) {
    console.error('❌ Errore durante l\'esecuzione:', err.message)
    console.error('')
    console.error('💡 SOLUZIONE ALTERNATIVA:')
    console.error('1. Vai su https://app.supabase.com')
    console.error('2. Seleziona il tuo progetto')
    console.error('3. Vai su SQL Editor')
    console.error('4. Copia e incolla il contenuto di scripts/add-avatar-url.sql')
    console.error('5. Clicca "Run"')
    process.exit(1)
  }
}

// Metodo alternativo: usa psql se disponibile
async function executeWithPsql() {
  const sqlFile = path.join(__dirname, 'add-avatar-url.sql')
  const sql = fs.readFileSync(sqlFile, 'utf8')
  
  // Estrai solo la parte ALTER TABLE per semplicità
  const simpleSQL = 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
  
  console.log('📝 SQL da eseguire:')
  console.log(simpleSQL)
  console.log('')
  console.log('💡 Per eseguire manualmente:')
  console.log('1. Vai su Supabase Dashboard → SQL Editor')
  console.log('2. Incolla lo script sopra')
  console.log('3. Clicca "Run"')
}

// Esegui
if (SUPABASE_SERVICE_KEY && SUPABASE_SERVICE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  executeScript().catch(console.error)
} else {
  console.log('⚠️  SERVICE_ROLE_KEY non configurata')
  console.log('')
  executeWithPsql()
}
