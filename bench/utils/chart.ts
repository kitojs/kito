import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Canvas } from "skia-canvas";
import fs from "node:fs/promises";

Chart.register([
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
]);

type ChartData = {
  frameworks: string[];
  requests: number[];
  latency: number[];
  throughput: number[];
};

export async function generateChart(data: ChartData, outputPath: string) {
  try {
    const canvas = new Canvas(1000, 600);
  
    const colors = [
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // amber
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#06b6d4", // cyan
    ];
    
    const chart = new Chart(canvas as any, {
      type: "bar",
      data: {
        labels: data.frameworks.map(f => f.charAt(0).toUpperCase() + f.slice(1)),
        datasets: [
          {
            label: "Requests/sec",
            data: data.requests,
            backgroundColor: "#3b82f6",
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: "Latency (ms)",
            data: data.latency,
            backgroundColor: "#10b981",
            borderRadius: 8,
            borderSkipped: false,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: false,
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              color: "#1f2937",
              font: {
                size: 14,
                weight: 600,
                family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: "rectRounded",
            },
          },
          title: {
            display: true,
            text: "Benchmark Results",
            color: "#1f2937",
            font: {
              size: 28,
              weight: "bold",
              family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
            },
            padding: {
              top: 10,
              bottom: 30,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
              weight: "bold",
              family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
            },
            bodyFont: {
              size: 13,
              family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
            },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;

                if (label.includes('Latency')) {
                  return `${label}: ${value?.toFixed(2)} ms`;
                }
                
                return `${label}: ${value?.toLocaleString()} req/s`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#4b5563",
              font: {
                size: 16,
                weight: 600,
                family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
              },
              padding: 10,
            },
            border: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            position: "left",
            grid: {
              color: "#e5e7eb",
              lineWidth: 1,
            },
            ticks: {
              color: "#3b82f6",
              font: {
                size: 13,
                weight: 600,
                family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
              },
              padding: 10,
              callback: (value) => {
                return value.toLocaleString();
              },
            },
            border: {
              display: false,
            },
            title: {
              display: true,
              text: "Requests/sec",
              color: "#3b82f6",
              font: {
                size: 13,
                weight: "bold",
                family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
              },
            },
          },
          y1: {
            beginAtZero: true,
            position: "right",
            grid: {
              display: false,
            },
            ticks: {
              color: "#10b981",
              font: {
                size: 13,
                weight: 600,
                family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
              },
              padding: 10,
              callback: (value) => {
                let valueNumber = value as number;
                return valueNumber.toFixed(1);
              },
            },
            border: {
              display: false,
            },
            title: {
              display: true,
              text: "Latency (ms)",
              color: "#10b981",
              font: {
                size: 13,
                weight: "bold",
                family: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
              },
            },
          },
        },
      },
    });

    const dir = outputPath.substring(0, outputPath.lastIndexOf("/"));
    if (dir) {
      await fs.mkdir(dir, { recursive: true });
    }

    const pngBuffer = await canvas.toBuffer("png", { 
      matte: "white",
      density: 2,
    });
    
    await fs.writeFile(outputPath, pngBuffer);

    console.log(`✅ Chart saved to ${outputPath}`);
    
    chart.destroy();
  } catch (err) {
    console.error("Error generating chart:", err);
  }
}