// frontend/src/api/api.js

const API_URL = "http://localhost:5000";  // backend URL

// -------------------- GET --------------------
export async function apiGet(path) {
  try {
    const res = await fetch(`http://localhost:5000${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    return await res.json();
  } catch (err) {
    console.error("API GET error:", err);
    return null;
  }
}
export async function apiPut(url, body) {
const res = await fetch(`${API_URL}${url}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("API PUT error");
  return res.json();
}

export async function apiPost(path, body) {
  try {
    const res = await fetch(`http://localhost:5000${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return await res.json();
  } catch (err) {
    console.error("API POST error:", err);
    return null;
  }
}

