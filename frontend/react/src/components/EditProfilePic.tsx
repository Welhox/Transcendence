import React, { useState } from "react";

interface ProfilePicProps {
	pic: File | null;
	onChange: (file: File | null) => void;
}

const EditProfilePic: React.FC<ProfilePicProps> = ({ pic, onChange }) => {
	const [isEditing, setIsEditing] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] || null;
		onChange(file);
	};

	return (
		<div>
			{pic ? (
				<img
					src={URL.createObjectURL(pic)}
					alt="Profile pic"
				/>
			) : (
				<div style={{ width: "80px", height: "80px", backgroundColor: "#eee", borderRadius: "50%", marginTop: "0.5rem" }} />
			)}
			{isEditing ? (
				<div>
					<button onClick={() => setIsEditing(true)}>Change</button>
				</div>
			) : (
				<div>
					<input type="file" accept="image/" onChange={handleFileChange} />
					<div>
						<button onClick={() => setIsEditing(false)}>Save</button>{" "}
						<button onClick={() => setIsEditing(false)}>Cancel</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default EditProfilePic