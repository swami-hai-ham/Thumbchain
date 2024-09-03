"use client"
import React, { useState, useEffect } from 'react';
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from 'next-cloudinary';

const UploadImage: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<any>([]);

  useEffect(() => {
    console.log(uploadedImages); // Log the state whenever it changes
  }, [uploadedImages]);

  const handleSuccess = (result: { info?: string | CloudinaryUploadWidgetInfo }) => {
    if (typeof result.info === 'object' && result.info !== null) {
      // `result.info` is of type `CloudinaryUploadWidgetInfo`
      const { url } = result.info;
      console.log(url); // Safe to access `url`
      setUploadedImages((prevImages:any) => [...prevImages, url]);
    } else if (typeof result.info === 'string') {
      console.error('Received result.info as string, expected CloudinaryUploadWidgetInfo.');
    } else {
      console.error('Unexpected result.info type:', result.info);
    }
  };

  return (
    <div>
      <CldUploadWidget
        signatureEndpoint={'http://localhost:3000/api/sign-cloudinary-params'}
        uploadPreset="jxfo07qr"
        options={{ maxFiles: 10 }}
        onSuccess={handleSuccess}
      >
        {({ open }) => (
          <button onClick={() => open()}>Upload Images</button>
        )}
      </CldUploadWidget>

      <div>
        {/* Display images or other UI elements */}
      </div>
    </div>
  );
};

export default UploadImage;
