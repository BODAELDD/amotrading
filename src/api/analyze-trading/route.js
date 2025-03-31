import { NextResponse } from 'next/server'; // Import NextResponse

// Export a function named POST
export async function POST(request) {
  console.log("--- analyze-trading-image POST handler started ---");

  let requestBody;
  try {
    // Get the request body (which contains the image)
    requestBody = await request.json();
  } catch (e) {
    console.error("Failed to parse request body:", e);
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const { image } = requestBody; // Extract image from the parsed body

  if (!image) {
    console.error("Analysis error: No image provided in request body");
    // Use NextResponse for JSON responses
    return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
  }
  console.log("Image received, length:", image?.length);

  try {
    let base64Image = image;
    if (image.includes("base64,")) {
      base64Image = image.split("base64,")[1];
    }

    if (!base64Image) {
      console.error("Analysis error: Invalid base64 format");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid image format. Must be base64 encoded",
        },
        { status: 400 }
      );
    }
    console.log("Base64 image prepared, length:", base64Image?.length);

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

    console.log("Attempting Vision API call...");
    // Use the full URL if running locally and middleware isn't correctly configured for fetch scope
    // const visionApiUrl = process.env.NODE_ENV === 'development'
    //   ? 'http://localhost:3000/integrations/gpt-vision/' // Or your actual local URL
    //   : '/integrations/gpt-vision/'; // Keep relative for production/Vercel
    const visionApiUrl = '/integrations/gpt-vision/'; // Use relative path, middleware should handle it

    const visionResponse = await fetch(visionApiUrl, { // Use the determined URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Middleware should add 'x-createxyz-project-id', no need here usually
      },
      body: JSON.stringify({ messages: visionMessages }),
    });

    console.log(`Vision API response status: ${visionResponse.status}`);

    const visionResponseText = await visionResponse.text();
    console.log("Raw Vision API response text:", visionResponseText);

    if (!visionResponse.ok) {
      const error = `Vision API failed with status: ${visionResponse.status}`;
      console.error("Vision API error:", error, "Body:", visionResponseText);
      throw new Error(error);
    }

    const visionData = JSON.parse(visionResponseText);
    console.log("Parsed Vision Data:", JSON.stringify(visionData, null, 2));

    if (!visionData?.choices?.[0]?.message?.content) {
      const error = "Invalid vision analysis response structure";
      console.error("Vision API error:", error, "Received data:", JSON.stringify(visionData, null, 2));
      throw new Error(error);
    }

    const analysis = visionData.choices[0].message.content;
    console.log("Analysis extracted successfully.");

    const geminiMessages = [
       {
        role: "user",
        content: `Based on this technical analysis: "${analysis}", provide a structured prediction with exactly these points:\n1. Direction (Bullish/Bearish/Neutral)\n2. Support Level: [number]\n3. Resistance Level: [number]\n4. Confidence Level: (percentage and brief reason)\n5. Key Risk Factor: (one main risk)`,
      },
    ];

    console.log("Attempting Gemini API call...");
    // const geminiApiUrl = process.env.NODE_ENV === 'development'
    //   ? 'http://localhost:3000/integrations/google-gemini-1-5/'
    //   : '/integrations/google-gemini-1-5/';
    const geminiApiUrl = '/integrations/google-gemini-1-5/'; // Use relative path

    const geminiResponse = await fetch(geminiApiUrl, { // Use the determined URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Middleware should add 'x-createxyz-project-id'
      },
      body: JSON.stringify({ messages: geminiMessages }),
    });

    console.log(`Gemini API response status: ${geminiResponse.status}`);

    const geminiResponseText = await geminiResponse.text();
    console.log("Raw Gemini API response text:", geminiResponseText);

    if (!geminiResponse.ok) {
      const error = `Gemini API failed with status: ${geminiResponse.status}`;
      console.error("Gemini API error:", error, "Body:", geminiResponseText);
      throw new Error(error);
    }

    const geminiData = JSON.parse(geminiResponseText);
    console.log("Parsed Gemini Data:", JSON.stringify(geminiData, null, 2));

    if (!geminiData?.choices?.[0]?.message?.content) {
      const error = "Invalid prediction response structure";
      console.error("Gemini API error:", error, "Received data:", JSON.stringify(geminiData, null, 2));
      throw new Error(error);
    }

    const prediction = geminiData.choices[0].message.content;
    console.log("Prediction extracted successfully.");

    console.log("--- analyze-trading-image POST handler successful ---");
    // Use NextResponse.json for the success response
    return NextResponse.json({
      success: true,
      analysis,
      prediction,
      // No need to send imageUrl back usually, the frontend already has it
      // imageUrl: `data:image/jpeg;base64,${base64Image}`,
    });

  } catch (error) {
    console.error("--- analyze-trading-image POST handler FAILED ---");
    console.error("Analysis error caught:", {
      message: error.message,
      // stack: error.stack, // Stack might be too verbose for client
      timestamp: new Date().toISOString(),
    });

    // Use NextResponse.json for the error response
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze image. Please try again.",
      },
      { status: 500 } // Set appropriate status code for server error
    );
  }
}

// You can optionally add handlers for other methods like GET if needed
// export async function GET(request) {
//   return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
// }
