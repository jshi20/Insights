import React, { useState } from 'react'
import Modal from 'react-modal'

// Bind the modal to the app root element
Modal.setAppElement('#root')

function AddModal(props) {
	const [file, setFile] = useState(null)
	const [datasetId, setDatasetId] = useState('')
	const [errorMessage, setErrorMessage] = useState('')

	const handleFileChange = (e) => {
		const selectedFile = e.target.files[0]
		validateAndSetFile(selectedFile)
	}

	const handleDrop = (e) => {
		e.preventDefault()
		e.stopPropagation()
		const droppedFile = e.dataTransfer.files[0]
		validateAndSetFile(droppedFile)
	}

	const validateAndSetFile = (selectedFile) => {
		if (!selectedFile) {
			setErrorMessage('No file selected.')
			return
		}
		if (
			selectedFile.type !== 'application/zip' &&
			!selectedFile.name.toLowerCase().endsWith('.zip')
		) {
			setErrorMessage('Only .zip files are allowed.')
			console.log('File type:', selectedFile.type)
			console.log('File name:', selectedFile.name)
			return
		}
		if (selectedFile.size > 50 * 1024 * 1024) {
			setErrorMessage('File size should not exceed 50MB.')
			return
		}
		setErrorMessage('')
		setFile(selectedFile)
	}

	const uploadFile = async () => {
		if (!file) {
			setErrorMessage('Please select a file before submitting.')
			return
		}
		if (!datasetId) {
			setErrorMessage('Please provide a dataset ID.')
			return
		}

		try {
			const datasetKind = 'sections' // Adjust as necessary
			const response = await fetch(
				`http://localhost:4321/dataset/${datasetId}/${datasetKind}`,
				{
					method: 'PUT',
					body: file,
					headers: {
						'Content-Type': 'application/octet-stream',
					},
				},
			)

			if (response.ok) {
				alert('File uploaded successfully!')
				setFile(null)
				setDatasetId('')
				props.closeModal()
			} else {
				const errorData = await response.json()
				setErrorMessage(`Failed to upload file: ${errorData.error}`)
			}
		} catch (error) {
			setErrorMessage('An error occurred while uploading the file.')
		}
	}

	return (
		<Modal
			isOpen={props.modalIsOpen}
			onRequestClose={props.closeModal}
			contentLabel="Add Dataset"
			style={{
				content: {
					top: '50%',
					left: '50%',
					right: 'auto',
					bottom: 'auto',
					marginRight: '-50%',
					transform: 'translate(-50%, -50%)',
					padding: '20px',
					maxWidth: '500px',
					borderRadius: '10px',
					boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
				},
			}}>
			<h2>Add Dataset</h2>

			<div style={{ marginBottom: '15px' }}>
				<label
					htmlFor="datasetId"
					style={{ display: 'block', marginBottom: '5px' }}>
					Dataset ID:
				</label>
				<input
					type="text"
					id="datasetId"
					value={datasetId}
					onChange={(e) => setDatasetId(e.target.value)}
					placeholder="Enter Dataset ID"
					style={{
						width: '100%',
						padding: '10px',
						borderRadius: '5px',
						border: '1px solid #ccc',
					}}
				/>
			</div>

			<div
				style={{
					border: '2px dashed #ccc',
					padding: '20px',
					borderRadius: '10px',
					textAlign: 'center',
					marginBottom: '15px',
					backgroundColor: '#f9f9f9',
					cursor: 'pointer',
				}}
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}>
				{file ? (
					<p>
						<strong>Selected File:</strong> {file.name}
					</p>
				) : (
					<p>Drag & Drop a .zip file here, or click below to select a file.</p>
				)}
			</div>

			<input
				type="file"
				accept=".zip"
				id="fileInput"
				onChange={handleFileChange}
				style={{ display: 'none' }}
			/>
			<label
				htmlFor="fileInput"
				style={{
					display: 'inline-block',
					padding: '10px 20px',
					backgroundColor: '#007BFF',
					color: '#fff',
					borderRadius: '5px',
					cursor: 'pointer',
					textAlign: 'center',
				}}>
				Select File
			</label>

			{errorMessage && (
				<p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
					{errorMessage}
				</p>
			)}

			<div style={{ marginTop: '20px', textAlign: 'center' }}>
				<button
					onClick={uploadFile}
					style={{
						padding: '10px 20px',
						backgroundColor: file && datasetId ? '#28a745' : '#ccc',
						color: '#fff',
						border: 'none',
						borderRadius: '5px',
						cursor: file && datasetId ? 'pointer' : 'not-allowed',
						marginRight: '10px',
					}}
					disabled={!file || !datasetId}>
					Submit
				</button>
				<button
					onClick={props.closeModal}
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
		</Modal>
	)
}

export default AddModal
