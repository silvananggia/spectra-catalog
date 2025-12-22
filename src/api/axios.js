import axios from "axios";

export default axios.create({
  baseURL: process.env.REACT_APP_STAC_API_URL || "https://spectra.brin.go.id/stac",
  headers: {
    "Content-Type": "application/json",
  },
});

