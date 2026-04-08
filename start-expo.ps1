$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
Set-Location "c:\Users\Kenrm\repositories\mood-tracker"
& "C:\Program Files\nodejs\node.exe" ".\node_modules\.bin\expo" start --port 8081 --clear
