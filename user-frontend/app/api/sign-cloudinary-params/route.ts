import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Handle POST requests
export async function POST(request: NextRequest, response: NextResponse) {
  try{
    const body = await request.json();
    const { paramsToSign } = body;
  
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET as string);
    
    return NextResponse.json({ signature });
  }catch(e){
    console.log(e);
    return NextResponse.json(
      { error: "Give proper inputs" },
      { status: 400 }
    );    
  }
}
