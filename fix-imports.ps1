# PowerShell script to fix relative imports in TypeScript files

$srcPath = "C:\Users\virgi\OneDrive\Desktop\Apps\Chress\src"
$files = Get-ChildItem -Path $srcPath -Include "*.ts", "*.tsx" -Recurse

# Define replacement patterns
# Format: @alias should replace both ../../path and ../path depending on nesting level
$replacements = @(
    # Core replacements (most common)
    @{ pattern = 'from [''"](\.\./)+core/'; replacement = 'from ''@core/' },
    @{ pattern = 'from [''"](\.\./)+managers/'; replacement = 'from ''@managers/' },
    @{ pattern = 'from [''"](\.\./)+utils/'; replacement = 'from ''@utils/' },
    @{ pattern = 'from [''"](\.\./)+enemy/'; replacement = 'from ''@enemy/' },
    @{ pattern = 'from [''"](\.\./)+entities/'; replacement = 'from ''@entities/' },
    @{ pattern = 'from [''"](\.\./)+renderers/'; replacement = 'from ''@renderers/' },
    @{ pattern = 'from [''"](\.\./)+ui/'; replacement = 'from ''@ui/' },
    @{ pattern = 'from [''"](\.\./)+npc/'; replacement = 'from ''@npc/' },
    @{ pattern = 'from [''"](\.\./)+facades/'; replacement = 'from ''@facades/' },
    @{ pattern = 'from [''"](\.\./)+generators/'; replacement = 'from ''@generators/' },
    @{ pattern = 'from [''"](\.\./)+state/'; replacement = 'from ''@state/' },
    @{ pattern = 'from [''"](\.\./)+repositories/'; replacement = 'from ''@repositories/' },
    @{ pattern = 'from [''"](\.\./)+loaders/'; replacement = 'from ''@loaders/' },
    @{ pattern = 'from [''"](\.\./)+config/'; replacement = 'from ''@config/' },
    @{ pattern = 'from [''"](\.\./)+controllers/'; replacement = 'from ''@controllers/' },
    @{ pattern = 'from [''"](\.\./)+types/'; replacement = 'from ''@types/' },
)

$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Apply all replacements
    foreach ($replacement in $replacements) {
        $content = $content -replace $replacement.pattern, $replacement.replacement
    }
    
    # Only write if changes were made
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedCount++
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "`nTotal files updated: $updatedCount"
