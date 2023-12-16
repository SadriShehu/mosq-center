// Intercept the form submission event
document.getElementById("payment-form").addEventListener("submit", function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Create the payload as a JavaScript object
    const payload = {
        family_id: document.getElementById("family_id").value,
        amount: parseFloat(document.getElementById("amount").value),
        year: parseInt(document.getElementById("year").value, 10),
        range_year: parseInt(document.getElementById("range_year").value, 10),
    };

    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/payments");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    // Convert the payload object to a JSON string and send it in the request body
    xhr.send(JSON.stringify(payload));

    // Set up a callback function to handle the response
    xhr.onload = function () {
        if (xhr.status === 201) {
            // Request was successful, handle the response here
            console.log("Request was successful");
            console.log(xhr.responseText);
            location.reload();
        } else {
            // Request had an error, handle the error here
            console.error("Request failed with status code: " + xhr.status);
        }
    };
});

function updateModal(id, family_id, amount, year) {
    document.getElementById('m_id').value = id;
    document.getElementById('m_family_id').value = family_id;
    document.getElementById('m_amount').value = amount;
    document.getElementById('m_year').value = year;
}

// Intercept the form submission event
document.getElementById("update-form").addEventListener("submit", function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Create the payload as a JavaScript object
    const payload = {
        family_id: document.getElementById("m_family_id").value,
        amount: parseFloat(document.getElementById("m_amount").value),
        year: parseInt(document.getElementById("m_year").value, 10),
    };

    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/v1/payments/" + document.getElementById("m_id").value);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    // Convert the payload object to a JSON string and send it in the request body
    xhr.send(JSON.stringify(payload));

    // Set up a callback function to handle the response
    xhr.onload = function () {
        if (xhr.status === 200) {
            // Request was successful, handle the response here
            console.log("Request was successful");
            console.log(xhr.responseText);
            location.reload();
        } else {
            // Request had an error, handle the error here
            console.error("Request failed with status code: " + xhr.status);
        }
    };
});

function deletePayment(id) {
    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", "/api/v1/payments/" + id);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    // Convert the payload object to a JSON string and send it in the request body
    xhr.send();

    // Set up a callback function to handle the response
    xhr.onload = function () {
        if (xhr.status === 200) {
            // Request was successful, handle the response here
            console.log("Request was successful");
            console.log(xhr.responseText);
            location.reload();
        } else {
            // Request had an error, handle the error here
            console.error("Request failed with status code: " + xhr.status);
        }
    };
}

const AMOUNT_PER_MEMBER = 3;
const familySelect = document.getElementById('family_id');
const amountInput = document.getElementById('amount');

familySelect.addEventListener('change', () => {
    const selectedOption = familySelect.options[familySelect.selectedIndex];
    const members = selectedOption.getAttribute('data-members');
    const amount = members * AMOUNT_PER_MEMBER;
    amountInput.value = amount;
});

const checkbox = document.getElementById('new-year');
const yearInput = document.getElementById('range_year');

checkbox.addEventListener('change', function() {
    if (this.checked) {
        yearInput.removeAttribute('hidden');
        yearInput.removeAttribute('disabled');
    } else {
        yearInput.setAttribute('hidden', true);
        yearInput.setAttribute('disabled', true);
    }
});

const searchByYearRadio = document.getElementById('searchByYear');
const searchByFamilyRadio = document.getElementById('searchByFamily');
const searchYearInput = document.getElementById('s_year');
const searchFamilyInput = document.getElementById('s_family_id');

searchByYearRadio.addEventListener('change', () => {
    searchYearInput.style.display = 'inline-block';
    searchFamilyInput.style.display = 'none';
    searchYearInput.disabled = false;
    searchFamilyInput.disabled = true;
});

searchByFamilyRadio.addEventListener('change', () => {
    searchYearInput.style.display = 'none';
    searchFamilyInput.style.display = 'inline-block';
    searchYearInput.disabled = true;
    searchFamilyInput.disabled = false;
});
