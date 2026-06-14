import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL =
  "https://smart-glasses-production-289e.up.railway.app";

const socket = io(API_URL);

function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [streamUrl, setStreamUrl] = useState(
    "http://192.168.100.193/stream"
  );
  const [streaming, setStreaming] = useState(true);
  const [page, setPage] = useState("home");

  useEffect(() => {
    getPhotos();

    socket.on("new-photo", (photo) => {
      setPhotos((prev) => [photo, ...prev]);
    });

    return () => {
      socket.off("new-photo");
    };
  }, []);

  const getPhotos = async () => {
    try {
      const res = await axios.get(`${API_URL}/photos`);

      setPhotos(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const deletePhoto = async (id) => {
    try {
      await axios.delete(
  `${API_URL}/photos/${id}`
);

      setPhotos((prev) =>
        prev.filter((photo) => photo._id !== id)
      );
    } catch (error) {
      console.log(error);
    }
  };

  const startStream = () => {
    setStreamUrl(
      `http://192.168.100.193/stream?t=${Date.now()}`
    );

    setStreaming(true);
  };

  const stopStream = () => {
    setStreamUrl("");
    setStreaming(false);
  };

  const capturePhoto = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setMessage("Taking photo...");

      setStreamUrl("");

      await new Promise((resolve) =>
        setTimeout(resolve, 2000)
      );

      await axios.get(
        "http://192.168.100.193/capture"
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 4000)
      );

      await getPhotos();

      setMessage("Photo captured!");
    } catch (error) {
      console.log(error);
      setMessage("Capture done");
    } finally {
      setTimeout(() => {
        setStreamUrl(
          `http://192.168.100.193/stream?t=${Date.now()}`
        );
      }, 1000);

      setTimeout(() => {
        setMessage("");
      }, 2500);

      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        fontFamily: "Arial, sans-serif"
      }}
    >
      {/* NAVBAR */}
      <div className="navbar">

  <h2 className="logo">
    Smart ESP32 Glasses
  </h2>

  <div className="nav-links">
          <button
  className={`nav-btn ${
    page === "home" ? "active" : ""
  }`}
  onClick={() => setPage("home")}
>
  Home
</button>

          <button
  className={`nav-btn ${
    page === "review" ? "active" : ""
  }`}
  onClick={() => setPage("review")}
>
  Review
</button>

          <button
  className={`nav-btn ${
    page === "gallery" ? "active" : ""
  }`}
  onClick={() => setPage("gallery")}
>
  Gallery
</button>

          <button
  className={`nav-btn ${
    page === "storage" ? "active" : ""
  }`}
  onClick={() => setPage("storage")}
>
  Storage
</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "40px" }}>

        {/* HOME */}
        {page === "home" && (
  <div className="home-card">

    <div className="home-left">

      <h1>Smart ESP32 Glasses</h1>

      <h2>
        Smart Glasses Monitoring System
      </h2>

      <p>
        Monitor camera stream and manage
        captured images from ESP32-CAM.
      </p>

      <button
        className="start-btn"
        onClick={() => setPage("review")}
      >
        Get Started
      </button>

    </div>

    <div className="home-right">

      <img
        src="/glasses.png"
        alt="Smart Glasses"
      />

    </div>

  </div>
)}

        {/* REVIEW */}
        {page === "review" && (
          <div>
            <h1>Live Camera</h1>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px"
              }}
            >
              <button
                onClick={
                  streaming
                    ? stopStream
                    : startStream
                }
              >
                {streaming
                  ? "Stop Stream"
                  : "Start Stream"}
              </button>

              {streaming && (
                <button
                  onClick={capturePhoto}
                  disabled={loading}
                >
                  {loading
                    ? "Please Wait..."
                    : "Capture Photo"}
                </button>
              )}
            </div>

            <p>{message}</p>

            {streaming && (
              <img
                src={streamUrl}
                alt="stream"
                style={{
                  width: "100%",
                  borderRadius: "20px"
                }}
              />
            )}
          </div>
        )}

        {/* GALLERY */}
        {page === "gallery" && (
          <div>
            <h1>Gallery</h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill,minmax(250px,1fr))",
                gap: "20px"
              }}
            >
              {photos.map((photo) => (
                <div
                  key={photo._id}
                  style={{
                    position: "relative",
                    background: "#1f1f1f",
                    borderRadius: "15px",
                    overflow: "hidden"
                  }}
                >
                  <img
                    src={photo.imageUrl}
                    alt="photo"
                    style={{
                      width: "100%",
                      display: "block"
                    }}
                  />

                  <button
  className="delete-btn"
  onClick={() => {
    const confirmDelete =
      window.confirm(
        "Yakin ingin menghapus foto ini?"
      );

    if (confirmDelete) {
      deletePhoto(photo._id);
    }
  }}
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
                borderRadius: "20px"
              }}
            >
              <h2>Cloudinary Storage</h2>

              <p>
                Storage information will be
                added later.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;