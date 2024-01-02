function getYearFromQueryParam() {
    // Get the URL query string
    var queryString = window.location.search;

    // Use a regular expression to match the 'year' query parameter
    var yearMatch = /[\?&]year=(\d{4})/.exec(queryString);

    // If the 'year' parameter is found, return its value
    if (yearMatch) {
        return yearMatch[1];
    } else {
        // If no 'year' parameter is found, get the current year
        var currentDate = new Date();
        return currentDate.getFullYear().toString();
    }
}

function getNeighbourhoodFromQueryParam() {
    // Get the URL query string
    var queryString = window.location.search;

    // Use a regular expression to match the 's_neighbourhood_id' query parameter
    var neighbourhoodIdMatch = /[\?&]s_neighbourhood_id=([^&]*)/.exec(queryString);

    // If the 'neighbourhoodId' parameter is found, return its value
    if (neighbourhoodIdMatch) {
        return neighbourhoodIdMatch[1];
    } else {
        // If no 'neighbourhoodId' parameter is found, return an empty string
        return "";
    }
}

var currentYear = getYearFromQueryParam();
document.getElementById('yearSpan').textContent = currentYear;

var currentNeighbourhood = getNeighbourhoodFromQueryParam();

function createPaymentModal(id, members, year) {
    const AMOUNT_PER_MEMBER = 3;
    document.getElementById('m_family_id').value = id;
    document.getElementById('m_amount').value = members * AMOUNT_PER_MEMBER;
    document.getElementById('m_year').value = year;
}

function createPaymentCall() {
    const payload = {
        family_id: document.getElementById("m_family_id").value,
        amount: parseFloat(document.getElementById("m_amount").value),
        year: parseInt(document.getElementById("m_year").value, 10),
    };

    // Send an AJAX request to the server with the payload in the request body
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/payments/");
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
}

function exportToPDF(year, neighborhood) {
    // do a request to the server to get the PDF
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/v1/invoices?year=" + year + "&s_neighbourhood_id=" + neighborhood);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.responseType = 'blob';

    // Set up a callback function to handle the response
    xhr.send();

    xhr.onload = function () {
        if (xhr.status === 200) {
            // Request was successful, handle the response here
            console.log("Request was successful");
            console.log(xhr.response);
            const blob = new Blob([xhr.response], {type: 'application/pdf'});
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'invoice-' + year + '.pdf';
            link.click();
        } else if (xhr.status === 404) {
            // Request was successful, handle the response here
            console.log("Request was successful");
            console.log(xhr.response);
            alert('No payments found for year ' + year);
        } else {
            // Request had an error, handle the error here
            console.error("Request failed with status code: " + xhr.status);
        }
    };
}
