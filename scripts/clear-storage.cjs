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

async function listAllFilesRecursive(folder = 'shared', allFiles = []) {
  const { data, error } = await supabase.storage
    .from('exercise-videos')
    .list(folder, { limit: 1000 });

  if (error) {
    console.error(`❌ Errore in ${folder}:`, error.message);
    return allFiles;
  }

  for (const item of data || []) {
    const fullPath = folder === 'shared' ? item.name : `${folder}/${item.name}`;
    
    if (item.id) {
      // È un file
      allFiles.push(fullPath);
    } else {
      // È una cartella, esplorala
      await listAllFilesRecursive(fullPath, allFiles);
    }
  }

  return allFiles;
}

async function clearStorage() {
  console.log('🗑️  Cancello tutti i file nello storage...\n');

  // Lista tutti i file ricorsivamente
  const allFiles = await listAllFilesRecursive();
  console.log(`📁 Trovati ${allFiles.length} file da cancellare\n`);

  if (allFiles.length === 0) {
    console.log('✅ Nessun file da cancellare');
    return;
  }

  // Cancella in batch (max 1000 per volta)
  const batchSize = 1000;
  let deleted = 0;

  for (let i = 0; i < allFiles.length; i += batchSize) {
    const batch = allFiles.slice(i, i + batchSize);
    const { error } = await supabase.storage
      .from('exercise-videos')
      .remove(batch);

    if (error) {
      console.error(`❌ Errore cancellando batch ${i / batchSize + 1}:`, error.message);
    } else {
      deleted += batch.length;
      console.log(`   ✅ Cancellati ${deleted} / ${allFiles.length} file`);
    }
  }

  console.log(`\n✅ Completato! ${deleted} file cancellati.`);

  // Pulisci anche i video_url dal database
  console.log('\n🔄 Pulisco video_url dal database...');
  const { error: updateError } = await supabase
    .from('exercises')
    .update({ video_url: null });

  if (updateError) {
    console.error('❌ Errore aggiornamento database:', updateError.message);
  } else {
    console.log('✅ video_url puliti dal database');
  }
}

clearStorage().catch(console.error);
