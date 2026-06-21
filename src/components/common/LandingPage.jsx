import React, { useState, useEffect } from 'react'
import { retreatService } from '../../services/retreatService'

// ─── Données démo ────────────────────────────────────────────────────────────
const DEMO_EVENTS = [
  {
    id: 'd1',
    titre: "Feu de l'Esprit 2026",
    date_debut: '2026-08-14',
    date_fin: '2026-08-17',
    lieu: 'Centre Loyola, Kinshasa'
  },
  {
    id: 'd2',
    titre: 'Retraite de Carême',
    date_debut: '2027-02-19',
    date_fin: '2027-02-23',
    lieu: 'Centre Manresa, Lubumbashi'
  }
]

const formatDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// ─── Sections de contenu ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🕊️',
    title: 'Méditations Quotidiennes',
    desc: 'Accédez chaque jour à un texte biblique et un audio de méditation guidée, même hors‑ligne.'
  },
  {
    icon: '📋',
    title: 'Réunions Hebdomadaires',
    desc: "Suivi numérique des présences, historique d'assiduité et gestion des réunions de groupe."
  },
  {
    icon: '⛺',
    title: 'Retraites Spirituelles',
    desc: 'Inscription en ligne, répartition intelligente des groupes et logements pour chaque retraite.'
  },
  {
    icon: '🪪',
    title: 'Badges & QR Codes',
    desc: 'Génération automatique de badges PDF personnalisés avec QR code de présence pour chaque participant.'
  }
]

