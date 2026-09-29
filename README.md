# Invitation Studio

Créateur d'invitations statique, conçu pour fonctionner sur GitHub Pages **sans Supabase**.

## Fonctionnalités

- Création d'invitations
- Anniversaire, fête, sortie, dîner ou événement personnalisé
- Aperçu en direct
- 4 thèmes visuels
- Date, heure, lieu, message et détails
- Confirmation de présence activable
- Sauvegarde locale dans le navigateur
- Génération d'un lien partageable
- Les données de l'invitation sont encodées dans le lien
- Aucun compte, aucune base de données et aucune clé secrète
- Compatible GitHub Pages
- Responsive mobile / ordinateur

## Déploiement

Le dépôt peut être publié directement avec GitHub Pages : aucun build ni serveur n'est nécessaire.

## Limite importante

Cette première architecture ne stocke pas les réponses RSVP sur un serveur : chaque invitation est autonome et les données sont dans le lien.

Pour une V2, on peut ajouter un backend indépendant de Supabase, par exemple Firebase, Appwrite, Cloudflare Workers/D1 ou une Google Apps Script Web App.
