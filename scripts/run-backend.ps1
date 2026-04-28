[CmdletBinding()]
param(
    [switch]$Dev,
    [switch]$SkipInfra,
    [switch]$DryRun,
    [string]$EnvFile
)

$ErrorActionPreference = "Stop"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptPath
$backendDir = Join-Path $repoRoot "backend"

if (-not $EnvFile) {
    $EnvFile = Join-Path $repoRoot ".env"
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
    throw "Environment file not found: $EnvFile"
}

function Import-EnvFile {
    param([string]$Path)

    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) {
            continue
        }

        $parts = $trimmed -split "=", 2
        if ($parts.Length -ne 2) {
            continue
        }

        $name = $parts[0].Trim()
        $value = $parts[1].Trim()

        if ($value.Length -ge 2) {
            $startsWithQuote = $value.StartsWith('"') -or $value.StartsWith("'")
            $endsWithQuote = $value.EndsWith('"') -or $value.EndsWith("'")
            if ($startsWithQuote -and $endsWithQuote) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        }

        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

Import-EnvFile -Path $EnvFile

$jwtSecret = [System.Environment]::GetEnvironmentVariable("APP_JWT_SECRET", "Process")
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    throw "APP_JWT_SECRET is missing. Set it in $EnvFile."
}

if ($jwtSecret.Length -lt 32) {
    throw "APP_JWT_SECRET must be at least 32 characters for JWT HMAC security."
}

if ($Dev) {
    [System.Environment]::SetEnvironmentVariable("SPRING_PROFILES_ACTIVE", "dev", "Process")
}

Write-Host "Loaded environment from $EnvFile"
Write-Host "Backend directory: $backendDir"
if ($Dev) {
    Write-Host "Spring profile: dev"
}

if ($DryRun) {
    Write-Host "Dry run enabled. No commands were executed."
    exit 0
}

if (-not $SkipInfra) {
    Write-Host "Starting local infrastructure with docker compose..."
    & docker compose up -d
}

Push-Location $backendDir
try {
    Write-Host "Starting Spring Boot backend..."
    & .\mvnw.cmd spring-boot:run
}
finally {
    Pop-Location
}
