#!/usr/bin/env node

/**
 * Script per caricare video degli esercizi in Supabase Storage
 * 
 * Usage:
 *   node scripts/upload-exercise-videos.js [path-to-videos-folder]
 * 
 * Esempio:
 *   node scripts/upload-exercise-videos.js "Basic course"
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere configurati in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Mapping nomi file video -> nomi esercizi basato sulla struttura delle cartelle
// I video sono organizzati in: Part 1 (Push), Part 2 (Pull), Part 3 (Core), Part 4 (Mobility)
const VIDEO_TO_EXERCISE_MAP = {
  // Push exercises (Part 1)
  'regular push up': 'Push-ups',
  'regular push ups': 'Push-ups',
  'pike push': 'Pike Push-ups',
  'pike push up': 'Pike Push-ups',
  'wide push': 'Wide Push-ups',
  'wide push up': 'Wide Push-ups',
  'diamond push': 'Diamond Push-ups',
  'diamond push up': 'Diamond Push-ups',
  'triceps': 'Push-ups',
  '1.1': 'Pike Push-ups',
  '1.2': 'Wide Push-ups',
  '1.3': 'Diamond Push-ups',
  '1.4': 'Push-ups',
  
  // Pull exercises (Part 2)
  'australian pull': 'Australian Pull-ups',
  'australian pull up': 'Australian Pull-ups',
  'pull up': 'Pull-ups',
  'pull ups': 'Pull-ups',
  'chin up': 'Chin-ups',
  'chin ups': 'Chin-ups',
  'trazione': 'Pull-ups',
  '2.1': 'Australian Pull-ups',
  '2.2': 'Pull-ups',
  '2.3': 'Chin-ups',
  
  // Core exercises (Part 3)
  'plank': 'Plank',
  'sit up': 'Sit-ups',
  'leg raise': 'Leg Raises',
  '3.1': 'Plank',
  '3.2': 'Sit-ups',
  '3.3': 'Leg Raises',
}

function findMatchingExercise(videoFilePath, videoFileName) {
  const lowerName = videoFileName.toLowerCase()
  const lowerPath = videoFilePath.toLowerCase()
  
  // Check if path contains exercise category hints
  const isPush = lowerPath.includes('pushing') || lowerPath.includes('push')
  const isPull = lowerPath.includes('pulling') || lowerPath.includes('pull')
  const isCore = lowerPath.includes('core')
  
  // Try exact matches first
  for (const [key, exerciseName] of Object.entries(VIDEO_TO_EXERCISE_MAP)) {
    if (lowerName.includes(key.toLowerCase())) {
      return exerciseName
    }
  }
  
  // Try pattern matching for progression codes (e.g., "1.2", "2.3")
  const progressionMatch = lowerName.match(/(\d+)\.(\d+)/)
  if (progressionMatch) {
    const group = parseInt(progressionMatch[1])
    const level = parseInt(progressionMatch[2])
    
    if (group === 1 && isPush) {
      // Push exercises
      if (level === 1) return 'Pike Push-ups'
      if (level === 2) return 'Wide Push-ups'
      if (level === 3) return 'Diamond Push-ups'
      if (level === 4) return 'Push-ups'
    } else if (group === 2 && isPull) {
      // Pull exercises
      if (level === 1) return 'Australian Pull-ups'
      if (level === 2) return 'Pull-ups'
      if (level === 3) return 'Chin-ups'
    }
  }
  
  return null
}

async function uploadVideo(filePath, exerciseName, groupId) {
  const fileName = path.basename(filePath)
  const fileExt = path.extname(fileName)
  // Use original filename to preserve uniqueness (multiple videos per exercise possible)
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `exercise-videos/${groupId}/${exerciseName.replace(/\s+/g, '-').toLowerCase()}/${safeFileName}`
  
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2)
    
    console.log(`📤 Uploading ${fileName} (${fileSizeMB} MB)...`)
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('exercise-videos')
      .upload(storagePath, fileBuffer, {
        contentType: fileExt === '.m4v' ? 'video/mp4' : `video/${fileExt.slice(1)}`,
        upsert: true,
      })
    
    if (error) {
      console.error(`❌ Errore upload ${fileName}:`, error.message)
      return null
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exercise-videos')
      .getPublicUrl(storagePath)
    
    console.log(`✅ Uploaded: ${fileName} -> ${exerciseName}`)
    return publicUrl
  } catch (err) {
    console.error(`❌ Errore processando ${fileName}:`, err.message)
    return null
  }
}

async function updateExerciseVideoUrl(exerciseName, videoUrl, groupId) {
  // Check if exercise exists
  const { data: existing } = await supabase
    .from('exercises')
    .select('id, video_url')
    .eq('group_id', groupId)
    .eq('name', exerciseName)
    .limit(1)
  
  if (!existing || existing.length === 0) {
    console.log(`⚠️  Esercizio non trovato: ${exerciseName} (crea l'esercizio prima)`)
    return false
  }
  
  // Update video_url (append if multiple videos, or replace)
  const { error } = await supabase
    .from('exercises')
    .update({ video_url: videoUrl })
    .eq('group_id', groupId)
    .eq('name', exerciseName)
  
  if (error) {
    console.error(`❌ Errore aggiornamento ${exerciseName}:`, error.message)
    return false
  }
  
  console.log(`✅ Aggiornato video_url per: ${exerciseName}`)
  return true
}

async function processVideosFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Cartella non trovata: ${folderPath}`)
    return
  }
  
  console.log(`📁 Processando cartella: ${folderPath}`)
  
  // Get group_id from first user (or you can specify it)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('group_id')
    .not('group_id', 'is', null)
    .limit(1)
  
  if (!profiles || profiles.length === 0) {
    console.error('❌ Nessun gruppo trovato nel database')
    return
  }
  
  const groupId = profiles[0].group_id
  console.log(`📋 Usando group_id: ${groupId}`)
  
  // Find all video files
  const videoFiles = []
  function findVideos(dir) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        findVideos(filePath)
      } else if (/\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(file)) {
        videoFiles.push(filePath)
      }
    }
  }
  
  findVideos(folderPath)
  console.log(`📹 Trovati ${videoFiles.length} video files`)
  
  if (videoFiles.length === 0) {
    console.log('⚠️  Nessun video trovato nella cartella')
    return
  }
  
  // Process each video
  for (const videoPath of videoFiles) {
    const fileName = path.basename(videoPath)
    const exerciseName = findMatchingExercise(videoPath, fileName)
    
    if (!exerciseName) {
      console.log(`⚠️  Nessun match per: ${fileName} (salto)`)
      console.log(`   Path: ${videoPath}`)
      continue
    }
    
    const videoUrl = await uploadVideo(videoPath, exerciseName, groupId)
    if (videoUrl) {
      await updateExerciseVideoUrl(exerciseName, videoUrl, groupId)
    }
  }
  
  console.log('\n✅ Upload completato!')
}

// Main
const videosFolder = process.argv[2] || 'Basic course'
const fullPath = path.join(__dirname, '..', videosFolder)

processVideosFolder(fullPath).catch(console.error)
