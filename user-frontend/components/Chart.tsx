import React, { useEffect, useRef } from 'react';
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface BarChartProps {
  data: number[];
  labels: string[];
  url: string[];
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, labels, title, url }) => {
    const divRef = useRef<HTMLDivElement | null>(null)
    const maxValue = Math.max(...data);
    useEffect(() => {
        if (divRef.current) {
          const bars = divRef.current.querySelectorAll('.bar');
          
          bars.forEach((bar, index) => {
            const barHeight = `${(data[index] / maxValue) * 100}px`;
            
            gsap.fromTo(
              bar, 
              { height: 0, autoAlpha: 0, backgroundColor: "#005f42", rotate: -10 }, 
              { 
                height: barHeight, 
                autoAlpha: 1, 
                backgroundColor: "#00FF85", // Blue color transition
                rotate: 0, // Smooth rotation back to 0
                delay: index * 0.2, 
                duration: 1.2, 
                ease: "elastic.out(1, 0.5)", // Elastic easing
                onComplete: () => {
                  // Optional flicker effect after animation
                  gsap.to(bar, { autoAlpha: 0.8, repeat: 1, yoyo: true, duration: 0.1 });
                }
              }
            );
          });
        }
    }, [data, maxValue]);  

    useGSAP(() => {
        const q = gsap.utils.selector(divRef.current);
        gsap.fromTo([q('.thumbnail'), q('.count')], {autoAlpha: 0}, {autoAlpha: 1})
    }, {dependencies: [data, maxValue], scope: divRef})
    return (
        <div className="bg-background p-4 rounded shadow h-1/2 w-full m-24" ref={divRef}>
        {title && <h2 className="text-lg font-bold mb-4">{title}</h2>}
        <div className="flex items-end h-full w-full justify-center">
            {data.map((value, index) => (
            <div key={index} className="flex flex-col items-center size-full justify-end gap-2">
                <img src={url[index]} className='thumbnail h-32 w-2/4 object-contain opacity-0' alt="" />
                <div className="bg-chart-2 rounded-t w-3/4 bar opacity-0 flex justify-center items-center">
                </div>
                <div className="count opacity-0 font-poppins text-white text-center p-1 text-2xl">{value}</div>
            </div>
            ))}
        </div>
        </div>
    );
    };

export default BarChart;