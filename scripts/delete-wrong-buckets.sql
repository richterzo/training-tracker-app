-- ============================================
-- DELETE WRONG STORAGE BUCKETS
-- Execute this in Supabase SQL Editor
-- ============================================
-- Elimina i bucket errati (quelli con group_id come nome)
-- Mantiene solo il bucket 'exercise-videos' corretto

-- NOTA: Prima di eseguire, verifica che non ci siano file importanti nei bucket da eliminare
-- I bucket da eliminare sono quelli con UUID come nome (es. c056223c-af9a-4488-b6bd-61bc05b9e22c)

-- Lista bucket da eliminare (sostituisci con i nomi effettivi)
-- DELETE FROM storage.buckets WHERE id = 'c056223c-af9a-4488-b6bd-61bc05b9e22c';

-- Oppure elimina tutti i bucket che non sono 'exercise-videos' o 'avatars'
-- ATTENZIONE: Questo elimina TUTTI i bucket tranne quelli standard!
-- DELETE FROM storage.buckets 
-- WHERE id NOT IN ('exercise-videos', 'avatars');

-- Per sicurezza, lista prima i bucket esistenti:
SELECT id, name, public, created_at 
FROM storage.buckets 
ORDER BY created_at;

-- Poi elimina manualmente quelli errati dal Dashboard o con:
-- DELETE FROM storage.buckets WHERE id = 'bucket-id-da-eliminare';
