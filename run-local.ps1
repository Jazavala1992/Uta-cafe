$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Abriendo backend y frontend en nuevas ventanas de PowerShell..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir/backend'; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir/frontend'; npm run dev"
