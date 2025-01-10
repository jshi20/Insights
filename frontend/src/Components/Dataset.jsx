import React from 'react'

function Dataset(props) {
	return (
		<div
			style={{
				border: '1px solid #ccc',
				borderRadius: '5px',
				padding: '15px',
				marginBottom: '10px',
				backgroundColor: '#f9f9f9',
				boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
			}}>
			<h3 style={{ margin: '0 0 10px', color: '#333' }}>{props.id}</h3>
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<button
					onClick={props.handleDelete}
					style={{
						backgroundColor: '#dc3545',
						color: '#fff',
						border: 'none',
						padding: '8px 12px',
						borderRadius: '3px',
						cursor: 'pointer',
					}}>
					Delete
				</button>
				<button
					onClick={() => props.viewInsight(props.id)}
					style={{
						backgroundColor: '#007BFF',
						color: '#fff',
						border: 'none',
						padding: '8px 12px',
						borderRadius: '3px',
						cursor: 'pointer',
					}}>
					View Insights
				</button>
			</div>
		</div>
	)
}

export default Dataset
