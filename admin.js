// admin.js - Firebase Firestore admin page script

// Import and configure Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Firebase configuration (provided)
const firebaseConfig = {
  apiKey: "AIzaSyAakB9v-OrKoJt9hS7TzjKZ7znDNkBmahA",
  authDomain: "sewage-app-93e97.firebaseapp.com",
  projectId: "sewage-app-93e97",
  storageBucket: "sewage-app-93e97.firebasestorage.app",
  messagingSenderId: "1063262132715",
  appId: "1:1063262132715:web:811b2d281596eef843e1ae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to fetch reports and populate the table
async function loadReports() {
  try {
    // Reference to the 'reports' collection
    const reportsRef = collection(db, 'reports');
    const querySnapshot = await getDocs(reportsRef);

    // Get table body element
    const tableBody = document.getElementById('reports-table-body');
    if (!tableBody) {
      console.error("Table body element not found");
      return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Handle no reports
    if (querySnapshot.empty) {
      const row = document.createElement('tr');
      const noDataCell = document.createElement('td');
      noDataCell.colSpan = 5;
      noDataCell.textContent = 'No reports found';
      noDataCell.style.textAlign = 'center';
      row.appendChild(noDataCell);
      tableBody.appendChild(row);
      return;
    }

    // Iterate through each report document
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Create a new table row
      const row = document.createElement('tr');

      // Type cell
      const typeCell = document.createElement('td');
      typeCell.textContent = data.type || '';
      row.appendChild(typeCell);

      // Description cell
      const descCell = document.createElement('td');
      descCell.textContent = data.description || '';
      row.appendChild(descCell);

      // Location cell
      const locCell = document.createElement('td');
      locCell.textContent = data.location || '';
      row.appendChild(locCell);

      // Photo cell (if photoURL exists)
      const photoCell = document.createElement('td');
      if (data.photoURL) {
        const img = document.createElement('img');
        img.src = data.photoURL;
        img.alt = 'Report Photo';
        img.style.maxWidth = '100px';
        img.style.height = 'auto';
        photoCell.appendChild(img);
      } else {
        photoCell.textContent = 'No Image';
      }
      row.appendChild(photoCell);

      // SubmittedAt (timestamp) cell
      const dateCell = document.createElement('td');
      if (data.submittedAt) {
        // Convert Firestore timestamp to readable date
        try {
          const date = data.submittedAt.toDate();
          dateCell.textContent = date.toLocaleString();
        } catch (e) {
          dateCell.textContent = data.submittedAt;
        }
      } else {
        dateCell.textContent = '';
      }
      row.appendChild(dateCell);

      // Append the row to the table body
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching reports: ", error);
  }
}

// Load reports on page load
window.addEventListener('DOMContentLoaded', loadReports);
