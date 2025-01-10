import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

type HierarchicalData = {
	name: string
	children?: { name: string; value: number }[]
}

const ChartLevelGraph = ({ id }: { id: string }) => {
	const chartRef = useRef<HTMLDivElement>(null)
	const [data, setData] = useState<HierarchicalData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const query = {
					WHERE: {
						OR: [
							{
								AND: [
									{
										GT: {
											[`${id}_avg`]: 78.15,
										},
									},
									{
										IS: {
											[`${id}_dept`]: 'e*',
										},
									},
								],
							},
							{
								IS: {
									[`${id}_uuid`]: '12345',
								},
							},
						],
					},
					OPTIONS: {
						COLUMNS: [`${id}_dept`, `${id}_id`, `${id}_avg`],
						ORDER: `${id}_avg`,
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
				console.log('Fetched data:', result.result) // Debug log

				// Group by course level
				const groupedData = result.result.reduce(
					(acc: Record<string, number>, cur: Record<string, any>) => {
						const section = cur[`${id}_id`]
						const level = Math.floor(section / 100) * 100 // Get level (e.g., 110 -> 100, 269 -> 200)
						if (!acc[level]) acc[level] = 0
						acc[level] += 1
						return acc
					},
					{},
				)

				// Convert to hierarchical data
				const hierarchicalData: HierarchicalData = {
					name: 'Courses',
					children: Object.entries(groupedData).map(([level, count]) => ({
						name: `${level}s`,
						value: count as number,
					})),
				}

				setData(hierarchicalData)
			} catch (err) {
				console.error('Fetch error:', err)
				setError((err as Error).message)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [id])

	useEffect(() => {
		setTimeout(() => {
			console.log('loading')

			if (!data?.children?.length || !chartRef.current) {
				console.log(
					'Skipping render - Reasons:\n' +
						`- Data length: ${data?.children?.length ?? 0}\n` +
						`- Chart reference: ${
							chartRef.current ? 'Exists' : 'you are so cooked'
						}\n`,
				)
				return
			}

			const width = chartRef.current.clientWidth
			const height = width
			const radius = Math.min(width, height) / 2

			// Clear any existing SVG
			d3.select(chartRef.current).selectAll('*').remove()

			const partition = d3
				.partition<HierarchicalData>()
				.size([2 * Math.PI, radius])

			const root = d3.hierarchy(data).sum((d) => d.value || 0)

			partition(root)

			const color = d3.scaleOrdinal(d3.schemeCategory10)

			const svg = d3
				.select(chartRef.current)
				.append('svg')
				.attr('width', width)
				.attr('height', height)
				.append('g')
				.attr('transform', `translate(${width / 2},${height / 2})`)

			const arc = d3
				.arc<d3.HierarchyNode<HierarchicalData>>()
				.startAngle((d) => d.x0)
				.endAngle((d) => d.x1)
				.innerRadius((d) => d.y0)
				.outerRadius((d) => d.y1)

			svg
				.selectAll('path')
				.data(root.descendants())
				.enter()
				.append('path')
				.attr('display', (d) => (d.depth ? null : 'none'))
				.attr('d', arc)
				.style('stroke', '#fff')
				.style('fill', (d) => color(d.data.name || ''))
				.on('mouseover', function (event, d) {
					d3.select(this).transition().duration(200).attr('fill', '#4a8c74')
				})
				.on('mouseout', function (event, d) {
					d3.select(this)
						.transition()
						.duration(200)
						.attr('fill', color(d.data.name || ''))
				})

			svg
				.selectAll('text')
				.data(root.descendants())
				.enter()
				.append('text')
				.attr('transform', (d) => {
					const [x, y] = arc.centroid(d) //centroid of each arc for positioning
					return `translate(${x},${y})`
				})
				.attr('dy', '.35em') //adjust vertical alignment
				.style('text-anchor', 'middle')
				.text((d) => d.data.name)
				.style('fill', '#fff')
				.style('font-size', '12px')
				.style('pointer-events', 'none')
		}, 100) //100ms timeout so stuff loads
	}, [data])

	return (
		<div className="w-full rounded-lg bg-white shadow-lg p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-800">
					Class Level Distribution
				</h2>
			</div>
			<div>
				{loading ? (
					<p>Loading...</p>
				) : error ? (
					<p className="text-red-500">{error}</p>
				) : data?.children?.length > 0 ? (
					<div ref={chartRef} className="w-full"></div>
				) : (
					<p>No data available.</p>
				)}
			</div>
		</div>
	)
}

export default ChartLevelGraph
