import React, { useState, useEffect, useRef } from "react";

interface ProfilePicProps {
	pic: File | null;
	onChange: (file: File | null) => void;
	onSave: () => void; // optional save handler -> figure out flow for pic saving
}

/*
Component for updating the profile picture in Settings. Displays saved profile pic
by default. If invalid picture is submitted, displays an error and clears up /
won't display the erroneous filename next to Choose file button. Displays a proper
picture file in the circle and changes will be committed only after user clicks Save.
Allows only file types .jpg, .jpeg and .png. Max file size is limited to 2MB.
*/
const EditProfilePic: React.FC<ProfilePicProps> = ({ pic, onChange, onSave }) => {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [newPic, setNewPic] = useState<File | null>(null); // holds unconfirmed file
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null); // to reset input

	const allowedTypes = ["image/jpeg", "image/png"];
	const maxSizeMB = 2;

	// update preview URL for either existing pic or newPic
	useEffect(() => {
		let url: string | null = null;

		if (newPic) {
			url = URL.createObjectURL(newPic);
		} else if (pic) {
			url = URL.createObjectURL(pic);
		}

		setPreviewUrl(url); // will this break if url === null...?

		return () => {
			if (url) URL.revokeObjectURL(url); // clean up
		};

	}, [pic, newPic]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const isValidType = allowedTypes.includes(file.type);
		const isValidSize = file.size <= maxSizeMB * 1024 * 1024;

		if (!isValidType) {
			setError("Only JPG and PNG images are allowed.");
			setNewPic(null);
			resetInput();
			return;
		}

		if (!isValidSize) {
			setError("File size must be less than 2MB.");
			setNewPic(null);
			resetInput();
			return;
		}
		setError(null);
		setNewPic(file);
	};

	const resetInput = () => {
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSave = () => {
		if (newPic) {
			onChange(newPic);
			onSave(); // this is undefined and hitting save will make console go red
			setNewPic(null);
			resetInput();
		}
	};

	return (
		<div>
			{previewUrl ? (
				<img
					src={previewUrl}
					alt="Profile pic"
					style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "50%", marginTop: "0.5rem" }}
				/>
			) : (
				<div style={{ width: "80px", height: "80px", backgroundColor: "#eee", borderRadius: "50%", marginTop: "0.5rem" }} />
			)}
			<div>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/png, image/jpeg"
					onChange={handleFileChange}
				/>
				{error && <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}
			</div>

			{newPic && !error && (
				<div style={{ marginTop: "0.5rem" }}>
					<button onClick={handleSave}>Save</button>
				</div>
			)}

		</div>
	);
};

export default EditProfilePic;