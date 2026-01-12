#!/usr/bin/env node

/**
 * Script per caricare video degli esercizi in Supabase Storage
 * 
 * Usage:
 *   node scripts/upload-exercise-videos.cjs [path-to-videos-folder]
 * 
 * Esempio:
 *   node scripts/upload-exercise-videos.cjs "Basic course "
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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere configurati in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Mapping cartelle esercizi -> nomi esercizi nel database
// Basato sulla struttura: "Part X. Category/Number. Exercise Name/"
const FOLDER_TO_EXERCISE_MAP = {
  // Part 1: Pushing Power
  '1. regular push ups': 'Push-ups',
  '1. regular push up': 'Push-ups',
  '2. pike push ups': 'Pike Push-ups',
  '2. pike push up': 'Pike Push-ups',
  '3. wide push ups': 'Wide Push-ups',
  '3. wide push up': 'Wide Push-ups',
  '4. diamond push ups': 'Diamond Push-ups',
  '4. diamond push up': 'Diamond Push-ups',
  '5. dips 1st variation': 'Dips',
  '5. dips 1st': 'Dips',
  '6. dips 2nd variation': 'Dips',
  '6. dips 2nd': 'Dips',
  '7. triceps extension push ups': 'Triceps Extension Push-ups',
  '7. triceps extension': 'Triceps Extension Push-ups',
  '8. typewriter': 'Typewriter Push-ups',
  
  // Part 2: Pulling Strength
  '1. wide australian pull ups': 'Australian Pull-ups',
  '1. wide australian pull up': 'Australian Pull-ups',
  '2. close australian pull ups': 'Australian Pull-ups',
  '2. close australian pull up': 'Australian Pull-ups',
  '3. leant australian pull ups': 'Australian Pull-ups',
  '3. leant australian pull up': 'Australian Pull-ups',
  '4. wide pull ups': 'Pull-ups',
  '4. wide pull up': 'Pull-ups',
  '5. close pull ups with retraction': 'Pull-ups',
  '5. close pull ups': 'Pull-ups',
  '6. lever rises and shrugs': 'Lever Rises',
  '7. typewriter': 'Typewriter Pull-ups',
  
  // Part 3: Core Strength
  '1. crunches': 'Crunches',
  '2. legs rises (floor)': 'Leg Raises',
  '2. legs rises': 'Leg Raises',
  '3. legs rises (high bar)': 'Leg Raises',
  '4. plank': 'Plank',
  '5. hollow hold': 'Hollow Hold',
  '6. wipers': 'Wipers',
  '7. side plank': 'Side Plank',
}

// Trova il nome dell'esercizio basato sulla cartella del video
function findExerciseFromFolder(videoFilePath) {
  const normalizedPath = videoFilePath.toLowerCase()
  const pathParts = normalizedPath.split(path.sep)
  
  // Cerca nella struttura: Part X/Number. Exercise Name/video.m4v
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const folderName = pathParts[i].trim()
    
    // Prova match esatto
    if (FOLDER_TO_EXERCISE_MAP[folderName]) {
      return FOLDER_TO_EXERCISE_MAP[folderName]
    }
    
    // Prova match parziale (es. "1. regular push ups" -> "1. regular push up")
    for (const [key, exerciseName] of Object.entries(FOLDER_TO_EXERCISE_MAP)) {
      if (folderName.includes(key) || key.includes(folderName)) {
        return exerciseName
      }
    }
    
    // Match per numero (es. "1." -> "1. regular push ups")
    const numberMatch = folderName.match(/^(\d+)\./)
    if (numberMatch) {
      const num = numberMatch[1]
      for (const [key, exerciseName] of Object.entries(FOLDER_TO_EXERCISE_MAP)) {
        if (key.startsWith(`${num}.`)) {
          return exerciseName
        }
      }
    }
  }
  
  return null
}

async function uploadVideo(filePath, exerciseName, groupId) {
  const fileName = path.basename(filePath)
  const fileExt = path.extname(fileName)
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${groupId}/${exerciseName.replace(/\s+/g, '-').toLowerCase()}/${safeFileName}`
  
  try {
    const fileStats = fs.statSync(filePath)
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2)
    const MAX_SIZE_MB = 50 // Supabase Storage limit
    
    // Check file size
    if (fileStats.size > MAX_SIZE_MB * 1024 * 1024) {
      console.warn(`   ⚠️  File troppo grande (${fileSizeMB} MB > ${MAX_SIZE_MB} MB): ${fileName}`)
      console.warn(`   💡 Considera di comprimere il video o usare un servizio esterno`)
      return null
    }
    
    const fileBuffer = fs.readFileSync(filePath)
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('exercise-videos')
      .upload(storagePath, fileBuffer, {
        contentType: fileExt === '.m4v' ? 'video/mp4' : `video/${fileExt.slice(1)}`,
        upsert: true,
      })
    
    if (error) {
      console.error(`   ❌ Errore upload ${fileName}:`, error.message)
      return null
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exercise-videos')
      .getPublicUrl(storagePath)
    
    console.log(`   ✅ Caricato (${fileSizeMB} MB)`)
    return publicUrl
  } catch (err) {
    console.error(`   ❌ Errore processando ${fileName}:`, err.message)
    return null
  }
}

async function processVideosFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Cartella non trovata: ${folderPath}`)
    return
  }
  
  console.log(`📁 Processando cartella: ${folderPath}\n`)
  
  // Get group_id from first user
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('group_id')
    .not('group_id', 'is', null)
    .limit(1)
  
  if (profileError) {
    console.error('❌ Errore nel recupero profili:', profileError.message)
    console.error('💡 Assicurati di avere SUPABASE_SERVICE_ROLE_KEY in .env.local')
    return
  }
  
  if (!profiles || profiles.length === 0) {
    console.error('❌ Nessun gruppo trovato nel database')
    console.error('💡 Crea prima un utente e un gruppo tramite onboarding')
    return
  }
  
  const groupId = profiles[0].group_id
  console.log(`📋 Usando group_id: ${groupId}\n`)
  
  // Raggruppa i video per esercizio
  const exerciseVideos = new Map() // exerciseName -> [{filePath, fileName, isMain}]
  
  function walkSync(dir, fileList = []) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file)
      if (fs.statSync(filePath).isDirectory()) {
        walkSync(filePath, fileList)
      } else if (/\.(m4v|mp4|mov|avi|webm|mkv)$/i.test(file)) {
        fileList.push(filePath)
      }
    })
    return fileList
  }
  
  const allVideoFiles = walkSync(folderPath)
  console.log(`📹 Trovati ${allVideoFiles.length} file video\n`)
  
  // Prima passata: trova tutti gli esercizi e raggruppa i video
  for (const filePath of allVideoFiles) {
    const fileName = path.basename(filePath, path.extname(filePath))
    const exerciseName = findExerciseFromFolder(filePath)
    
    if (exerciseName) {
      if (!exerciseVideos.has(exerciseName)) {
        exerciseVideos.set(exerciseName, [])
      }
      
      // Determina se è il video principale (es. "1.2 regular" o "2.2 regular" sono i principali)
      const isMain = /(regular|2\.|2\s)/i.test(fileName) && !/(incline|decline|slow|pause|negative)/i.test(fileName)
      
      exerciseVideos.get(exerciseName).push({
        filePath,
        fileName: path.basename(filePath),
        isMain
      })
    } else {
      console.warn(`⚠️  Nessun esercizio trovato per: ${path.basename(filePath)}`)
    }
  }
  
  console.log(`📊 Trovati ${exerciseVideos.size} esercizi con video\n`)
  
  // Seconda passata: carica i video e aggiorna il database
  for (const [exerciseName, videos] of exerciseVideos.entries()) {
    console.log(`🎯 Esercizio: ${exerciseName}`)
    console.log(`   Video trovati: ${videos.length}`)
    
    // Ordina: video principale per primo
    videos.sort((a, b) => {
      if (a.isMain && !b.isMain) return -1
      if (!a.isMain && b.isMain) return 1
      return 0
    })
    
    let mainVideoUrl = null
    
    // Carica tutti i video
    for (const video of videos) {
      console.log(`   📤 Caricando: ${video.fileName}${video.isMain ? ' (PRINCIPALE)' : ''}...`)
      const publicUrl = await uploadVideo(video.filePath, exerciseName, groupId)
      
      if (publicUrl) {
        if (video.isMain || !mainVideoUrl) {
          mainVideoUrl = publicUrl
        }
        console.log(`   ✅ Caricato`)
      }
    }
    
    // Aggiorna il campo video_url con il video principale
    if (mainVideoUrl) {
      const { error: updateError } = await supabase
        .from('exercises')
        .update({ video_url: mainVideoUrl })
        .eq('group_id', groupId)
        .eq('name', exerciseName)
      
      if (updateError) {
        console.error(`   ❌ Errore aggiornamento video_url per ${exerciseName}:`, updateError.message)
      } else {
        console.log(`   ✅ Aggiornato video_url principale per "${exerciseName}"`)
        console.log(`   🔗 Link: ${mainVideoUrl}\n`)
      }
    }
  }
  
  console.log('\n🏁 Processo di upload completato!')
  console.log(`✅ ${exerciseVideos.size} esercizi aggiornati con video`)
}

// Main
const videosFolder = process.argv[2] || 'Basic course '
const fullPath = path.resolve(process.cwd(), videosFolder)

processVideosFolder(fullPath).catch(console.error)
