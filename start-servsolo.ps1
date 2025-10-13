# C:\Users\firat\OneDrive\Desktop\servsolo-starter\start-servsolo.ps1
$ErrorActionPreference = 'Stop'
$app = 'C:\Users\firat\OneDrive\Desktop\servsolo-starter'
Set-Location $app

# Ensure Node exists
Get-Command node | Out-Null

# Install deps once
if (-not (Test-Path "$app\node_modules")) {
  cmd /c npm install
}

# Seed DB once
if (-not (Test-Path "$app\servsolo.db")) {
  cmd /c npm run seed
}

# Start server on 3000 if not already listening (hidden)
$listen = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $listen) {
  Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $app -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

# Find Chrome
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) { $chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" }
if (-not (Test-Path $chrome)) { throw "Chrome not found." }

# Launch Kiosk first (full screen)
$kioskArgs = "--new-window --kiosk --user-data-dir=""$app\ChromeKiosk"" http://localhost:3000"
Start-Process -FilePath $chrome -ArgumentList $kioskArgs | Out-Null

Start-Sleep -Milliseconds 800

# Launch Admin (separate profile) and put it on top
$adminArgs = "--new-window --user-data-dir=""$app\ChromeAdmin"" http://localhost:3000/admin.html"
$adminProc = Start-Process -FilePath $chrome -ArgumentList $adminArgs -PassThru

# Wait for the admin window to exist
for ($i=0; $i -lt 40 -and $adminProc.MainWindowHandle -eq 0; $i++) {
  Start-Sleep -Milliseconds 150
  $adminProc.Refresh()
}

# Make Admin topmost (above kiosk)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class Win32 {
  [DllImport("user32.dll")] public static extern bool SetWindowPos(
    IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
  public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
  public const UInt32 SWP_NOMOVE=0x0002, SWP_NOSIZE=0x0001, SWP_SHOWWINDOW=0x0040;
}
"@

$h = $adminProc.MainWindowHandle
if ($h -ne 0) {
  [Win32]::SetWindowPos($h, [Win32]::HWND_TOPMOST, 0,0,0,0,
    [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_SHOWWINDOW) | Out-Null
}
