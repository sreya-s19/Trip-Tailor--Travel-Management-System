// hotel.js (UPDATED WITH LOADING SPINNER AND IMPROVED DISPLAY)

document.addEventListener("DOMContentLoaded", function () {
  const hotelForm = document.getElementById("hotelForm");

  hotelForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const cityCode = document.getElementById("destination").value.toUpperCase().trim();
    const checkInDate = document.getElementById("checkin").value;
    const checkOutDate = document.getElementById("checkout").value;
    const resultsContainer = document.getElementById('hotel-results-container');

    if (!cityCode || !checkInDate || !checkOutDate) {
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
      // Call the backend API endpoint for searching hotels
      const response = await fetch('/api/search-hotels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityCode, checkInDate, checkOutDate })
      });

      if (!response.ok) {
          throw new Error('Could not find hotels. Please check the city code and dates.');
      }

      const hotelData = await response.json();

      if (!hotelData.data || hotelData.data.length === 0) {
          resultsContainer.innerHTML = '<p>No hotels found for this city on the selected dates.</p>';
          return;
      }
      
      // 2. Build and display the improved results
      let resultsHTML = '<h3>Available Hotels</h3><div class="results-grid">';
      
      hotelData.data.forEach(hotel => {
          const hotelName = hotel.hotel.name;
          const rating = hotel.hotel.rating ? `${hotel.hotel.rating} star rating` : "No rating available";
          
          let price = 250.00; // Default price
          let currency = "USD";
          if (hotel.offers && hotel.offers.length > 0) {
              price = parseFloat(hotel.offers[0].price.total);
              currency = hotel.offers[0].price.currency;
          }

          resultsHTML += `
              <div class="hotel-result-card">
                  <div class="hotel-details">
                      <h4>${hotelName}</h4>
                      <p>${rating}</p>
                  </div>
                  <div class="hotel-footer">
                      <span class="price">$${price.toFixed(2)} / night</span>
                      <button onclick="addToCart('hotel', '${hotelName.replace(/'/g, "\\'")}', '1 Night Stay in ${currency}', ${price})">Add to Cart</button>
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