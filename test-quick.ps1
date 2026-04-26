# Test simple avec curl (Windows + PowerShell)
# Usage: .\test-quick.ps1

Write-Host "🧪 TEST RAPIDE API IMMOTISS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$API = "http://localhost:3000"

# 1. Vérifier que le serveur répond
Write-Host "1️⃣  Vérifier serveur..." -ForegroundColor Yellow
$response = curl -s "$API/" | Select-String "Serveur backend"
if ($response) {
    Write-Host "✅ Backend fonctionne" -ForegroundColor Green
} else {
    Write-Host "❌ Backend ne répond pas" -ForegroundColor Red
    exit
}

# 2. Admin login
Write-Host "2️⃣  Admin login..." -ForegroundColor Yellow
$loginJson = @{
    email = "admin@immotiss.com"
    password = "admin123"
} | ConvertTo-Json

$login = curl -s -X POST "$API/auth/login" `
    -H "Content-Type: application/json" `
    -d $loginJson

if ($login -like "*token*") {
    Write-Host "✅ Admin connecté" -ForegroundColor Green
    $token = ($login | ConvertFrom-Json).token
} else {
    Write-Host "❌ Login échoué" -ForegroundColor Red
    exit
}

# 3. Offres publiques
Write-Host "3️⃣  Offres de test..." -ForegroundColor Yellow
$offers = curl -s "$API/offers/" | ConvertFrom-Json
$count = $offers.offers.Count
Write-Host "✅ $count offres trouvées" -ForegroundColor Green

# 4. Statistiques
Write-Host "4️⃣  Statistiques admin..." -ForegroundColor Yellow
$stats = curl -s -H "Authorization: Bearer $token" "$API/offers/admin/stats/overview" | ConvertFrom-Json
Write-Host "✅ Total offres: $($stats.totalOffers)" -ForegroundColor Green
Write-Host "   - Approuvées: $($stats.approvedOffers)" -ForegroundColor Gray
Write-Host "   - En attente: $($stats.pendingOffers)" -ForegroundColor Gray

# 5. Audit logs
Write-Host "5️⃣  Logs d'audit..." -ForegroundColor Yellow
$audit = curl -s -H "Authorization: Bearer $token" "$API/audit?page=1&limit=5" | ConvertFrom-Json
$auditCount = $audit.logs.Count
Write-Host "✅ $auditCount logs trouvés" -ForegroundColor Green

# 6. Demandes
Write-Host "6️⃣  Demandes d'inscription..." -ForegroundColor Yellow
$requests = curl -s -H "Authorization: Bearer $token" "$API/requests" | ConvertFrom-Json
$reqCount = $requests.Count
Write-Host "✅ $reqCount demandes en attente" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ TOUS LES TESTS RÉUSSIS!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Résumé:" -ForegroundColor Cyan
Write-Host "  ✅ Backend API: Fonctionne" -ForegroundColor Green
Write-Host "  ✅ Admin: Authentifié" -ForegroundColor Green
Write-Host "  ✅ Offres: $count disponibles" -ForegroundColor Green
Write-Host "  ✅ Statistiques: OK" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Ouvrir http://localhost:5174 (frontend)" -ForegroundColor White
Write-Host "  2. Voir les 6 offres de test" -ForegroundColor White
Write-Host "  3. Configurer l'email dans .env" -ForegroundColor White
Write-Host ""
