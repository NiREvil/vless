# Minimal DNS Resolver & Speed Tester
#
# Usage: 
#   Copy the following line and paste it into Windows PowerShell (by right-click)
#   irm https://raw.githubusercontent.com/NiREvil/vless/main/edge/dns-test.ps1 | iex
#
# If you want to test a DNS other than the default, just type the "test" into PowerShell and enter the DNS IP you want,
# for example:
#   test 8.8.8.8
#   test 78.157.42.101
#   test 1.1.1.1


function test {
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
        "ai.dev",
        "openai.com",
        "cloudflare.com",
        "raw.githubusercontent.com"
    )

    Write-Host "`n🔍 DNS Health Check — $DnsServer"
    Write-Host "----------------------------------------"

    $successCount = 0
    $total = $domains.Count

    foreach ($domain in $domains) {
        Write-Host "`n(⁠✷⁠‿⁠✷⁠) Testing: $domain"
        $start = Get-Date
        try {
            $result = Resolve-DnsName $domain -Server $DnsServer -ErrorAction Stop
            $end = Get-Date
            $ms = ($end - $start).TotalMilliseconds
            $ips = ($result | Where-Object { $_.QueryType -eq "A" }).IPAddress -join ", "
            Write-Host "  ＼⁠(⁠°⁠o⁠°⁠)⁠／ OK $([math]::Round($ms)) ms)"
            Write-Host "  ↳ $ips"
            $successCount++
        }
        catch {
            $end = Get-Date
            $ms = ($end - $start).TotalMilliseconds
            Write-Host "   (⁠●⁠_⁠_⁠●⁠) Failed ($([math]::Round($ms)) ms)"
        }
    }

    Write-Host "`n----------------------------------------"
    Write-Host " U ⁠꓃⁠ ⁠U Summary:"
    Write-Host "   Resolved: $successCount / $total"

    if ($successCount -eq $total) {
        Write-Host "  ＼⁠(⁠°⁠o⁠°⁠)⁠／ All sites resolved successfully!"
    } elseif ($successCount -gt 0) {
        Write-Host "  (⁠〒⁠﹏⁠〒⁠)  Partial success — some blocked or slow."
    } else {
        Write-Host "   (⁠●⁠_⁠_⁠●⁠)  DNS unreachable or fully filtered."
    }

    Write-Host "----------------------------------------"
}

Write-Host "    Usage example:  test 1.1.1.1"
Write-Host "                    test 78.157.42.100`n"
