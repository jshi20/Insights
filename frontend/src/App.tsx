import React, { useState } from 'react'
import './App.css'
import HomeSubmit from './Components/HomeSubmit'
import Datasets from './pages/Datasets'

function App() {
	const [success, setSuccess] = useState(false)
	fetch('http://localhost:4321/datasets')
		.then((res) => res.json())
		.then((data) => {})
	function handleSuccess() {
		setSuccess(true) // Set success to true
	}
	return (
		<div className="app">
			{!success ? (
				<HomeSubmit handleSuccess={handleSuccess}></HomeSubmit>
			) : (
				<Datasets></Datasets>
			)}{' '}
		</div>
	)
}

export default App
