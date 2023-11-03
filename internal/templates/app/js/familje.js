// Intercept the form submission event
document.getElementById("family-form").addEventListener("submit", function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Create the payload as a JavaScript object
    const payload = {
        name: document.getElementById("name").value,
        middle_name: document.getElementById("middle_name").value,
        surname: document.getElementById("surname").value,
        members: parseInt(document.getElementById("members").value, 10),
        neighbourhood_id: document.getElementById("neighbourhood_id").value,
    };

    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/families");
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

function updateModal(id, name, middlename, surname, members, neighbourhood) {
    document.getElementById('m_id').value = id;
    document.getElementById('m_name').value = name;
    document.getElementById('m_middlename').value = middlename;
    document.getElementById('m_surname').value = surname;
    document.getElementById('m_members').value = members;
    document.getElementById('m_neighbourhood_id').value = neighbourhood;
}

// Intercept the form submission event
document.getElementById("update-form").addEventListener("submit", function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Create the payload as a JavaScript object
    const payload = {
        name: document.getElementById("m_name").value,
        middle_name: document.getElementById("m_middlename").value,
        surname: document.getElementById("m_surname").value,
        members: parseInt(document.getElementById("m_members").value, 10),
        neighbourhood_id: document.getElementById("m_neighbourhood_id").value,
    };

    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/v1/families/" + document.getElementById("m_id").value);
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

function deleteFamily(id) {
    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", "/api/v1/families/" + id);
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
