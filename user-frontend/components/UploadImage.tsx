"use client";
import React, { useState, useEffect } from "react";
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from "next-cloudinary";

const UploadImage: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<any>([]);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    // Retrieve from localStorage on initial render
    const savedImages = localStorage.getItem("uploadedImages");
    if (savedImages) {
      const images = JSON.parse(savedImages);
      console.log(images)
      setUploadedImages(images);
      if(images && images.length != 0){
        setDisabled(true); // Disable if there are already 5 images
      }
    }
  }, []);

  const handleSuccess = async (result: { info?: string | CloudinaryUploadWidgetInfo }) => {
    if (typeof result.info === "object" && result.info !== null) {
      const { secure_url, width, height } = result.info;
      const newImages = [...uploadedImages, { url: secure_url, width, height }];
      setUploadedImages(newImages);
      
      if (newImages.length >= 5) {
        setDisabled(true); // Disable button if 5 images are reached
      }
    } else {
      console.error("Unexpected result.info type:", result.info);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 space-y-6">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <CldUploadWidget
          uploadPreset="dfsdfsdfsd"
          options={{ 
            maxFiles: 5, 
            resourceType: "image", 
            clientAllowedFormats: ["jpg", "png", "gif", "jpeg", "webp", "bmp", "svg"] 
          }}
          onSuccess={handleSuccess}
          onClose={() => {localStorage.setItem("uploadedImages", uploadedImages)}}
        >
          {({ open }) => (
            <button
              onClick={() => open()}
              className={`h-12 w-full bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-300 ${
                disabled ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={disabled}
            >
              Upload Images
            </button>
          )}
        </CldUploadWidget>
      </div>

      <div className="flex flex-wrap justify-center items-start gap-4 max-w-full overflow-hidden">
        {uploadedImages.map((img: { url: string; width: number; height: number }, idx: number) => (
          <div key={idx} className="relative">
            <img
              src={img.url}
              style={{
                width: Math.min(img.width, 300),  // Max width cap to prevent overflow
                height: Math.min(img.height, 300),
              }}
              className="shadow-md object-contain"
              alt={`uploaded-${idx}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadImage;
