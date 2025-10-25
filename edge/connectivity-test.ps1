# ═══════════════════════════════════════════════════════════════
#               WEBSITE CONNECTIVITY TESTER
#      Real HTTP/HTTPS Connection Testing - No DNS Tricks!
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   Run this command in Windows PowerShell:
#   irm https://raw.githubusercontent.com/NiREvil/vless/main/edge/connectivity-test.ps1 | iex
#
# Commands:
#   test              # Test all websites
#   test -Quick       # Test only essential sites (faster)
#   test -Detailed    # Show detailed response info
#
# Author: @sahar-km and @Diana-Cl
# ═══════════════════════════════════════════════════════════════

function Show-Banner {
    Write-Host "`n" -NoNewline
    Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan -NoNewline
    Write-Host "       REAL CONNECTIVITY TEST - NO DNS GAMES       " -ForegroundColor White -NoNewline
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan -NoNewline
    Write-Host "        Testing Actual HTTP/HTTPS Connections      " -ForegroundColor Yellow -NoNewline
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Progress {
    param([int]$Current, [int]$Total)
    $percent = [math]::Round(($Current / $Total) * 100)
    $barLength = 40
    $filled = [math]::Round(($percent / 100) * $barLength)
    $bar = "█" * $filled + "░" * ($barLength - $filled)
    
    Write-Host "`r  Progress: [" -NoNewline -ForegroundColor Gray
    Write-Host $bar -NoNewline -ForegroundColor Cyan
    Write-Host "] $percent% ($Current/$Total)" -NoNewline -ForegroundColor Gray
}

function Test-WebsiteConnectivity {
    param (
        [Parameter(Mandatory = $false)]
        [switch]$Quick,
        
        [Parameter(Mandatory = $false)]
        [switch]$Detailed,
        
        [Parameter(Mandatory = $false)]
        [string]$DNS = $null
    )

    $allSites = @(
        @{ Name = "Google"; URL = "https://www.google.com"; Essential = $true },
        @{ Name = "Bing"; URL = "https://bing.com"; Essential = $true },
        @{ Name = "YouTube"; URL = "https://www.youtube.com"; Essential = $true },
        @{ Name = "Instagram"; URL = "https://www.instagram.com"; Essential = $true },
        @{ Name = "X - Twitter"; URL = "https://x.com"; Essential = $true },
        @{ Name = "Reddit"; URL = "https://www.reddit.com"; Essential = $true },
        @{ Name = "Telegram"; URL = "https://telegram.org"; Essential = $true },
        @{ Name = "OpenAI"; URL = "https://chat.openai.com"; Essential = $true },
        @{ Name = "Gemini"; URL = "https://gemini.google.com"; Essential = $true },
        @{ Name = "Cloudflare"; URL = "https://www.cloudflare.com"; Essential = $true },
        @{ Name = "GitHub"; URL = "https://github.com"; Essential = $false },
        @{ Name = "RawGithub"; URL = "https://raw.githubusercontent.com"; Essential = $false },
        @{ Name = "Discord"; URL = "https://discord.com"; Essential = $false },
        @{ Name = "WhatsApp"; URL = "https://web.whatsapp.com"; Essential = $true },
        @{ Name = "TikTok"; URL = "https://www.tiktok.com"; Essential = $false },
        @{ Name = "Grok Ai"; URL = "https://grok.com"; Essential = $true },
        @{ Name = "Google Studio"; URL = "https://aistudio.google.com"; Essential = $true },
        @{ Name = "Google Jules"; URL = "https://jules.google.com"; Essential = $true },
        @{ Name = "Google Store"; URL = "https://store.google.com"; Essential = $false },
        @{ Name = "Imgur"; URL = "https://imgur.com"; Essential = $false },
        @{ Name = "JetBrains"; URL = "https://datalore.jetbrains.com"; Essential = $false },
        @{ Name = "Microsoft Copilot"; URL = "https://www.microsoft.com/en-us/microsoft-copilot"; Essential = $false },
        @{ Name = "Notebook LM"; URL = "https://notebooklm.google.com"; Essential = $false },
        @{ Name = "Notion"; URL = "https://www.notion.com"; Essential = $false },
        @{ Name = "Parsec"; URL = "https://parsec.app"; Essential = $false },
        @{ Name = "Spotify"; URL = "https://spotify.com"; Essential = $true },
        @{ Name = "True Social"; URL = "https://truthsocial.com"; Essential = $false },
        @{ Name = "Xbox"; URL = "https://www.xbox.com"; Essential = $false },
        @{ Name = "Xbox Cloud Gaming"; URL = "https://www.xbox.com/en-US/xbox-cloud-gaming"; Essential = $false },
        @{ Name = "Twitch"; URL = "https://m.twitch.tv"; Essential = $false },
        @{ Name = "BrawlStars"; URL = "https://supercell.com/en/games/brawlstars"; Essential = $false },
        @{ Name = "Canva"; URL = "https://www.canva.com/en_in"; Essential = $false },
        @{ Name = "Supercell"; URL = "https://supercell.com/en"; Essential = $false },
        @{ Name = "ClashRoyal"; URL = "https://supercell.com/en/games/clashroyale"; Essential = $false },
        @{ Name = "Claude"; URL = "https://claude.ai"; Essential = $false },
        @{ Name = "DeepL"; URL = "https://www.deepl.com/en/translator"; Essential = $false },
        @{ Name = "Deezer"; URL = "https://www.deezer.com"; Essential = $false },
        @{ Name = "ElevenLabs"; URL = "https://elevenlabs.io"; Essential = $false },
        @{ Name = "Nvidia"; URL = "https://www.nvidia.com"; Essential = $false },
        @{ Name = "GitHub Copilot"; URL = "https://github.com/features/copilot"; Essential = $false }
    )

    # Filter sites based on Quick mode
    $sites = if ($Quick) {
        $allSites | Where-Object { $_.Essential -eq $true }
    } else {
        $allSites
    }

    Show-Banner
    
    Write-Host "  Mode: " -NoNewline -ForegroundColor Gray
    if ($Quick) {
        Write-Host "Quick Test (Essential Sites Only)" -ForegroundColor Yellow
    } else {
        Write-Host "Full Test (All Sites)" -ForegroundColor Green
    }
    
    if ($DNS) {
        Write-Host "  DNS:  " -NoNewline -ForegroundColor Gray
        Write-Host "$DNS (Custom)" -ForegroundColor Magenta
        
        # Temporarily change system DNS
        Write-Host "  Info: Temporarily using custom DNS..." -ForegroundColor Yellow
        
        # Get active network adapter
        $adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1
        $adapterName = $adapter.Name
        
        # Backup current DNS
        $originalDNS = (Get-DnsClientServerAddress -InterfaceAlias $adapterName -AddressFamily IPv4).ServerAddresses
        
        # Set custom DNS
        try {
            Set-DnsClientServerAddress -InterfaceAlias $adapterName -ServerAddresses $DNS -ErrorAction Stop
            Start-Sleep -Milliseconds 500  # Wait for DNS to apply
        }
        catch {
            Write-Host "  Error: Could not set DNS. Running with system DNS." -ForegroundColor Red
            $DNS = $null
        }
    }
    
    Write-Host "  Testing " -NoNewline -ForegroundColor Gray
    Write-Host "$($sites.Count)" -NoNewline -ForegroundColor Yellow
    Write-Host " websites with real HTTP requests..." -ForegroundColor Gray
    Write-Host "`n" + ("─" * 55) -ForegroundColor DarkGray

    $results = @()
    $successCount = 0
    $blockedCount = 0
    $timeoutCount = 0
    $totalTime = 0
    $counter = 0

    foreach ($site in $sites) {
        $counter++
        Show-Progress -Current $counter -Total $sites.Count
        
        $start = Get-Date
        try {
            $response = Invoke-WebRequest -Uri $site.URL -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            $end = Get-Date
            $ms = ($end - $start).TotalMilliseconds
            
            $results += [PSCustomObject]@{
                Name = $site.Name
                URL = $site.URL
                Status = "ACCESSIBLE"
                StatusCode = $response.StatusCode
                Time = $ms
                Details = "OK"
            }
            
            $successCount++
            $totalTime += $ms
        }
        catch {
            $end = Get-Date
            $ms = ($end - $start).TotalMilliseconds
            
            $statusCode = "N/A"
            $status = "BLOCKED"
            $details = "Connection Failed"
            
            if ($_.Exception.Response) {
                $statusCode = [int]$_.Exception.Response.StatusCode
                if ($statusCode -eq 403 -or $statusCode -eq 451) {
                    $status = "FILTERED"
                    $details = "Blocked by Firewall"
                } elseif ($statusCode -ge 400 -and $statusCode -lt 500) {
                    $status = "CLIENT_ERROR"
                    $details = "HTTP $statusCode"
                } elseif ($statusCode -ge 500) {
                    $status = "SERVER_ERROR"
                    $details = "Server Issue"
                }
            } elseif ($_.Exception.Message -match "timeout") {
                $status = "TIMEOUT"
                $details = "Connection Timeout"
                $timeoutCount++
            } else {
                $status = "BLOCKED"
                $details = "Network Blocked"
                $blockedCount++
            }
            
            $results += [PSCustomObject]@{
                Name = $site.Name
                URL = $site.URL
                Status = $status
                StatusCode = $statusCode
                Time = $ms
                Details = $details
            }
            
            if ($status -eq "FILTERED" -or $status -eq "BLOCKED") {
                $blockedCount++
            }
        }
    }

    # Display results with beautiful formatting
    Write-Host "`n`n" + ("─" * 55) -ForegroundColor DarkGray
    Write-Host "`n  RESULTS:" -ForegroundColor Cyan
    Write-Host ""

    foreach ($r in $results) {
        $statusColor = switch ($r.Status) {
            "ACCESSIBLE" { "Green" }
            "FILTERED" { "Red" }
            "BLOCKED" { "Red" }
            "TIMEOUT" { "Yellow" }
            default { "Magenta" }
        }
        
        $statusSymbol = if ($r.Status -eq "ACCESSIBLE") { "✓" } else { "✗" }
        $timeColor = if ($r.Time -lt 500) { "Green" } elseif ($r.Time -lt 2000) { "Yellow" } else { "Red" }
        
        Write-Host "  $statusSymbol " -NoNewline -ForegroundColor $statusColor
        Write-Host ("{0,-20}" -f $r.Name) -NoNewline -ForegroundColor White

        Write-Host (" {0,6} ms  " -f [math]::Round($r.Time)) -NoNewline -ForegroundColor $timeColor
        Write-Host "[" -NoNewline -ForegroundColor DarkGray

        Write-Host $r.Status -NoNewline -ForegroundColor $statusColor
        Write-Host "]" -ForegroundColor DarkGray
        
        if ($Detailed -or $r.Status -ne "ACCESSIBLE") {
            Write-Host ("    └─ " + $r.Details) -ForegroundColor DarkGray
            if ($r.StatusCode -ne "N/A") {
                Write-Host ("       HTTP " + $r.StatusCode) -ForegroundColor DarkGray
            }
        }
    }

    # Summary
    Write-Host "`n" + ("─" * 55) -ForegroundColor DarkGray
    Write-Host "`n  SUMMARY:" -ForegroundColor Cyan
    Write-Host ""
    
    $successRate = [math]::Round(($successCount / $sites.Count) * 100, 1)
    $avgTime = if ($successCount -gt 0) { [math]::Round($totalTime / $successCount, 1) } else { 0 }
    
    Write-Host "  • Accessible:    " -NoNewline -ForegroundColor Gray
    Write-Host "$successCount" -NoNewline -ForegroundColor Green
    Write-Host " / $($sites.Count)" -ForegroundColor DarkGray
    
    Write-Host "  • Blocked:       " -NoNewline -ForegroundColor Gray
    Write-Host "$blockedCount" -ForegroundColor $(if ($blockedCount -eq 0) { "Green" } else { "Red" })
    
    Write-Host "  • Timeout:       " -NoNewline -ForegroundColor Gray
    Write-Host "$timeoutCount" -ForegroundColor $(if ($timeoutCount -eq 0) { "Green" } else { "Yellow" })
    
    Write-Host "  • Success Rate:  " -NoNewline -ForegroundColor Gray
    $rateColor = if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" }
    Write-Host "$successRate%" -ForegroundColor $rateColor
    
    Write-Host "  • Average Speed: " -NoNewline -ForegroundColor Gray
    $speedColor = if ($avgTime -lt 1000) { "Green" } elseif ($avgTime -lt 3000) { "Yellow" } else { "Red" }
    Write-Host "$avgTime ms" -ForegroundColor $speedColor

    # Overall verdict
    Write-Host "`n  VERDICT: " -NoNewline -ForegroundColor Cyan
    if ($successRate -eq 100) {
        Write-Host "Perfect! All websites are accessible." -ForegroundColor Green
    }
    elseif ($successRate -ge 80) {
        Write-Host "Good! Most sites work, minor filtering detected." -ForegroundColor Yellow
    }
    elseif ($successRate -ge 50) {
        Write-Host "Moderate filtering. VPN recommended." -ForegroundColor Yellow
    }
    elseif ($successRate -ge 20) {
        Write-Host "Heavy filtering! VPN/Proxy required." -ForegroundColor Red
    }
    else {
        Write-Host "Critical! Internet severely restricted." -ForegroundColor Red
    }

    Write-Host "`n" + ("═" * 55) -ForegroundColor Cyan
    Write-Host ""
    
    # Restore original DNS if changed
    if ($DNS -and $originalDNS) {
        try {
            Set-DnsClientServerAddress -InterfaceAlias $adapterName -ServerAddresses $originalDNS -ErrorAction Stop
            Write-Host "  DNS restored to original settings." -ForegroundColor Green
        }
        catch {
            Write-Host "  Warning: Could not restore DNS. Please check manually." -ForegroundColor Yellow
        }
    }
}

Set-Alias -Name test -Value Test-WebsiteConnectivity -Scope Global

Write-Host "`n  Quick Start:" -ForegroundColor Cyan
Write-Host "  ────────────" -ForegroundColor DarkGray
Write-Host "    test                     " -NoNewline -ForegroundColor Yellow
Write-Host "# Test all websites (system DNS)" -ForegroundColor Gray
Write-Host "    test -Quick              " -NoNewline -ForegroundColor Yellow
Write-Host "# Test essential sites only" -ForegroundColor Gray
Write-Host "    test -Detailed           " -NoNewline -ForegroundColor Yellow
Write-Host "# Show detailed information" -ForegroundColor Gray
Write-Host "    test -DNS 78.157.42.100  " -NoNewline -ForegroundColor Yellow
Write-Host "# Test with Electro DNS" -ForegroundColor Gray
Write-Host "    test -DNS 1.1.1.1        " -NoNewline -ForegroundColor Yellow
Write-Host "# Test with Cloudflare DNS" -ForegroundColor Gray
Write-Host "    test -DNS 8.8.8.8 -Quick " -NoNewline -ForegroundColor Yellow
Write-Host "# Combine parameters" -ForegroundColor Gray
Write-Host ""
Write-Host "  This tests REAL connections, not just DNS!" -ForegroundColor Green
Write-Host ""
