# CoffeeFlow POS - Application web complète de gestion de caisse café

Application front-end (HTML/CSS/JS) pensée pour une caisse de café avec fonctionnalités avancées.

## Fonctionnalités incluses

- **Multi-serveurs**: gestion d'une liste de serveurs et attribution de chaque ticket.
- **Vente rapide**: ajout de produits au ticket, modification des quantités, validation d'une vente.
- **Stock**: suivi du stock par produit, alerte de stock bas, blocage en rupture.
- **Gestion produits**: création, édition et suppression de produits (nom, catégorie, prix, stock, seuil).
- **Paramètres**:
  - nom de l'établissement
  - devise
  - TVA
  - nom d'imprimante
  - auto-impression du ticket
  - message de bas de ticket
- **Impression**:
  - impression du dernier ticket
  - impression du rapport du jour
  - impression lors de la fin de journée
- **Fin de journée**: clôture avec archive des journées (CA, nb tickets, nb articles, top serveur).

## Lancement

```bash
python3 -m http.server 8000
```

Puis ouvrir : `http://localhost:8000`

## Fichiers

- `index.html` : structure de l'interface.
- `styles.css` : thème sombre moderne + responsive.
- `app.js` : logique complète de caisse / stock / paramètres / impression / rapports.
