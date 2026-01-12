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

// Mapping esercizi -> slug
function exerciseToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function listStorageRecursive(folder = 'shared') {
  const { data, error } = await supabase.storage
    .from('exercise-videos')
    .list(folder, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  if (error) {
    console.error(`❌ Errore in ${folder}:`, error.message);
    return [];
  }

  const result = [];
  for (const item of data || []) {
    const fullPath = folder === 'shared' ? item.name : `${folder}/${item.name}`;
    if (item.id) {
      // È un file
      result.push({ path: fullPath, name: item.name, folder: folder });
    } else {
      // È una cartella, esplorala
      const subItems = await listStorageRecursive(fullPath);
      result.push(...subItems);
    }
  }
  return result;
}

async function linkExistingVideos() {
  console.log('🔍 Cerco video caricati ma non linkati...\n');

  // Lista tutti i file nello storage
  const storageFiles = await listStorageRecursive();
  console.log(`📹 Trovati ${storageFiles.length} file nello storage\n`);

  // Raggruppa per esercizio (cartella)
  const videosByExercise = {};
  storageFiles.forEach(file => {
    const parts = file.path.split('/');
    if (parts.length >= 2 && parts[0] === 'shared') {
      const exerciseSlug = parts[1];
      if (!videosByExercise[exerciseSlug]) {
        videosByExercise[exerciseSlug] = [];
      }
      videosByExercise[exerciseSlug].push(file);
    }
  });

  console.log(`📋 Video trovati per ${Object.keys(videosByExercise).length} esercizi:\n`);
  Object.entries(videosByExercise).sort().forEach(([slug, files]) => {
    console.log(`   ${slug}: ${files.length} video`);
  });

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

  // Trova esercizi senza video_url ma con video nello storage
  let linked = 0;
  for (const exercise of exercises) {
    const exerciseSlug = exerciseToSlug(exercise.name);
    const videos = videosByExercise[exerciseSlug];

    if (videos && videos.length > 0 && !exercise.video_url) {
      // Trova il video principale (primo nella lista o quello con "regular")
      const mainVideo = videos.find(v => 
        v.name.toLowerCase().includes('regular') || 
        v.name.toLowerCase().includes('2.')
      ) || videos[0];

      const videoUrl = supabase.storage
        .from('exercise-videos')
        .getPublicUrl(`shared/${exerciseSlug}/${mainVideo.name}`).data.publicUrl;

      console.log(`🔗 Linko "${exercise.name}" -> ${mainVideo.name}`);
      
      // Aggiorna solo gli esercizi di questo gruppo
      const { error: updateError } = await supabase
        .from('exercises')
        .update({ video_url: videoUrl })
        .eq('id', exercise.id);

      if (updateError) {
        console.error(`   ❌ Errore: ${updateError.message}`);
      } else {
        linked++;
        console.log(`   ✅ Linkato!`);
      }
    }
  }

  console.log(`\n✅ Completato! ${linked} esercizi linkati.`);
}

linkExistingVideos().catch(console.error);
