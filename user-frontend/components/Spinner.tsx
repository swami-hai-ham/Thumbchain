import React from 'react';


const Spinner = () => {
  return <div className="flex justify-center items-center gap-6">Loading<span className="loader relative block w-12 h-12 rounded-full transform rotate-45 perspective-1000"></span></div>;
};

export default Spinner;
