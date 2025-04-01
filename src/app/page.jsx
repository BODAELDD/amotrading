"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

("use client");

function MainComponent() {
  const [file, setFile] = useState(null);
  const [upload, { loading: uploading }] = useUpload();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  const validateImageFile = (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (PNG, JPG, or JPEG)");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB");
      return false;
    }
    return true;
  };
  const handleImageUpload = useCallback(
    async (file) => {
      if (validateImageFile(file)) {
        try {
          const base64 = await getBase64(file);
          const { url, error: uploadError } = await upload({ base64 });
          if (uploadError) {
            setError(uploadError);
            return;
          }
          setFile(file);
          setPreviewUrl(url);
          setError(null);
        } catch (err) {
          setError("Failed to upload image. Please try again.");
          console.error(err);
        }
      }
    },
    [upload]
  );
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer?.files[0];
      if (droppedFile) {
        handleImageUpload(droppedFile);
      }
    },
    [handleImageUpload]
  );
  const handleFileSelect = useCallback(
    (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        handleImageUpload(selectedFile);
      }
    },
    [handleImageUpload]
  );
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleRemoveImage = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setPrediction(null);
    setError(null);
  }, []);
  const analyzeImage = useCallback(async () => {
    if (!file || !previewUrl) {
      setError("Please upload an image first");
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      const base64 = await getBase64(file);
      const response = await fetch("/api/analyze-trading-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(
          data.error || "Analysis failed without a specific error message"
        );
      }

      if (!data.analysis || !data.prediction) {
        throw new Error("Invalid response format from analysis service");
      }

      setAnalysis(data.analysis);
      setPrediction(data.prediction);
    } catch (err) {
      setError(err.message || "Failed to analyze image. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, previewUrl, getBase64]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="pt-8 pb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          AI Trading Analysis
        </h1>
        <p className="text-gray-400 text-center mt-2">
          Upload your trading chart for instant AI-powered analysis
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="w-full max-w-2xl mx-auto md:col-span-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={onDrop}
              className={`
      relative
      border-2 border-dashed rounded-2xl
      transition-all duration-300 ease-in-out
      ${
        isDragging
          ? "border-blue-500 bg-blue-500/10"
          : !previewUrl
          ? "border-gray-600 hover:border-gray-500 hover:bg-gray-800/50"
          : "border-gray-700"
      }
      min-h-[400px]
      flex flex-col items-center justify-center
      p-8
      cursor-pointer
      group
    `}
            >
              {!previewUrl ? (
                <div className="space-y-6 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <i className="fas fa-cloud-upload-alt text-4xl text-blue-500 group-hover:text-blue-400"></i>
                    </div>
                    <div className="absolute -right-1 -bottom-1">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                        <i className="fas fa-chart-line text-sm text-white"></i>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xl text-gray-300 font-medium">
                      Drag and drop your trading chart here
                    </p>
                    <p className="text-gray-500">
                      or{" "}
                      <label
                        htmlFor="fileInput"
                        className="text-blue-500 hover:text-blue-400 cursor-pointer"
                      >
                        browse files
                      </label>
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported formats: PNG, JPG, JPEG (max 10MB)
                    </p>
                  </div>

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="fileInput"
                  />

                  <label
                    htmlFor="fileInput"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer"
                  >
                    Choose Image
                  </label>
                </div>
              ) : (
                <div className="relative w-full group">
                  <div className="relative overflow-hidden rounded-xl shadow-2xl border border-blue-500/20">
                    <img
                      src={previewUrl}
                      alt="Trading chart preview"
                      className={`max-h-[400px] w-full object-contain ${
                        isAnalyzing ? "scale-[1.02] blur-[2px]" : ""
                      } transition-all duration-700`}
                    />

                    {isAnalyzing && (
                      <>
                        <div className="absolute top-0 -left-48 w-48 h-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent transform animate-scan" />

                        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(17,24,39,.1)1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,.1)1px,transparent_1px)] bg-[size:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-[2px]">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-4">
                              <div className="inline-block p-4 bg-gray-900/90 rounded-2xl backdrop-blur-xl border border-blue-500/20 shadow-2xl">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 relative">
                                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
                                  </div>
                                  <span className="text-blue-400 font-medium">
                                    Analyzing Chart Patterns...
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-blue-500/50"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-blue-500/50"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-blue-500/50"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-blue-500/50"></div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg z-10"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            {previewUrl && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className={`
      w-full max-w-md
      flex items-center justify-center
      px-8 py-4 rounded-xl
      font-medium text-lg
      transition-all duration-500
      ${
        isAnalyzing
          ? "bg-gray-700 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
      }
    `}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing Analysis...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-robot mr-2"></i>
                      Analyze Chart
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {(isAnalyzing || analysis) && (
            <div className="max-w-7xl mx-auto px-4 mb-12 md:col-span-2">
              <div className="bg-[#111827] rounded-2xl shadow-2xl overflow-hidden border border-blue-500/10">
                <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-6 border-b border-blue-500/10">
                  <h2 className="text-2xl font-bold text-center flex items-center justify-center text-blue-400">
                    <i className="fas fa-chart-bar mr-3"></i>
                    Analysis Results
                  </h2>
                </div>

                <div className="p-8">
                  {isAnalyzing ? (
                    <div className="space-y-6">
                      <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
                      <div className="h-6 bg-gray-800 rounded animate-pulse w-3/4"></div>
                      <div className="h-6 bg-gray-800 rounded animate-pulse w-1/2"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-[#1a1f2d] rounded-xl p-6 shadow-lg border border-blue-500/10">
                          <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                            <i className="fas fa-chart-line mr-2"></i>
                            Technical Analysis
                          </h3>

                          <div className="space-y-6">
                            <div className="bg-[#111827] rounded-lg p-4">
                              <h4 className="text-blue-400 font-medium mb-4">
                                Trend Analysis
                              </h4>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Trend:</span>
                                  <span
                                    className={`font-medium px-4 py-1 rounded-full ${
                                      analysis
                                        ?.toLowerCase()
                                        .includes("downtrend") ||
                                      analysis
                                        ?.toLowerCase()
                                        .includes("down trend")
                                        ? "bg-red-500/10 text-red-400"
                                        : analysis
                                            ?.toLowerCase()
                                            .includes("uptrend") ||
                                          analysis
                                            ?.toLowerCase()
                                            .includes("up trend")
                                        ? "bg-green-500/10 text-green-400"
                                        : "bg-gray-500/10 text-gray-400"
                                    }`}
                                  >
                                    {analysis
                                      ?.toLowerCase()
                                      .includes("downtrend") ||
                                    analysis
                                      ?.toLowerCase()
                                      .includes("down trend")
                                      ? "Downtrend"
                                      : analysis
                                          ?.toLowerCase()
                                          .includes("uptrend") ||
                                        analysis
                                          ?.toLowerCase()
                                          .includes("up trend")
                                      ? "Uptrend"
                                      : "Sideways"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">
                                    Strength:
                                  </span>
                                  <span className="font-medium px-4 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                                    {analysis?.toLowerCase().includes("strong")
                                      ? "Strong"
                                      : analysis?.toLowerCase().includes("weak")
                                      ? "Weak"
                                      : "Moderate"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#111827] rounded-lg p-4">
                              <h4 className="text-blue-400 font-medium mb-4">
                                Key Price Levels
                              </h4>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">
                                    Support:
                                  </span>
                                  <span className="font-medium text-white">
                                    {analysis?.match(
                                      /support[:\s]+(\d+\.?\d*)/i
                                    )?.[1] || "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">
                                    Resistance:
                                  </span>
                                  <span className="font-medium text-white">
                                    {analysis?.match(
                                      /resistance[:\s]+(\d+\.?\d*)/i
                                    )?.[1] || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="bg-[#1a1f2d] rounded-xl p-6 shadow-lg border border-blue-500/10">
                          <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                            <i className="fas fa-robot mr-2"></i>
                            Trade Analysis
                          </h3>

                          <div className="space-y-6">
                            <div className="bg-[#111827] rounded-lg p-4">
                              <h4 className="text-blue-400 font-medium mb-4">
                                Next Candle Prediction
                              </h4>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">
                                  Direction:
                                </span>
                                <span
                                  className={`font-medium px-4 py-1 rounded-full ${
                                    prediction
                                      ?.toLowerCase()
                                      .includes("bearish")
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-green-500/10 text-green-400"
                                  }`}
                                >
                                  {prediction?.toLowerCase().includes("bearish")
                                    ? "Bearish"
                                    : "Bullish"}
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#111827] rounded-lg p-4">
                              <h4 className="text-blue-400 font-medium mb-4">
                                Confidence Level
                              </h4>
                              <div className="relative pt-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-400 text-sm">
                                    Confidence
                                  </span>
                                  <span className="text-white text-sm font-bold">
                                    {prediction?.match(
                                      /confidence[:\s]+(\d+)%/i
                                    )?.[1] || "75"}
                                    %
                                  </span>
                                </div>
                                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-700">
                                  <div
                                    style={{
                                      width: `${
                                        prediction?.match(
                                          /confidence[:\s]+(\d+)%/i
                                        )?.[1] || "75"
                                      }%`,
                                    }}
                                    className="animate-width-expand shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500"
                                  ></div>
                                </div>
                                <div className="absolute -left-1 top-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <div className="absolute -right-1 top-1/2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            <div className="bg-[#111827] rounded-lg p-4 mt-4">
                              <h4 className="text-blue-400 font-medium mb-4">
                                Trading Signal Strength
                              </h4>
                              <div className="space-y-6">
                                <div className="relative pt-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <i className="fas fa-arrow-up text-green-500 mr-2"></i>
                                      <span className="text-gray-400 text-sm">
                                        Buy Signal
                                      </span>
                                    </div>
                                    <span className="text-green-400 text-sm font-bold">
                                      {prediction
                                        ?.toLowerCase()
                                        .includes("bullish")
                                        ? "80%"
                                        : "40%"}
                                    </span>
                                  </div>
                                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-700">
                                    <div
                                      style={{
                                        width: prediction
                                          ?.toLowerCase()
                                          .includes("bullish")
                                          ? "80%"
                                          : "40%",
                                      }}
                                      className="animate-width-expand shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-500 to-green-400"
                                    ></div>
                                  </div>
                                  <div className="absolute -left-1 top-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <div className="absolute -right-1 top-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                </div>

                                <div className="relative pt-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <i className="fas fa-arrow-down text-red-500 mr-2"></i>
                                      <span className="text-gray-400 text-sm">
                                        Sell Signal
                                      </span>
                                    </div>
                                    <span className="text-red-400 text-sm font-bold">
                                      {prediction
                                        ?.toLowerCase()
                                        .includes("bearish")
                                        ? "75%"
                                        : "35%"}
                                    </span>
                                  </div>
                                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-700">
                                    <div
                                      style={{
                                        width: prediction
                                          ?.toLowerCase()
                                          .includes("bearish")
                                          ? "75%"
                                          : "35%",
                                      }}
                                      className="animate-width-expand shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-red-500 to-red-400"
                                    ></div>
                                  </div>
                                  <div className="absolute -left-1 top-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <div className="absolute -right-1 top-1/2 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                </div>

                                <div className="relative pt-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <i className="fas fa-minus text-yellow-500 mr-2"></i>
                                      <span className="text-gray-400 text-sm">
                                        Neutral Signal
                                      </span>
                                    </div>
                                    <span className="text-yellow-400 text-sm font-bold">
                                      {!prediction
                                        ?.toLowerCase()
                                        .includes("bullish") &&
                                      !prediction
                                        ?.toLowerCase()
                                        .includes("bearish")
                                        ? "60%"
                                        : "25%"}
                                    </span>
                                  </div>
                                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-700">
                                    <div
                                      style={{
                                        width:
                                          !prediction
                                            ?.toLowerCase()
                                            .includes("bullish") &&
                                          !prediction
                                            ?.toLowerCase()
                                            .includes("bearish")
                                            ? "60%"
                                            : "25%",
                                      }}
                                      className="animate-width-expand shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-yellow-500 to-yellow-400"
                                    ></div>
                                  </div>
                                  <div className="absolute -left-1 top-1/2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                  <div className="absolute -right-1 top-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-[#111827] rounded-lg p-4">
                              <h4 className="text-blue-400 font-medium mb-4">
                                Risk Factors
                              </h4>
                              <div className="text-white">
                                {prediction?.match(
                                  /risk factors?[:\s]+(.*?)(?=\n\n|$)/is
                                )?.[1] || "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes scan {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(1000%);
          }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        @keyframes width-expand {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
        .animate-width-expand {
          animation: width-expand 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;
