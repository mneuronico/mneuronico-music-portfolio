$albumsDir = Join-Path $PSScriptRoot "albums"
$outputFile = Join-Path $PSScriptRoot "music_data.json"

$albums = @()

if (Test-Path $albumsDir) {
    $albumDirs = Get-ChildItem -Path $albumsDir -Directory

    foreach ($dir in $albumDirs) {
        $albumName = $dir.Name
        $tracks = @()
        
        # Get audio files (mp3, wav)
        $audioFiles = Get-ChildItem -Path $dir.FullName -Include *.mp3, *.wav -Recurse

        foreach ($file in $audioFiles) {
            # Create relative path for web usage
            $relativePath = "albums/$albumName/" + $file.Name
            $tracks += @{
                title = $file.BaseName
                src   = $relativePath
            }
        }

        # Check for cover image (jpg or png)
        $coverPath = "albums/$albumName/cover.jpg"
        if (-not (Test-Path (Join-Path $dir.FullName "cover.jpg"))) {
            if (Test-Path (Join-Path $dir.FullName "cover.png")) {
                $coverPath = "albums/$albumName/cover.png"
            }
            else {
                # Fallback handled by frontend or default
                $coverPath = "albums/$albumName/cover.jpg" 
            }
        }

        if ($tracks.Count -gt 0) {
            $albums += @{
                id     = $albumName
                title  = $albumName
                cover  = $coverPath
                tracks = $tracks
            }
        }
    }
}

$json = $albums | ConvertTo-Json -Depth 4
Set-Content -Path $outputFile -Value $json -Encoding UTF8

Write-Host "Generated music_data.json with $($albums.Count) albums."
