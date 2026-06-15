# Rétrospective de Sprint : MIJERCA Cénacle

**Sprint** : Sprint 1 — Socle PWA & Engagement Spirituel  
**Date** : 13 Juin 2026  
**Animateurs** : John (Product Manager) & Winston (System Architect)  
**Vélocité** : 14 Story Points planifiés, 14 Story Points complétés (100% de réussite).  

---

## 1. Ce qui s'est bien passé (Successes)

* **Codebase PWA Épurée** : L'initialisation manuelle de React + Vite sans template lourd a produit une base de code propre, lisible et performante. La taille du bundle est minimale, répondant à nos exigences réseau.
* **Mécanisme de Démo Intégré** : L'intégration d'un mode de connexion simulation (`loginAsDemo`) a permis de valider instantanément les flux utilisateur (Mobile vs Admin) et l'expérience audio, sans dépendance bloquante envers la configuration des clés secrètes d'API Supabase.
* **Richesse de l'Expérience Utilisateur** : Le lecteur de méditations intègre la gestion hors-ligne automatique et le partage WhatsApp enrichi (gras, emojis, liens), ce qui rend le produit prêt à l'usage réel.

---

## 2. Ce qui peut être amélioré (Lessons Learned)

* **Planification des Dépendances** : Lors du setup initial de la story US-1.1, nous avons omis d'inclure `@supabase/supabase-js` dans `package.json`. Bien que corrigé rapidement au début de la story US-1.2, nous devrons consacrer une attention particulière aux bibliothèques requises dès l'étape d'écriture des fiches de spécification (Story Specs).

---

## 3. Actions Immédiates (Action Items)

1. **Paramétrage Réel** : Remplacer les clés factices du fichier `.env` par les clés réelles du projet Supabase de la paroisse Saint Charles Lwanga pour tester la synchronisation en direct.
2. **Lancement du Sprint 2** : Planifier le découpage de la phase d'implémentation opérationnelle (suivi des présences et logistique).

---

## 4. Aperçu du Sprint 2 (Planification à venir)

Le **Sprint 2** se concentrera sur l'administration et la logistique événementielle :

```
                                  [ SPRINT 2 BACKLOG ]
                                            |
         +----------------------------------+----------------------------------+
         |                                  |                                  |
         v                                  v                                  v
  [ Epic 3 : Présences ]            [ Epic 4 : Retraites ]              [ Epic 5 : Badges ]
  - US-3.1 : Pointage checklist      - US-4.1 : Inscriptions             - US-5.1 : Upload fond
  - US-3.2 : Fiche d'assiduité       - US-4.2 : Tri Logements (M/F)      - US-5.2 : PDF Badges + QR
                                     - US-4.3 : Tri Carrefours (Âge)
```

* **Objectif du Sprint 2** : Permettre au comité de cocher les présences en réunion et d'automatiser entièrement la logistique et l'impression des badges pour les retraites.