// ─── Composant principal ──────────────────────────────────────────────────────
export default function LandingPage({ onLoginRequest, isDemo }) {
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  useEffect(() => {
    document.title = 'MIJERCA Cénacle – Communauté de Foi & Fraternité'

    // Description
    let createdDesc = false
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
      createdDesc = true
    }
    const prevDesc = metaDesc.content
    metaDesc.content =
      'Découvrez le groupe MIJERCA Cénacle : retraites spirituelles, méditations quotidiennes, réunions de prière et fraternité à Kinshasa.'

    // Open Graph
    let createdOgTitle = false
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
      createdOgTitle = true
    }
    const prevOgTitle = ogTitle.content
    ogTitle.content = 'MIJERCA Cénacle – Communauté de Foi & Fraternité'

    return () => {
      document.title = 'MIJERCA Cénacle'
      if (createdDesc) {
        metaDesc.remove()
      } else {
        metaDesc.content = prevDesc
      }
      if (createdOgTitle) {
        ogTitle.remove()
      } else {
        ogTitle.content = prevOgTitle
      }
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        if (isDemo) {
          await new Promise((r) => setTimeout(r, 400))
          setEvents(DEMO_EVENTS)
        } else {
          setEvents(await retreatService.getActiveRetreats())
        }
      } catch {
        setEvents([])
      } finally {
        setLoadingEvents(false)
      }
    }
    load()
  }, [isDemo])

  return (
    <div id="landing-page" style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ─── META SEO ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        #landing-page { font-family: 'Inter', sans-serif; }

        /* Animation hero */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .lp-hero-emoji { animation: float 4s ease-in-out infinite; display: inline-block; }
        .lp-fade-1 { animation: fadeUp 0.6s ease both 0.1s; }
        .lp-fade-2 { animation: fadeUp 0.6s ease both 0.25s; }
        .lp-fade-3 { animation: fadeUp 0.6s ease both 0.4s; }
        .lp-fade-4 { animation: fadeUp 0.6s ease both 0.55s; }

        .lp-feature-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px;
          padding: 1.4rem 1.2rem;
          transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .lp-feature-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .lp-event-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(155,89,182,0.25);
          border-radius: 14px;
          padding: 1.1rem 1.25rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .lp-event-card:hover {
          border-color: rgba(155,89,182,0.5);
          background: rgba(155,89,182,0.06);
        }
        .lp-btn-primary {
          background: linear-gradient(135deg, var(--accent-color, #9b59b6), #6c3483);
          color: #fff;
          border: none;
          padding: 0.75rem 1.75rem;
          border-radius: 40px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 18px rgba(155,89,182,0.4);
        }
        .lp-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(155,89,182,0.55);
        }
        .lp-btn-primary:active { transform: translateY(0); opacity: 0.9; }

        .lp-btn-ghost {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 0.72rem 1.5rem;
          border-radius: 40px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .lp-btn-ghost:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.3);
        }

        .lp-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          margin: 2.5rem 0;
        }
        @media (max-width: 480px) {
          .lp-grid-features { grid-template-columns: 1fr !important; }
          .lp-grid-events   { grid-template-columns: 1fr !important; }
          .lp-hero-title    { font-size: 2rem !important; }
          .lp-hero-btns     { flex-direction: column; align-items: stretch !important; }
          .lp-hero-btns button { width: 100%; text-align: center; }
        }
      `}</style>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <header style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 1.5rem 3rem',
        position: 'relative',
        background: 'radial-gradient(ellipse at 60% 0%, rgba(155,89,182,0.18) 0%, transparent 65%), radial-gradient(ellipse at 30% 80%, rgba(52,152,219,0.10) 0%, transparent 55%)'
      }}>
        {/* Orbe décoratif */}
        <div aria-hidden style={{
          position: 'absolute', top: '8%', right: '10%',
          width: '260px', height: '260px',
          background: 'radial-gradient(circle, rgba(155,89,182,0.12), transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div className="lp-fade-1">
          <span className="lp-hero-emoji" style={{ fontSize: '4rem', lineHeight: 1 }}>✝️</span>
        </div>

        <h1 className="lp-hero-title lp-fade-2" style={{
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: '800',
          color: '#fff',
          margin: '0.75rem 0 0.5rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.15
        }}>
          MIJERCA&nbsp;
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-color, #9b59b6), #f39c12)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Cénacle</span>
        </h1>

        <p className="lp-fade-3" style={{
          fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
          color: 'rgba(255,255,255,0.65)',
          maxWidth: '560px',
          lineHeight: 1.7,
          margin: '0 auto 0.5rem'
        }}>
          Communauté de jeunes chrétiens engagés dans la prière, la fraternité et la croissance spirituelle.
        </p>
        <p className="lp-fade-3" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', marginBottom: '2rem' }}>
          📍 Kinshasa · Congo-Kinshasa
        </p>

        <div className="lp-hero-btns lp-fade-4" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            id="landing-login-btn"
            className="lp-btn-primary"
            onClick={onLoginRequest}
            aria-label="Se connecter à l'espace MIJERCA Cénacle"
          >
            🔐 Se connecter
          </button>
          <button
            id="landing-discover-btn"
            className="lp-btn-ghost"
            onClick={() => {
              document.getElementById('lp-features')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Découvrir ↓
          </button>
        </div>

        {/* Indicateur de défilement */}
        <div aria-hidden style={{ marginTop: '3rem', opacity: 0.3, fontSize: '1.2rem', animation: 'float 2.5s ease-in-out infinite' }}>
          ↓
        </div>
      </header>

      {/* ─── FONCTIONNALITÉS ──────────────────────────────────────── */}
      <section id="lp-features" style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h2 style={{ textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: '1.6rem', marginBottom: '0.5rem' }}>
          Tout pour votre vie de foi
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
          Une application mobile‑first pensée pour la communauté MIJERCA Cénacle.
        </p>

        <div className="lp-grid-features" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.65rem' }}>{f.icon}</div>
              <h3 style={{ color: '#fff', fontWeight: '600', fontSize: '1rem', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" style={{ maxWidth: '800px', margin: '0 auto' }} />

      {/* ─── PROCHAINS ÉVÉNEMENTS ─────────────────────────────────── */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        <h2 style={{ color: '#fff', fontWeight: '700', fontSize: '1.4rem', marginBottom: '1.5rem' }}>
          ⛺ Prochains événements
        </h2>

        {loadingEvents ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>Chargement des événements...</p>
        ) : events.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '1.5rem', textAlign: 'center',
            color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem'
          }}>
            Aucun événement prévu prochainement. Revenez bientôt ! 🙏
          </div>
        ) : (
          <div className="lp-grid-events" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem'
          }}>
            {events.map((evt) => (
              <div key={evt.id} className="lp-event-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <h3 style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem', margin: 0, flex: 1 }}>
                    {evt.titre}
                  </h3>
                  <span style={{
                    background: 'rgba(155,89,182,0.25)', color: 'var(--accent-color, #9b59b6)',
                    fontSize: '0.65rem', fontWeight: '700', padding: '0.2rem 0.5rem',
                    borderRadius: '20px', whiteSpace: 'nowrap', marginLeft: '0.5rem', textTransform: 'uppercase'
                  }}>
                    Inscriptions ouvertes
                  </span>
                </div>
                {evt.lieu && (
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', margin: '0 0 0.3rem' }}>
                    📍 {evt.lieu}
                  </p>
                )}
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', margin: 0 }}>
                  📅 {formatDate(evt.date_debut)} → {formatDate(evt.date_fin)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="lp-divider" style={{ maxWidth: '800px', margin: '0 auto' }} />

      {/* ─── À PROPOS ─────────────────────────────────────────────── */}
      <section style={{
        maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem 4rem', textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.2)',
          borderRadius: '20px', padding: '2.5rem 2rem'
        }}>
          <h2 style={{ color: '#fff', fontWeight: '700', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
            Notre Mission
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontSize: '0.92rem', margin: '0 0 1.5rem' }}>
            La <strong style={{ color: 'rgba(255,255,255,0.85)' }}>MIJERCA Cénacle</strong> est une communauté de jeunes chrétiens qui vivent leur foi à travers la prière commune, les retraites spirituelles et l'engagement fraternel. Inspirés par l'Esprit de Cénacle, nous cherchons à grandir ensemble dans la foi, l'espérance et la charité.
          </p>
          <button
            id="landing-cta-bottom"
            className="lp-btn-primary"
            onClick={onLoginRequest}
            aria-label="Rejoindre la communauté MIJERCA Cénacle"
          >
            Rejoindre la communauté →
          </button>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem',
        textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem'
      }}>
        © {new Date().getFullYear()} MIJERCA Cénacle — Tous droits réservés
      </footer>
    </div>
  )
}
