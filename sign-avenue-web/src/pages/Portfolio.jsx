const Portfolio = () => {
  // generate 64 image records (p001.webp ... p064.webp)
  const variants = [
    "", // normal
    "wide",
    "tall",
    "large",
    "accent",
    "tall",
    "wide",
    "", // pattern repeats to form a stylish mosaic
  ];

  const images = Array.from({ length: 64 }, (_, i) => {
    const idx = String(i + 1).padStart(3, "0");
    const variant = variants[i % variants.length];
    return {
      id: i + 1,
      src: `/images/p${idx}.webp`,
      variant: variant ? `grid-item--${variant}` : "",
    };
  });

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">Portfolio</h1>
      </header>

      <section className="portfolio-gallery">
        <div className="portfolio-grid">
          {images.map((img) => (
            <figure
              key={img.id}
              className={`grid-item ${img.variant}`}
              aria-hidden={false}
            >
              <img
                src={img.src}
                alt={`Portfolio ${img.id}`}
                loading="lazy"
                className="grid-item-image"
              />
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Portfolio;
