# Spécification de Story : US-3.2

**ID** : US-3.2  
**Titre** : Fiche d'Assiduité des Membres  
**Épique** : Epic 3 — Réunions & Présences Hebdomadaires  
**Estimation** : 3 Story Points  
**Statut** : A Faire (Todo)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Pour accompagner efficacement les jeunes de la paroisse dans leur assiduité et identifier d'éventuels décrochages spirituels ou communautaires, l'administrateur doit disposer d'un historique précis pour chaque membre. Cette story implémente un panneau de profil détaillé (modale) affichant le taux d'assiduité global du membre sur les réunions enregistrées ainsi qu'une liste historique triée par date décroissante de ses présences et absences.

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : Le clic sur le nom d'un membre dans la liste d'appel ouvre une modale de profil d'assiduité.
* **CA-2** : La modale affiche le taux global d'assiduité du membre en pourcentage : `(nombre de présences / nombre total de réunions enregistrées) * 100`.
* **CA-3** : Un indicateur visuel de performance (ex: couleur verte si assiduité >= 80%, orange si entre 50% et 79%, rouge si < 50%) met en évidence le niveau d'engagement.
* **CA-4** : La modale présente la liste chronologique décroissante de toutes les dates de réunion avec le statut (Présent ou Absent) associé à chaque réunion.
* **CA-5** : En mode Démo (`isDemo`), la modale génère à la volée un historique de présences simulé réaliste pour la personne sélectionnée (ex: 8 dernières réunions avec un mélange de présences/absences) afin de rendre la maquette interactive sans base de données active.
* **CA-6** : L'accès se fait de manière asynchrone avec un indicateur de chargement dans la modale pendant l'appel API Supabase.

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers à créer / modifier

1. **`src/services/presenceService.js`** : Ajouter la méthode `getMemberAttendanceHistory` pour interroger l'historique avec une jointure Supabase.
2. **`src/components/common/MemberProfileModal.jsx`** : Créer le composant de la modale avec styles Glassmorphism.
3. **`src/App.jsx`** : Importer le composant de la modale et lier l'état d'ouverture au clic sur un membre.

### 3.2. Code Service à ajouter dans `presenceService.js`

```javascript
  // Récupère l'historique complet d'un membre (jointure)
  async getMemberAttendanceHistory(memberId) {
    const { data, error } = await supabase
      .from('presences')
      .select(`
        present,
        reunion:reunion_id (
          id,
          date,
          theme
        )
      `)
      .eq('member_id', memberId)

    if (error) throw error

    // Aplatir et trier par date décroissante
    return (data || [])
      .map(p => ({
        present: p.present,
        date: p.reunion?.date || '',
        theme: p.reunion?.theme || ''
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }
```

### 3.3. Structure Recommandée pour `MemberProfileModal.jsx`

La modale sera affichée en surimpression absolue avec un fond flouté :

```javascript
import React, { useState, useEffect } from 'react'
import { presenceService } from '../../services/presenceService'

export default function MemberProfileModal({ member, isDemo, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      // Simulation d'historique en mode démo (dates de réunions passées)
      const mockHistory = [
        { date: '2026-06-13', present: member.id === 'demo-2' || member.id === 'demo-4' ? false : true, theme: 'La joie de servir' },
        { date: '2026-06-06', present: true, theme: 'Esprit Saint, souffle de vie' },
        { date: '2026-05-30', present: member.id === 'demo-4' ? false : true, theme: 'Marcher dans la foi' },
        { date: '2026-05-23', present: true, theme: 'L\'amour fraternel' },
        { date: '2026-05-16', present: member.id === 'demo-1' ? false : true, theme: 'Prier sans cesse' },
        { date: '2026-05-09', present: true, theme: 'L\'humilité' },
        { date: '2026-05-02', present: true, theme: 'La fidélité dans les petites choses' },
        { date: '2026-04-25', present: false, theme: 'Porter sa croix quotidiennement' }
      ]
      setHistory(mockHistory)
      setLoading(false)
      return
    }

    const loadHistory = async () => {
      setLoading(true)
      try {
        const data = await presenceService.getMemberAttendanceHistory(member.id)
        setHistory(data)
      } catch (err) {
        console.error("Erreur de chargement d'historique :", err)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [member, isDemo])

  // Calcul du taux d'assiduité
  const totalReunions = history.length
  const totalPresences = history.filter(h => h.present).length
  const rate = totalReunions > 0 ? Math.round((totalPresences / totalReunions) * 100) : 0

  // Déterminer la couleur de performance
  const getRateColor = (r) => {
    if (r >= 80) return 'var(--success-color, #2ecc71)'
    if (r >= 50) return '#e67e22' // Orange
    return 'var(--danger-color, #e74c3c)' // Rouge
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div className="glass-panel flex flex-col gap-4" style={{
        maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        
        {/* Header Modale */}
        <div className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Profil d'Assiduité</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>{member.nom} {member.prenom}</p>
          </div>
          <button className="glass-button" style={{ padding: '0.3rem 0.6rem' }} onClick={onClose}>
            Fermer
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Chargement de l'historique...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Taux d'assiduité */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1.5rem',
              background: 'rgba(255,255,255,0.02)', padding: '1rem',
              borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                fontSize: '2.25rem', fontWeight: 'bold',
                color: getRateColor(rate),
                border: `3px solid ${getRateColor(rate)}`,
                borderRadius: '50%', width: '80px', height: '80px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {rate}%
              </div>
              <div>
                <h4 style={{ color: '#fff', margin: '0 0 0.25rem 0' }}>Score d'Assiduité</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Présent à {totalPresences} réunion(s) sur un total de {totalReunions} séances enregistrées.
                </p>
              </div>
            </div>

            {/* Liste historique */}
            <div>
              <h4 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1rem' }}>Historique des réunions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {history.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aucune réunion enregistrée</p>
                ) : (
                  history.map((h, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.01)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: '500', color: '#fff' }}>
                          {new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        {h.theme && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>— {h.theme}</span>}
                      </div>
                      <span style={{
                        fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                        background: h.present ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                        color: h.present ? '#2ecc71' : '#e74c3c', fontWeight: 'bold'
                      }}>
                        {h.present ? 'Présent' : 'Absent'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
```

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. **Ouverture Modale** : Cliquer sur le nom du premier membre dans la liste. S'assurer que le panneau s'ouvre bien en surimpression avec le fond flouté.
2. **Affichage Score** : Vérifier que le score est correctement calculé en pourcentage et que le cercle a la bonne couleur (Vert pour Didier, Orange/Rouge si applicable).
3. **Tri chronologique** : S'assurer que les dates listées sont triées de la plus récente à la plus ancienne.
4. **Validation Mode Démo** : En mode démo, vérifier que l'historique s'affiche de manière fluide et réaliste au clic sur n'importe quel membre (Didier, Sarah, Jean-Paul...).
5. **Comportement Réseau Réel** : En mode réel, simuler une lenteur réseau et s'assurer que la mention "Chargement de l'historique..." s'affiche temporairement avant l'affichage des données.
