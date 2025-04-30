import React from "react";

const Spinner = () => {
  return (
    <div className="flex justify-center items-center gap-6 text-sm">
      Loading
      <span className="loader relative block w-8 h-8 rounded-full transform rotate-45 perspective-1000"></span>
    </div>
  );
};

export default Spinner;
