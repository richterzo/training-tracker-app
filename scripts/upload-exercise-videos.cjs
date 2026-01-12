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
  '1 regular push ups': 'Push-ups',
  '1 regular push up': 'Push-ups',
  '2. pike push ups': 'Pike Push-ups',
  '2. pike push up': 'Pike Push-ups',
  '2 pike push ups': 'Pike Push-ups',
  '2 pike push up': 'Pike Push-ups',
  '3. wide push ups': 'Wide Push-ups',
  '3. wide push up': 'Wide Push-ups',
  '3 wide push ups': 'Wide Push-ups',
  '3 wide push up': 'Wide Push-ups',
  '4. diamond push ups': 'Diamond Push-ups',
  '4. diamond push up': 'Diamond Push-ups',
  '4 diamond push ups': 'Diamond Push-ups',
  '4 diamond push up': 'Diamond Push-ups',
  '5. dips 1st variation': 'Dips',
  '5. dips 1st': 'Dips',
  '5 dips 1st variation': 'Dips',
  '5 dips 1st': 'Dips',
  '6. dips 2nd variation': 'Dips',
  '6. dips 2nd': 'Dips',
  '6 dips 2nd variation': 'Dips',
  '6 dips 2nd': 'Dips',
  '7. triceps extension push ups': 'Triceps Extension Push-ups',
  '7. triceps extension': 'Triceps Extension Push-ups',
  '7 triceps extension push ups': 'Triceps Extension Push-ups',
  '7 triceps extension': 'Triceps Extension Push-ups',
  '8. typewriter': 'Typewriter Push-ups',
  '8 typewriter': 'Typewriter Push-ups',
  
  // Part 2: Pulling Strength
  '1. wide australian pull ups': 'Australian Pull-ups',
  '1. wide australian pull up': 'Australian Pull-ups',
  '1 wide australian pull ups': 'Australian Pull-ups',
  '1 wide australian pull up': 'Australian Pull-ups',
  '2. close australian pull ups': 'Australian Pull-ups',
  '2. close australian pull up': 'Australian Pull-ups',
  '2 close australian pull ups': 'Australian Pull-ups',
  '2 close australian pull up': 'Australian Pull-ups',
  '3. leant australian pull ups': 'Australian Pull-ups',
  '3. leant australian pull up': 'Australian Pull-ups',
  '3 leant australian pull ups': 'Australian Pull-ups',
  '3 leant australian pull up': 'Australian Pull-ups',
  '4. wide pull ups': 'Pull-ups',
  '4. wide pull up': 'Pull-ups',
  '4 wide pull ups': 'Pull-ups',
  '4 wide pull up': 'Pull-ups',
  '5. close pull ups with retraction': 'Pull-ups',
  '5. close pull ups': 'Pull-ups',
  '5 close pull ups with retraction': 'Pull-ups',
  '5 close pull ups': 'Pull-ups',
  // Chin-ups mapping (close pull ups with underhand = chin-ups)
  '5. close pull ups': 'Chin-ups',
  '5 close pull ups': 'Chin-ups',
  'close pull ups': 'Chin-ups',
  'chin up': 'Chin-ups',
  'chin ups': 'Chin-ups',
  'chin-up': 'Chin-ups',
  'chin-ups': 'Chin-ups',
  // Negative Pull-ups
  'negative pull up': 'Negative Pull-ups',
  'negative pull ups': 'Negative Pull-ups',
  'negative pull-up': 'Negative Pull-ups',
  'negative pull-ups': 'Negative Pull-ups',
  'slow negative': 'Negative Pull-ups',
  'slow negatives': 'Negative Pull-ups',
  // L-sit Pull-ups
  'l-sit pull up': 'L-sit Pull-ups',
  'l-sit pull ups': 'L-sit Pull-ups',
  'l sit pull up': 'L-sit Pull-ups',
  'l sit pull ups': 'L-sit Pull-ups',
  '6. lever rises and shrugs': 'Lever Rises',
  '6 lever rises and shrugs': 'Lever Rises',
  '7. typewriter': 'Typewriter Pull-ups',
  '7 typewriter': 'Typewriter Pull-ups',
  
  // Part 3: Core Strength
  '1. crunches': 'Crunches',
  '1 crunches': 'Crunches',
  '2. legs rises (floor)': 'Leg Raises',
  '2. legs rises': 'Leg Raises',
  '2 legs rises (floor)': 'Leg Raises',
  '2 legs rises': 'Leg Raises',
  'legs rise': 'Leg Raises',
  'leg rises': 'Leg Raises',
  'leg raise': 'Leg Raises',
  'leg raises': 'Leg Raises',
  '3. legs rises (high bar)': 'Leg Raises',
  '3 legs rises (high bar)': 'Leg Raises',
  '4. plank': 'Plank',
  '4 plank': 'Plank',
  'plank': 'Plank',
  '5. hollow hold': 'Hollow Body Hold',
  '5 hollow hold': 'Hollow Body Hold',
  'hollow hold': 'Hollow Body Hold',
  'hollow body': 'Hollow Body Hold',
  '6. wipers': 'Wipers',
  '6 wipers': 'Wipers',
  'wipers': 'Wipers',
  '7. side plank': 'Side Plank',
  '7 side plank': 'Side Plank',
  'side plank': 'Side Plank',
  // Dragon Flag
  'dragon flag': 'Dragon Flag',
  'dragon flags': 'Dragon Flag',
  // L-sit
  'l-sit': 'L-sit',
  'l sit': 'L-sit',
  'lsit': 'L-sit',
}

