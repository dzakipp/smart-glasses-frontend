import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "https://smart-glasses-production-289e.up.railway.app";

// Ganti IP ini sesuai IP ESP32 kamu (cek Serial Monitor)
const ESP32_IP = "192.168.100.193";
const ESP32_STREAM_URL = `http://${ESP32_IP}/stream`;
const ESP32_CAPTURE_URL = `http://${ESP32_IP}/capture`;

function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const [page, setPage] = useState("home");

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      timeout: 10000,
    });

    getPhotos();

    socket.on("new-photo", (photo) => {
      setPhotos((prev) => [photo, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getPhotos = async () => {
    try {
      const res = await axios.get(`${API_URL}/photos`);
      setPhotos(res.data);
    } catch (error) {
      console.log("Get photos error:", error);
    }
  };

  const deletePhoto = async (id) => {
    const ok = window.confirm("Yakin ingin menghapus foto ini?");
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/photos/${id}`);
      setPhotos((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const startStream = () => {
    setStreaming(true);
    // tambah timestamp supaya browser tidak cache
    setStreamUrl(`${ESP32_STREAM_URL}?t=${Date.now()}`);
  };

  const stopStream = () => {
    setStreaming(false);
    setStreamUrl(null);
  };

  const capturePhoto = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setMessage("Mengambil foto...");

      // Panggil langsung ke ESP32 supaya dia upload ke server
      await axios.get(ESP32_CAPTURE_URL);

      // Tunggu ESP32 upload ke Cloudinary
      await new Promise((resolve) => setTimeout(resolve, 4000));

      await getPhotos();
      setMessage("Foto berhasil diambil!");
    } catch (error) {
      console.log("Capture error:", error);
      setMessage("Gagal capture, cek koneksi ESP32.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
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
              <img src="/glasses.png" alt="Smart Glasses" />
            </div>
          </div>
        )}

        {/* REVIEW */}
        {page === "review" && (
          <div>
            <h1>Live Camera</h1>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button onClick={streaming ? stopStream : startStream}>
                {streaming ? "Stop Stream" : "Start Stream"}
              </button>

              {streaming && (
                <button onClick={capturePhoto} disabled={loading}>
                  {loading ? "Mohon Tunggu..." : "Capture Photo"}
                </button>
              )}
            </div>

            {message && <p style={{ color: "#aaa" }}>{message}</p>}

            {streaming && streamUrl && (
              <img
                src={streamUrl}
                alt="ESP32 stream"
                style={{ width: "100%", borderRadius: "20px" }}
                onError={() => {
                  setMessage("Stream tidak tersambung. Cek IP ESP32.");
                }}
              />
            )}

            {streaming && !streamUrl && (
              <p style={{ color: "#aaa" }}>Memuat stream...</p>
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
