' Launch servsolo.ps1 from the same folder, hidden
Dim fso, scriptDir, ps1, cmd, sh
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = """" & scriptDir & "\servsolo.ps1" & """"
cmd = "powershell.exe -ExecutionPolicy Bypass -NoProfile -File " & ps1
Set sh = CreateObject("WScript.Shell")
sh.Run cmd, 0, False
