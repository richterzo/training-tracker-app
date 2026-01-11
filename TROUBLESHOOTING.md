# Troubleshooting - Errori Comuni

## Errore 500 su `/api/onboarding/create-group`

### Causa più probabile: Tabelle database non create

**Sintomi:**
- Errore 500 quando provi a creare un gruppo
- Messaggio: "Failed to create group" o "Failed to create profile"
- Errore nel browser console o network tab

**Soluzione:**
1. Vai su https://app.supabase.com
2. Seleziona il tuo progetto
3. Vai a **SQL Editor**
4. Esegui questo **unico script**:

```sql
-- Copia e incolla il contenuto di scripts/setup-database.sql
-- Questo script crea tutto: tabelle, indici, funzioni e RLS policies
```

### Verifica che le tabelle esistano

In Supabase SQL Editor, esegui:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('groups', 'user_profiles', 'exercises', 'workout_templates');
```

Dovresti vedere tutte e 4 le tabelle nell'elenco.

### Verifica RLS Policies

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('groups', 'user_profiles');
```

Dovresti vedere almeno alcune policies per ogni tabella.

## Altri errori comuni

### "Unauthorized" (401)
- L'utente non è autenticato
- Verifica che tu abbia fatto login prima di creare un gruppo

### "Failed to create profile"
- Potrebbe essere un problema di RLS
- Verifica che le policies permettano l'inserimento in `user_profiles`
- Controlla che `auth.uid()` funzioni correttamente

### "seed_default_exercises" non esiste
- Non è critico, l'app funziona comunque
- Puoi creare manualmente gli esercisi dopo
- La funzione è inclusa in `scripts/setup-database.sql`

## Come vedere i log dettagliati

1. Apri la console del browser (F12)
2. Vai alla tab "Network"
3. Clicca sulla richiesta `/api/onboarding/create-group`
4. Vai alla tab "Response" per vedere il messaggio di errore dettagliato

Oppure controlla i log del server Next.js nel terminale dove hai avviato `npm run dev`.
