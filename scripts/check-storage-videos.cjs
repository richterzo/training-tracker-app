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

async function checkStorageVideos() {
  console.log('🔍 Verifico video caricati nello storage...\n');

  // Lista tutti i file nello storage
  const { data: files, error } = await supabase.storage
    .from('exercise-videos')
    .list('shared', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error('❌ Errore nel recupero file:', error.message);
    return;
  }

  console.log(`📹 Video trovati nello storage: ${files.length}\n`);

  // Raggruppa per cartella esercizio
  const byExercise = {};
  files.forEach(file => {
    // I file sono in shared/exercise-name/video.m4v
    // Per ora mostriamo solo i file nella root di shared
    // Dobbiamo fare una ricerca ricorsiva
  });

  // Lista ricorsiva di tutte le cartelle
  async function listAllFiles(folder = 'shared', depth = 0) {
    const { data, error } = await supabase.storage
      .from('exercise-videos')
      .list(folder, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`❌ Errore in ${folder}:`, error.message);
      return [];
    }

    const allFiles = [];
    for (const item of data || []) {
      const fullPath = folder === 'shared' ? item.name : `${folder}/${item.name}`;
      if (item.id) {
        // È un file
        allFiles.push(fullPath);
      } else {
        // È una cartella, esplorala
        const subFiles = await listAllFiles(fullPath, depth + 1);
        allFiles.push(...subFiles);
      }
    }
    return allFiles;
  }

  const allFiles = await listAllFiles();
  console.log(`📹 Totale file video nello storage: ${allFiles.length}\n`);

  // Raggruppa per esercizio
  const exerciseVideos = {};
  allFiles.forEach(file => {
    const parts = file.split('/');
    if (parts.length >= 3 && parts[0] === 'shared') {
      const exerciseName = parts[1];
      if (!exerciseVideos[exerciseName]) {
        exerciseVideos[exerciseName] = [];
      }
      exerciseVideos[exerciseName].push(parts[2]);
    }
  });

  console.log('📋 Video per esercizio:\n');
  Object.entries(exerciseVideos).sort().forEach(([exercise, videos]) => {
    console.log(`   ${exercise}: ${videos.length} video`);
    videos.slice(0, 3).forEach(v => console.log(`      - ${v}`));
    if (videos.length > 3) console.log(`      ... e altri ${videos.length - 3}`);
  });

  // Verifica esercizi nel database
  const { data: exercises } = await supabase
    .from('exercises')
    .select('name, video_url')
    .order('name');

  console.log('\n\n📊 CONFRONTO CON DATABASE:\n');
  console.log(`   Esercizi totali: ${exercises.length}`);
  const withVideo = exercises.filter(e => e.video_url).length;
  const withoutVideo = exercises.length - withVideo;
  console.log(`   ✅ Con video_url: ${withVideo}`);
  console.log(`   ❌ Senza video_url: ${withoutVideo}\n`);

  // Esercizi senza video ma con video nello storage
  console.log('🔍 Esercizi senza video_url ma con video nello storage:\n');
  exercises.filter(e => !e.video_url).forEach(ex => {
    const exerciseSlug = ex.name.toLowerCase().replace(/\s+/g, '-');
    if (exerciseVideos[exerciseSlug]) {
      console.log(`   ⚠️  ${ex.name}: ha ${exerciseVideos[exerciseSlug].length} video nello storage ma non ha video_url!`);
    }
  });
}

checkStorageVideos().catch(console.error);
