import { createCanvas } from 'canvas'
import { Chart } from 'chart.js/auto'
import fs from 'fs'
import chalk from 'chalk'
import { results } from '../consts.js'

export const generateChart = (outputPath) => {
	const width = 800
	const height = 400
	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, width, height)

	const chartConfig = {
		type: 'bar',
		data: {
			labels: results.map((result) => result.name),
			datasets: [
				{
					label: 'Req/s',
					data: results.map((result) => result.reqPerSec),
					backgroundColor: 'rgba(75, 192, 192, 1)',
					borderColor: 'rgba(75, 192, 192, 1)',
					borderWidth: 1,
					yAxisID: 'reqs'
				},
				{
					label: 'Latency (ms)',
					data: results.map((result) => result.latency),
					backgroundColor: 'rgba(255, 99, 132, 1)',
					borderColor: 'rgba(255, 99, 132, 1)',
					borderWidth: 1,
					yAxisID: 'latency'
				}
			]
		}
	}

	new Chart(ctx, chartConfig)
	const buffer = canvas.toBuffer('image/jpeg')
	fs.writeFileSync(outputPath, buffer)
	console.log(chalk.green(`\nChart saved to ${outputPath}`))
}
