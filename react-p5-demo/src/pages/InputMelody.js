import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import QRCode from 'qrcode.react';
import Mic from "../components/TestMicsound";
import { useNavigate } from "react-router-dom";

function InputMelody() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("Start recording");
  const [showPopup, setShowPopup] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("https://github.com/antonioerdeljac/next13-spotify");
  const [songName, setSongName] = useState("");
  const [songExists, setSongExists] = useState(false);
  const [fetchInterval, setFetchInterval] = useState(null);

  const navigate = useNavigate();
  let socket = null;
  let datas = [];

  const handleInputChange = (event) => {
    setSongName(event.target.value);
  }

  const checkSongExistence = () => {
    fetch(`http://localhost:4000/audio`)
      .then((response) => response.json())
      .then((data) => {
        const songExists = data.some((audio) => audio.filename === songName);

        if (songExists) {
          setSongExists(true);
          setMessage("Song name already exists");
          window.alert("Song name already exists");
        } else {
          startDataFetching();
        }
      })
      .catch((error) => {
        console.error(error);
        alert("Error checking song name existence.");
      });
  }

  const startDataFetching = () => {
    setMessage("Recording");
    datas = [];
    socket = io('http://localhost:8888');
    const fetchInterval = setInterval(() => {
      socket.on('serialdata', (data) => {
        datas.push(data.data);
        setData(data.data);
      });
    }, 1000);

    setTimeout(() => {
      clearInterval(fetchInterval);
      socket.close();
      console.log("Stop fetching: " + datas + " "+songName);
      setMessage("View QR Code");
      setShowPopup(true);
      fetch('http://localhost:5000/receive_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songname: songName, datas: datas }),
      }).then((response) => response.json())
        .then((data) => {
          console.log(data);
        }).catch((err) => console.log("error : " + err));
      let audiofile = songName + ".wav";
      setQrCodeData(`http://localhost:4000/audioname/${audiofile}`);
    }, 10000);
  }

  const closePopup = () => {
    setShowPopup(false);
  }

  return (
    <div className="halloween-input-melody">
      <h1 className="halloween-header">Hello, Spooky Halloween!</h1>
      <Mic />
      <input
        type="text"
        placeholder="Type the song name"
        value={songName}
        onChange={handleInputChange}
        className="halloween-input"
        style={{ display: showPopup ? 'none' : 'block' }}
      />

      <button
        onClick={songExists ? null : checkSongExistence}
        className="halloween-button"
        style={{ display: showPopup ? 'none' : 'block' }}
      >
        {message}
      </button>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <button onClick={closePopup} className="halloween-button ">
              Close
            </button>
            <QRCode value={qrCodeData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default InputMelody;
