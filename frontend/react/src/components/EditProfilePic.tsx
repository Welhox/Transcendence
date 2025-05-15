import React, { useState, useEffect, useRef } from "react";

interface ProfilePicProps {
	pic: File | null;
	onChange: (file: File | null) => void;
	//onSave: () => void; // optional save handler -> figure out flow for pic saving
}

/*
Component for updating the profile picture in Settings. Displays saved profile pic
by default. If invalid picture is submitted, displays an error and clears up /
won't display the erroneous filename next to Choose file button. Displays a proper
picture file in the circle and changes will be committed only after user clicks Save.
Allows only file types .jpg, .jpeg and .png. Max file size is limited to 2MB.
*/
const EditProfilePic: React.FC<ProfilePicProps> = ({ pic, onChange/*, onSave */}) => {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [newPic, setNewPic] = useState<File | null>(null); // holds unconfirmed file
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
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

		setPreviewUrl(url);

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
			//onSave(); // this is undefined and hitting save will make console go red
			setNewPic(null);
			setSuccess(true);
			resetInput();
			setTimeout(() => setSuccess(false), 2000); // clears after 2s
		}
	};

	return (
		<div className="max-w-sm mx-auto block">
			{previewUrl ? (
				<img className="mx-auto my-3"
					src={previewUrl}
					alt="Profile pic"
					style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "50%", marginTop: "0.5rem" }}
				/>
			) : (
				<div className="mx-auto" style={{ width: "80px", height: "80px", backgroundColor: "#eee", borderRadius: "50%", marginTop: "0.5rem" }} />
			)}
			<div>
				<input className="block w-full m-5 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
					ref={fileInputRef}
					type="file"
					accept="image/png, image/jpeg"
					onChange={handleFileChange}
				/>
				{error && <div className="text-red-700 dark:text-red-600 mt-0.5">{error}</div>}
				{success && <div className="text-green-700 dark:text-green-500 mt-0.5">Picture saved!</div>}
			</div>

			{newPic && !error && (
				<div style={{ marginTop: "0.5rem" }}>
					<button className="px-5 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
								  dark:focus:ring-teal-800" onClick={handleSave}>Save</button>
				</div>
			)}

		</div>
	);
};

export default EditProfilePic;