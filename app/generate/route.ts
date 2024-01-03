import { Ratelimit } from "@upstash/ratelimit";
import redis from "../../utils/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import OpenAI from "openai";
export const maxDuration = 300; // This function can run for a maximum of 300 seconds

// Initialize the OpenAI client with the API key. This key is essential for authenticating 
// the requests with OpenAI's API services.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// Create a new ratelimiter, that allows 5 requests per 24 hours
const ratelimit = redis
  ? new Ratelimit({
    redis: redis,
    limiter: Ratelimit.fixedWindow(5, "1440 m"),
    analytics: true,
  })
  : undefined;

export async function POST(request: Request) {

  const { imageUrl, theme, room } = await request.json();

  console.log('Start: Processing ');

  // Rate Limiter Code
  if (ratelimit) {
    const headersList = headers();
    const ipIdentifier = headersList.get("x-real-ip");

    const result = await ratelimit.limit(ipIdentifier ?? "");

    if (!result.success) {
      return new Response(
        "Too many uploads in 1 day. Please try again in a 24 hours.",
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit,
            "X-RateLimit-Remaining": result.remaining,
          } as any,
        }
      );
    }
  }

  // Describe Picture 
  const promptText = "Analyze and describe the image in detail. Focus on visual elements like colors, object details, people's positions and expressions, and the environment. Aim for a clear, thorough representation of all visual and textual aspects. The description should describe an Avatar for social media ";

  // Log the chosen prompt
  // console.log(`Using prompt: ${promptText}`);

  // Sending the image and prompt to OpenAI for processing. This step is crucial for the image analysis.
  console.log('Sending request to OpenAI');

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptText },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    max_tokens: 200
  });

  console.log('Received response from OpenAI');
 // console.log('Response:', JSON.stringify(response, null, 2)); // Log the response for debugging

  // Extract and log the analysis from the response
  const analysis = response?.choices[0]?.message?.content;
  console.log('Analysis:', analysis);

  //add TOK to analysis

  // Simpsonify 


  // POST request to Replicate to start the image restoration generation process
  let endpointUrl = null ; 
  try {
  let startResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Token " + process.env.REPLICATE_API_KEY,
    },
    body: JSON.stringify({
      version: "f4d36a72b43ea2fd511cab0afb32539955ee5b28b65c8e3fb7d8abd254be8e91",
      input: {
        //image: imageUrl,
        prompt: "A TOK Simpsons character of " + analysis,
        negative_prompt: "ugly, broken, distorted, artefacts, 3D, render, photography",
        width: 512,
        height: 512,
        refine: "expert_ensemble_refiner",
        scheduler: "K_EULER",
        lora_scale: 0.6,
        num_outputs: 1,
        guidance_scale: 7.5,
        apply_watermark: false,
        high_noise_frac: 0.8,
        prompt_strength: 0.9,
        num_inference_steps: 50,
        disable_safety_checker: false
      },
    }),
  });
  if (!startResponse.ok) {
    // Log the error status and message
    console.error("Replicate API Error:", startResponse.status, startResponse.statusText);
    // Return an error response to the client
    return NextResponse.json({
        error: "Failed to start image processing with Replicate API",
        statusCode: startResponse.status,
        statusText: startResponse.statusText,
    }, {
        status: startResponse.status
    });
}

let jsonStartResponse = await startResponse.json();
     endpointUrl = jsonStartResponse.urls.get;

} catch (error) {
    console.error("Error during Replicate API call:", error);
    return NextResponse.json({
        error: "An error occurred while processing the image with Replicate API",
        details: error
    }, {
        status: 500 // Internal Server Error
    });
}


  // GET request to get the status of the image restoration process & return the result when it's ready
  let restoredImage: string | null = null;
  while (!restoredImage) {
    // Loop in 1s intervals until the alt text is ready
    console.log("polling for result...");
    console.log('endpointUrl:', endpointUrl);

    let finalResponse = await fetch(endpointUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + process.env.REPLICATE_API_KEY,
      },
    });
    let jsonFinalResponse = await finalResponse.json();
    // console.log(jsonFinalResponse);
    if (jsonFinalResponse.status === "succeeded") {
      restoredImage = jsonFinalResponse.output;

    } else if (jsonFinalResponse.status === "failed") {
      break;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json(
    restoredImage ? restoredImage : "Failed to restore image"
  );
}
