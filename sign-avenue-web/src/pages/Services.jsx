import React, { useState } from "react";

const Services = () => {
  const filterOptions = [
    "All",
    "Exterior Signs",
    "Interior Signs",
    "Vehicles & Wraps",
    "Banners & Displays",
    "Specialty Signs",
    "LED Signs",
    "Marketing Signs",
  ];

  // single source of truth for services (each service can be in multiple categories)
  const services = [
    { name: "Channel Letters", description: "Illuminated three-dimensional letters mounted to buildings for high visibility.", categories: ["Exterior Signs"] },
    { name: "PVC Lawn Signs", description: "Economical corrugated plastic signage for events, real estate, or short-term campaigns.", categories: ["Exterior Signs", "Marketing Signs"] },
    { name: "Lightbox", description: "Backlit boxes that make graphics readable at night or in low light.", categories: ["Exterior Signs"] },
    { name: "Awning", description: "Fabric or metal awnings with printed or cut signage for storefronts.", categories: ["Exterior Signs"] },
    { name: "Dimensional Letters", description: "Raised letters in various materials for durable, professional signage.", categories: ["Exterior Signs", "Interior Signs"] },
    { name: "Building Wraps", description: "Large-format wraps that turn building facades into bold, branded displays.", categories: ["Exterior Signs"] },
    { name: "Blade Signs", description: "Projecting signs mounted perpendicular to a building for pedestrian visibility.", categories: ["Exterior Signs"] },

    { name: "ADA Signs", description: "Code-compliant wayfinding signs with tactile text and Braille.", categories: ["Interior Signs"] },
    { name: "LED Signs", description: "Energy-efficient illuminated signs.", categories: ["Interior Signs", "LED Signs", "Exterior Signs"] },
    { name: "Wall Graphics", description: "Large format printed or cut graphics for interior branding and decoration.", categories: ["Interior Signs", "Vehicles & Wraps"] },
    { name: "Window Decals", description: "Perforated or vinyl decals for glass, used for branding and privacy.", categories: ["Interior Signs", "Vehicles & Wraps"] },
    { name: "Directory Signs", description: "Multi-tenant or building directories for clear navigation.", categories: ["Interior Signs"] },
    { name: "Lobby Signs", description: "High-impact reception signs to reinforce your brand identity.", categories: ["Interior Signs"] },
    { name: "Banners", description: "Flexible, portable banners for events, promotions, and tradeshow use.", categories: ["Interior Signs", "Banners & Displays", "Marketing Signs"] },
    { name: "Posters", description: "Printed posters for promotions, interiors, and point-of-sale.", categories: ["Interior Signs", "Banners & Displays"] },

    { name: "Truck Decals", description: "Decals and cut vinyl for trucks to promote your brand on the road.", categories: ["Vehicles & Wraps"] },
    { name: "Van Wraps", description: "Full or partial vehicle wraps for mobile advertising.", categories: ["Vehicles & Wraps"] },
    { name: "Magnetic Decals", description: "Removable magnets for temporary vehicle branding.", categories: ["Vehicles & Wraps"] },

    { name: "Menus", description: "Durable printed or laminated menus for restaurants and cafes.", categories: ["Banners & Displays"] },
    { name: "Engraving", description: "Precision engraving for nameplates, tags, and specialty signage.", categories: ["Specialty Signs"] },

    { name: "Business Cards", description: "Printed business cards with a variety of stocks and finishes.", categories: ["Marketing Signs"] },
    { name: "Brochures", description: "Folded collateral to showcase services and products.", categories: ["Marketing Signs"] },
    { name: "Flyers", description: "Single-sheet promotional pieces for quick distribution.", categories: ["Marketing Signs"] },
    { name: "Stickers", description: "Custom stickers for packaging, promotions, and branding.", categories: ["Marketing Signs"] },
  ];

  const [activeFilter, setActiveFilter] = useState("All");
  const [expanded, setExpanded] = useState(new Set());

  const visibleServices = services.filter((s) =>
    activeFilter === "All" ? true : s.categories.includes(activeFilter)
  );

  const toggleExpand = (name) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <main className="page">
      <section className="page-section services-section">
        <h2 className="page-section-title">Our Core Services</h2>

        <div className="cards-grid">
          <article className="info-card">
            <h3 className="info-card-title">Design & Concepting</h3>
            <p className="info-card-body">
              We take your logo, sketch, or idea and convert it into a sign-ready
              design. We help with sizing, color choices, and readability so
              your sign looks great in real life—not just on a screen.
            </p>
            <ul className="info-card-list">
              <li>Logo trace & design</li>
              <li>Font and color recommendations</li>
              <li>Digital mockups for approval</li>
            </ul>
          </article>

          <article className="info-card">
            <h3 className="info-card-title">Fabrication</h3>
            <p className="info-card-body">
              We handle cutting, wiring and final assembly. High quality material with extreme focus on Quality Control.
            </p>
            <ul className="info-card-list">
              <li>Custom-cut</li>
              <li>Single color & RGB options</li>
              <li>Home, commercial & event builds</li>
            </ul>
          </article>

          <article className="info-card">
            <h3 className="info-card-title">Installation</h3>
            <p className="info-card-body">
              Local clients can schedule professional installation. We coordinate
              access, mounting hardware, and power so your sign is safe and
              secure.
            </p>
            <ul className="info-card-list">
              <li>On-site installation (where available)</li>
              <li>Mounting hardware & power planning</li>
              <li>Removal of old signage</li>
            </ul>
          </article>
        </div>
      </section>

      <section
        className="page-section services-list-section"
        style={{ marginTop: 24 }}
      >
        <h2 
          className="page-section-title"
          style={{
            marginBottom: 18,
          }}
          >Service Catalog</h2>

        <div
          className="filters"
          style={{
            marginBottom: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt;
            return (
              <button
                key={opt}
                onClick={() => setActiveFilter(opt)}
                aria-pressed={isActive}
                className={`filter-btn ${isActive ? "active" : ""}`}
                style={{
                  padding: "6px 20px",
                  borderRadius: 6,
                  border: isActive ? "2px solid transparent" : "1px solid #ccc",
                  // when active, use a two-layer background so the gradient appears as a border
                  background: isActive
                    ? "linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #0078d4, #00c853) border-box"
                    : "#fff",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            );
            })}
          </div>

          <div
            className="service-grid"
            style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            }}
          >
            {visibleServices.map((svc) => {
            const isOpen = expanded.has(svc.name);
            return (
              <div
              key={svc.name}
              className="service-card"
              style={{
                border: isOpen ? "2px solid transparent" : "1px solid #ddd",
                borderRadius: 6,
                padding: 12,
                background: isOpen
                ? "linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #0078d4, #00c853) border-box"
                : "#fff",
              }}
              >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleExpand(svc.name)}
                style={{
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
                }}
              >
                {svc.name}
              </button>

              {isOpen && (
                <div
                className="service-desc"
                style={{ marginTop: 8, color: "#333" }}
                >
                <p style={{ margin: 0 }}>{svc.description}</p>
                <div
                  style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#666",
                  }}
                >
                  Categories: {svc.categories.join(", ")}
                </div>
                </div>
              )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default Services;
