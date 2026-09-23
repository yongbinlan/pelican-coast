$ErrorActionPreference = 'Stop'
$siteRoot = $PSScriptRoot
$url = 'http://127.0.0.1:8765/'
$running = $false
try { $response = Invoke-WebRequest -Uri $url -TimeoutSec 2; $running = $response.Content -match 'Pelican Coast' } catch {}
if (-not $running) {
    $pythonExe = (Get-Command python -ErrorAction Stop).Source
    Start-Process -FilePath $pythonExe -ArgumentList @('-m', 'http.server', '8765', '--bind', '127.0.0.1', '--directory', ('"' + $siteRoot + '"')) -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 200
        try { $response = Invoke-WebRequest -Uri $url -TimeoutSec 1; if ($response.Content -match 'Pelican Coast') { $running = $true; break } } catch {}
    }
    if (-not $running) { throw '本地页面未能启动。请检查 8765 端口是否被其他程序占用。' }
}
Start-Process $url
