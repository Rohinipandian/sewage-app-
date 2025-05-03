document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("query-form");
    const photoInput = document.getElementById("issue-photo");
  
    const db = firebase.firestore();
    const storage = firebase.storage();
  
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
  
      const type = document.getElementById("issue-type").value;
      const description = document.getElementById("issue-description").value;
      const location = document.getElementById("issue-location").value;
      const photoFile = photoInput.files[0];
  
      try {
        let photoURL = null;
  
        if (photoFile) {
          const photoRef = storage.ref().child(`issue_photos/${Date.now()}_${photoFile.name}`);
          await photoRef.put(photoFile);
          photoURL = await photoRef.getDownloadURL();
        }
  
        const report = {
          type,
          description,
          location,
          photoURL: photoURL || null,
          submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
  
        await db.collection("reports").add(report);
  
        alert("Issue submitted successfully!");
        form.reset();
      } catch (error) {
        console.error("Error submitting report:", error);
        alert("Failed to submit the issue. Try again.");
      }
    });
  
    document.getElementById("get-location").addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = pos.coords;
          document.getElementById("issue-location").value =
            `Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`;
        },
        () => alert("Failed to fetch location")
      );
    });
  });
  