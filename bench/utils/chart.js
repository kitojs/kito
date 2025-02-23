import { createCanvas } from 'canvas';
import { Chart } from 'chart.js/auto';
import fs from 'fs';
import chalk from 'chalk';
import { results } from '../consts.js';

export const generateChart = (outputPath) => {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, width, height);

  const chartConfig = {
    type: 'bar',
    data: {
      labels: results.map((result) => result.name),
      datasets: [
        {
          label: 'Req/s',
          data: results.map((result) => result.reqPerSec),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderRadius: 5,
          yAxisID: 'reqs',
        },
        {
          label: 'Latency (ms)',
          data: results.map((result) => result.latency),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          borderRadius: 5,
          yAxisID: 'latency',
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          labels: {
            color: '#333',
            font: {
              size: 14,
              weight: 'bold',
            },
          },
        },
      },
      scales: {
        reqs: {
          position: 'left',
          ticks: {
            color: '#555',
            font: {
              size: 12,
            },
          },
          grid: {
            color: 'rgba(200, 200, 200, 0.2)',
          },
        },
        latency: {
          position: 'right',
          ticks: {
            color: '#555',
            font: {
              size: 12,
            },
          },
          grid: {
            color: 'rgba(200, 200, 200, 0.2)',
          },
        },
        x: {
          ticks: {
            color: '#333',
            font: {
              size: 12,
            },
          },
          grid: {
            color: 'rgba(200, 200, 200, 0.2)',
          },
        },
      },
    },
  };

  new Chart(ctx, chartConfig);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(chalk.green(`\nChart saved to ${outputPath}`));
};
