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

// Converte nome esercizio in slug
function exerciseToSlug(name) {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Mapping nomi esercizi -> slug possibili
const exerciseSlugMap = {
  'Push-ups': ['push-ups', 'pushups'],
  'Pike Push-ups': ['pike-push-ups', 'pike-pushups'],
  'Wide Push-ups': ['wide-push-ups', 'wide-pushups'],
  'Diamond Push-ups': ['diamond-push-ups', 'diamond-pushups'],
  'Dips': ['dips'],
  'Triceps Extension Push-ups': ['triceps-extension-push-ups'],
  'Typewriter Push-ups': ['typewriter-push-ups', 'typewriter'],
  'Australian Pull-ups': ['australian-pull-ups', 'australian-pullups'],
  'Pull-ups': ['pull-ups', 'pullups'],
  'Chin-ups': ['chin-ups', 'chinups'],
  'Negative Pull-ups': ['negative-pull-ups', 'negative-pullups'],
  'L-sit Pull-ups': ['l-sit-pull-ups', 'lsit-pull-ups'],
  'Typewriter Pull-ups': ['typewriter-pull-ups', 'typewriter'],
  'Lever Rises': ['lever-rises'],
  'Crunches': ['crunches'],
  'Leg Raises': ['leg-raises', 'legs-rises'],
  'Plank': ['plank'],
  'Hollow Body Hold': ['hollow-body-hold', 'hollow-hold'],
  'Wipers': ['wipers'],
  'Side Plank': ['side-plank'],
};

async function listStorageFolders() {
  const { data: folders, error } = await supabase.storage
    .from('exercise-videos')
    .list('shared', { limit: 1000 });

  if (error) {
    console.error('❌ Errore nel recupero cartelle:', error.message);
    return [];
  }

  return folders?.filter(f => !f.id) || []; // Solo cartelle, non file
}

async function getFirstVideoInFolder(folderName) {
  const { data: files, error } = await supabase.storage
    .from('exercise-videos')
    .list(`shared/${folderName}`, { limit: 100 });

  if (error || !files || files.length === 0) {
    return null;
  }

  // Preferisci video con "regular" o "2." nel nome, altrimenti il primo
  const regularVideo = files.find(f => 
    f.name.toLowerCase().includes('regular') || 
    f.name.toLowerCase().includes('2.')
  );

  const videoFile = regularVideo || files[0];
  const { data: { publicUrl } } = supabase.storage
    .from('exercise-videos')
    .getPublicUrl(`shared/${folderName}/${videoFile.name}`);

  return publicUrl;
}

async function linkVideosToExercises() {
  console.log('🔍 Collego video caricati agli esercizi...\n');

  // Lista cartelle nello storage
  const storageFolders = await listStorageFolders();
  console.log(`📁 Trovate ${storageFolders.length} cartelle nello storage:\n`);
  storageFolders.forEach(f => console.log(`   - ${f.name}`));

  // Recupera tutti gli esercizi
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, video_url, group_id')
    .order('name');

  if (error) {
    console.error('❌ Errore nel recupero esercizi:', error.message);
    return;
  }

  console.log(`\n📊 Esercizi nel database: ${exercises.length}\n`);

  let linked = 0;
  let skipped = 0;

  // Per ogni cartella nello storage, trova esercizi corrispondenti
  for (const folder of storageFolders) {
    const folderSlug = folder.name;

    // Trova esercizi che corrispondono a questa cartella
    const matchingExercises = exercises.filter(ex => {
      if (ex.video_url) return false; // Salta se già ha video

      const exerciseSlug = exerciseToSlug(ex.name);
      
      // Match esatto
      if (exerciseSlug === folderSlug) return true;

      // Match tramite mapping
      const possibleSlugs = exerciseSlugMap[ex.name] || [];
      if (possibleSlugs.includes(folderSlug)) return true;

      // Match parziale (es. "push-ups" matcha "push-ups-variation")
      if (folderSlug.includes(exerciseSlug) || exerciseSlug.includes(folderSlug)) {
        // Verifica che non sia troppo generico
        const minLength = Math.min(folderSlug.length, exerciseSlug.length);
        if (minLength >= 5) return true; // Almeno 5 caratteri in comune
      }

      return false;
    });

    if (matchingExercises.length === 0) {
      console.log(`⚠️  Nessun esercizio matchato per cartella: ${folderSlug}`);
      continue;
    }

    // Ottieni URL del primo video nella cartella
    const videoUrl = await getFirstVideoInFolder(folderSlug);
    if (!videoUrl) {
      console.log(`⚠️  Nessun video trovato in: ${folderSlug}`);
      continue;
    }

    // Aggiorna tutti gli esercizi matchati
    for (const exercise of matchingExercises) {
      const { error: updateError } = await supabase
        .from('exercises')
        .update({ video_url: videoUrl })
        .eq('id', exercise.id);

      if (updateError) {
        console.error(`   ❌ Errore aggiornamento "${exercise.name}": ${updateError.message}`);
      } else {
        console.log(`   ✅ Linkato "${exercise.name}" -> ${folderSlug}`);
        linked++;
      }
    }
  }

  console.log(`\n✅ Completato! ${linked} esercizi linkati, ${skipped} saltati.`);
}

linkVideosToExercises().catch(console.error);
