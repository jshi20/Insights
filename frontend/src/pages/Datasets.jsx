import React, { useEffect, useState } from 'react'

import AddModal from '../Components/AddModal'
import Dataset from '../Components/Dataset'
import Insights from '../Components/Insights'

function Datasets() {
	const [datasets, setDatasets] = useState([]) // Initialize as an empty array
	const [modalIsOpen, setModalIsOpen] = useState(false)
	const [showInsight, setShowInsight] = useState(false)
	const [selectedDataset, setSelectedDataset] = useState('')

	// Open and close modal
	const openModal = () => setModalIsOpen(true)
	const closeModal = () => {
		setModalIsOpen(false)
		fetchData()
	}

	const fetchData = async () => {
		const data = await fetch('http://localhost:4321/datasets')
			.then((res) => res.json())
			.then((data) => data.result)
		setDatasets(data)
	}

	// Fetch data from API
	useEffect(() => {
		fetchData()
	}, [])

	// Handle delete
	const handleDelete = async (id) => {
		try {
			const response = await fetch(`http://localhost:4321/dataset/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (response.ok) {
				setDatasets((prevDatasets) =>
					prevDatasets.filter((dataset) => dataset.id !== id),
				)
			} else {
				alert('Failed to delete dataset')
			}
		} catch (error) {
			console.error('Error deleting dataset:', error)
			alert('An error occurred while deleting the dataset.')
		}
	}

	// Show insight
	function viewInsight(id) {
		setShowInsight(true)
		setSelectedDataset(id)
	}

	function closeInsight() {
		setShowInsight(false)
		setSelectedDataset('')
	}

	return (
		<div
			style={{
				fontFamily: 'Arial, sans-serif',
				padding: '20px',
				maxWidth: '800px',
				margin: '0 auto',
			}}>
			{!showInsight ? (
				<div>
					<h1
						style={{
							textAlign: 'center',
							color: '#333',
							marginBottom: '20px',
							fontSize: '60px',
						}}>
						Datasets
					</h1>

					{/* Modal */}
					{modalIsOpen && (
						<AddModal modalIsOpen={modalIsOpen} closeModal={closeModal} />
					)}

					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '20px',
						}}>
						<button
							onClick={openModal}
							style={{
								padding: '10px 20px',
								backgroundColor: '#007BFF',
								color: '#fff',
								border: 'none',
								borderRadius: '5px',
								cursor: 'pointer',
							}}>
							Add Dataset
						</button>
					</div>

					<div>
						{datasets.length === 0 ? (
							<p style={{ textAlign: 'center', color: '#666' }}>
								No datasets available. Click Add Dataset to upload one.
							</p>
						) : (
							datasets.map((dataset, index) => (
								<Dataset
									key={index}
									id={dataset.id}
									kind={dataset.kind}
									numRows={dataset.numRows}
									handleDelete={() => handleDelete(dataset.id)}
									viewInsight={() => viewInsight(dataset.id)}
								/>
							))
						)}
					</div>
				</div>
			) : (
				<div>
					<Insights id={selectedDataset} />
					<div
						style={{
							textAlign: 'center',
							marginTop: '20px',
						}}>
						<button
							onClick={closeInsight}
							style={{
								padding: '10px 20px',
								backgroundColor: '#dc3545',
								color: '#fff',
								border: 'none',
								borderRadius: '5px',
								cursor: 'pointer',
							}}>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export default Datasets
