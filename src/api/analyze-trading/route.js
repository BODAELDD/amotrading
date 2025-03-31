async function handler({ image }) {
  console.log("--- analyze-trading-image handler started ---"); // Add start log

  if (!image) {
    console.error("Analysis error: No image provided");
    return { success: false, error: "No image provided" };
  }
  console.log("Image received, length:", image?.length); // Log image length

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
    console.log("Base64 image prepared, length:", base64Image?.length); // Log processed image length

    const visionMessages = [ /* ... your messages ... */ ];
    console.log("Attempting Vision API call..."); // Log before fetch

    const visionResponse = await fetch("/integrations/gpt-vision/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: visionMessages }),
    });

    console.log(`Vision API response status: ${visionResponse.status}`); // Log status code

    // --- Log the raw response text BEFORE checking .ok or parsing JSON ---
    const visionResponseText = await visionResponse.text();
    console.log("Raw Vision API response text:", visionResponseText);
    // --- End log raw response ---

    if (!visionResponse.ok) {
      const error = `Vision API failed with status: ${visionResponse.status}`;
      console.error("Vision API error:", error, "Body:", visionResponseText); // Log body on error
      throw new Error(error);
    }

    const visionData = JSON.parse(visionResponseText); // Parse the text you already read
    console.log("Parsed Vision Data:", JSON.stringify(visionData, null, 2)); // Log parsed data nicely

    if (!visionData?.choices?.[0]?.message?.content) {
      const error = "Invalid vision analysis response structure";
      // Log the data that caused the error
      console.error("Vision API error:", error, "Received data:", JSON.stringify(visionData, null, 2));
      throw new Error(error);
    }

    const analysis = visionData.choices[0].message.content;
    console.log("Analysis extracted successfully.");

    const geminiMessages = [ /* ... your messages ... */ ];
    console.log("Attempting Gemini API call..."); // Log before fetch

    const geminiResponse = await fetch("/integrations/google-gemini-1-5/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: geminiMessages }),
    });

    console.log(`Gemini API response status: ${geminiResponse.status}`); // Log status code

    // --- Log the raw response text BEFORE checking .ok or parsing JSON ---
    const geminiResponseText = await geminiResponse.text();
    console.log("Raw Gemini API response text:", geminiResponseText);
    // --- End log raw response ---

    if (!geminiResponse.ok) {
      const error = `Gemini API failed with status: ${geminiResponse.status}`;
      console.error("Gemini API error:", error, "Body:", geminiResponseText); // Log body on error
      throw new Error(error);
    }

    const geminiData = JSON.parse(geminiResponseText); // Parse the text
    console.log("Parsed Gemini Data:", JSON.stringify(geminiData, null, 2)); // Log parsed data

    if (!geminiData?.choices?.[0]?.message?.content) {
      const error = "Invalid prediction response structure";
      console.error("Gemini API error:", error, "Received data:", JSON.stringify(geminiData, null, 2));
      throw new Error(error);
    }

    const prediction = geminiData.choices[0].message.content;
    console.log("Prediction extracted successfully.");

    console.log("--- analyze-trading-image handler successful ---"); // Log success end
    return {
      success: true,
      analysis,
      prediction,
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
    };

  } catch (error) {
    console.error("--- analyze-trading-image handler FAILED ---"); // Log failure end
    console.error("Analysis error caught:", {
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
