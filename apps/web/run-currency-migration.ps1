# PowerShell script to run currency migration
# This converts all currency values from paise to rupees

Write-Host "Currency Migration Script" -ForegroundColor Cyan
Write-Host "This will convert all currency values from paise to rupees" -ForegroundColor Yellow
Write-Host ""

# Read database credentials from .env file
$envContent = Get-Content .env
$dbUrl = ($envContent | Select-String "DATABASE_URL").ToString().Split("=")[1].Trim()

# Parse DATABASE_URL (format: mysql://user:password@host:port/database)
if ($dbUrl -match "mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "Database: $dbName on $dbHost`:$dbPort" -ForegroundColor Green
    Write-Host ""
    
    # Confirm before proceeding
    $confirm = Read-Host "Do you want to proceed with the currency migration? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Migration cancelled." -ForegroundColor Red
        exit
    }
    
    # Read SQL file
    $sqlFile = "run-currency-migration.sql"
    if (Test-Path $sqlFile) {
        $sql = Get-Content $sqlFile -Raw
        
        Write-Host "Running migration..." -ForegroundColor Yellow
        
        # Execute SQL using mysql command (if available)
        # Note: This requires mysql client to be installed
        $mysqlCmd = "mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPassword $dbName"
        
        try {
            $sql | & $mysqlCmd 2>&1
            Write-Host "Migration completed successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Error running migration: $_" -ForegroundColor Red
            Write-Host ""
            Write-Host "Alternative: Run the SQL file manually using:" -ForegroundColor Yellow
            Write-Host "  mysql -h $dbHost -P $dbPort -u $dbUser -p $dbName < $sqlFile" -ForegroundColor Cyan
        }
    } else {
        Write-Host "SQL file not found: $sqlFile" -ForegroundColor Red
    }
} else {
    Write-Host "Could not parse DATABASE_URL from .env file" -ForegroundColor Red
    Write-Host "Please run the SQL migration manually" -ForegroundColor Yellow
}

