$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
  npm install
}

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host ""
  Write-Host "Created .env. Edit BRIDGE_KEY before continuing." -ForegroundColor Yellow
  Write-Host ""
}

node server.mjs
