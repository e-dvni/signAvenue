// src/pages/Home.jsx
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <main className="page page-home">
      {/* FULLSCREEN HERO */}
      <section className="page-hero">
        <div className="page-hero-overlay">
          <h1 className="page-hero-heading">
            Custom Sign Services | Sign Avenue
          </h1>

          <div className="page-hero-actions page-hero-actions-centered">
            <Link to="/contact" className="btn-primary hero-cta">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>
      
      {/* SERVICES PREVIEW */}
        <section className="page-section what-we-do-section">
          <header className="section-header">
            <p className="section-eyebrow">WHAT WE DO</p>
            <h2 className="page-section-title">Custom Sign Solutions</h2>
            <p className="page-section-lead">
          Whether you're a business, home-owner, or just looking to decorate,
          we handle design, fabrication, installation and support.
            </p>
          </header>

          <div className="cards-grid">
            <article className="info-card">
          <div className="info-card-media">
            <img
              src="/images/langanExterior.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
            />
          </div>
          <h3 className="info-card-title">Exterior Signage</h3>
          <p className="info-card-body">
            Channel Letters, Lightboxes, Cutting Letters, Awnings, and more...
          </p>
            </article>

            <article className="info-card">
          <div className="info-card-media">
            <img
              src="/images/dunkinInterior.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
            />
          </div>
          <h3 className="info-card-title">Interior Design</h3>
          <p className="info-card-body">
            PVC Cutting Letters, LED Signs, ADA Wayfinding, Window Decals, and more...
          </p>
            </article>

            <article className="info-card">
          <div className="info-card-media">
            <img
              src="/images/truckPrinting.webp"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%' }}
            />
          </div>
          <h3 className="info-card-title">Printing Services</h3>
          <p className="info-card-body">
            Truck Decals, Banners, Posters, Aluminum Signs, Laser Engraving, and more...
          </p>
            </article>
          </div>

          <div className="section-footer-link">
            <Link to="/services" className="btn-text">
          See all services →
            </Link>
          </div>
        </section>
        <section className="page-section page-section-muted">
          <header className="section-header">
            <p className="section-eyebrow">HOW IT WORKS</p>
            <h2 className="page-section-title">Simple, guided process.</h2>
            <p className="page-section-lead">
            We believe communication is most important so you always know what's next.
            </p>
          </header>

          <ol className="steps-list">
            <li className="step-item">
          <span className="step-number">1</span>
          <div className="step-content">
            <h3>Share your idea</h3>
            <p>
              Send us your logo, inspiration photos, or just a rough idea.
              We&apos;ll help shape it into a clear concept.
            </p>
          </div>
            </li>
            <li className="step-item">
          <span className="step-number">2</span>
          <div className="step-content">
            <h3>Design & quote</h3>
            <p>
              We create a mock-up, confirm size, materials and colors, then
              send a clear quote with visuals.
            </p>
          </div>
            </li>
            <li className="step-item">
          <span className="step-number">3</span>
          <div className="step-content">
            <h3>Build & quality check</h3>
            <p>
              Your sign is fabricated, wired and tested in our shop to make
              sure it looks right and works perfectly.
            </p>
          </div>
            </li>
            <li className="step-item">
          <span className="step-number">4</span>
          <div className="step-content">
            <h3>Install or pickup</h3>
            <p>
              Schedule installation or prepare your sign for pickup.
            </p>
          </div>
            </li>
          </ol>
        </section>

        {/* PORTFOLIO PREVIEW */}
          <section className="page-section">
            <header className="section-header">
              <p className="section-eyebrow">FEATURED WORK</p>
              <h2 className="page-section-title">Recent projects.</h2>
              <p className="page-section-lead">
            Some brands you may know.
              </p>
            </header>

            <div className="cards-grid cards-grid-3">
              <article className="project-card">
            <div className="project-image-placeholder">
              <img
                src="/images/loreal.jpg"
                alt="L'Oreal project"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%' }}
              />
            </div>
            <div className="project-card-body">
              <h3>L'Oreal</h3>
              <p>
                Interior LED Signs, Posters, Window Decals, ADA Signs
              </p>
            </div>
              </article>

              <article className="project-card">
            <div className="project-image-placeholder">
              <img
                src="/images/bbqChicken.jpg"
                alt="BBQChicken project"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%' }}
              />
            </div>
            <div className="project-card-body">
              <h3>BBQ Chicken</h3>
              <p>
                Halo-Lit Signs, Menu Boards, Wall Graphics, Window Decals, Takeout Menus
              </p>
            </div>
              </article>

              <article className="project-card">
            <div className="project-image-placeholder">
              <img
                src="/images/samsung.jpg"
                alt="Samsung project"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
              />
            </div>
            <div className="project-card-body">
              <h3>Samsung</h3>
              <p>
                Truck Decals, Channel Letter Signs, ADA Signs, Window Decals
              </p>
            </div>
              </article>
            </div>

            <div className="section-footer-link">
              <Link to="/portfolio" className="btn-text">
            View full portfolio →
              </Link>
            </div>
          </section>

          {/* CTA BANNER */}
      <section className="page-section page-cta">
        <div className="page-cta-inner">
          <div>
            <h2 className="page-cta-title">
              Ready to start your sign project?
            </h2>
            <p className="page-cta-subtitle">
              Send us your logo, measurements, or even just a rough idea. We&apos;ll
              help you figure out size, placement and pricing.
            </p>
          </div>
          <div className="page-cta-actions">
            <Link to="/contact" className="btn-primary btn-primary-light">
              Request a Quote
            </Link>
            <Link
              to="/customer/dashboard"
              className="btn-secondary btn-secondary-light"
            >
              Existing customer login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
