$albumsDir = Join-Path $PSScriptRoot "albums"
$outputFile = Join-Path $PSScriptRoot "music_data.json"

$configPath = Join-Path $PSScriptRoot "portfolio_config.json"
$config = @{ albumOrder = @(); recommendedAlbums = @() }

if (Test-Path $configPath) {
    $jsonContent = Get-Content $configPath -Raw | ConvertFrom-Json
    $config.albumOrder = $jsonContent.albumOrder
    $config.recommendedAlbums = $jsonContent.recommendedAlbums
}

$albums = @()
$totalSongs = 0

if (Test-Path $albumsDir) {
    $albumDirs = Get-ChildItem -Path $albumsDir -Directory

    foreach ($dir in $albumDirs) {
        $albumName = $dir.Name
        $tracks = @()
        
        # Get audio files
        $audioFiles = Get-ChildItem -Path $dir.FullName -Include *.mp3, *.wav -Recurse
        
        # Check for tracklist.txt
        $tracklistPath = Join-Path $dir.FullName "tracklist.txt"
        $trackOrder = @()
        if (Test-Path $tracklistPath) {
            $trackOrder = Get-Content $tracklistPath
        }

        # Process files
        $tempTracks = @()
        foreach ($file in $audioFiles) {
            $relativePath = "albums/$albumName/" + $file.Name
            $tempTracks += @{
                title    = $file.BaseName
                src      = $relativePath
                filename = $file.Name
            }
        }

        # Sort tracks
        if ($trackOrder.Count -gt 0) {
            foreach ($title in $trackOrder) {
                $match = $tempTracks | Where-Object { $_.title -eq $title }
                if ($match) {
                    $tracks += $match
                    $tempTracks = $tempTracks | Where-Object { $_.title -ne $title }
                }
            }
            # Add remaining tracks
            $tracks += $tempTracks
        }
        else {
            $tracks = $tempTracks
        }

        $totalSongs += $tracks.Count

        # Check for cover image (jpg or png)
        $coverPath = "albums/$albumName/cover.jpg"
        if (-not (Test-Path (Join-Path $dir.FullName "cover.jpg"))) {
            if (Test-Path (Join-Path $dir.FullName "cover.png")) {
                $coverPath = "albums/$albumName/cover.png"
            }
        }

        if ($tracks.Count -gt 0) {
            $isRecommended = $config.recommendedAlbums -contains $albumName
            $albums += @{
                id            = $albumName
                title         = $albumName
                cover         = $coverPath
                tracks        = $tracks
                isRecommended = $isRecommended
            }
        }
    }
}

# Sort albums based on config
$sortedAlbums = @()
foreach ($name in $config.albumOrder) {
    $match = $albums | Where-Object { $_.title -eq $name }
    if ($match) {
        $sortedAlbums += $match
        $albums = $albums | Where-Object { $_.title -ne $name }
    }
}
$sortedAlbums += $albums

$outputData = @{
    albums     = $sortedAlbums
    totalSongs = $totalSongs
}

$json = $outputData | ConvertTo-Json -Depth 4
Set-Content -Path $outputFile -Value $json -Encoding UTF8

Write-Host "Generated music_data.json with $($sortedAlbums.Count) albums and $totalSongs songs."
