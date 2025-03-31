async function handler({ image }) {
  if (!image) {
    console.error("Analysis error: No image provided");
    return { success: false, error: "No image provided" };
  }

  try {
    let base64Image = image;
    if (image.includes("base64,")) {
      base64Image = image.split("base64,")[1];
    }

    if (!base64Image) {
      console.error("Analysis error: Invalid base64 format");
      return {
        success: false,
        error: "Invalid image format. Must be base64 encoded",
      };
    }

    const visionMessages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this trading chart and provide a structured response with exactly these points:\n1. Trend Analysis:\n- Current Trend (UpTrend/DownTrend/Sideways)\n- Trend Strength (Strong/Moderate/Weak)\n2. Key Levels:\n- Support: [number]\n- Resistance: [number]\n3. Technical Indicators:\n- Key observations from visible indicators",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ];

    const visionResponse = await fetch("/integrations/gpt-vision/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: visionMessages }),
    });

    if (!visionResponse.ok) {
      const error = `Vision API failed with status: ${visionResponse.status}`;
      console.error("Vision API error:", error);
      throw new Error(error);
    }

    const visionData = await visionResponse.json();

    if (!visionData?.choices?.[0]?.message?.content) {
      const error = "Invalid vision analysis response structure";
      console.error("Vision API error:", error, visionData);
      throw new Error(error);
    }

    const analysis = visionData.choices[0].message.content;

    const geminiMessages = [
      {
        role: "user",
        content: `Based on this technical analysis: "${analysis}", provide a structured prediction with exactly these points:\n1. Direction (Bullish/Bearish/Neutral)\n2. Support Level: [number]\n3. Resistance Level: [number]\n4. Confidence Level: (percentage and brief reason)\n5. Key Risk Factor: (one main risk)`,
      },
    ];

    const geminiResponse = await fetch("/integrations/google-gemini-1-5/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: geminiMessages }),
    });

    if (!geminiResponse.ok) {
      const error = `Gemini API failed with status: ${geminiResponse.status}`;
      console.error("Gemini API error:", error);
      throw new Error(error);
    }

    const geminiData = await geminiResponse.json();

    if (!geminiData?.choices?.[0]?.message?.content) {
      const error = "Invalid prediction response structure";
      console.error("Gemini API error:", error, geminiData);
      throw new Error(error);
    }

    const prediction = geminiData.choices[0].message.content;

    return {
      success: true,
      analysis,
      prediction,
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
    };
  } catch (error) {
    console.error("Analysis error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: error.message || "Failed to analyze image. Please try again.",
    };
  }
}
