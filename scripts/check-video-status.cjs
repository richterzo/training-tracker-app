#!/usr/bin/env node

/**
 * Script per verificare lo stato dei video caricati
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        process.env[key] = value
      }
    })
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere configurati')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkStatus() {
  console.log('🔍 Verifico stato video...\n')
  
  // Get group_id
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('group_id')
    .not('group_id', 'is', null)
    .limit(1)
  
  if (!profiles || profiles.length === 0) {
    console.error('❌ Nessun gruppo trovato')
    return
  }
  
  const groupId = profiles[0].group_id
  console.log(`📋 Group ID: ${groupId}\n`)
  
  // Get all exercises
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('id, name, category, video_url')
    .eq('group_id', groupId)
    .order('category, name')
  
  if (exError) {
    console.error('❌ Errore nel recupero esercizi:', exError.message)
    return
  }
  
  if (!exercises || exercises.length === 0) {
    console.log('⚠️  Nessun esercizio trovato nel database')
    return
  }
  
  const withVideo = exercises.filter(e => e.video_url)
  const withoutVideo = exercises.filter(e => !e.video_url)
  
  console.log('📊 STATISTICHE:')
  console.log(`   Totale esercizi: ${exercises.length}`)
  console.log(`   ✅ Con video: ${withVideo.length}`)
  console.log(`   ❌ Senza video: ${withoutVideo.length}`)
  console.log(`   📈 Percentuale: ${((withVideo.length / exercises.length) * 100).toFixed(1)}%`)
  console.log('')
  
  // Group by category
  const byCategory = exercises.reduce((acc, ex) => {
    if (!acc[ex.category]) {
      acc[ex.category] = { total: 0, withVideo: 0, withoutVideo: 0 }
    }
    acc[ex.category].total++
    if (ex.video_url) {
      acc[ex.category].withVideo++
    } else {
      acc[ex.category].withoutVideo++
    }
    return acc
  }, {})
  
  console.log('📋 PER CATEGORIA:')
  Object.entries(byCategory).forEach(([cat, stats]) => {
    const pct = ((stats.withVideo / stats.total) * 100).toFixed(1)
    console.log(`   ${cat.toUpperCase()}: ${stats.withVideo}/${stats.total} (${pct}%)`)
  })
  console.log('')
  
  if (withoutVideo.length > 0) {
    console.log('❌ ESERCIZI SENZA VIDEO:')
    withoutVideo.forEach(ex => {
      console.log(`   - ${ex.name} (${ex.category})`)
    })
    console.log('')
  }
  
  if (withVideo.length > 0) {
    console.log('✅ ESERCIZI CON VIDEO:')
    withVideo.forEach(ex => {
      console.log(`   - ${ex.name} (${ex.category})`)
    })
  }
  
  // Check compressed videos
  const compressedDir = path.join(__dirname, '..', 'Basic course _compressed')
  if (fs.existsSync(compressedDir)) {
    const compressedVideos = []
    function findVideos(dir) {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
          findVideos(filePath)
        } else if (/\.(m4v|mp4)$/i.test(file)) {
          compressedVideos.push(filePath)
        }
      }
    }
    findVideos(compressedDir)
    
    const totalVideos = 99 // Expected total
    console.log('')
    console.log('📹 VIDEO COMPRESSI:')
    console.log(`   Compressi: ${compressedVideos.length} / ${totalVideos}`)
    console.log(`   Percentuale: ${((compressedVideos.length / totalVideos) * 100).toFixed(1)}%`)
  }
}

checkStatus().catch(console.error)
