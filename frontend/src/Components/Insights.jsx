import React, { useState } from 'react'

import AvgGraph from './AvgGraph'
import ChartLevelGraph from './ClassLevelGraph'
import PassRateGraph from './PassRateGraph'

function Insights(props) {
	// State to manage the selected graph
	const [selectedGraph, setSelectedGraph] = useState(1)

	// Function to handle graph button clicks
	const handleGraphClick = (graphNumber) => {
		setSelectedGraph(graphNumber)
	}

	return (
		<div style={{ padding: '20px' }}>
			<h1> Insights for {props.id} </h1>
			{/* Button Bar for Graphs */}
			<div style={{ marginBottom: '20px' }}>
				<button
					style={{
						padding: '10px 20px',
						marginRight: '10px',
						backgroundColor: selectedGraph === 1 ? '#4f46e5' : '#e5e7eb',
						color: selectedGraph === 1 ? 'white' : 'black',
						border: 'none',
						cursor: 'pointer',
						borderRadius: '5px',
					}}
					onClick={() => handleGraphClick(1)}>
					Graph 1
				</button>
				<button
					style={{
						padding: '10px 20px',
						marginRight: '10px',
						backgroundColor: selectedGraph === 2 ? '#4f46e5' : '#e5e7eb',
						color: selectedGraph === 2 ? 'white' : 'black',
						border: 'none',
						cursor: 'pointer',
						borderRadius: '5px',
					}}
					onClick={() => handleGraphClick(2)}>
					Graph 2
				</button>
				<button
					style={{
						padding: '10px 20px',
						marginRight: '10px',
						backgroundColor: selectedGraph === 3 ? '#4f46e5' : '#e5e7eb',
						color: selectedGraph === 3 ? 'white' : 'black',
						border: 'none',
						cursor: 'pointer',
						borderRadius: '5px',
					}}
					onClick={() => handleGraphClick(3)}>
					Graph 3
				</button>
			</div>

			{/* Conditionally render the selected graph */}
			<div>
				{selectedGraph === 1 && <AvgGraph id={props.id} />}
				{selectedGraph === 2 && <PassRateGraph id={props.id} />}
				{selectedGraph === 3 && <ChartLevelGraph id={props.id} />}
			</div>
		</div>
	)
}

export default Insights
