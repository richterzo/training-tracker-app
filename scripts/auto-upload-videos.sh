#!/bin/bash

# Script per monitorare la compressione e caricare automaticamente i video
# quando vengono compressi

COMPRESSED_DIR="Basic course _compressed"
TOTAL_VIDEOS=99
CHECK_INTERVAL=30  # Controlla ogni 30 secondi
LAST_COUNT=0

echo "🔄 Monitoraggio compressione e upload automatico"
echo "📁 Cartella: $COMPRESSED_DIR"
echo "⏱️  Controllo ogni $CHECK_INTERVAL secondi"
echo ""

while true; do
    CURRENT_COUNT=$(find "$COMPRESSED_DIR" -name "*.m4v" 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$CURRENT_COUNT" -gt "$LAST_COUNT" ]; then
        NEW_VIDEOS=$((CURRENT_COUNT - LAST_COUNT))
        echo "[$(date +%H:%M:%S)] 📊 Progresso: $CURRENT_COUNT / $TOTAL_VIDEOS video compressi (+$NEW_VIDEOS nuovi)"
        echo "[$(date +%H:%M:%S)] 🚀 Carico i nuovi video..."
        
        node scripts/upload-exercise-videos.cjs "$COMPRESSED_DIR" 2>&1 | grep -E "(Trovati|aggiornati|✅|❌)" | tail -5
        
        LAST_COUNT=$CURRENT_COUNT
        
        if [ "$CURRENT_COUNT" -ge "$TOTAL_VIDEOS" ]; then
            echo ""
            echo "✅ Tutti i video sono stati compressi e caricati!"
            echo "🎬 Vai su http://localhost:3000/app/exercises per vedere i video"
            break
        fi
    else
        echo "[$(date +%H:%M:%S)] ⏳ In attesa... ($CURRENT_COUNT / $TOTAL_VIDEOS)"
    fi
    
    sleep $CHECK_INTERVAL
done
