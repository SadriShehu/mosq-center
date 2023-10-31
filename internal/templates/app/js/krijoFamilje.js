// Intercept the form submission event
document.getElementById("family-form").addEventListener("submit", function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Create the payload as a JavaScript object
    const payload = {
        name: document.getElementsByName("name")[0].value,
        middle_name: document.getElementsByName("middle_name")[0].value,
        surname: document.getElementsByName("surname")[0].value,
        members: parseInt(document.getElementsByName("members")[0].value, 10),
        neighbourhood_id: document.getElementsByName("neighbourhood_id")[0].value,
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