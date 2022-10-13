/*
    In this file you'll find manipulation of markers

    Markers were all set with folium, which uses leaflet.js
    -- More info at: http://python-visualization.github.io/folium/
*/





/* 
    STATES
*/
// Last marker selected
var lastMarkerSelected;
var isFirstSelected = true;
var from, to;
var blinking;
////

/*
    MARKERS
*/
// All markers
var markers = document.querySelectorAll(".awesome-marker-icon-gray.awesome-marker.leaflet-zoom-animated.leaflet-interactive");
// All selected markers
var selected_markers = document.getElementsByClassName("awesome-marker-icon-red awesome-marker leaflet-zoom-animated leaflet-interactive");
////





/*
    FUNCTIONS
*/

// Start blinking animation
function blink(element) {
    $(element).fadeOut(200);
    $(element).fadeIn(200);
    blinking = setInterval(function() {
        $(element).fadeOut(200);
        $(element).fadeIn(200);
    }
    ,500);
}

// Toggle delete button
function ToggleDelButton(airport_name) {
    var del_button = document.getElementById(`del_${airport_name}`);

    var isAdded = lastMarkerSelected.getAttribute('isadded');
    if (isAdded == 'true') {
        del_button.style.display = 'block';
    } else {
        del_button.style.display = 'none';
    }
}

// Add an airport to the graph
function AddAirport(airport_name, airport_lat, airport_lon) {
    // Set an ID to the selected marker
    lastMarkerSelected.setAttribute('id', `airport_${airport_name}`);

    // If the markers is added, add isAdded flag
    lastMarkerSelected.setAttribute('isadded', true);

    // Color the airport and add to the selected markers
    lastMarkerSelected.classList.remove("awesome-marker-icon-gray");
    lastMarkerSelected.classList.add("awesome-marker-icon-red");

    // Try to add an edge to the graph is two markers are selected
    AddEdge(airport_lat, airport_lon);

    // Toggle delete button
    ToggleDelButton(airport_name);

}

// Remove an airpot from the graph
function DelAirport(airport_name, airport_lat, airport_lon) {

    // Clear state if the marker selected WAS first selected
    if (isFirstSelected == false) {
        isFirstSelected = true;
        // Stop indication
        clearInterval(blinking);
    }

    // If the markers is removed, remove isAdded flag
    lastMarkerSelected.setAttribute('isadded', false);

    // Remove the button
    ToggleDelButton(airport_name);

    // Color the airport and remove from the selected markers
    lastMarkerSelected.classList.add("awesome-marker-icon-gray");
    lastMarkerSelected.classList.remove("awesome-marker-icon-red");

    // Delete associated edges of a marker on deletion.
    DelAssoEdges(airport_lat, airport_lon);

    //

    xhr.open("POST", "/api/v1", true);
        xhr.setRequestHeader("Content-Type", "application/json")
        xhr.send(JSON.stringify({"lat": airport_lat, "lon": airport_lon, "method": "remove_vertex"}))
        xhr.onreadystatechange = function () {

            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                ShowAlert('Aeropuerto eliminado','info',2000);
            }
        }

}
////





/*
    ON-LOAD SCRIPT
*/
// Get the HTML element clicked

window.onclick = e => {
    // If clicked on a marker (with a DIV tag)
    if (e.target.tagName == 'DIV') {
        for (let i = 0; i < markers.length; i++) {
            if (e.target == markers[i]) {
                lastMarkerSelected = e.target;
            }
        }
    }

    // If clicked on a marker icon (with a I tag)
    if (e.target.tagName == 'I') {
        for (let i = 0; i < markers.length; i++) {
            if (e.target.parentElement == markers[i]) {
                lastMarkerSelected = e.target.parentElement;
            }
        }
    }
}


////
