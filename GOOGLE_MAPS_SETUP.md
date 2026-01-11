# Google Maps API Setup (Opzionale)

## ⚠️ La chiave API NON è obbligatoria

L'app funziona perfettamente anche senza Google Maps. Se non hai la chiave:
- ✅ Puoi comunque inserire la location manualmente come testo
- ✅ Le coordinate vengono salvate se inserite manualmente
- ❌ Non vedrai la mappa interattiva per selezionare la location
- ❌ Non vedrai la mappa nella visualizzazione dei workout completati

## Come ottenere la chiave API (se la vuoi)

### 1. Vai su Google Cloud Console
- Visita: https://console.cloud.google.com/

### 2. Crea un nuovo progetto (o seleziona uno esistente)
- Clicca sul menu a tendina del progetto in alto
- "New Project"
- Dai un nome (es. "Training Tracker")
- Clicca "Create"

### 3. Abilita le API necessarie
- Vai su "APIs & Services" > "Library"
- Cerca e abilita:
  - **Maps JavaScript API**
  - **Places API** (per l'autocomplete)
  - **Geocoding API** (per convertire indirizzi in coordinate)

### 4. Crea le credenziali
- Vai su "APIs & Services" > "Credentials"
- Clicca "Create Credentials" > "API Key"
- Copia la chiave generata

### 5. Configura le restrizioni (IMPORTANTE per sicurezza)
- Clicca sulla chiave appena creata
- In "Application restrictions":
  - Seleziona "HTTP referrers (web sites)"
  - Aggiungi:
    - `http://localhost:3000/*` (per sviluppo)
    - `https://tuodominio.com/*` (per produzione)
- In "API restrictions":
  - Seleziona "Restrict key"
  - Seleziona solo:
    - Maps JavaScript API
    - Places API
    - Geocoding API
- Salva

### 6. Aggiungi la chiave al progetto
Aggiungi questa riga al file `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=la_tua_chiave_qui
```

### 7. Riavvia il server di sviluppo
```bash
npm run dev
```

## Costi

Google Maps offre un **free tier generoso**:
- **$200 di credito gratuito al mese**
- Con questo puoi fare:
  - ~28,000 caricamenti di mappe
  - ~40,000 richieste di geocoding
  - ~17,000 richieste Places

Per un'app personale o piccola, è molto probabile che rimanga sempre nel free tier.

## Alternative gratuite (se non vuoi usare Google Maps)

Se preferisci non usare Google Maps, puoi:
1. Usare solo il campo testo per la location
2. Integrare OpenStreetMap (gratuito, open source)
3. Usare Mapbox (ha anche un free tier)

Vuoi che implementi una di queste alternative?
