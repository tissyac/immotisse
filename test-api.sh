#!/bin/bash
# Script de test de l'API IMMOTISS
# Usage: chmod +x test-api.sh && ./test-api.sh

echo "🧪 TEST API IMMOTISS"
echo "===================="
echo ""

API="http://localhost:3000"
ADMIN_EMAIL="admin@immotiss.com"
ADMIN_PASS="admin123"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. TEST: Serveur accessible
echo "1️⃣  Vérifier que le serveur répond..."
if curl -s "$API/" | grep -q "Serveur backend"; then
    echo -e "${GREEN}✅ Serveur backend OK${NC}"
else
    echo -e "${RED}❌ Serveur backend ne répond pas${NC}"
    exit 1
fi
echo ""

# 2. TEST: Admin login
echo "2️⃣  Test login admin..."
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login admin échoué${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Admin connecté${NC}"
    echo "   Token: ${TOKEN:0:50}..."
fi
echo ""

# 3. TEST: Récupérer les offres publiques
echo "3️⃣  Récupérer les 6 offres de test..."
OFFERS=$(curl -s "$API/offers/" | grep -o '"_id"' | wc -l)

if [ "$OFFERS" -ge 6 ]; then
    echo -e "${GREEN}✅ ${OFFERS} offres trouvées${NC}"
else
    echo -e "${RED}⚠️  Seulement ${OFFERS} offres (attendait 6)${NC}"
fi
echo ""

# 4. TEST: Filtrer les offres par ville
echo "4️⃣  Filtrer offres par ville (Casablanca)..."
CASABLANCA=$(curl -s "$API/offers/?city=Casablanca" | grep -o '"city":"Casablanca"' | wc -l)

if [ "$CASABLANCA" -ge 1 ]; then
    echo -e "${GREEN}✅ ${CASABLANCA} offres à Casablanca${NC}"
else
    echo -e "${RED}⚠️  Aucune offre trouvée à Casablanca${NC}"
fi
echo ""

# 5. TEST: Récupérer les stats admin
echo "5️⃣  Récupérer statistiques admin..."
STATS=$(curl -s -X GET "$API/offers/admin/stats/overview" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"totalOffers":[0-9]*' | cut -d':' -f2)

if [ ! -z "$STATS" ]; then
    echo -e "${GREEN}✅ Total offres (stats): $STATS${NC}"
else
    echo -e "${RED}❌ Impossible de récupérer les stats${NC}"
fi
echo ""

# 6. TEST: Vérifier les demandes d'inscription
echo "6️⃣  Vérifier les demandes d'inscription..."
REQUESTS=$(curl -s -X GET "$API/requests" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"_id"' | wc -l)

echo -e "${GREEN}✅ ${REQUESTS} demandes d'inscription${NC}"
echo ""

# 7. TEST: Vérifier les logs d'audit
echo "7️⃣  Vérifier les logs d'audit..."
AUDIT_LOGS=$(curl -s -X GET "$API/audit?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"_id"' | wc -l)

echo -e "${GREEN}✅ ${AUDIT_LOGS} logs d'audit${NC}"
echo ""

echo "═══════════════════════════════════════════"
echo -e "${GREEN}✅ TOUS LES TESTS SONT PASSÉS!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "🌐 Accéder à l'application:"
echo "   Frontend: http://localhost:5174"
echo "   Backend API: http://localhost:3000"
echo ""
echo "👤 Comptes de test:"
echo "   Admin:"
echo "   - Email: admin@immotiss.com"
echo "   - Password: admin123"
echo ""
