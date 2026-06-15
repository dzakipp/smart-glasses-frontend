import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "https://smart-glasses-production-289e.up.railway.app";

// Ganti IP ini sesuai IP ESP32 kamu (cek Serial Monitor)
const ESP32_IP = "10.28.230.72";
const ESP32_STREAM_URL = `http://${ESP32_IP}/stream`;
const ESP32_CAPTURE_URL = `http://${ESP32_IP}/capture`;

function App() {
  const [photos, setPhotos]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const [page, setPage]         = useState("home");

  // Simpan socket di ref supaya tidak disconnect waktu re-render
  const socketRef = useRef(null);

  useEffect(() => {
    // Buat socket sekali saja, jangan di-disconnect saat komponen re-render
    socketRef.current = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      timeout: 10000,
    });

    getPhotos();

    socketRef.current.on("new-photo", (photo) => {
      // Foto baru langsung muncul tanpa refresh
      setPhotos((prev) => [photo, ...prev]);
    });

    // Cleanup hanya saat komponen benar-benar unmount (tutup tab)
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const getPhotos = async () => {
    try {
      const res = await axios.get(`${API_URL}/photos`);
      setPhotos(res.data);
    } catch (err) {
      console.log("Get photos error:", err);
    }
  };

  const deletePhoto = async (id) => {
    const ok = window.confirm("Yakin ingin menghapus foto ini?");
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/photos/${id}`);
      setPhotos((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.log("Delete error:", err);
    }
  };

  const startStream = () => {
  setStreaming(true);
  setStreamUrl(ESP32_STREAM_URL);
};

  const stopStream = () => {
    setStreaming(false);
    setStreamUrl(null);
  };

  const capturePhoto = async () => {
  if (loading) return;

  try {
    setLoading(true);

    await axios.get(ESP32_CAPTURE_URL);

    await getPhotos(); // langsung update gallery

  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* NAVBAR */}
      <div className="navbar">
        <h2 className="logo">Smart ESP32 Glasses</h2>
        <div className="nav-links">
          {["home", "review", "gallery", "storage"].map((p) => (
            <button
              key={p}
              className={`nav-btn ${page === p ? "active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "40px" }}>

        {/* HOME */}
        {page === "home" && (
          <div className="home-card">
            <div className="home-left">
              <h1>Smart ESP32 Glasses</h1>
              <h2>Smart Glasses Monitoring System</h2>
              <p>Monitor camera stream dan kelola foto dari ESP32-CAM.</p>
              <button className="start-btn" onClick={() => setPage("review")}>
                Get Started
              </button>
            </div>
            <div className="home-right">
              <img src="/glasses.jpeg" alt="Smart Glasses" />
            </div>
          </div>
        )}

        {/* REVIEW */}
        {page === "review" && (
          <div>
            <h1>Live Camera</h1>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button onClick={streaming ? stopStream : startStream} disabled={loading}>
                {streaming ? "Stop Stream" : "Start Stream"}
              </button>

              {streaming && (
                <button onClick={capturePhoto} disabled={loading}>
                  {loading ? "Mohon Tunggu..." : "Capture Photo"}
                </button>
              )}
            </div>

            {/* Status message */}
            {message && (
              <p style={{ color: "#f0c040", marginBottom: "12px" }}>{message}</p>
            )}

            {/* Stream image */}
            {/* Stream image */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  }}
>
  <img
    src={streamUrl}
    alt="ESP32 stream"
    style={{
      width: "70%",
      transform: "rotate(-90deg)",
      borderRadius: "20px",
    }}
  />
</div>

            {/* Placeholder saat stream off tapi tidak loading */}
            {!streamUrl && !loading && (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  background: "#1f1f1f",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#555",
                }}
              >
                Stream tidak aktif
              </div>
            )}
          </div>
        )}

        {/* GALLERY */}
        {page === "gallery" && (
          <div>
            <h1>Gallery</h1>
            {photos.length === 0 && (
              <p style={{ color: "#aaa" }}>Belum ada foto.</p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "20px",
              }}
            >
              {photos.map((photo) => (
                <div
                  key={photo._id}
                  style={{
                    position: "relative",
                    background: "#1f1f1f",
                    borderRadius: "15px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={photo.imageUrl}
                    alt="captured"
                    style={{ width: "100%", display: "block" }}
                  />
                  <button
                    className="delete-btn"
                    onClick={() => deletePhoto(photo._id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STORAGE */}
        {page === "storage" && (
          <div>
            <h1>Storage</h1>
            <div
              style={{
                background: "#1f1f1f",
                padding: "30px",
                borderRadius: "20px",
              }}
            >
              <h2>Cloudinary Storage</h2>
              <p>Total foto tersimpan: <strong>{photos.length}</strong></p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
