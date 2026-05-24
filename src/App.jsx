import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const initialUploadState = {
  title: "",
  description: "",
  tags: "",
  file: null
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function copyText(value, label) {
  return navigator.clipboard.writeText(value).then(() => `${label} copied`);
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function AppShell({ children, stats }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span>Yimage</span>
          <small>Minimal image hosting</small>
        </Link>
        <nav className="sidebar-nav">
          <Link to="/">Home</Link>
          <a href="#upload-panel">Upload</a>
        </nav>
        <div className="sidebar-stats">
          <div>
            <strong>{stats.total}</strong>
            <span>posts</span>
          </div>
          <div>
            <strong>{stats.totalViews}</strong>
            <span>views</span>
          </div>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function UploadPanel({ onUpload, isUploading }) {
  const [form, setForm] = useState(initialUploadState);

  function updateField(event) {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.file) {
      return;
    }

    const payload = new FormData();
    payload.append("image", form.file);
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("tags", form.tags);

    const ok = await onUpload(payload);
    if (ok) {
      setForm(initialUploadState);
      const input = document.getElementById("image-input");
      if (input) {
        input.value = "";
      }
    }
  }

  return (
    <section className="panel upload-panel" id="upload-panel">
      <div className="panel-header">
        <h1>Upload</h1>
        <p>One post, one image, one clean share link.</p>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input name="title" value={form.title} onChange={updateField} maxLength={80} />
        </label>
        <label>
          Description
          <textarea name="description" value={form.description} onChange={updateField} rows={4} maxLength={240} />
        </label>
        <label>
          Tags
          <input name="tags" value={form.tags} onChange={updateField} placeholder="art, ui, reference" />
        </label>
        <label className="file-field">
          Image
          <input id="image-input" name="file" type="file" accept="image/*" onChange={updateField} />
        </label>
        <button type="submit" disabled={isUploading}>
          {isUploading ? "Publishing..." : "Publish image"}
        </button>
      </form>
    </section>
  );
}

function Gallery({ images, onDelete }) {
  if (!images.length) {
    return (
      <section className="panel empty-state">
        <h2>No posts yet</h2>
        <p>Your gallery starts the moment the first image lands.</p>
      </section>
    );
  }

  return (
    <section className="gallery">
      {images.map((image) => (
        <article className="panel card" key={image.id}>
          <Link className="card-image-wrap" to={`/image/${image.id}`}>
            <img className="card-image" src={image.imageUrl} alt={image.title || "Uploaded image"} />
          </Link>
          <div className="card-body">
            <div className="card-topline">
              <h2>{image.title || "Untitled"}</h2>
              <span>{formatDate(image.createdAt)}</span>
            </div>
            <p>{image.description || "Direct-hosted image ready to share."}</p>
            <div className="card-tags">
              {image.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
            <div className="card-actions">
              <Link to={`/image/${image.id}`}>Open</Link>
              <button type="button" onClick={() => onDelete(image.id)}>
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function DetailView({ refreshToken, onDelete }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadImage() {
      setStatus("loading");
      const response = await fetch(apiUrl(`/api/images/${id}`));
      if (!active) {
        return;
      }
      if (!response.ok) {
        setStatus("missing");
        return;
      }
      const data = await response.json();
      setImage(data);
      setStatus("ready");
    }

    loadImage();
    return () => {
      active = false;
    };
  }, [id, refreshToken]);

  const shareLinks = useMemo(() => {
    if (!image) {
      return [];
    }

    const pageUrl = window.location.origin + `/image/${image.id}`;
    return [
      { label: "Direct", value: window.location.origin + image.imageUrl },
      { label: "Page", value: pageUrl },
      { label: "Markdown", value: `![${image.title || "image"}](${window.location.origin + image.imageUrl})` },
      { label: "BBCode", value: `[img]${window.location.origin + image.imageUrl}[/img]` }
    ];
  }, [image]);

  if (status === "loading") {
    return <section className="panel detail-panel"><p>Loading image...</p></section>;
  }

  if (status === "missing") {
    return <section className="panel detail-panel"><p>Image not found.</p></section>;
  }

  return (
    <section className="panel detail-panel">
      <div className="detail-header">
        <div>
          <h1>{image.title || "Untitled"}</h1>
          <p>{image.description || "Published on Yimage."}</p>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={async () => {
            await onDelete(image.id);
            navigate("/");
          }}
        >
          Delete
        </button>
      </div>
      <img className="detail-image" src={image.imageUrl} alt={image.title || "Uploaded image"} />
      <div className="detail-meta">
        <span>{formatDate(image.createdAt)}</span>
        <span>{image.views} views</span>
        <span>{Math.round(image.size / 1024)} KB</span>
        <span>{image.width}x{image.height}</span>
      </div>
      <div className="share-grid">
        {shareLinks.map((item) => (
          <button
            key={item.label}
            type="button"
            className="share-card"
            onClick={async () => {
              const nextMessage = await copyText(item.value, item.label);
              setMessage(nextMessage);
            }}
          >
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </button>
        ))}
      </div>
      {message ? <p className="flash">{message}</p> : null}
    </section>
  );
}

export default function App() {
  const [images, setImages] = useState([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [flash, setFlash] = useState("");

  async function loadImages() {
    const response = await fetch(apiUrl("/api/images"));
    const data = await response.json();
    setImages(data);
  }

  useEffect(() => {
    loadImages();
  }, [refreshToken]);

  async function handleUpload(formData) {
    setIsUploading(true);
    let response;

    try {
      response = await fetch(apiUrl("/api/images"), {
        method: "POST",
        body: formData
      });
    } catch {
      setIsUploading(false);
      setFlash("Upload failed. API unreachable.");
      return false;
    }

    setIsUploading(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      setFlash(error.error || "Upload failed");
      return false;
    }

    setFlash("Image published");
    setRefreshToken((value) => value + 1);
    return true;
  }

  async function handleDelete(id) {
    const response = await fetch(apiUrl(`/api/images/${id}`), {
      method: "DELETE"
    });
    if (response.ok) {
      setFlash("Image deleted");
      setRefreshToken((value) => value + 1);
    }
  }

  const stats = useMemo(() => ({
    total: images.length,
    totalViews: images.reduce((sum, image) => sum + image.views, 0)
  }), [images]);

  return (
    <AppShell stats={stats}>
      {flash ? <div className="flash-banner">{flash}</div> : null}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <UploadPanel onUpload={handleUpload} isUploading={isUploading} />
              <Gallery images={images} onDelete={handleDelete} />
            </>
          }
        />
        <Route path="/image/:id" element={<DetailView refreshToken={refreshToken} onDelete={handleDelete} />} />
      </Routes>
    </AppShell>
  );
}
