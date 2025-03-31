// app/api/upload/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json(); // Assuming you are sending JSON with base64
    const base64Image = body.base64;

    if (!base64Image) {
      console.error("Upload error: No base64 data provided");
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    // Here you'd typically:
    // 1. Generate a unique filename (e.g., using UUID)
    // 2. Decode the base64 string into binary data
    // 3. Upload the binary data to a storage service (S3, Cloudinary, etc.)

    const buffer = Buffer.from(base64Image, 'base64'); // Decode

    // --- EXAMPLE: Saving to local filesystem (NOT RECOMMENDED FOR PRODUCTION) ---
    const filename = `image-${Date.now()}.jpeg`;
    const filepath = `./public/uploads/${filename}`; // Use a safe directory
    // Check that the `./public/uploads` directory exists.
    await fs.promises.mkdir('./public/uploads', { recursive: true })
    await fs.promises.writeFile(filepath, buffer); // Save to file

    const imageUrl = `/uploads/${filename}`;  // Public URL
    console.log('File uploaded successfully to:', imageUrl);

    return NextResponse.json({ url: imageUrl }); // Send URL back to client

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

//Need `fs` to use the code above
import * as fs from 'fs'
