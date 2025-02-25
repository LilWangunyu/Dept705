// Import Firebase modules from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Replace these placeholders with your actual Firebase project configuration values.
const firebaseConfig = {
  apiKey: "AIzaSyC11Fdf67z47Ox64_RqQ1vwgwdQRZf2dvI",
  authDomain: "dept705.firebaseapp.com",
  projectId: "dept705",
  storageBucket: "dept705.firebasestorage.app",
  messagingSenderId: "333873965527",
  appId: "1:333873965527:web:0efce8b2c56bf682cdc392"
};

// Initialize Firebase and Firestore.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const logsCollection = collection(db, "breakdownLogs");

// Utility: Generate time options (30-minute increments, 24-hour format)
function generateTimeOptions(selectElement) {
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const hh = hour.toString().padStart(2, '0');
      const mm = min.toString().padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      const option = document.createElement('option');
      option.value = timeStr;
      option.textContent = timeStr;
      selectElement.appendChild(option);
    }
  }
}

// Utility: Convert a time string "HH:MM" to minutes since midnight.
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Utility: Format minutes (number) back into a "HH:MM" string.
function formatMinutes(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// Utility: Compute Mean Time To Repair (MTTR) from start and end times.
function computeMTTR(start, end) {
  let startMins = timeToMinutes(start);
  let endMins = timeToMinutes(end);
  if (endMins < startMins) {
    // Account for overnight spans.
    endMins += 24 * 60;
  }
  return formatMinutes(endMins - startMins);
}

// ---------------------------------------------------------------------------
// Check which page is loaded by looking for a unique element in each page.
// ---------------------------------------------------------------------------

// If the element with id "breakdownForm" exists, we're on index.html.
if (document.getElementById("breakdownForm")) {
  // ----------------------------
  // Code for index.html Page
  // ----------------------------

  // Generate time options for the start and end time dropdowns.
  generateTimeOptions(document.getElementById('startTime'));
  generateTimeOptions(document.getElementById('endTime'));

  // Function to render breakdown logs in the table with real-time updates.
  function renderLogs() {
    const searchQuery = document.getElementById('searchBar').value.toLowerCase();
    const factoryFilter = document.getElementById('factoryFilter').value;
    const tbody = document.querySelector('#logTable tbody');

    const q = query(logsCollection, orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
      tbody.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const log = docSnap.data();
        log.id = docSnap.id;
        const logString = `${log.date} ${log.technician} ${log.machine} ${log.factory} ${log.startTime} ${log.endTime} ${log.reason}`.toLowerCase();
        if (logString.indexOf(searchQuery) === -1) return;
        if (factoryFilter && log.factory !== factoryFilter) return;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${log.date}</td>
          <td>${log.technician}</td>
          <td>${log.machine}</td>
          <td>${log.factory}</td>
          <td>${log.startTime}</td>
          <td>${log.endTime}</td>
          <td>${log.reason}</td>
          <td><button class="delete-btn" data-id="${log.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
    });
  }
  renderLogs();

  // Breakdown entry form submission.
  document.getElementById('breakdownForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('date').value.trim();
    const technician = document.getElementById('technician').value.trim();
    const machine = document.getElementById('machine').value.trim();
    const factory = document.getElementById('factory').value.trim();
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const reason = document.getElementById('reason').value.trim();

    // Require at least 4 fields filled.
    const filledCount = [date, technician, machine, factory, startTime, endTime, reason].filter(val => val !== "").length;
    if (filledCount < 4) {
      alert("Please fill in at least 4 fields to submit a breakdown entry.");
      return;
    }

    try {
      await addDoc(logsCollection, {
        date,
        technician,
        machine,
        factory,
        startTime,
        endTime,
        reason,
        timestamp: Date.now()
      });
      document.getElementById("breakdownForm").reset();
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  });

  // Handle deletion of a breakdown entry.
  document.querySelector("#logTable tbody").addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.getAttribute("data-id");
      try {
        await deleteDoc(doc(db, "breakdownLogs", id));
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  });

  // Update the log table when search text or factory filter changes.
  document.getElementById("searchBar").addEventListener("input", renderLogs);
  document.getElementById("factoryFilter").addEventListener("change", renderLogs);

  // Login for Machine Stoppage Access (using a hard-coded password).
  const correctPassword = "admin705";
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const enteredPassword = document.getElementById("password").value;
    if (enteredPassword === correctPassword) {
      localStorage.setItem("machineStoppageLoggedIn", "true");
      window.location.href = "machine-stoppage.html";
    } else {
      document.getElementById("loginMessage").textContent = "Incorrect password. Please try again.";
    }
  });

  // -------------------------------------------------------------------------
} else if (document.getElementById("logoutBtn")) {
  // ----------------------------
  // Code for machine-stoppage.html Page
  // ----------------------------

  // Redirect to index.html if not logged in.
  if (localStorage.getItem("machineStoppageLoggedIn") !== "true") {
    window.location.href = "index.html";
  }

  // Function to render the machine stoppage tables per shift.
  function renderStoppage() {
    const shift1Body = document.getElementById("shift1Body");
    const shift2Body = document.getElementById("shift2Body");
    const shift3Body = document.getElementById("shift3Body");

    const q = query(logsCollection, orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
      // Clear table bodies on each update.
      shift1Body.innerHTML = "";
      shift2Body.innerHTML = "";
      shift3Body.innerHTML = "";

      snapshot.forEach((docSnap) => {
        const log = docSnap.data();
        // Determine which shift based on the breakdown's start time.
        const startMins = timeToMinutes(log.startTime);
        let shift;
        // 1st Shift: 07:30 (450 minutes) to 15:30 (930 minutes)
        if (startMins >= 450 && startMins < 930) {
          shift = 1;
        }
        // 2nd Shift: 15:30 (930 minutes) to 23:30 (1410 minutes)
        else if (startMins >= 930 && startMins < 1410) {
          shift = 2;
        }
        // 3rd Shift: Otherwise (overnight)
        else {
          shift = 3;
        }
        const mttr = computeMTTR(log.startTime, log.endTime);
        const row = `<tr>
                      <td>${log.startTime}</td>
                      <td>${log.endTime}</td>
                      <td>${log.technician}</td>
                      <td>${log.reason}</td>
                      <td>${mttr}</td>
                    </tr>`;
        if (shift === 1) {
          shift1Body.innerHTML += row;
        } else if (shift === 2) {
          shift2Body.innerHTML += row;
        } else if (shift === 3) {
          shift3Body.innerHTML += row;
        }
      });
    });
  }
  renderStoppage();

  // Logout: Clear login flag and redirect to index.html.
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("machineStoppageLoggedIn");
    window.location.href = "index.html";
  });
}
