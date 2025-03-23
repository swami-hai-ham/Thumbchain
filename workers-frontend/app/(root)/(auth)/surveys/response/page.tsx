import React from "react";
import Surveytitdes from "@/components/Surveytitdes";
import SurveyQues from "@/components/SurveyQues";

const page = () => {
  return (
    <div className="text-foreground w-full h-full">
      <Surveytitdes />
      <SurveyQues />
    </div>
  );
};

export default page;
