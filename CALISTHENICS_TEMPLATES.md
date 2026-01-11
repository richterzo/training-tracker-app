# Calisthenics Templates Guide

## Sistema di Template Basato sul Corso Calisthenics Basic Course v3

Questo sistema implementa i template di allenamento basati sul documento "Calisthenics for beginners and intermediate - BASIC COURSE".

## Struttura del Sistema

### Livelli di Progressione
Ogni esercizio ha un sistema di livelli:
- **Formato**: `Gruppo.Livello` (es. `1.1`, `1.2`, `1.3`, `1.4`)
- **Gruppo**: Numero da 1 a 8 (identifica il tipo di esercizio)
- **Livello**: Da 1 a 4 (difficoltà crescente)

### Categorie di Esercizi
- **PUSH**: Esercizi di spinta (push-up, dip, ecc.)
- **PULL**: Esercizi di trazione (pull-up, row, ecc.)
- **CORE**: Esercizi per il core (plank, leg raises, ecc.)

## Template Disponibili

### 1. Plain Basics (4 giorni)
Programmi base per forza generale:
- **Day 1**: Push + Pull + Core combinati
- **Day 2**: Push + Pull + Core combinati
- **Day 3**: Push + Pull + Core combinati
- **Day 4**: Push + Pull + Core combinati

### 2. Pull Strength Focus
Programma focalizzato sulla forza di trazione con esercizi push minimi per bilanciamento.

### 3. Push Strength Focus
Programma focalizzato sulla forza di spinta con esercizi pull minimi per bilanciamento.

### 4. Core Focus
Programma dedicato al core con esercizi per:
- ABS1 (addominali superiori)
- SIDE ABS (addominali laterali)
- ABS2 (addominali inferiori)

### 5. Skill Preparation Programs
Template per preparazione a skills specifiche:

#### Planche Preparation
- Focus su pushing strength e core
- Include esercizi asimmetrici

#### Handstand Preparation
- Focus su pushing strength e core
- Nessun esercizio pull richiesto

#### Front Lever Preparation
- Focus su pulling e core strength
- Include French push-ups per teres major e lats

#### One Arm Pull Up Preparation
- Focus su asymmetric pulling
- Include esercizi del gruppo 7 (movimenti asimmetrici)

#### Back Lever Preparation
- Focus su upper back e core
- Include esercizi di pushing e pulling

## Come Usare i Template

### Passo 1: Eseguire le Migration
Esegui la migration SQL per aggiungere i campi di progressione:
```sql
-- File: supabase/migrations/20260112000001_add_exercise_levels.sql
```

### Passo 2: Creare Esercizi con Livelli
Quando crei esercizi nella library, puoi opzionalmente specificare:
- `progression_group`: Numero del gruppo (1-8)
- `progression_level`: Livello (1-4)
- `exercise_code`: Codice formato "Gruppo.Livello" (es. "1.1", "2.4")

### Passo 3: Usare i Preset
1. Vai su `/app/templates/new`
2. Seleziona il tab "Calisthenics Presets"
3. Scegli il template che vuoi creare
4. Clicca "Create Template"
5. Il template verrà creato con le note di progressione

### Passo 4: Personalizzare il Template
Dopo aver creato il template dal preset:
1. Vai alla lista dei template
2. Modifica il template creato
3. Per ogni esercizio, seleziona l'esercizio appropriato dalla tua library
4. Le note di progressione ti indicano quale livello scegliere (es. "Choose level 1.1-1.4")

## Note Importanti

### Selezione del Livello
- **Matching level**: Sei al livello corretto quando riesci a fare almeno l'80% delle reps nell'ultimo set
- Se un esercizio è troppo facile, passa al livello successivo
- Se un esercizio è troppo difficile, torna al livello precedente

### Frequenza di Allenamento
- **Beginners (muscle building)**: 2 volte a settimana per gruppo muscolare
- **Beginners (strength for skills)**: 5-7 giorni a settimana per esercizi specifici (max 3 esercizi)
- **Intermediate (basics + skills)**: 6 volte a settimana (skills 3-4x, basics 2x)
- **Advanced (skills focus)**: Focus su skills, torna ai basics ogni pochi mesi

### Rest
- **Muscle building**: 1-2 giorni di riposo tra allenamenti
- **Skills preparation**: Rest totale ogni 3 settimane (3-4 giorni)
- **Combined training**: 1-2 giorni di riposo, con rest weeks periodiche

## Esempi di Utilizzo

### Esempio 1: Beginner che vuole costruire muscoli
1. Usa "Plain Basics - Day 1" e "Plain Basics - Day 2"
2. Allena 2 volte a settimana (es. Lunedì e Giovedì)
3. Riposa 1-2 giorni tra gli allenamenti
4. Scegli il livello appropriato per ogni esercizio

### Esempio 2: Preparazione per Planche
1. Usa "Planche Preparation"
2. Allena 3-4 volte a settimana
3. Non andare a failure per avere energia per i basics
4. Aggiungi basics 2 volte a settimana alla fine dell'allenamento skills

### Esempio 3: Focus su Pulling Strength
1. Usa "Pull Strength Focus"
2. Allena 2 volte a settimana
3. Ogni allenamento è molto completo
4. Ideale per costruire muscoli con bodyweight

## Link ai Video

I link ai video degli esercizi non sono inclusi nel sistema, ma puoi:
1. Aggiungere i link quando crei gli esercizi nella library
2. Usare il campo `video_url` nell'esercizio
3. I link verranno visualizzati durante l'allenamento

## Prossimi Passi

1. ✅ Sistema di preset implementato
2. ⏳ Eseguire migration SQL
3. ⏳ Creare esercizi con livelli nella library
4. ⏳ Testare i template creati
5. ⏳ Aggiungere link ai video quando disponibili
