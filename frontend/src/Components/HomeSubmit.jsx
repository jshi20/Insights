import React, { useState } from 'react'

function HomeSubmit(props) {
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	})

	// Handle input changes
	const handleInputChange = (e) => {
		const { name, value } = e.target
		setFormData({
			...formData,
			[name]: value,
		})
	}

	// Handle form submission
	const handleSubmit = () => {
		let handleSuccess = false

		if (formData.username && formData.password) {
			handleSuccess = true
		}

		// If `handleSuccess` is passed as a prop, call it
		if (handleSuccess) {
			props.handleSuccess()
		} else {
			alert('Wrong Username or Password')
		}
	}

	return (
		<div className="App" data-testid="app-page">
			<header className="App-header">
				<p className="header">Sections Insights</p>

				<div className="body">
					<form onSubmit={handleSubmit}>
						<label htmlFor="username">Username:</label>
						<input
							type="text"
							id="username"
							name="username"
							value={formData.username}
							onChange={handleInputChange}
						/>
						<br />
						<label htmlFor="password">Password:</label>
						<input
							type="password"
							id="password"
							name="password"
							value={formData.password}
							onChange={handleInputChange}
						/>
						<br />
						<button type="submit">Submit</button>
					</form>
				</div>
			</header>
		</div>
	)
}

export default HomeSubmit
