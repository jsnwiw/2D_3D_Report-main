$emojiPattern = "[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}\x{1F900}-\x{1F9FF}\x{1FA70}-\x{1FAFF}]"
$files = Get-ChildItem -Path . -Recurse -Include *.html,*.js,*.css
foreach ($f in $files) {
    $text = Get-Content $f.FullName -Raw -Encoding UTF8
    $newText = $text -replace $emojiPattern, ''
    if ($newText -ne $text) {
        Set-Content $f.FullName -Value $newText -Encoding UTF8
        Write-Host "Cleaned: $($f.FullName)"
    }
}
