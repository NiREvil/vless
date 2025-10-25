# ═══════════════════════════════════════════════════════════════
#  DNS SPEED TESTER | تست سرعت و کارایی DNS
# ═══════════════════════════════════════════════════════════════
#
# نحوه استفاده:
#   این دستور را در PowerShell اجرا کنید:
#   irm https://raw.githubusercontent.com/NiREvil/vless/main/edge/dns-test.ps1 | iex
#
# تست DNS دلخواه:
#   test 8.8.8.8          # Google DNS
#   test 1.1.1.1          # Cloudflare DNS
#   test 78.157.42.101    # Shecan DNS
#
# ═══════════════════════════════════════════════════════════════

function Show-Banner {
    Write-Host "`n" -NoNewline
    Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan -NoNewline
    Write-Host "          DNS SPEED & CONNECTIVITY TEST           " -ForegroundColor White -NoNewline
    Write-Host "║" -ForegroundColor Cyan
    Write-Host "║" -ForegroundColor Cyan -NoNewline
    Write-Host "              تست سرعت و دسترسی DNS              " -ForegroundColor Yellow -NoNewline
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

function Test-DnsServer {
    param (
        [Parameter(Mandatory = $false)]
        [string]$DnsServer = "78.157.42.100"
    )

    $domains = @(
        "google.com",
        "youtube.com",
        "instagram.com",
        "x.com",
        "twitter.com",
        "reddit.com",
        "gemini.google.com",
        "telegram.org",
        "t.me",
        "openai.com",
        "cloudflare.com",
        "github.com",
        "raw.githubusercontent.com",
        "bing.com",
        "brawlstars.com",
        "canva.com",
        "chat.openai.com",
        "supercell.com",
        "clashroyale.com",
        "claude.ai",
        "deepl.com",
        "deezer.com",
        "elevenlabs.io",
        "fitbit.com",
        "nvidia.com",
        "api.gemini.com",
        "gemini.com",
        "github.com/features/copilot",
        "studio.google.com",
        "jules.google.com",
        "grok.openai.com",
        "imgur.com",
        "datalore.jetbrains.com",
        "microsoft.com/en-us/copilot",
        "notebooklm.google.com",
        "notion.so",
        "api.openai.com",
        "parsec.app",
        "spotify.com",
        "tiktok.com",
        "truthsocial.com",
        "xbox.com",
        "xbox.com/en-US/xbox-cloud-gaming",
        "twitch.tv"
    )

    Show-Banner
    
    Write-Host "  DNS Server: " -NoNewline -ForegroundColor Gray
    Write-Host $DnsServer -ForegroundColor Green
    Write-Host "  Testing " -NoNewline -ForegroundColor Gray
    Write-Host "$($domains.Count)" -NoNewline -ForegroundColor Yellow
    Write-Host " domains..." -ForegroundColor Gray
    Write-Host "`n" + ("─" * 55) -ForegroundColor DarkGray

    $results = @()
    $successCount = 0
    $failCount = 0
    $totalTime = 0
    $counter = 0

    foreach ($domain in $domains) {
        $counter++
        Show-Progress -Current $counter -Total $domains.Count
        
        $start = Get-Date
        try {
            $result = Resolve-DnsName $domain -Server $DnsServer -ErrorAction Stop -DnsOnly
            $end = Get-Date
            $ms = ($end - $start).TotalMilliseconds
            $ips = ($result | Where-Object { $_.Type -eq "A" }).IPAddress
            
            $results += [PSCustomObject]@{
                Domain = $domain
                Status = "SUCCESS"
                Time = $ms
                IP = ($ips -join ", ")
            }
            
            $successCount++
            $totalTime += $ms
        }
        catch {
            $end = Get-Date
            $ms = ($end - $start).TotalMilliseconds
            
            $results += [PSCustomObject]@{
                Domain = $domain
                Status = "FAILED"
                Time = $ms
                IP = "N/A"
            }
            
            $failCount++
        }
    }

    Write-Host "`n`n" + ("─" * 55) -ForegroundColor DarkGray
    Write-Host "`n  RESULTS:" -ForegroundColor Cyan
    Write-Host ""

    foreach ($r in $results) {
        $statusColor = if ($r.Status -eq "SUCCESS") { "Green" } else { "Red" }
        $statusSymbol = if ($r.Status -eq "SUCCESS") { "✓" } else { "✗" }
        $timeColor = if ($r.Time -lt 50) { "Green" } elseif ($r.Time -lt 150) { "Yellow" } else { "Red" }
        
        Write-Host "  $statusSymbol " -NoNewline -ForegroundColor $statusColor
        Write-Host ("{0,-30}" -f $r.Domain) -NoNewline -ForegroundColor White
        Write-Host (" {0,6} ms" -f [math]::Round($r.Time)) -ForegroundColor $timeColor
        
        if ($r.Status -eq "SUCCESS" -and $r.IP) {
            Write-Host ("    └─ " + $r.IP) -ForegroundColor DarkGray
        }
    }

    Write-Host "`n" + ("─" * 55) -ForegroundColor DarkGray
    Write-Host "`n  SUMMARY:" -ForegroundColor Cyan
    Write-Host ""
    
    $successRate = [math]::Round(($successCount / $domains.Count) * 100, 1)
    $avgTime = if ($successCount -gt 0) { [math]::Round($totalTime / $successCount, 1) } else { 0 }
    
    Write-Host "  • Success Rate:  " -NoNewline -ForegroundColor Gray
    $rateColor = if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" }
    Write-Host "$successRate%" -NoNewline -ForegroundColor $rateColor
    Write-Host " ($successCount/$($domains.Count))" -ForegroundColor DarkGray
    
    Write-Host "  • Average Speed: " -NoNewline -ForegroundColor Gray
    $speedColor = if ($avgTime -lt 50) { "Green" } elseif ($avgTime -lt 150) { "Yellow" } else { "Red" }
    Write-Host "$avgTime ms" -ForegroundColor $speedColor
    
    Write-Host "  • Failed:        " -NoNewline -ForegroundColor Gray
    Write-Host "$failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

    Write-Host "`n  VERDICT: " -NoNewline -ForegroundColor Cyan
    if ($successRate -eq 100 -and $avgTime -lt 100) {
        Write-Host "Excellent! This DNS is fast and reliable." -ForegroundColor Green
        Write-Host "           این DNS عالی و قابل اعتماد است." -ForegroundColor Green
    }
    elseif ($successRate -ge 80) {
        Write-Host "Good performance with minor issues." -ForegroundColor Yellow
        Write-Host "           عملکرد خوب با مشکلات جزئی." -ForegroundColor Yellow
    }
    elseif ($successRate -ge 50) {
        Write-Host "Poor performance. Consider switching DNS." -ForegroundColor Red
        Write-Host "           عملکرد ضعیف، تغییر DNS توصیه می‌شود." -ForegroundColor Red
    }
    else {
        Write-Host "Critical! DNS is unreachable or heavily filtered." -ForegroundColor Red
        Write-Host "           بحرانی! DNS در دسترس نیست یا فیلتر شده." -ForegroundColor Red
    }

    Write-Host "`n" + ("═" * 55) -ForegroundColor Cyan
    Write-Host ""
}

Set-Alias -Name test -Value Test-DnsServer -Scope Global

Write-Host "`n  Quick Start:" -ForegroundColor Cyan
Write-Host "  ────────────" -ForegroundColor DarkGray
Write-Host "    test" -NoNewline -ForegroundColor Yellow
Write-Host "                    # Test default DNS (Shecan)" -ForegroundColor Gray
Write-Host "    test 1.1.1.1" -NoNewline -ForegroundColor Yellow
Write-Host "            # Test Cloudflare DNS" -ForegroundColor Gray
Write-Host "    test 8.8.8.8" -NoNewline -ForegroundColor Yellow
Write-Host "            # Test Google DNS" -ForegroundColor Gray
Write-Host "    test 78.157.42.101" -NoNewline -ForegroundColor Yellow
Write-Host "      # Test Shecan DNS" -ForegroundColor Gray
Write-Host ""
