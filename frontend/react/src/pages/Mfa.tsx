import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import  axios from 'axios'

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

const MfaValidation: React.FC = () => {
	const navigate = useNavigate();


	try {


	}
	catch (err) {

	}
	return (
		<div>
			<h2>ENTER OTP</h2>

		</div>
	)
}


export default MfaValidation