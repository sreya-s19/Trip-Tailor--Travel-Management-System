// flight.js (UPDATED WITH LOADING SPINNER AND IMPROVED DISPLAY)

document.addEventListener("DOMContentLoaded", function () {
  const flightForm = document.getElementById("flightForm");

  flightForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent default form submission

    const origin = document.getElementById("from").value.toUpperCase().trim();
    const destination = document.getElementById("to").value.toUpperCase().trim();
    
    const rawDateValue = document.getElementById("departure").value;
    const date = new Date(rawDateValue).toISOString().split('T')[0]; 

    const resultsContainer = document.getElementById('flight-results-container');

    if (!origin || !destination || !date) {
      showCustomAlert("Please fill all required fields.", "Incomplete Form");
      return;
    }

    // 1. Show the loading spinner
    resultsContainer.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
        </div>
    `;

    try {
      // Call the backend API endpoint for searching flights
      const response = await fetch('/api/search-flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin, destination, date })
      });

      if (!response.ok) {
          throw new Error('Could not find flights. Please check the airport codes and date.');
      }

      const flightData = await response.json();
      
      if (!flightData.data || flightData.data.length === 0) {
          resultsContainer.innerHTML = '<p>No flights found for this route on the selected date.</p>';
          return;
      }

      // 2. Build and display the improved results
      let resultsHTML = '<h3>Available Flights</h3><div class="results-grid">';
      
      flightData.data.forEach(offer => {
          const price = offer.price.total;
          const currency = offer.price.currency;
          const duration = offer.itineraries[0].duration.replace('PT', '').replace('H', 'h ').replace('M', 'm');
          const segments = offer.itineraries[0].segments;
          const stops = segments.length - 1;
          const carrierCode = segments[0].carrierCode;
          const flightTitle = `${segments[0].departure.iataCode} → ${segments[segments.length - 1].arrival.iataCode}`;
          const flightDescription = `Airline: ${carrierCode} | Duration: ${duration} (${stops} stops)`;
          const numericPrice = parseFloat(price);

          resultsHTML += `
              <div class="flight-result-card">
                  <div class="flight-details">
                      <h4>${flightTitle}</h4>
                      <p>${flightDescription}</p>
                  </div>
                  <div class="flight-footer">
                      <span class="price">$${numericPrice.toFixed(2)}</span>
                      <button onclick="addToCart('flight', '${flightTitle}', '${flightDescription.replace(/'/g, "\\'")}', ${numericPrice})">Add to Cart</button>
                  </div>
              </div>
          `;
      });
      
      resultsHTML += '</div>'; // Close the grid container
      resultsContainer.innerHTML = resultsHTML;

    } catch (error) {
        resultsContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  });
});

// --- Custom Alert Functionality ---
// --- NEW Custom Alert Functionality ---
function showCustomAlert(message, title = "Trip Tailor") {
    const alertModal = document.getElementById('custom-alert-modal');
    const alertTitle = document.getElementById('custom-alert-title');
    const alertMessage = document.getElementById('custom--alert-message'); // Corrected ID
    
    if (alertModal && alertTitle && alertMessage) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        // We now add a class instead of changing the style directly
        alertModal.classList.add('active');
    }
}

function hideCustomAlert() {
    const alertModal = document.getElementById('custom-alert-modal');
    if (alertModal) {
        // We remove the class to hide it
        alertModal.classList.remove('active');
    }
}

// --- UPDATED window.onclick to work with the new system ---
window.onclick = function(event) {
    // This now works for ALL modals that use the .modal class
    if (event.target.classList.contains('modal')) {
        // Hide any modal by removing its 'active' class
        event.target.classList.remove('active');
    }
}