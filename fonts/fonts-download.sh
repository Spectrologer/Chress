#!/bin/bash
# Download script for Google Fonts
# Run this script to download all required fonts locally

cd "$(dirname "$0")"

# Function to download a font
download_font() {
    local url=$1
    local filename=$2
    echo "Downloading $filename..."
    curl -L "$url" -o "$filename"
}

# Cinzel fonts
download_font "https://github.com/google/fonts/raw/main/ofl/cinzel/Cinzel-Regular.ttf" "Cinzel-Regular.ttf"
download_font "https://github.com/google/fonts/raw/main/ofl/cinzel/Cinzel-SemiBold.ttf" "Cinzel-SemiBold.ttf"
download_font "https://github.com/google/fonts/raw/main/ofl/cinzel/Cinzel-Bold.ttf" "Cinzel-Bold.ttf"
download_font "https://github.com/google/fonts/raw/main/ofl/cinzel/Cinzel-Black.ttf" "Cinzel-Black.ttf"

# Single weight fonts
download_font "https://github.com/google/fonts/raw/main/ofl/creepster/Creepster-Regular.ttf" "Creepster-Regular.ttf"
download_font "https://github.com/google/fonts/raw/main/ofl/nosifer/Nosifer-Regular.ttf" "Nosifer-Regular.ttf"
download_font "https://github.com/google/fonts/raw/main/ofl/griffy/Griffy-Regular.ttf" "Griffy-Regular.ttf"
download_font "https://github.com/google/fonts/raw/main/ofl/medievalsharp/MedievalSharp-Regular.ttf" "MedievalSharp-Regular.ttf"

echo "All fonts downloaded!"
