import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface ProfilePicProps {
  pic: File | string | null;
  onChange: (file: File | null) => void;
  onSave?: (file: File | null) => void;
}

function validateImageMagicBytes(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 4);
      const header = Array.from(arr)
        .map((byte) => byte.toString(16))
        .join("");

      // JPEG: ff d8 ff e0 || ff d8 ff e1
      if (header.startsWith("ffd8ffe0") || header.startsWith("ffd8ffe1"))
        return resolve(true);

      // PNG: 89 50 4e 47
      if (header === "89504e47") return resolve(true);

      return resolve(false);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

/*
Component for updating the profile picture in Settings. Displays saved profile pic
by default. If invalid picture is submitted, displays an error and clears up /
won't display the erroneous filename next to Choose file button. Displays a proper
picture file in the circle and changes will be committed only after user clicks Save.
Allows only file types .jpg, .jpeg and .png. Max file size is limited to 2MB.
*/
const EditProfilePic: React.FC<ProfilePicProps> = ({
  pic,
  onChange,
  onSave,
}) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newPic, setNewPic] = useState<File | null>(null); // holds unconfirmed file
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // to reset input
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null); // for screen reader aria announcements

  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSizeMB = 2;

  // This is a workaround for an issue with voiceover moving focus to the wrong place
  // (to the entire website window) after exiting a native file upload dialog.
  useEffect(() => {
    if (error || success) {
      setLiveMessage(null); // force remount
      setTimeout(() => {
        setLiveMessage(error || (success ? t("editProfilePic.saved") : ""));
        // Give React time to render it
        setTimeout(() => {
          liveRegionRef.current?.focus();
        }, 10);
      }, 100); // wait for file input focus shift to complete
    }
  }, [error, success, t]);

  // update preview URL for either existing pic or newPic
  useEffect(() => {
    let url: string | null = null;

    if (newPic) {
      url = URL.createObjectURL(newPic);
    } else if (pic instanceof File) {
      url = URL.createObjectURL(pic);
    } else if (typeof pic === "string") {
      url = pic;
    }

    setPreviewUrl(url);

    return () => {
      if (newPic || pic instanceof File) {
        URL.revokeObjectURL(url!);
      }
    };
  }, [pic, newPic]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = allowedTypes.includes(file.type);
    const isValidSize = file.size <= maxSizeMB * 1024 * 1024;
    const isValidContent = await validateImageMagicBytes(file);

    if (!isValidType) {
      setError(t("editProfilePic.onlyImages"));
      setNewPic(null);
      resetInput();
      return;
    }

    if (!isValidSize) {
      setError(t("editProfilePic.fileTooLarge"));
      setNewPic(null);
      resetInput();
      return;
    }

    if (!isValidContent) {
      setError(t("editProfilePic.notValidImage"));
      setNewPic(null);
      resetInput();
      return;
    }

    setError(null);
    setNewPic(file);
    console.log(file);
  };

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!newPic) return;

    try {
      onChange(newPic); // updates parent state
      await onSave?.(newPic); // triggers the actual upload
      setNewPic(null);
      setSuccess(true);
      resetInput();
      setTimeout(() => setSuccess(false), 2000); // clears after 2s
    } catch (error) {
      console.error("Failed to save profile picture:", error);
      setError("Upload failed. Please try again.");
    }
  };

  return (
    <div className="max-w-sm flex flex-col justify-center items-center mx-auto">
      {previewUrl ? (
        <img
          className="mx-auto my-3"
          src={previewUrl}
          alt="Profile pic"
          style={{
            width: "80px",
            height: "80px",
            objectFit: "cover",
            borderRadius: "50%",
            marginTop: "0.5rem",
          }}
        />
      ) : (
        <div
          className="mx-auto"
          style={{
            width: "80px",
            height: "80px",
            backgroundColor: "#eee",
            borderRadius: "50%",
            marginTop: "0.5rem",
          }}
        />
      )}
      <div>
        <input
          className="flex flex-col m-5 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
        />
        {error && (
          <span className="text-red-700 dark:text-red-600 mt-0.5">{error}</span>
        )}
        {success && (
          <span className="text-green-700 dark:text-green-500 mt-0.5">
            {t("editProfilePic.saved")}
          </span>
        )}
      </div>
      {/* This next part is a secret div, visible only to screen readers, which ensures that the error
	  or success messages get announced using aria. */}
      {liveMessage && (
        <div
          ref={liveRegionRef}
          tabIndex={-1}
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        >
          {liveMessage}
        </div>
      )}

      {newPic && !error && (
        <div style={{ marginTop: "0.5rem" }}>
          <button
            className="px-5 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
								  dark:focus:ring-teal-800"
            onClick={handleSave}
          >
            {t("editProfilePic.save")}
          </button>
        </div>
      )}
    </div>
  );
};

export default EditProfilePic;
