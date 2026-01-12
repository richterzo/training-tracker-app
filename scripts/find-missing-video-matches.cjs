#!/usr/bin/env node

/**
 * Script per trovare video nella cartella compressa che potrebbero essere associati
 * agli esercizi mancanti ma non vengono matchati correttamente
 */

const fs = require('fs')
const path = require('path')

const COMPRESSED_FOLDER = 'Basic course _compressed'

// Esercizi senza video
const EXERCISES_WITHOUT_VIDEO = [
  'Burpees',
  'High Knees',
  'Jumping Jacks',
  'Mountain Climbers',
  'Dragon Flag',
  'L-sit',
  'Bulgarian Split Squats',
  'Calf Raises',
  'Jump Squats',
  'Lunges',
  'Pistol Squats',
  'Squats',
  'L-sit Pull-ups',
  'Back Lever',
  'Front Lever',
  'Handstand',
  'Muscle-up',
  'Planche',
  'Crunches', // Verifico se esiste
  'Wipers', // Verifico se esiste
]

// Keywords per matching
const EXERCISE_KEYWORDS = {
  'Dragon Flag': ['dragon', 'flag', 'lever rises', 'tuck dragon'],
  'L-sit': ['l-sit', 'lsit', 'l sit'],
  'Crunches': ['crunch'],
  'Wipers': ['wiper', 'wipers'],
  'L-sit Pull-ups': ['l-sit pull', 'lsit pull'],
  'Back Lever': ['back lever', 'lever'],
  'Front Lever': ['front lever', 'lever', 'fl'],
  'Handstand': ['handstand'],
  'Muscle-up': ['muscle up', 'muscle-up'],
  'Planche': ['planche'],
  'Squats': ['squat'],
  'Bulgarian Split Squats': ['bulgarian', 'split'],
  'Calf Raises': ['calf'],
  'Jump Squats': ['jump squat'],
  'Lunges': ['lunge'],
  'Pistol Squats': ['pistol'],
  'Burpees': ['burpee'],
  'High Knees': ['high knee'],
  'Jumping Jacks': ['jumping jack'],
  'Mountain Climbers': ['mountain climber'],
}

function findVideosRecursive(dir) {
  const videos = []
  
  if (!fs.existsSync(dir)) {
    return videos
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    
    if (item.isDirectory()) {
      videos.push(...findVideosRecursive(fullPath))
    } else if (item.isFile() && (item.name.endsWith('.m4v') || item.name.endsWith('.mp4'))) {
      videos.push({
        path: fullPath,
        name: item.name,
        folder: path.dirname(fullPath),
      })
    }
  }
  
  return videos
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

function findMatches() {
  console.log('🔍 Cercando video nella cartella compressa...\n')
  
  const allVideos = findVideosRecursive(COMPRESSED_FOLDER)
  console.log(`📹 Trovati ${allVideos.length} video totali\n`)
  
  console.log('='.repeat(80))
  console.log('📊 ANALISI MATCHING VIDEO-ESERCIZI')
  console.log('='.repeat(80))
  console.log('')
  
  EXERCISES_WITHOUT_VIDEO.forEach(exercise => {
    const keywords = EXERCISE_KEYWORDS[exercise] || []
    const exerciseNorm = normalize(exercise)
    
    const matches = []
    
    allVideos.forEach(video => {
      const videoNorm = normalize(video.name + ' ' + path.basename(video.folder))
      
      // Match per keywords
      let keywordMatch = false
      if (keywords.length > 0) {
        keywordMatch = keywords.some(kw => videoNorm.includes(normalize(kw)))
      }
      
      // Match parziale nome esercizio
      const partialMatch = videoNorm.includes(exerciseNorm) || exerciseNorm.includes(videoNorm)
      
      // Match per parole chiave nel nome esercizio
      const exerciseWords = exerciseNorm.split(' ')
      const videoWords = videoNorm.split(' ')
      const wordMatches = exerciseWords.filter(ew => 
        videoWords.some(vw => vw.includes(ew) || ew.includes(vw))
      )
      const wordMatchScore = wordMatches.length / Math.max(exerciseWords.length, 1)
      
      if (keywordMatch || partialMatch || wordMatchScore > 0.3) {
        let score = 0
        if (keywordMatch) score += 50
        if (partialMatch) score += 30
        score += wordMatchScore * 20
        
        matches.push({
          video: video,
          score: score,
          reasons: [
            keywordMatch && 'keyword match',
            partialMatch && 'partial name match',
            wordMatchScore > 0.3 && `word match (${Math.round(wordMatchScore * 100)}%)`
          ].filter(Boolean)
        })
      }
    })
    
    matches.sort((a, b) => b.score - a.score)
    
    if (matches.length > 0) {
      console.log(`✅ ${exercise}:`)
      console.log(`   Trovati ${matches.length} possibili match:`)
      matches.slice(0, 5).forEach((match, idx) => {
        const relPath = path.relative(COMPRESSED_FOLDER, match.video.path)
        console.log(`   ${idx + 1}. ${match.video.name} (score: ${Math.round(match.score)}%)`)
        console.log(`      Path: ${relPath}`)
        console.log(`      Reasons: ${match.reasons.join(', ')}`)
      })
      console.log('')
    } else {
      console.log(`❌ ${exercise}: Nessun video trovato`)
      console.log('')
    }
  })
  
  console.log('='.repeat(80))
  console.log('💡 CONCLUSIONE:')
  console.log('   Se vedi match con score > 50%, i video esistono ma non vengono associati.')
  console.log('   Se non vedi match, i video non esistono nella cartella compressa.')
  console.log('='.repeat(80))
}

findMatches()
