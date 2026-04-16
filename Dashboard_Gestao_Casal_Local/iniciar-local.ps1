$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Iniciando API local..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\MinhaVidaAPI'; dotnet run"

Start-Sleep -Seconds 3

Write-Host "Iniciando frontend local..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\MinhaVidaFront'; npm install; npm run dev"

Write-Host "Projeto local iniciado."
