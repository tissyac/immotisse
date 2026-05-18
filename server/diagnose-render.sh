#!/bin/bash

echo "🔍 DIAGNOSTIC EMAIL RENDER"
echo "=========================="
echo ""

echo "1️⃣ Vérification des variables d'environnement:"
echo "   SENDGRID_API_KEY: ${SENDGRID_API_KEY:0:20}..."
echo "   SMTP_SERVICE: $SMTP_SERVICE"
echo "   SMTP_USER: ${SMTP_USER:0:10}..."
echo "   SMTP_HOST: $SMTP_HOST"
echo "   SMTP_PORT: $SMTP_PORT"
echo ""

echo "2️⃣ Test de connectivité réseau:"
echo "   Tester Gmail SMTP (timeout = 5s)..."
timeout 5 nc -zv smtp.gmail.com 587 2>&1 || echo "   ❌ Gmail SMTP n'est pas accessible (Render bloque probablement)"
echo ""
echo "   Tester SendGrid SMTP (timeout = 5s)..."
timeout 5 nc -zv smtp.sendgrid.net 587 2>&1 || echo "   SendGrid SMTP test"
echo ""

echo "3️⃣ Recommandation:"
if [ -z "$SENDGRID_API_KEY" ]; then
    echo "   ⚠️  SENDGRID_API_KEY non configuré"
    echo "   📝 Solution: Ajouter SENDGRID_API_KEY à vos variables Render"
else
    echo "   ✅ SendGrid est configuré"
fi
echo ""

if [ -n "$SMTP_USER" ]; then
    echo "   ℹ️  Gmail est aussi configuré"
    echo "   ⚠️  Render peut bloquer les connexions sortantes SMTP à Gmail"
    echo "   💡 Recommandation: Utiliser SENDGRID_API_KEY comme principal"
fi