// Trova il nome dell'esercizio basato sulla cartella del video
function findExerciseFromFolder(videoFilePath) {
  const normalizedPath = videoFilePath.toLowerCase()
  const pathParts = normalizedPath.split(path.sep)
  
  // Cerca nella struttura: Part X/Number. Exercise Name/video.m4v
  // Partiamo dalla fine (cartella più specifica)
  for (let i = pathParts.length - 1; i >= 0; i--) {
    let folderName = pathParts[i].trim()
    
    // Rimuovi estensioni se presenti
    folderName = folderName.replace(/\.(m4v|mp4|mov|avi|webm|mkv)$/i, '')
    
    // Prova match esatto (più preciso)
    if (FOLDER_TO_EXERCISE_MAP[folderName]) {
      return FOLDER_TO_EXERCISE_MAP[folderName]
    }
    
    // Prova match senza punto dopo il numero (es. "1 regular push ups")
    const withoutDot = folderName.replace(/^(\d+)\./, '$1 ')
    if (FOLDER_TO_EXERCISE_MAP[withoutDot]) {
      return FOLDER_TO_EXERCISE_MAP[withoutDot]
    }
    
    // Prova match parziale più specifico (deve contenere parole chiave)
    for (const [key, exerciseName] of Object.entries(FOLDER_TO_EXERCISE_MAP)) {
      // Match più preciso: la cartella deve contenere le parole chiave
      const keyWords = key.split(/\s+/).filter(w => w.length > 2)
      const folderWords = folderName.split(/\s+/)
      
      // Se almeno 2 parole chiave corrispondono
      const matches = keyWords.filter(kw => 
        folderWords.some(fw => fw.includes(kw) || kw.includes(fw))
      )
      
      if (matches.length >= 2) {
        return exerciseName
      }
    }
    
    // Match per numero come fallback (solo se siamo in Part 1 o Part 2)
    const partMatch = normalizedPath.match(/part\s*(\d+)/)
    const numberMatch = folderName.match(/^(\d+)[\.\s]/)
    
    if (partMatch && numberMatch) {
      const partNum = parseInt(partMatch[1])
      const exNum = parseInt(numberMatch[1])
      
      // Mapping diretto per Part 1 (Push)
      if (partNum === 1) {
        const pushMap = {
          1: 'Push-ups',
          2: 'Pike Push-ups',
          3: 'Wide Push-ups',
          4: 'Diamond Push-ups',
          5: 'Dips',
          6: 'Dips',
          7: 'Triceps Extension Push-ups',
          8: 'Typewriter Push-ups'
        }
        if (pushMap[exNum]) return pushMap[exNum]
      }
      
      // Mapping diretto per Part 2 (Pull)
      if (partNum === 2) {
        const pullMap = {
          1: 'Australian Pull-ups',
          2: 'Australian Pull-ups', // Potrebbe essere anche Chin-ups se "close"
          3: 'Australian Pull-ups',
          4: 'Pull-ups',
          5: 'Chin-ups', // Close pull ups = Chin-ups
          6: 'Lever Rises',
          7: 'Typewriter Pull-ups'
        }
        // Verifica se è "close" per Chin-ups
        if (exNum === 2 && folderName.includes('close')) {
          return 'Chin-ups'
        }
        if (exNum === 5 && folderName.includes('close')) {
          return 'Chin-ups'
        }
        if (pullMap[exNum]) return pullMap[exNum]
      }
      
      // Mapping per Part 3 (Core)
      if (partNum === 3) {
        const coreMap = {
          1: 'Crunches',
          2: 'Leg Raises',
          3: 'Leg Raises',
          4: 'Plank',
          5: 'Hollow Body Hold',
          6: 'Wipers',
          7: 'Side Plank'
        }
        if (coreMap[exNum]) return coreMap[exNum]
      }
    }
  }
  
  return null
}

