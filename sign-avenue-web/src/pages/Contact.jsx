import { useState, useRef } from "react";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    business_name: "",
    city: "",
    message: "",
  });

  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      business_name: "",
      city: "",
      message: "",
    });
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setErrors(null);

    // Let HTML5 validations run (since we call preventDefault)
    if (formRef.current && !formRef.current.reportValidity()) return;

    setSubmitting(true);

    try {
      // Use FormData so file uploads are supported.
      const formData = new FormData();
      // Append fields as nested contact_request[...] so backend receives same shape.
      Object.entries(form).forEach(([key, value]) => {
        formData.append(`contact_request[${key}]`, value);
      });
      if (file) {
        // Adjust key name if your backend expects another param name
        formData.append("contact_request[file]", file);
      }

      const response = await fetch(
        "http://localhost:3000/api/v1/contact_requests",
        {
          method: "POST",
          body: formData, // browser sets correct Content-Type for multipart
        }
      );

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        // ignore JSON parse errors, handle by status
      }

      if (response.ok) {
        setSuccess("Thanks! We'll contact you shortly.");
        resetForm();
      } else {
        setErrors(data?.errors || ["Something went wrong."]);
      }
    } catch (err) {
      console.error(err);
      setErrors(["Unable to reach the server. Please try again later."]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">Contact & Quote Request</h1>
        <p className="page-subtitle">
          Tell us about your sign idea and attach any designs. We'll follow up
          with sizing, options, and a clear price estimate.
        </p>
      </header>

      <section className="page-section contact-card">
        {success && <p style={{ color: "green" }}>{success}</p>}
        {errors &&
          errors.map((e, i) => (
            <p key={i} style={{ color: "red" }}>
              {e}
            </p>
          ))}

        <form
          className="contact-form"
          onSubmit={handleSubmit}
          ref={formRef}
          noValidate
        >
          <div className="contact-form-grid">
            {/* Name */}
            <div className="contact-form-field">
              <label>
                Name
                <br />
                <input
                  className="input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {/* Email */}
            <div className="contact-form-field">
              <label>
                Email
                <br />
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {/* Phone */}
            <div className="contact-form-field">
              <label>
                Phone
                <br />
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>
            </div>

            {/* Business Name */}
            <div className="contact-form-field">
              <label>
                Business / Organization Name
                <br />
                <input
                  className="input"
                  type="text"
                  name="business_name"
                  value={form.business_name}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {/* City */}
            <div className="contact-form-field">
              <label>
                City
                <br />
                <input
                  className="input"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {/* Project Details */}
            <div className="contact-form-field contact-form-field--full">
              <label>
                Project Details
                <br />
                <textarea
                  className="textarea"
                  name="message"
                  rows={6}
                  placeholder="Tell us about the sign: size, where it will go, text or logo, timeline, etc."
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {/* File upload */}
            <div className="contact-form-field contact-form-field--full">
              <label>
                Attach design or plans (optional)
                <br />
                <input
                  className="input"
                  type="file"
                  name="file"
                  accept=".pdf,image/*,application/*"
                  onChange={handleFileChange}
                />
              </label>
              {file && (
                <div className="file-meta">
                  <small>Selected file: {file.name}</small>
                </div>
              )}
            </div>
          </div>

          <button
            className="button primary"
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            style={{
              width: 150,
              display: "block",
              margin: "20px auto 0",
            }}
          >
            {submitting ? "Sending..." : "Send Request"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Contact;
