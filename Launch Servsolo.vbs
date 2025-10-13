' C:\Users\firat\OneDrive\Desktop\servsolo-starter\Launch Servsolo.vbs
Set sh = CreateObject("WScript.Shell")
cmd = "powershell -ExecutionPolicy Bypass -File ""C:\Users\firat\OneDrive\Desktop\servsolo-starter\start-servsolo.ps1"""
sh.Run cmd, 0, False
