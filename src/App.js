import Webcam from "react-webcam";
import { useCallback, useRef, useState } from "react";
import "./App.css";

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgSrcArray, setImgSrcArray] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureIndex, setCaptureIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const maxPhotos = 3;

  // Handle email input changes
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // Start capturing photos
  const startCapture = () => {
    console.log("Starting capture...");
    setIsCapturing(true);
    setImgSrcArray([]);
    setCaptureIndex(0);
    startCountdown();
  };

  // Start countdown before capturing a photo
  const startCountdown = () => {
    let timer = 5;
    setCountdown(timer);
    const countdownInterval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(countdownInterval);
        capturePhoto();
      }
    }, 1000);
  };

  // Capture a single photo
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        console.log("Captured Image:", imageSrc);
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
        setImgSrcArray((prev) => [...prev, imageSrc]);
        savePhoto(imageSrc, captureIndex);

        if (captureIndex + 1 < maxPhotos) {
          setCaptureIndex((prev) => prev + 1);
          startCountdown();
        } else {
          setIsCapturing(false);
        }
      } else {
        console.error("Failed to capture image.");
      }
    }
  }, [captureIndex]);

  // Save photo locally
  const savePhoto = (imageSrc, index) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `photo_${index + 1}.png`;
    link.click();
  };

  // Generate the photostrip
  const generatePhotostrip = (onComplete) => {
    console.log("Generating photostrip:", imgSrcArray);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const template = new Image();
    template.src = `${process.env.PUBLIC_URL}/Frankie_PhotoStrip.png`;

    template.onload = () => {
      canvas.width = template.width;
      canvas.height = template.height;
      ctx.drawImage(template, 0, 0);

      const positions = [
        { x: 26, y: 42, width: 548, height: 407 },
        { x: 26, y: 492, width: 548, height: 407 },
        { x: 26, y: 941, width: 548, height: 407 },
      ];

      let imagesLoaded = 0;

      // After all images are loaded, we add the flower layers and save the photo strip
      if (imagesLoaded === imgSrcArray.length) {
        // Flower layer 1
        const flowerLayer1 = new Image();
        flowerLayer1.src = `${process.env.PUBLIC_URL}/Flowers.png`;

        // Flower layer 2
        const flowerLayer2 = new Image();
        flowerLayer2.src = `${process.env.PUBLIC_URL}/Flower2.png`;

        // Flower layer 3
        const flowerLayer3 = new Image();
        flowerLayer3.src = `${process.env.PUBLIC_URL}/Flower3.png`;

        // Load all flower layers and add them sequentially
        const flowerLayers = [flowerLayer1, flowerLayer2, flowerLayer3];
        let flowerLayersLoaded = 0;

        flowerLayers.forEach((flowerLayer, index) => {
          flowerLayer.onload = () => {
            console.log(`Flower layer ${index + 1} loaded successfully`);

            // Define positions for the flower layers
            const flowerPositions = [
              { x: 2, y: 1300, width: 120, height: 120 }, // Over the third photo
              { x: -2, y: 0, width: 120, height: 120 },   // Flower 2
              { x: 503, y: 840, width: 120, height: 120 } // Flower 3
            ];

            ctx.drawImage(flowerLayer, flowerPositions[index].x, flowerPositions[index].y, flowerPositions[index].width, flowerPositions[index].height);

            flowerLayersLoaded++;

            if (flowerLayersLoaded === flowerLayers.length) {
              // Save the final canvas as an image
              const finalImage = canvas.toDataURL("image/png");
              const link = document.createElement('a');
              link.href = finalImage;
              link.download = 'photo_strip.png'; // Name of the downloaded file
              link.click(); // Trigger the download

              // Optionally reload the page after the download
              // setTimeout(() => {
              //   window.location.reload();
              // }, 1000); // Allow some time for the download to complete
            }
          };

          flowerLayer.onerror = () => {
            console.error(`Failed to load flower layer ${index + 1}`);
          };
        });
      }
    imgSrcArray.forEach((imgSrc, index) => {
      const img = new Image();
      img.src = imgSrc;

      img.onload = () => {
        const { x, y, width, height } = positions[index];
        ctx.drawImage(img, x, y, width, height);
        imagesLoaded++;

        if (imagesLoaded === imgSrcArray.length) {
          if (onComplete) onComplete(canvas);
        }
      };
    });
  };

  template.onerror = () => console.error("Failed to load template image.");
};

// Save photostrip locally
const savePhotostrip = () => {
  generatePhotostrip((canvas) => {
    const finalImage = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = finalImage;
    link.download = "photo_strip.png";
    link.click();
  });
};

// Send photostrip via email
const sendEmail = async () => {
  generatePhotostrip(async (canvas) => {
    const finalImage = canvas.toDataURL("image/png");
    const blob = await (await fetch(finalImage)).blob();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("photoStrip", blob, "photo_strip.png");

    const response = await fetch("http://localhost:5000/send-email", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      console.log("Email sent successfully");
      setEmailSubmitted(true);
    } else {
      console.error("Failed to send email");
    }
  });
};

// Retake photos
const retakePhotos = () => {
  console.log("Retaking photos...");
  setImgSrcArray([]);
  setIsCapturing(false);
};

return (
  <div className="container">
    {imgSrcArray.length === maxPhotos ? (
      <>
         <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100vh", padding: "20px" }}>
      {/* Left Side - Email Input */}
      <div className="email-section" style={{ width: "40%", textAlign: "center" }}>
        <h3>Enter Your Email to Receive the Photo Strip:</h3>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Your Email"
          style={{ width: "80%", padding: "10px", marginBottom: "10px" }}
        />
        <button
          onClick={sendEmail}
          style={{ padding: "10px 20px", fontSize: "16px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          Submit
        </button>

        {emailSubmitted && <p>Email sent successfully!</p>}

        <hr style={{ margin: "20px 0" }} />
        <p>OR</p>

        <button
          onClick={retakePhotos}
          style={{ padding: "10px 20px", fontSize: "16px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          Retake Photos
        </button>
      </div>

      {/* Right Side - Photo Strip Display */}
      <div className="photo-strip-container" style={{ width: "50%", position: "relative", textAlign: "center" }}>
        <img src="/Frankie_Photostrip.png" alt="Photostrip Template" style={{ width: "50%", maxWidth: "200px" }} />
        
        <div className="photo-overlay" style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "80%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {imgSrcArray.map((imgSrc, index) => (
            <img key={index} src={imgSrc} alt={`captured ${index}`} style={{ width: "50%", marginBottom: "5px" }} />
          ))}
        </div>
      </div>
    </div>
      </>



















    ) : (
      <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
        {/* Background Image */}
        <img
          src="/Background.png" // Background image
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Makes sure the background covers the entire screen
            zIndex: -1, // Sends the background image behind other elements
          }}
        />

        {/* Left Floating Section with Webcam and Button */}
        <div style={{ position: 'absolute', left: '5%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Webcam */}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{
              width: '600px',
              height: 'auto',
              borderRadius: '10px', // Optional rounded edges for webcam feed
            }}
          />

          {/* Countdown Timer */}
          {isCapturing && countdown !== null && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ff4500',
              zIndex: 20,
              animation: 'pulse 1s infinite',
            }}>
              {countdown}
            </div>
          )}

          {/* Take Photo Button */}
          {!isCapturing && (
            <button onClick={startCapture} style={{
              marginTop: '20px',
              padding: '10px 20px',
              width: '600px',
              fontSize: '30px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}>
              Take a photo
            </button>
          )}
        </div>
      </div>

    )}
  </div>
);
}

export default App;
