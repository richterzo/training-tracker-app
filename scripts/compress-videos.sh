#!/bin/bash

# Script per comprimere i video prima dell'upload
# Usa ffmpeg per ridurre la dimensione mantenendo una buona qualità

SOURCE_DIR="${1:-Basic course }"
OUTPUT_DIR="${2:-Basic course _compressed}"
TARGET_SIZE_MB=45  # Sotto il limite di 50MB
CRF=28  # Quality: 18-28 (più alto = più compressione, più piccolo)

if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg non trovato!"
    echo "💡 Installa ffmpeg:"
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu: sudo apt install ffmpeg"
    exit 1
fi

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Cartella sorgente non trovata: $SOURCE_DIR"
    exit 1
fi

echo "📹 Comprimo i video da: $SOURCE_DIR"
echo "📁 Output in: $OUTPUT_DIR"
echo "🎯 Dimensione target: < ${TARGET_SIZE_MB}MB"
echo ""

# Crea directory output mantenendo la struttura
mkdir -p "$OUTPUT_DIR"

# Conta i file
TOTAL=$(find "$SOURCE_DIR" -name "*.m4v" -o -name "*.mp4" | wc -l | tr -d ' ')
COUNT=0

find "$SOURCE_DIR" -type f \( -name "*.m4v" -o -name "*.mp4" \) | while IFS= read -r video; do
    COUNT=$((COUNT + 1))
    # Rimuovi il prefisso della directory sorgente (gestendo spazi)
    RELATIVE_PATH="${video#${SOURCE_DIR}/}"
    OUTPUT_PATH="$OUTPUT_DIR/$RELATIVE_PATH"
    OUTPUT_DIR_PATH=$(dirname "$OUTPUT_PATH")
    
    mkdir -p "$OUTPUT_DIR_PATH"
    
    # Verifica dimensione originale
    ORIGINAL_SIZE=$(stat -f%z "$video" 2>/dev/null || stat -c%s "$video" 2>/dev/null)
    ORIGINAL_SIZE_MB=$((ORIGINAL_SIZE / 1024 / 1024))
    
    if [ "$ORIGINAL_SIZE_MB" -lt "$TARGET_SIZE_MB" ]; then
        echo "[$COUNT/$TOTAL] ✅ Già sotto ${TARGET_SIZE_MB}MB: $(basename "$video") (${ORIGINAL_SIZE_MB}MB)"
        cp "$video" "$OUTPUT_PATH"
    else
        echo "[$COUNT/$TOTAL] 📤 Comprimo: $(basename "$video") (${ORIGINAL_SIZE_MB}MB)..."
        
               # Comprimi con ffmpeg (usa percorsi tra virgolette)
               # Aggiungi timeout e gestione errori migliore
               timeout 600 ffmpeg -i "$video" \
                   -c:v libx264 \
                   -crf $CRF \
                   -preset medium \
                   -c:a aac \
                   -b:a 128k \
                   -movflags +faststart \
                   -y \
                   "$OUTPUT_PATH" > /tmp/ffmpeg_$$.log 2>&1
               
               FFMPEG_EXIT=$?
               if [ $FFMPEG_EXIT -eq 124 ]; then
                   echo "   ⚠️  Timeout (10 minuti) per: $(basename "$video")" | tee -a "$LOG_FILE"
                   rm -f "$OUTPUT_PATH"
               elif [ $FFMPEG_EXIT -ne 0 ]; then
                   echo "   ❌ Errore ffmpeg per: $(basename "$video")" | tee -a "$LOG_FILE"
                   tail -3 /tmp/ffmpeg_$$.log | tee -a "$LOG_FILE"
                   rm -f "$OUTPUT_PATH"
               fi
               rm -f /tmp/ffmpeg_$$.log
        
        # Verifica dimensione compressa
           if [ -f "$OUTPUT_PATH" ]; then
                   COMPRESSED_SIZE=$(stat -f%z "$OUTPUT_PATH" 2>/dev/null || stat -c%s "$OUTPUT_PATH" 2>/dev/null)
                   COMPRESSED_SIZE_MB=$((COMPRESSED_SIZE / 1024 / 1024))
                   REDUCTION=$((100 - (COMPRESSED_SIZE * 100 / ORIGINAL_SIZE)))
                   PERCENTAGE=$((COUNT * 100 / TOTAL))
                   echo "[$COUNT/$TOTAL - ${PERCENTAGE}%] ✅ Completato: ${COMPRESSED_SIZE_MB}MB (riduzione: ${REDUCTION}%)" | tee -a "$LOG_FILE"
               else
                   echo "[$COUNT/$TOTAL] ❌ Errore nella compressione: $(basename "$video")" | tee -a "$LOG_FILE"
               fi
           else
               PERCENTAGE=$((COUNT * 100 / TOTAL))
               echo "[$COUNT/$TOTAL - ${PERCENTAGE}%] ✅ Già sotto ${TARGET_SIZE_MB}MB: $(basename "$video") (${ORIGINAL_SIZE_MB}MB)" | tee -a "$LOG_FILE"
           fi
       done

echo "" | tee -a "$LOG_FILE"
echo "🏁 Compressione completata!" | tee -a "$LOG_FILE"
echo "📁 Video compressi in: $OUTPUT_DIR" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "📝 Prossimo passo:" | tee -a "$LOG_FILE"
echo "   node scripts/upload-exercise-videos.cjs '$OUTPUT_DIR'" | tee -a "$LOG_FILE"
