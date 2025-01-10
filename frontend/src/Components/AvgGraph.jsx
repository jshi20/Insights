import * as d3 from 'd3'
import React, { useEffect, useRef, useState } from 'react'

const AvgGraph = ({ id }) => {
	const chartRef = useRef()
	const [data, setData] = useState([])

	useEffect(() => {
		const fetchData = async () => {
			try {
				const query = {
					WHERE: {},
					OPTIONS: {
						COLUMNS: [`${id}_dept`, 'overallAvg'],
						ORDER: { dir: 'DOWN', keys: ['overallAvg'] },
					},
					TRANSFORMATIONS: {
						GROUP: [`${id}_dept`],
						APPLY: [{ overallAvg: { AVG: `${id}_avg` } }],
					},
				}

				const response = await fetch('http://localhost:4321/query', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(query), //Fixed: JSON stringify the query
				})

				if (!response.ok) {
					throw new Error(`Error: ${response.status}`)
				}

				const result = await response.json()
				//console.log('Fetched data:', result.result)
				setData(result.result)
			} catch (err) {
				console.error('Fetch error:', err)
			}
		}

		fetchData()
	}, [id])

	useEffect(() => {
		if (!data.length || !chartRef.current) return

		const margin = { top: 20, right: 30, bottom: 80, left: 50 }
		const width = chartRef.current.clientWidth - margin.left - margin.right
		const height = 400 - margin.top - margin.bottom

		// Clear any existing SVG
		d3.select(chartRef.current).selectAll('svg').remove()

		// Create the SVG container
		const svg = d3
			.select(chartRef.current)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`)

		// Define scales
		const xScale = d3
			.scaleBand()
			.domain(data.map((d) => d[`${id}_dept`]))
			.range([0, width])
			.padding(0.1)

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => d.overallAvg) || 100])
			.nice()
			.range([height, 0])

		// Add x-axis
		svg
			.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(xScale))
			.selectAll('text')
			.attr('transform', 'rotate(-45)')
			.style('text-anchor', 'end')

		// Add y-axis
		svg.append('g').call(d3.axisLeft(yScale))

		// Add bars
		svg
			.selectAll('.bar')
			.data(data)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', (d) => xScale(d[`${id}_dept`]))
			.attr('y', (d) => yScale(d.overallAvg))
			.attr('width', xScale.bandwidth())
			.attr('height', (d) => height - yScale(d.overallAvg))
			.attr('fill', '#69b3a2')
			.on('mouseover', function () {
				d3.select(this).transition().duration(200).attr('fill', '#4a8c74')
			})
			.on('mouseout', function () {
				d3.select(this).transition().duration(200).attr('fill', '#69b3a2')
			})

		// Add labels
		svg
			.selectAll('.label')
			.data(data)
			.enter()
			.append('text')
			.attr('x', (d) => xScale(d[`${id}_dept`]) + xScale.bandwidth() / 2)
			.attr('y', (d) => yScale(d.overallAvg) - 5)
			.attr('text-anchor', 'middle')
			.text((d) => d.overallAvg.toFixed(1))
			.style('font-size', '10px')
			.style('fill', 'black')
	}, [data])

	// Add window resize handler
	useEffect(() => {
		const handleResize = () => {
			// Trigger re-render of the chart
			setData((prevData) => [...prevData])
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	return (
		<div className="w-full rounded-lg bg-white shadow-lg p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-800">
					Department Average Grades
				</h2>
			</div>
			<div>
				{data.length != 0 ? (
					<div ref={chartRef} className="w-full"></div>
				) : (
					<h1>bruh</h1>
				)}
			</div>
		</div>
	)
}

export default AvgGraph
