# Minimal DNS Resolver & Speed Tester
#
# Usage: 
#   Copy the following line and paste it into Windows PowerShell (by right-click)
#   irm https://raw.githubusercontent.com/NiREvil/vless/main/edge/dns-test.ps1 | iex

$dns = "78.157.42.100"

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
    "cloudflare.com"
)

Write-Host "`n🔍 DNS Health Check — $dns"
Write-Host "----------------------------------------"

$successCount = 0
$total = $domains.Count

foreach ($domain in $domains) {
    Write-Host "`n🌐 Testing: $domain"
    $start = Get-Date
    try {
        $result = Resolve-DnsName $domain -Server $dns -ErrorAction Stop
        $end = Get-Date
        $ms = ($end - $start).TotalMilliseconds
        $ips = ($result | Where-Object { $_.QueryType -eq "A" }).IPAddress -join ", "
        Write-Host "   ✅ OK ($([math]::Round($ms)) ms)"
        Write-Host "   ↳ $ips"
        $successCount++
    }
    catch {
        $end = Get-Date
        $ms = ($end - $start).TotalMilliseconds
        Write-Host "   ❌ Failed ($([math]::Round($ms)) ms)"
    }
}

Write-Host "`n----------------------------------------"
Write-Host "📊 Summary:"
Write-Host "   Resolved: $successCount / $total"

if ($successCount -eq $total) {
    Write-Host "   ✅ All sites resolved successfully!"
} elseif ($successCount -gt 0) {
    Write-Host "   ⚠️ Partial success — some blocked or slow."
} else {
    Write-Host "   ❌ DNS unreachable or fully filtered."
}

Write-Host "----------------------------------------"
