# Installe (ou remplace) la tache planifiee du robot editorial de Cosme Check.
# Jumeau de Memory-Pilot-Web/scripts/seo/installer-tache.ps1 (8 h) et de celui de
# RevealChat (7 h) : les trois robots partagent Chrome, d'ou une heure d'ecart
# entre eux (Cosme Check passe le premier, a 6 h) et le verrou de robot.ps1.
#
#   powershell -ExecutionPolicy Bypass -File scripts\seo\installer-tache.ps1 [-Heure 06:00]
#
# Pour l'enlever :  Unregister-ScheduledTask -TaskName 'CosmeCheck Robot SEO' -Confirm:$false
# Pour la suspendre sans la toucher : creer le fichier docs/seo/PAUSE.
#
# Reglages, et pourquoi :
# - chaque jour a l'heure dite, en session ouverte de l'utilisateur : la fenetre du
#   terminal et Chrome doivent s'afficher dans sa session, pas dans une session
#   invisible de service ;
# - WakeToRun : sort l'ordinateur de veille pour l'occasion ;
# - StartWhenAvailable : si l'ordinateur etait eteint a l'heure dite, la tache part
#   des qu'il redemarre, une fois, sans rattraper les jours manques ;
# - quatre heures au plus : une session en effort maximal sur un article complet
#   tient largement dedans, et une session bloquee ne tourne pas indefiniment ;
# - jamais deux en meme temps (IgnoreNew).

param([string]$Heure = '06:00')

$ErrorActionPreference = 'Stop'
$depot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script = Join-Path $depot 'scripts\seo\robot.ps1'
$nom = 'CosmeCheck Robot SEO'

# PowerShell par son chemin complet, et non Windows Terminal : `wt.exe` n'est
# qu'un alias d'application, que le Planificateur ne resout pas (erreur
# 0x80070002, fichier introuvable, constatee le 19/10/2026). La console de
# PowerShell affiche Claude tout aussi bien.
$action = New-ScheduledTaskAction `
  -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" `
  -Argument "-NoExit -ExecutionPolicy Bypass -File `"$script`"" `
  -WorkingDirectory $depot
$declencheur = New-ScheduledTaskTrigger -Daily -At $Heure
$reglages = New-ScheduledTaskSettingsSet -WakeToRun -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 4) -MultipleInstances IgnoreNew `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $nom -Action $action -Trigger $declencheur `
  -Settings $reglages -Principal $principal `
  -Description 'Cosme Check, chaque matin a 6 h : Claude (Opus 5.5, medium) mesure, ecrit un article, en optimise un, publie et demande l''indexation. Doctrine : docs/seo/ROBOT.md.' `
  -Force | Out-Null

Get-ScheduledTask -TaskName $nom | Select-Object TaskName, State
Write-Host "Prochaine execution : $((Get-ScheduledTaskInfo -TaskName $nom).NextRunTime)"
