// Intercept the form submission event
document.getElementById("payment-form").addEventListener("submit", function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Create the payload as a JavaScript object
    const payload = {
        family_id: document.getElementById("family_id").value,
        amount: parseFloat(document.getElementById("amount").value),
        year: parseInt(document.getElementById("year").value, 10),
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
