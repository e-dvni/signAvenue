import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProjectDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setProject(data);
        } else {
          setError(data.error || "Unable to load project.");
        }
      } catch {
        setError("Unable to reach the server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProject();
    } else {
      setLoading(false);
      setError("Not authorized.");
    }
  }, [id, token]);

  if (loading) {
    return <p>Loading project...</p>;
  }

  if (error) {
    return (
      <section>
        <p style={{ color: "red" }}>{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    );
  }

  if (!project) {
    return (
      <section>
        <p>Project not found.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>{project.name}</h1>
      <p><strong>Status:</strong> {project.status || "Pending"}</p>
      <p><strong>Location:</strong> {project.location || "N/A"}</p>
      <p><strong>Install Date:</strong> {project.install_date || "TBD"}</p>
      <p><strong>Description:</strong></p>
      <p>{project.description || "No description yet."}</p>

      <Link to="/dashboard">Back to dashboard</Link>
    </section>
  );
};

export default ProjectDetail;