async function uploadVideo(filePath, exerciseName, groupId = null) {
  const fileName = path.basename(filePath)
  const fileExt = path.extname(fileName)
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  // Path corretto: exercise-name/video.m4v (senza group_id, esercizi trasversali)
  // Se groupId è null, usa path globale per esercizi condivisi
  const storagePath = groupId 
    ? `${groupId}/${exerciseName.replace(/\s+/g, '-').toLowerCase()}/${safeFileName}`
    : `shared/${exerciseName.replace(/\s+/g, '-').toLowerCase()}/${safeFileName}`
  
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
  
  // Get all groups (i video tutorial sono condivisi per tutti i gruppi)
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('group_id')
    .not('group_id', 'is', null)
  
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
  
  // Get unique group IDs
  const groupIds = [...new Set(profiles.map(p => p.group_id).filter(Boolean))]
  console.log(`📋 Trovati ${groupIds.length} gruppi\n`)
  console.log('💡 I 99 video tutorial sono CONdivisi per tutti i gruppi')
  console.log('   Ogni gruppo può anche caricare i propri esercizi personalizzati\n')
  
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
    
    // Carica tutti i video (una volta sola, senza group_id - esercizi trasversali)
    for (const video of videos) {
      console.log(`   📤 Caricando: ${video.fileName}${video.isMain ? ' (PRINCIPALE)' : ''}...`)
      const publicUrl = await uploadVideo(video.filePath, exerciseName, null) // null = path condiviso
      
      if (publicUrl) {
        if (video.isMain || !mainVideoUrl) {
          mainVideoUrl = publicUrl
        }
        console.log(`   ✅ Caricato`)
      }
    }
    
    // Aggiorna il campo video_url con il video principale per TUTTI i gruppi
    // I video tutorial sono condivisi: stesso video per tutti gli esercizi con lo stesso nome
    // OTTIMIZZATO: una singola query invece di loop per gruppo
    if (mainVideoUrl) {
      // Aggiorna tutti gli esercizi con questo nome in tutti i gruppi in una singola query
      const { data: updated, error: updateError, count } = await supabase
        .from('exercises')
        .update({ video_url: mainVideoUrl })
        .eq('name', exerciseName)
        .in('group_id', groupIds)
        .select('id', { count: 'exact' })
      
      if (updateError) {
        console.error(`   ❌ Errore aggiornamento:`, updateError.message)
      } else {
        const updatedCount = count || (updated ? updated.length : 0)
        if (updatedCount > 0) {
          console.log(`   ✅ Aggiornato video_url per "${exerciseName}"`)
          console.log(`   📊 ${updatedCount} esercizi aggiornati in tutti i gruppi`)
          console.log(`   🔗 Link condiviso: ${mainVideoUrl}\n`)
        } else {
          console.warn(`   ⚠️  Nessun esercizio "${exerciseName}" trovato nei gruppi`)
          console.warn(`   💡 Gli esercizi verranno creati quando i gruppi li aggiungeranno\n`)
        }
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
