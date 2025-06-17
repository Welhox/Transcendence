const apiUrl = import.meta.env.VITE_API_BASE_URL || "api";

const showDatabase = async () => {
  const res = await fetch(apiUrl + "/users/allInfo");
  const data = await res.json();
  console.log(data);
};

export default showDatabase;
