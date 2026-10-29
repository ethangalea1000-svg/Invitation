# Invitation Studio

Créateur d'invitations gratuit, hébergé sur GitHub Pages.

## Fonctionnalités

- Création d'anniversaires, fêtes, sorties, dîners et événements personnalisés.
- Aperçu en direct et 6 thèmes.
- Couleurs, polices, symbole, sous-titre et image de couverture.
- Lien d'invitation autonome.
- RSVP : présence/absence, nom, nombre de personnes, message et question personnalisée.
- Sauvegarde locale jusqu'à 50 créations.
- Tableau de bord organisateur.
- Réponses centralisées avec Cloudflare Worker + D1.
- Export CSV et suppression des invitations.
- Aucun Supabase et aucun Firebase.

## Configuration Cloudflare

1. Crée un Worker Cloudflare.
2. Ajoute une base D1 nommée invitation-db.
3. Exécute worker/schema.sql dans D1.
4. Remplace database_id dans worker/wrangler.toml.
5. Déploie worker/src/index.ts.
6. Copie l'URL publique du Worker dans api-config.js.
7. Recharge GitHub Pages.

Le code organisateur est une clé aléatoire générée dans le navigateur. Seul son hash SHA-256 est stocké dans D1. Conserve-le si tu veux retrouver tes invitations sur un autre appareil.

Le site peut continuer à fonctionner sans Worker : les liens d'invitation restent autonomes et les réponses peuvent être préparées/copiées localement.
