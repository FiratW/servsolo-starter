' Run servsolo.ps1 from the same folder, hidden
On Error Resume Next
Dim fso, shell, scriptDir, ps1
Set fso   = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1       = scriptDir & "\servsolo.ps1"

If fso.FileExists(ps1) Then
  shell.CurrentDirectory = scriptDir
  ' Hide window (0) and don’t wait (False)
  shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & ps1 & """", 0, False
Else
  MsgBox "servsolo.ps1 not found at:" & vbCrLf & ps1, vbCritical, "Servsolo"
End If
