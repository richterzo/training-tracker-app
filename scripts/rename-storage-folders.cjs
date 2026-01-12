#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere configurati in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapping: nome esercizio nel DB -> slug cartella corretta
const exerciseToCorrectSlug = {
  'Push-ups': 'push-ups',
  'Pike Push-ups': 'pike-push-ups',
  'Wide Push-ups': 'wide-push-ups',
  'Diamond Push-ups': 'diamond-push-ups',
  'Dips': 'dips',
  'Triceps Extension Push-ups': 'triceps-extension-push-ups',
  'Typewriter Push-ups': 'typewriter-push-ups',
  'Australian Pull-ups': 'australian-pull-ups',
  'Pull-ups': 'pull-ups',
  'Chin-ups': 'chin-ups',
  'Negative Pull-ups': 'negative-pull-ups',
  'L-sit Pull-ups': 'l-sit-pull-ups',
  'Typewriter Pull-ups': 'typewriter-pull-ups',
  'Lever Rises': 'lever-rises',
  'Crunches': 'crunches',
  'Leg Raises': 'leg-raises',
  'Plank': 'plank',
  'Hollow Body Hold': 'hollow-body-hold',
  'Wipers': 'wipers',
  'Side Plank': 'side-plank',
};

// Mapping: cartelle esistenti -> nome esercizio corretto
const folderToExercise = {
  'australian-pull-ups': 'Australian Pull-ups',
  'diamond-push-ups': 'Diamond Push-ups',
  'dips': 'Dips',
  'hollow-body-hold': 'Hollow Body Hold',
  'leg-raises': 'Leg Raises',
  'negative-pull-ups': 'Negative Pull-ups',
  'plank': 'Plank',
  'push-ups': 'Push-ups',
  'side-plank': 'Side Plank',
  'typewriter-pull-ups': 'Typewriter Pull-ups',
  'typewriter-push-ups': 'Typewriter Push-ups',
  'wide-push-ups': 'Wide Push-ups',
  'wipers': 'Wipers',
};

async function renameStorageFolders() {
  console.log('🔄 Rinomino le cartelle nello storage per match perfetto...\n');

  // Le cartelle sono già corrette! Verifichiamo solo che i video siano linkati
  const { data: folders } = await supabase.storage
    .from('exercise-videos')
    .list('shared', { limit: 1000 });

  if (!folders) {
    console.error('❌ Errore nel recupero cartelle');
    return;
  }

  console.log(`📁 Cartelle esistenti: ${folders.filter(f => !f.id).length}\n`);

  // Per ogni cartella, verifica che i video siano linkati agli esercizi corretti
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, video_url, group_id')
    .order('name');

  let updated = 0;

  for (const folder of folders.filter(f => !f.id)) {
    const folderName = folder.name;
    const exerciseName = folderToExercise[folderName];

    if (!exerciseName) {
      console.log(`⚠️  Nessun mapping per cartella: ${folderName}`);
      continue;
    }

    // Ottieni il primo video nella cartella
    const { data: files } = await supabase.storage
      .from('exercise-videos')
      .list(`shared/${folderName}`, { limit: 10 });

    if (!files || files.length === 0) {
      console.log(`⚠️  Nessun file in: ${folderName}`);
      continue;
    }

    // Preferisci video con "regular" o "2." nel nome
    const regularVideo = files.find(f => 
      f.name.toLowerCase().includes('regular') || 
      f.name.toLowerCase().includes('2.')
    );
    const videoFile = regularVideo || files[0];

    const { data: { publicUrl } } = supabase.storage
      .from('exercise-videos')
      .getPublicUrl(`shared/${folderName}/${videoFile.name}`);

    // Trova esercizi con questo nome che non hanno video_url
    const exercisesToUpdate = exercises.filter(ex => 
      ex.name === exerciseName && !ex.video_url
    );

    if (exercisesToUpdate.length > 0) {
      for (const exercise of exercisesToUpdate) {
        const { error } = await supabase
          .from('exercises')
          .update({ video_url: publicUrl })
          .eq('id', exercise.id);

        if (error) {
          console.error(`   ❌ Errore aggiornamento "${exercise.name}": ${error.message}`);
        } else {
          console.log(`   ✅ Linkato "${exercise.name}" -> ${folderName}/${videoFile.name}`);
          updated++;
        }
      }
    } else {
      console.log(`   ℹ️  "${exerciseName}" già ha video_url o non esiste nel database`);
    }
  }

  console.log(`\n✅ Completato! ${updated} esercizi aggiornati.`);
}

renameStorageFolders().catch(console.error);
