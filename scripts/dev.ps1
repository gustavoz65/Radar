# Omnia - automacao de desenvolvimento para Windows (equivalente ao Makefile)
# Uso: .\scripts\dev.ps1 <alvo>   | alvos: up, down, logs, backend-run, backend-test,
#        backend-build, frontend-run, frontend-test, frontend-build, test, format, check, sonar-up, clean
param([Parameter(Position = 0)][string]$Target = 'help')

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Backend([string]$goals) {
  Set-Location "$root\backend"
  & .\mvnw.cmd $goals.Split(' ')
  $code = $LASTEXITCODE
  Set-Location $root
  if ($code -ne 0) { exit $code }
}

switch ($Target) {
  'up'             { docker compose up -d postgres redis mailhog }
  'down'           { docker compose down }
  'logs'           { docker compose logs -f }
  'backend-run'    { Backend 'spring-boot:run -Dspring-boot.run.profiles=local' }
  'backend-test'   { Backend 'verify' }
  'backend-build'  { Backend '-DskipTests package' }
  'frontend-run'   { Set-Location "$root\frontend"; npm start }
  'frontend-test'  { Set-Location "$root\frontend"; npm test -- --watch=false }
  'frontend-build' { Set-Location "$root\frontend"; npm run build }
  'test'           { Backend 'verify'; Set-Location "$root\frontend"; npm test -- --watch=false }
  'format'         { Backend 'spotless:apply'; npx prettier --write . }
  'check'          { Backend 'spotless:check checkstyle:check verify'; npx prettier --check . }
  'sonar-up'       { docker compose --profile quality up -d sonarqube }
  'clean'          { Backend 'clean'; Remove-Item -Recurse -Force "$root\frontend\dist", "$root\frontend\.angular" -ErrorAction SilentlyContinue }
  default {
    Write-Host "Alvos: up, down, logs, backend-run, backend-test, backend-build, frontend-run,"
    Write-Host "       frontend-test, frontend-build, test, format, check, sonar-up, clean"
  }
}


