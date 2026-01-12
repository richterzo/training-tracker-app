#!/usr/bin/env node

/**
 * Script per controllo incrociato esercizi-video
 * Verifica quali esercizi hanno video e quali no
 * Suggerisce video disponibili che potrebbero essere associati
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Load environment variables
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere configurati in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Normalizza nome esercizio per matching
function normalizeExerciseName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Estrai parole chiave da nome esercizio
function extractKeywords(name) {
  const normalized = normalizeExerciseName(name)
  const words = normalized.split(' ')
  
  // Rimuovi parole comuni
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
  return words.filter(w => w.length > 2 && !stopWords.includes(w))
}

// Matching fuzzy tra nome esercizio e nome video
function fuzzyMatch(exerciseName, videoName) {
  const exerciseNorm = normalizeExerciseName(exerciseName)
  const videoNorm = normalizeExerciseName(videoName)
  
  // Match esatto
  if (exerciseNorm === videoNorm) return 100
  
  // Match parziale
  if (videoNorm.includes(exerciseNorm) || exerciseNorm.includes(videoNorm)) return 80
  
  // Match per parole chiave
  const exerciseKeywords = extractKeywords(exerciseName)
  const videoKeywords = extractKeywords(videoName)
  
  let matchCount = 0
  exerciseKeywords.forEach(ek => {
    if (videoKeywords.some(vk => vk.includes(ek) || ek.includes(vk))) {
      matchCount++
    }
  })
  
  if (matchCount === 0) return 0
  
  return (matchCount / Math.max(exerciseKeywords.length, videoKeywords.length)) * 60
}

// Mappa nomi esercizi a possibili varianti nei video
const EXERCISE_VIDEO_MAP = {
  'Australian Pull-ups': ['australian', 'horizontal', 'row', 'incline pull'],
  'Chin-ups': ['chin', 'underhand', 'close pull'],
  'Pull-ups': ['pull', 'overhand', 'wide pull'],
  'L-sit Pull-ups': ['l-sit', 'lsit', 'l sit pull', 'l-sit pull'],
  'Negative Pull-ups': ['negative', 'eccentric', 'slow negative'],
  'Dips': ['dip'],
  'Push-ups': ['push', 'regular push'],
  'Diamond Push-ups': ['diamond'],
  'Wide Push-ups': ['wide push'],
  'Pike Push-ups': ['pike'],
  'Handstand Push-ups': ['handstand push'],
  'Leg Raises': ['leg raise', 'legs rise', 'knees', 'legs rises'],
  'Plank': ['plank'],
  'Side Plank': ['side plank'],
  'Hollow Body Hold': ['hollow', 'hold', 'hollow hold'],
  'Wipers': ['wiper', 'wipers'],
  'Crunches': ['crunch', 'crunches'],
  'Back Lever': ['back lever', 'lever', 'fl', 'front lever'],
  'Front Lever': ['front lever', 'lever', 'fl'],
  'Handstand': ['handstand'],
  'Muscle-up': ['muscle up', 'muscle-up'],
  'Planche': ['planche'],
  'Squats': ['squat'],
  'Bulgarian Split Squats': ['bulgarian', 'split squat'],
  'Calf Raises': ['calf'],
  'Jump Squats': ['jump squat'],
  'Lunges': ['lunge'],
  'Pistol Squats': ['pistol'],
  'Burpees': ['burpee'],
  'High Knees': ['high knee'],
  'Jumping Jacks': ['jumping jack'],
  'Mountain Climbers': ['mountain climber'],
  'Dragon Flag': ['dragon flag', 'dragon', 'flag', 'lever rises', 'tuck dragon'],
  'L-sit': ['l-sit', 'lsit', 'l sit', 'lever'],
}

async function checkExerciseVideos() {
  console.log('🔍 Controllo incrociato esercizi-video...\n')
  
  // 1. Recupera tutti gli esercizi dal database
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, name, category, video_url, group_id')
    .order('name')
  
  if (exercisesError) {
    console.error('❌ Errore recupero esercizi:', exercisesError.message)
    return
  }
  
  console.log(`📊 Trovati ${exercises.length} esercizi nel database\n`)
  
  // 2. Recupera tutti i video dallo storage (ricorsivo)
  async function listVideosRecursive(folderPath = 'shared') {
    const allVideos = []
    
    const { data: items, error } = await supabase.storage
      .from('exercise-videos')
      .list(folderPath, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      })
    
    if (error) {
      console.error(`❌ Errore listando ${folderPath}:`, error.message)
      return allVideos
    }
    
    if (!items || items.length === 0) {
      return allVideos
    }
    
    for (const item of items) {
      const itemPath = folderPath === 'shared' ? `shared/${item.name}` : `${folderPath}/${item.name}`
      
      // Se è una cartella (ha id), esplorala ricorsivamente
      if (item.id && !item.name.includes('.')) {
        const subVideos = await listVideosRecursive(itemPath)
        allVideos.push(...subVideos)
      } else if (item.name.endsWith('.m4v') || item.name.endsWith('.mp4')) {
        // È un file video
        const folder = folderPath.split('/').pop()
        allVideos.push({
          path: itemPath,
          name: item.name,
          folder: folder,
          fullPath: itemPath,
        })
      }
    }
    
    return allVideos
  }
  
  console.log('📹 Recupero video dallo storage...')
  const allVideos = await listVideosRecursive()
  
  // Se non trova video, prova a recuperarli dai video_url degli esercizi
  if (allVideos.length === 0) {
    console.log('⚠️  Nessun video trovato nello storage, controllo video_url degli esercizi...')
    const videoUrls = new Set()
    exercises.forEach(ex => {
      if (ex.video_url) {
        // Estrai il nome del file dal URL
        const urlParts = ex.video_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const folder = urlParts[urlParts.length - 2]
        if (fileName && folder) {
          videoUrls.add({ name: fileName, folder: folder, url: ex.video_url })
        }
      }
    })
    allVideos.push(...Array.from(videoUrls))
    console.log(`📹 Trovati ${allVideos.length} video dai video_url\n`)
  } else {
    console.log(`📹 Trovati ${allVideos.length} video nello storage\n`)
  }
  
  // 3. Raggruppa esercizi per nome (ignorando group_id per i video condivisi)
  const exercisesByName = new Map()
  exercises.forEach(ex => {
    const key = ex.name.toLowerCase().trim()
    if (!exercisesByName.has(key)) {
      exercisesByName.set(key, {
        name: ex.name,
        exercises: [],
        hasVideo: false,
        videoUrl: null,
      })
    }
    exercisesByName.get(key).exercises.push(ex)
    if (ex.video_url) {
      exercisesByName.get(key).hasVideo = true
      exercisesByName.get(key).videoUrl = ex.video_url
    }
  })
  
  // 4. Analizza ogni esercizio
  const exercisesWithVideo = []
  const exercisesWithoutVideo = []
  const suggestedMatches = []
  
  exercisesByName.forEach((exerciseGroup, key) => {
    const exerciseName = exerciseGroup.name
    
    if (exerciseGroup.hasVideo) {
      exercisesWithVideo.push({
        name: exerciseName,
        count: exerciseGroup.exercises.length,
        videoUrl: exerciseGroup.videoUrl,
      })
    } else {
      // Cerca video corrispondenti
      const matches = []
      
      allVideos.forEach(video => {
        const matchScore = fuzzyMatch(exerciseName, video.name)
        const keywords = EXERCISE_VIDEO_MAP[exerciseName] || []
        let keywordMatch = false
        
        if (keywords.length > 0) {
          const videoLower = video.name.toLowerCase()
          keywordMatch = keywords.some(kw => videoLower.includes(kw.toLowerCase()))
        }
        
        if (matchScore > 50 || keywordMatch) {
          matches.push({
            video: video,
            score: keywordMatch ? 90 : matchScore,
          })
        }
      })
      
      matches.sort((a, b) => b.score - a.score)
      
      exercisesWithoutVideo.push({
        name: exerciseName,
        category: exerciseGroup.exercises[0].category,
        count: exerciseGroup.exercises.length,
        suggestedVideos: matches.slice(0, 3), // Top 3 matches
      })
    }
  })
  
  // 5. Report
  console.log('='.repeat(80))
  console.log('📊 REPORT ESERCIZI-VIDEO')
  console.log('='.repeat(80))
  console.log('')
  
  console.log(`✅ ESERCIZI CON VIDEO: ${exercisesWithVideo.length}`)
  console.log('-'.repeat(80))
  exercisesWithVideo.forEach(ex => {
    console.log(`   ✓ ${ex.name} (${ex.count} esercizi)`)
  })
  console.log('')
  
  console.log(`❌ ESERCIZI SENZA VIDEO: ${exercisesWithoutVideo.length}`)
  console.log('-'.repeat(80))
  
  // Raggruppa per categoria
  const byCategory = {}
  exercisesWithoutVideo.forEach(ex => {
    if (!byCategory[ex.category]) {
      byCategory[ex.category] = []
    }
    byCategory[ex.category].push(ex)
  })
  
  Object.keys(byCategory).sort().forEach(category => {
    console.log(`\n📁 ${category.toUpperCase()}:`)
    byCategory[category].forEach(ex => {
      console.log(`   ❌ ${ex.name} (${ex.count} esercizi)`)
      if (ex.suggestedVideos.length > 0) {
        console.log(`      💡 Video suggeriti:`)
        ex.suggestedVideos.forEach((match, idx) => {
          console.log(`         ${idx + 1}. ${match.video.name} (score: ${Math.round(match.score)}%)`)
        })
      } else {
        console.log(`      ⚠️  Nessun video corrispondente trovato`)
      }
    })
  })
  
  console.log('')
  console.log('='.repeat(80))
  console.log(`📈 STATISTICHE:`)
  console.log(`   Totale esercizi unici: ${exercisesByName.size}`)
  console.log(`   ✅ Con video: ${exercisesWithVideo.length} (${Math.round(exercisesWithVideo.length * 100 / exercisesByName.size)}%)`)
  console.log(`   ❌ Senza video: ${exercisesWithoutVideo.length} (${Math.round(exercisesWithoutVideo.length * 100 / exercisesByName.size)}%)`)
  console.log(`   📹 Video disponibili: ${allVideos.length}`)
  console.log('='.repeat(80))
}

checkExerciseVideos().catch(console.error)
