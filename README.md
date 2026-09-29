# Invitation Studio

Créateur d'invitations gratuit, hébergé sur GitHub Pages et conçu pour fonctionner sans Supabase.

## V2 — création

- Anniversaire, fête, sortie, dîner ou événement personnalisé
- Aperçu en direct
- 6 thèmes : Minuit, Papier, Sunset, Forêt, Océan, Lilas
- Couleur d'accent personnalisable
- Couleur du texte personnalisable
- 4 styles de police
- Mise en page compacte
- Symbole personnalisé
- Sous-titre
- Image de couverture par URL
- Date, heure, lieu, message, détails et organisateur
- Sauvegarde locale de jusqu'à 50 créations

## V2 — partage

- Lien unique sans compte
- Invitation autonome : les réglages sont encodés dans le lien
- Vue invité séparée de l'éditeur
- Fonctionne sur mobile et ordinateur
- Compatible GitHub Pages

## V2 — réponses

Le formulaire de réponse permet :

- Je viens / Je ne peux pas
- Nom du participant
- Nombre de personnes si activé
- Message facultatif
- Question personnalisée
- Envoi par e-mail quand l'organisateur fournit une adresse e-mail
- Sinon copie de la réponse pour l'envoyer par le moyen choisi

### Important

Cette version ne prétend pas avoir une base de données : les réponses ne sont pas encore centralisées sur un serveur.

Pour obtenir un **tableau de bord de réponses partagé entre appareils**, sans Supabase et en restant à 0 €, une prochaine version peut utiliser Firebase Realtime Database sur le forfait Spark. Firebase indique actuellement que Spark ne demande pas d'informations de paiement et fournit notamment 1 Go de stockage et 10 Go/mois de téléchargements pour Realtime Database, avec des limites de quota. Si le quota Spark est dépassé, le service concerné est suspendu pour le reste du mois. 

L'objectif de la prochaine étape serait alors :
- identifiant unique de chaque invitation
- code privé organisateur
- tableau de bord des réponses
- compteurs « présents / absents / total »
- liste des participants
- export CSV
- suppression d'une réponse
- protection des données par règles Firebase

Aucune fonctionnalité payante ne serait nécessaire pour cette architecture tant que les quotas gratuits sont respectés.

## Déploiement

Le dépôt est prévu pour GitHub Pages et ne nécessite ni build ni serveur Node.

Site attendu :
https://ethangalea1000-svg.github.io/Invitation/
