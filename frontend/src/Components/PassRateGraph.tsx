import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const PassRateGraph = ({ id }) => {
	const chartRef = useRef(null)
	const [data, setData] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [svgWidth, setSvgWidth] = useState(0)

	useLayoutEffect(() => {
		const updateDimensions = () => {
			if (chartRef.current && chartRef.current.parentElement) {
				const parent = chartRef.current.parentElement
				const width = parent.getBoundingClientRect().width
				setSvgWidth(width)
			}
		}

		//Delay execution to ensure DOM is ready
		//hahaha need 100ms for some reason HAHAHA
		const timeoutId = setTimeout(updateDimensions, 250)

		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(updateDimensions)
		})

		if (chartRef.current?.parentElement) {
			resizeObserver.observe(chartRef.current.parentElement)
		}

		return () => {
			clearTimeout(timeoutId)
			if (chartRef.current?.parentElement) {
				resizeObserver.unobserve(chartRef.current.parentElement)
			}
			resizeObserver.disconnect()
		}
	}, [])

	// Fetch data
	useEffect(() => {
		const fetchData = async () => {
			try {
				const query = {
					WHERE: {},
					OPTIONS: {
						COLUMNS: [`${id}_dept`, `${id}_id`, 'passCount', 'failCount'],
					},
					TRANSFORMATIONS: {
						GROUP: [`${id}_dept`, `${id}_id`],
						APPLY: [
							{
								passCount: {
									SUM: `${id}_pass`,
								},
							},
							{
								failCount: {
									SUM: `${id}_fail`,
								},
							},
						],
					},
				}

				const response = await fetch('http://localhost:4321/query', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(query),
				})

				if (!response.ok) {
					throw new Error(`Error: ${response.status}`)
				}

				const result = await response.json()
				const processedData = result.result.map((d) => ({
					...d,
					dept: d[`${id}_dept`],
					courseId: d[`${id}_id`],
					passRate: d.passCount / (d.passCount + d.failCount) || 0,
				}))
				setData(processedData)
			} catch (err) {
				console.error('Fetch error:', err)
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [id])

	// Draw chart
	useEffect(() => {
		if (!data.length || !chartRef.current || svgWidth <= 0) {
			console.log(
				'Skipping render - Reasons:\n' +
					`- Data length: ${data.length}\n` +
					`- Chart reference: ${
						chartRef.current ? 'Exists' : 'Not available'
					}\n` +
					`- Chart width: ${svgWidth}`,
			)
			return
		}

		console.log('Rendering chart...')

		// Clear any existing SVG
		d3.select(chartRef.current).selectAll('svg').remove()

		const margin = { top: 40, right: 30, bottom: 90, left: 60 }
		const width = svgWidth - margin.left - margin.right
		const height = 400 - margin.top - margin.bottom

		// Create SVG container
		const svg = d3
			.select(chartRef.current)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`)

		const departmentData = d3.group(data, (d) => d.dept)
		const departments = Array.from(departmentData.keys())

		const x0Scale = d3
			.scaleBand()
			.domain(departments)
			.range([0, width])
			.padding(0.1)

		const x1Scale = d3
			.scaleBand()
			.domain(data.map((d) => d.courseId))
			.range([0, x0Scale.bandwidth()])
			.padding(0.05)

		const yScale = d3.scaleLinear().domain([0.9, 1]).range([height, 0])

		// Add axes
		svg
			.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(x0Scale))
			.selectAll('text')
			.attr('transform', 'rotate(-45)')
			.style('text-anchor', 'end')

		svg
			.append('g')
			.call(d3.axisLeft(yScale).tickFormat((d) => `${(d * 100).toFixed(0)}%`))

		// Add bars and interactivity
		departmentData.forEach((courses, dept) => {
			svg
				.selectAll(`.bar-${dept}`)
				.data(courses)
				.join('rect')
				.attr('class', `bar-${dept}`)
				.attr('x', (d) => x0Scale(dept) + x1Scale(d.courseId))
				.attr('y', (d) => yScale(d.passRate))
				.attr('width', x1Scale.bandwidth())
				.attr('height', (d) => height - yScale(d.passRate))
				.attr('fill', '#69b3a2')
		})
	}, [data, svgWidth])

	return (
		<div className="w-full rounded-lg bg-white shadow-lg p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-800">
					Department Pass Rates
				</h2>
			</div>
			{loading ? (
				<p>Loading...</p>
			) : error ? (
				<p>Error loading data: {error}</p>
			) : (
				<div ref={chartRef} style={{ height: '400px', width: '100%' }} />
			)}
		</div>
	)
}

export default PassRateGraph
