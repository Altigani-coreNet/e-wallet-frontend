# PowerShell Script to Setup Dashboards Project Assets
# Run this from the "POS Artitectures" directory

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Dashboards Project Asset Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running from correct directory
if (!(Test-Path "SoftPos") -or !(Test-Path "Dashboards")) {
    Write-Host "ERROR: Please run this script from the 'POS Artitectures' directory" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    exit 1
}

# Step 1: Copy Metronic Assets
Write-Host "[1/3] Copying Metronic Theme Assets..." -ForegroundColor Yellow
Write-Host "  Source: SoftPos\public\assets" -ForegroundColor Gray
Write-Host "  Destination: Dashboards\public\assets" -ForegroundColor Gray

if (Test-Path "SoftPos\public\assets") {
    try {
        # Create public directory if it doesn't exist
        if (!(Test-Path "Dashboards\public")) {
            New-Item -ItemType Directory -Path "Dashboards\public" -Force | Out-Null
        }
        
        Copy-Item -Path "SoftPos\public\assets" -Destination "Dashboards\public\" -Recurse -Force
        Write-Host "  ✓ Metronic assets copied successfully!" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Error copying Metronic assets: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ Source assets not found!" -ForegroundColor Red
}

Write-Host ""

# Step 2: Copy Merchant Components
Write-Host "[2/3] Copying Merchant Components..." -ForegroundColor Yellow

$merchantComponents = @(
    @{Source="branches"; Dest="branches"},
    @{Source="terminals"; Dest="terminals"},
    @{Source="payment-links"; Dest="payment-links"},
    @{Source="merchant"; Dest="merchant"},
    @{Source="contracts"; Dest="contracts"},
    @{Source="service-fees"; Dest="service-fees"},
    @{Source="Profile"; Dest="Profile"}
)

foreach ($component in $merchantComponents) {
    $sourcePath = "SoftPos\resources\js\components\$($component.Source)"
    $destPath = "Dashboards\src\components\merchant\$($component.Dest)"
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            Write-Host "  ✓ Copied $($component.Source)" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Error copying $($component.Source): $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠ Skipped $($component.Source) (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 3: Copy Sales Components
Write-Host "[3/3] Copying Sales Components..." -ForegroundColor Yellow

$salesComponents = @(
    @{Source="Sales"; Dest="Sales"},
    @{Source="POS"; Dest="POS"},
    @{Source="users"; Dest="users"},
    @{Source="roles"; Dest="roles"}
)

foreach ($component in $salesComponents) {
    $sourcePath = "SoftPos\resources\js\components\$($component.Source)"
    $destPath = "Dashboards\src\components\sales\$($component.Dest)"
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            Write-Host "  ✓ Copied $($component.Source)" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Error copying $($component.Source): $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠ Skipped $($component.Source) (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Create .env file in Dashboards folder with API URLs" -ForegroundColor White
Write-Host "  2. Uncomment CSS/JS links in Dashboards\index.html" -ForegroundColor White
Write-Host "  3. Run: cd Dashboards; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: Dashboards\SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

