// Intercept the form submission event
document.getElementById("neighbourhood-form").addEventListener("submit", function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Create the payload as a JavaScript object
    const payload = {
        name: document.getElementById("name").value,
        region: document.getElementById("region").value,
        city: document.getElementById("city").value,
        country: document.getElementById("country").value,
        postal_code: document.getElementById("postal_code").value
    };

    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/neighbourhoods");
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

function updateModal(id, name, city, region, country, postalCode) {
    document.getElementById('m_id').value = id;
    document.getElementById('m_name').value = name;
    document.getElementById('m_region').value = region;
    document.getElementById('m_city').value = city;
    document.getElementById('m_country').value = country;
    document.getElementById('m_postal_code').value = postalCode;
}

// Intercept the form submission event
document.getElementById("update-form").addEventListener("submit", function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Create the payload as a JavaScript object
    const payload = {
        name: document.getElementById("m_name").value,
        region: document.getElementById("m_region").value,
        city: document.getElementById("m_city").value,
        country: document.getElementById("m_country").value,
        postal_code: document.getElementById("m_postal_code").value
    };

    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/v1/neighbourhoods/" + document.getElementById("m_id").value);
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

function deleteNeighbourhood(id) {
    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", "/api/v1/neighbourhoods/" + id);
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

const cities = {
    "Junik": ["Junik", "Jasiq", "Gjocaj"],
    "Gjakove": ["Gjakove", "Batushe", "Dobrosh", "Molliq", "Rracaj"]
}

function updatePostalCodeAndCity() {
    var regionSelect = document.getElementById("region");
    var postalCodeInput = document.getElementById("postal_code");
    var selectedOption = regionSelect.options[regionSelect.selectedIndex];
    var zip = selectedOption.getAttribute("data-zip");
    postalCodeInput.value = zip;

    var region = selectedOption.getAttribute("data-region");
    var citySelect = document.getElementById("city");
    var citiesList = cities[region];
    citySelect.innerHTML = "";

    var staticOption = document.createElement("option");
    staticOption.text = "Zgjidh Fshatin";
    staticOption.value = "";
    staticOption.disabled = true;
    staticOption.selected = true;
    citySelect.add(staticOption);

    for (var i = 0; i < citiesList.length; i++) {
        var option = document.createElement("option");
        option.text = citiesList[i];
        option.value = citiesList[i];
        citySelect.add(option);
    }
}
