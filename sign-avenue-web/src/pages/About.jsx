import React from "react";

const About = () => {
  const styles = {
    main: {
      fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      color: "#111827",
      lineHeight: 1.6,
      padding: "0",
      margin: "0",
      background: "#f7f7f9",
    },
    container: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "32px 20px",
    },
    hero: {
      background: "linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)",
      padding: "48px 20px",
      borderRadius: 10,
      boxShadow: "0 6px 18px rgba(17,24,39,0.06)",
      marginBottom: 24,
    },
    heroInner: { maxWidth: 760, margin: "0 auto", textAlign: "center" },
    title: { fontSize: 34, margin: "0 0 8px", color: "#0f172a", fontWeight: 700 },
    subtitle: { fontSize: 16, margin: 0, color: "#374151" },
    tagline: { marginTop: 12, fontSize: 14, color: "#6b7280" },
    section: {
      background: "#fff",
      padding: "28px",
      borderRadius: 8,
      marginBottom: 16,
      boxShadow: "0 4px 14px rgba(2,6,23,0.04)",
    },
    sectionRow: { display: "flex", gap: 20, flexWrap: "wrap" },
    sectionTitle: { fontSize: 20, margin: "0 0 12px", color: "#0f172a", fontWeight: 600 },
    paragraph: { margin: "0 0 12px", color: "#374151", fontSize: 15 },
    cards: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      marginTop: 8,
    },
    card: {
      flex: "1 1 220px",
      minWidth: 220,
      background: "#fafafa",
      borderRadius: 8,
      padding: 14,
      boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.04)",
    },
    cardTitle: { margin: 0, fontSize: 16, color: "#0f172a", fontWeight: 600 },
    cardBody: { margin: "8px 0 0", color: "#4b5563", fontSize: 14 },
    list: { paddingLeft: 18, margin: "8px 0", color: "#374151" },
    contact: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
      flexWrap: "wrap",
    },
    contactInfo: { color: "#0f172a", fontWeight: 600 },
    cta: {
      background: "#0f172a",
      color: "#fff",
      padding: "10px 16px",
      borderRadius: 8,
      textDecoration: "none",
      fontWeight: 600,
      display: "inline-block",
    },
    small: { fontSize: 13, color: "#6b7280" },
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.hero}>
          <div style={styles.heroInner}>
            <h1 style={styles.title}>Sign Avenue — Little Ferry, NJ</h1>
            <p style={styles.subtitle}>
              Professional sign manufacturing and installation with over 20 years of experience.
            </p>
            <p style={styles.tagline}>
              Serving local businesses, homes, events, and community organizations across Little Ferry and the surrounding area.
            </p>
          </div>
        </header>

        <section style={styles.section}>
          <div style={styles.sectionRow}>
            <div style={{ flex: "1 1 520px", minWidth: 280 }}>
              <h2 style={styles.sectionTitle}>Who We Are</h2>
              <p style={styles.paragraph}>
                For more than two decades we’ve designed, fabricated, and installed custom signs for storefronts, events,
                residences, and public spaces. We combine practical workmanship with thoughtful design to make signage
                that looks great and lasts.
              </p>
              <p style={styles.paragraph}>
                Based in Little Ferry, NJ, we prioritize clear communication, reliable timelines, and an honest,
                local-first approach.
              </p>
            </div>

            <div style={{ flex: "0 0 320px", minWidth: 260 }}>
              <h3 style={{ ...styles.sectionTitle, fontSize: 18 }}>Why Clients Choose Us</h3>
              <ul style={styles.list}>
                <li>20+ years of hands-on manufacturing and installation experience</li>
                <li>Full-service: design, fabrication, and local installation</li>
                <li>Work for businesses, homes, special events, churches, and more</li>
                <li>Durable materials and tidy, code-conscious installations</li>
              </ul>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Services</h2>
          <div style={styles.cards}>
            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Custom Business Signs</h4>
              <p style={styles.cardBody}>Channel letters, lightboxes, storefront signs, wayfinding, and façade packages.</p>
            </div>

            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Residential & Event Signs</h4>
              <p style={styles.cardBody}>Temporary event signage, yard signs, and custom pieces for homes and celebrations.</p>
            </div>

            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Fabrication & Repair</h4>
              <p style={styles.cardBody}>In-house fabrication, LED retrofits, maintenance, and repair services.</p>
            </div>

            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Shipping & Remote Builds</h4>
              <p style={styles.cardBody}>We can build and ship signs nationwide with clear mounting instructions when installation isn’t local.</p>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Process</h2>
          <p style={styles.paragraph}>
            Our process is straightforward: discuss goals, provide a clear estimate, produce a proof, fabricate with care,
            and install on schedule. We’re happy to advise on materials and mounting for long-term durability.
          </p>

          <div style={styles.contact}>
            <div>
              <div style={styles.contactInfo}>Little Ferry, NJ · Local Manufacturing</div>
              <div style={styles.small}>Open to serving nearby communities and meeting site needs on request.</div>
            </div>

            <a href="/contact" style={styles.cta}>
              Contact Us
            </a>
          </div>
        </section>

        <footer style={{ textAlign: "center", marginTop: 10 }}>
          <div style={styles.small}>Sign Avenue — Trusted local sign makers for 20+ years</div>
        </footer>
      </div>
    </main>
  );
};

export default About;
