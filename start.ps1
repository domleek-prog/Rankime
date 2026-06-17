# Starts both the API server and the Vite dev server in separate windows
$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm run dev" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev" -WindowStyle Normal

Write-Host "Started! Open http://localhost:5173 in your browser."
Write-Host "API server: http://localhost:3001"
