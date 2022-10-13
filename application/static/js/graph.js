/*
    In this file you'll find the creation of the graph (only to draw with JS).

    Reference(s):
    -- Arrows on leaflet.js: https://github.com/slutske22/leaflet-arrowheads
    -- Text path on leaflet.js: https://github.com/makinacorpus/Leaflet.TextPath
*/



/* 
    Requests
*/
var xhr = new XMLHttpRequest();
////




/* 
    MAP
*/
const map = map_44e742c23e81cd705d2fc47524212eb2;
////

/*
    GRAPH
*/
var graph = [];

/*
    The graph consists on this structure:
    * main brackets for the graph itself:
    []
    * inner brackets representing a line:
    [[line_1], [line_2], [line_3], ...]
    * inner brackets for each line, represented with xy points:
    [[[x,y],[x,y]], [[x,y],[x,y]], [[x,y],[x,y]], ...]
*/
////

/*
    DISTANCES
*/
var distances = [];
////




/*
    FUNCTIONS
*/
// Draw graph
function DrawGraph() {
    // Delete previous graph
    ClearGraph();

    // For each pair of nodes,
    for (let i = 0; i < graph.length; i++) {
        let new_line;

        // Draw a line between them
        new_line = L.polyline(graph[i], {color: 'red'});

        // Add a direction
        new_line.arrowheads({size: '5px', fill: true,  frequency: 3});

        // Add weight to the line
        new_line.setText(`${parseInt(distances[i])} km`, {repeat: false, center: true, offset: -5, attributes: {fill: 'gray', 'font-size': '14px'}});
        
        // Add del function to the edge
        new_line.on("dblclick", (e) => {
            DelEdge(e.target.getLatLngs());
        });
        
        // Add it to the map
        new_line.addTo(map);
    }
}

// Add edge
function AddEdge(airport_lat, airport_lon) {

    // Check the order of selection of the airport and draw the graph on the map
    if (isFirstSelected) {
        // From which airport
        from = [airport_lat, airport_lon];
        isFirstSelected = false;

        // Indicate state of selection
        let iconOnWait = lastMarkerSelected.children[0];
        blink(iconOnWait);

    } else {
        // To another airport
        to = [airport_lat, airport_lon];

        // Check if it is the same airport (from == to)
        if (from[0] == to[0] && from[1] == to[1]) {
            ShowAlert('Selecciona un aeropuerto distinto.', 'error', 2000);
            return;
        }

        // Check is that edge already exists
        let edge_to_check = [from, to]
        var i = 0;
        while (i < graph.length) {
            if (JSON.stringify(graph[i]) == JSON.stringify(edge_to_check)) {
                ShowAlert('Ese vuelo ya existe.', 'error', 2000)
                return;
            }
            i++;
        }

        // XHRequest (Create nodes and establish connection)
        xhr.open("POST", "/api/v1", true);
        xhr.setRequestHeader("Content-Type", "application/json")
        xhr.send(JSON.stringify({"from": from, "to": to, "method": "add"}))
        xhr.onreadystatechange = function () {

            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

                //Server response
                var response = JSON.parse(xhr.responseText);

                // CASES:
                // If there's no route
                if (response == "null") {
                    ShowAlert('No hay vuelo.','error',2000);
                    isFirstSelected = true;
                    clearInterval(blinking);
                    return;
                }
                // If there's a direct connection (response = distance)
                if (typeof response == "number") {
                    isFirstSelected = true;

                    // Stop indication
                    clearInterval(blinking);

                    // Push new changes to the graph
                    graph.push([from, to]);
                    distances.push(response);

                    // Draw the graph
                    DrawGraph();
                    // Movement anim. for new created line
                    MoveAirplane([from, to], 1000);

                    return;
                }
                // If there's NO direct connection (response = route + distances)
                if (typeof response == "object") {
                    ShowAlert("No hay vuelo directo. Recalculando ruta más corta...",'warning',4000);
                    isFirstSelected = true;

                    // Stop indication
                    clearInterval(blinking);

                    for(let i = 0; i < response["vertices"].length; i++) {
                        if (typeof response["vertices"][i+1] != "undefined") {
                            // Create edges for recalculated route
                            let new_line = [response["vertices"][i], response["vertices"][i+1]];
                            let new_distance = response["distances"][i];

                            // Verify if the edge already exists
                            let edge_exists = false;
                            let n = 0;
                            while (n < graph.length) {
                                if (JSON.stringify(graph[n]) == JSON.stringify(new_line)) {
                                    edge_exists = true;
                                }
                                n++;
                            }

                            if (!edge_exists) {
                                // Push changes
                                graph.push(new_line);
                                distances.push(new_distance);
                            }
                            
                        }

                        // Add each new vertex to selected markers on the map
                        map.eachLayer(function (layer) {
                            try {
                                if (response["vertices"][i][0] == layer._latlng.lat && response["vertices"][i][1] == layer._latlng.lng) {
                                    // Each marker on the new route
                                    let marker_on_route = layer._icon;

                                    // Check those markers that aren't on the selected markers group
                                    if (marker_on_route.getAttribute('isadded') != 'true') {
                                        // Add them and set a bunch of properties... lmao

                                        // Get airport name on that coordinate
                                        let airport_on_route = response["nombres_con_tildes"][i];

                                        // Set an ID to the selected marker
                                        marker_on_route.setAttribute('id', `airport_${airport_on_route}`);

                                        // If the markers is added, add isAdded flag
                                        marker_on_route.setAttribute('isadded', true);

                                        // Color the airport and add to the selected markers
                                        marker_on_route.classList.remove("awesome-marker-icon-gray");
                                        marker_on_route.classList.add("awesome-marker-icon-red");

                                        // Toggle delete button
                                        // The way leaflet works with graphs is horrible...
                                        // The following block adds a function that waits to be executed once the user clicks
                                        // on the awaited airport.
                                        marker_on_route.addEventListener("click", function() {
                                            let delay = setInterval(() => {
                                                ToggleDelButton(airport_on_route);
                                                clearInterval(delay);
                                            }, 100);
                                        }, {once : true});
                                        
                                    }
                                }
                               
                            }
                            catch(e) {}
                        });
                    }

                    // Draw the graph
                    DrawGraph();
                    // Movement anim. for new created line
                    MoveAirplane(response["vertices"], response["vertices"].length * 500);

                    return;
                    
                }

                
            }
        }

        

        
    }
}

// Delete edge
function DelEdge(coords) {
    let from = [coords[0].lat, coords[0].lng];
    let to = [coords[1].lat, coords[1].lng];

    let edge_to_del = [from, to];

    // Loop
    var i = 0;
    while (i < graph.length) {
        if (JSON.stringify(graph[i]) == JSON.stringify(edge_to_del)) {
            graph.splice(i, 1);
            distances.splice(i,1);
            i--; // Index corrector when splicing
        }
        i++;
    }

    // Draw the graph
    DrawGraph();

    //
    xhr.open("POST", "/api/v1", true);
        xhr.setRequestHeader("Content-Type", "application/json")
        xhr.send(JSON.stringify({"from": from, "to": to, "method": "remove_edge"}))
        xhr.onreadystatechange = function () {

            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                ShowAlert('Vuelo eliminado.', 'warning', 2000);
            }
        }
}

// Delete associated edges of a marker on deletion
function DelAssoEdges(airport_lat, airport_lon) {
    //Remove any polylines from the graph connect with the deleted airport
    let marker_to_del = [airport_lat, airport_lon];
    // Loop
    var i = 0;
    while (i < graph.length) {
        if (JSON.stringify(graph[i][0]) == JSON.stringify(marker_to_del) || JSON.stringify(graph[i][1]) == JSON.stringify(marker_to_del)) {
            graph.splice(i, 1);
            distances.splice(i, 1);
            i--; // Index corrector when splicing
        }
        i++;
    }

    // Draw the graph
    DrawGraph();
}

// Clear graph
function ClearGraph() {
    for(i in map._layers) {
        if(map._layers[i]._path != undefined) {
            try {
                map.removeLayer(map._layers[i]);
            }
            catch(e) {}
        }
    }
}

// FUNCTIONS FROM THE PANEL

// Traversals (BFS and DFS)
function Traversal(traversal_type) {
    // If there are no markers added to the graph
    if (selected_markers.length == 0) {
        ShowAlert("Seleccione al menos un aeropuerto antes de pulsar este botón.", 'error', 2000)
        return;
    }

    // Block buttons until the end.
    const buttons = document.querySelectorAll('.tool-button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        buttons[i].style.background = "var(--secondary-color)";
    }
    
    ShowAlert("Haga clic en un aeropuerto inicial para empezar el recorrido.", 'info', 5000);

    let marker_clicked;
    let on_selection = true;
    let startPoint;
    var results_text = document.getElementById("results-traversal");

    // Save last element clicked.
    document.onclick = e => {
        // If clicked on a marker (with a DIV tag)
        if (e.target.tagName == 'DIV') {
            for (let i = 0; i < markers.length; i++) {
                if (e.target == markers[i]) {
                    marker_clicked = e.target;
                }
            }
        }

        // If clicked on a marker icon (with a I tag)
        else if (e.target.tagName == 'I') {
            for (let i = 0; i < markers.length; i++) {
                if (e.target.parentElement == markers[i]) {
                    marker_clicked = e.target.parentElement;
                }
            }
        }

        // If something else is clicked
        else {
            marker_clicked = e.target;
        }

        // Omit popups on markers
        map.closePopup();
    }

    // Get a click from the user
    function getClick() {

        return new Promise(acc => {
            function handleClick() {
            document.removeEventListener('click', handleClick);
            acc();
            }
            document.addEventListener('click', handleClick);
        });
    }

    // Hold the user until it clicks a correct element
    setTimeout(async function () {
        while(on_selection) {
            await getClick(); // Wait for a user click...

            if (marker_clicked.getAttribute("isadded") == "true") {

                // Clean states
                on_selection = false;

                // Code to exec after click event:

                // Look up for the coordinates of the start point.
                map.eachLayer(function (layer) {
                    try {
                        if (layer._icon == marker_clicked) {
                            startPoint = [layer._latlng.lat, layer._latlng.lng];
                        }
                    
                    }
                    catch(e) {}
                });

                // Depending on traversal type do BFS or DFS

                xhr.open("POST", "/api/v1", true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send(JSON.stringify({"lat": startPoint[0], "lon": startPoint[1], "method": traversal_type}));
                xhr.onreadystatechange = function () {

                    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

                        response = JSON.parse(xhr.response);

                        // Display the results in the results box
                        results_text.innerHTML = null;
                        for (let i = 0; i < response["airports"].length; i++) {
                            results_text.innerHTML += `<li>${response["airports"][i]}</li>`;
                        }

                        ShowAlert("Vea los resultados en el panel.",'info',4000);
                        
                    }
                }

                // Unblock buttons
                const buttons = document.querySelectorAll('.tool-button');
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].disabled = false;
                    buttons[i].style.background = "var(--primary-color)";
                }

                document.onclick = null;
                

            // Try again for the user
            } else {
                ShowAlert("Solo haga clic en aeropuerto YA añadido previamente.", 'warning', 2000);
            }
            
        }
    }, 100);
}

// Less distance paths
function SinglePath() {
    // If there are less than 2 markers added to the graph
    if (selected_markers.length < 2) {
        ShowAlert("Seleccione al menos dos aeropuertos antes de pulsar este botón.", 'error', 2000);
        return;
    }

    // Block buttons until the end.
    const buttons = document.querySelectorAll('.tool-button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        buttons[i].style.background = "var(--secondary-color)";
    }

    ShowAlert("Haga clic en un aeropuerto inicial.", 'info', 5000);

    let isStart = true;
    let marker_clicked;
    let start_marker;
    let end_marker;
    let on_selection = true;
    let startPoint;
    let endPoint;
    var results_text = document.getElementById("results-path");

    // Save last element clicked.
    document.onclick = e => {
        // If clicked on a marker (with a DIV tag)
        if (e.target.tagName == 'DIV') {
            for (let i = 0; i < markers.length; i++) {
                if (e.target == markers[i]) {
                    marker_clicked = e.target;
                }
            }
        }

        // If clicked on a marker icon (with a I tag)
        else if (e.target.tagName == 'I') {
            for (let i = 0; i < markers.length; i++) {
                if (e.target.parentElement == markers[i]) {
                    marker_clicked = e.target.parentElement;
                }
            }
        }

        // If something else is clicked
        else {
            marker_clicked = e.target;
        }

        // Omit popups on markers
        map.closePopup();
    }

    // Get a click from the user
    function getClick() {

        return new Promise(acc => {
            function handleClick() {
            document.removeEventListener('click', handleClick);
            acc();
            }
            document.addEventListener('click', handleClick);
        });
    }

    // Hold the user until it gives two clicks on markers
    setTimeout(async function() {
        while(on_selection) {
            await getClick(); // Wait for a user click...

            if (marker_clicked.getAttribute("isadded") == "true") {
                // For the first airport
                if (isStart) {
                    isStart = false;
                    start_marker = marker_clicked;
                    ShowAlert('Ahora, haga clic en un aeropuerto de destino.', 'info', 5000);
                
                } else {
                    // Code to exec after click event:

                    end_marker = marker_clicked;

                    // Check if the markers are the same
                    if (start_marker == end_marker) {
                        ShowAlert("El aeropuerto de destino tiene que ser diferente.", 'error', 2000);
                    } else {
                        // Clean state
                        on_selection = false;

                        // Look up for the coords of both markers
                        map.eachLayer(function (layer) {
                            try {
                                if (layer._icon == start_marker) {
                                    startPoint = [layer._latlng.lat, layer._latlng.lng];
                                }
                                if (layer._icon == end_marker) {
                                    endPoint = [layer._latlng.lat, layer._latlng.lng];
                                }
                            }
                            catch(e) {}
                        });

                        // Request to the server
                        xhr.open("POST", "/api/v1", true);
                        xhr.setRequestHeader("Content-Type", "application/json");
                        xhr.send(JSON.stringify({"from": startPoint, "to": endPoint, "method": "point_to_point"}));
                        xhr.onreadystatechange = function () {

                            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

                                response = JSON.parse(xhr.response);
                                
                                // Display the results in the results box
                                results_text.innerHTML = null;

                                // If no path possible
                                if (response["airports"].length == 0) {
                                    ShowAlert("No hay camino posible.",'warning',2000);
                                    return;
                                }

                                for (let i = 0; i < response["airports"].length; i++) {
                                    results_text.innerHTML += `<li>${response["airports"][i]}</li>`;
                                }

                                // Show the airplane going
                                MoveAirplane(response["route"], response["route"].length * 500);

                                ShowAlert("Vea los resultados en el panel.",'info',4000);
                                
                            }
                        
                        }

                        // Unblock buttons
                        const buttons = document.querySelectorAll('.tool-button');
                        for (let i = 0; i < buttons.length; i++) {
                            buttons[i].disabled = false;
                            buttons[i].style.background = "var(--primary-color)";
                        }

                        document.onclick = null;
                    }


                }


            // Try again for the user
            } else {
                ShowAlert("Solo haga clic en aeropuerto YA añadido previamente.", 'warning', 2000);
            }
        }
    },100);

}

// Less distance path between one point and the others
function OneToAllPaths() {
    // If there are NO markers added to the graph
    if (selected_markers.length == 0) {
        ShowAlert("Seleccione al menos un aeropuerto antes de pulsar este botón.", 'error', 2000);
        return;
    }

    // Block buttons until the end.
    const buttons = document.querySelectorAll('.tool-button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        buttons[i].style.background = "var(--secondary-color)";
    }

    ShowAlert("Haga clic en un aeropuerto inicial para indicar las rutas.", 'info', 5000);

    let marker_clicked;
    let on_selection = true;
    let startPoint;
    var results_text = document.getElementById("results-path");

    // Save last element clicked.
    document.onclick = e => {
        // If clicked on a marker (with a DIV tag)
        if (e.target.tagName == 'DIV') {
            for (let i = 0; i < markers.length; i++) {
                if (e.target == markers[i]) {
                    marker_clicked = e.target;
                }
            }
        }

        // If clicked on a marker icon (with a I tag)
        else if (e.target.tagName == 'I') {
            for (let i = 0; i < markers.length; i++) {
                if (e.target.parentElement == markers[i]) {
                    marker_clicked = e.target.parentElement;
                }
            }
        }

        // If something else is clicked
        else {
            marker_clicked = e.target;
        }

        // Omit popups on markers
        map.closePopup();
    }

    // Get a click from the user
    function getClick() {

        return new Promise(acc => {
            function handleClick() {
            document.removeEventListener('click', handleClick);
            acc();
            }
            document.addEventListener('click', handleClick);
        });
    }

    setTimeout(async function () {
        while(on_selection) {
            await getClick(); // Wait for a user click...

            if (marker_clicked.getAttribute("isadded") == "true") {

                // Clean states
                on_selection = false;

                // Code to exec after click event:

                // Look up for the coordinates of the start point.
                map.eachLayer(function (layer) {
                    try {
                        if (layer._icon == marker_clicked) {
                            startPoint = [layer._latlng.lat, layer._latlng.lng];
                        }
                    
                    }
                    catch(e) {}
                });

                // Request
                xhr.open("POST", "/api/v1", true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send(JSON.stringify({"lat": startPoint[0], "lon": startPoint[1], "method": "point_to_all"}));
                xhr.onreadystatechange = function () {

                    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

                        response = JSON.parse(xhr.response);
                        
                        // Display the results in the textbox
                        let airports = response[1];
                        let routes = response[0];

                        results_text.innerHTML = '';
                        // If no path possible
                        if (response.length == 0) {
                            ShowAlert("No hay camino posible.",'warning',2000);
                            return;
                        }

                        let index_path = 1;
                        for (let i = 0; i < airports.length; i++) {
                            if (airports[i].length != 0) {
                                results_text.innerHTML += `<p style="font-weight: bold;">Camino ${index_path}<p>`;
                                for (let n = 0; n < airports[i].length; n++) {
                                    results_text.innerHTML += `<li>${airports[i][n]}</li>`;
                                }
                                index_path++;
                            }
                        }

                        // Add a timer for each route to complete
                        const timer = ms => new Promise(res => setTimeout(res, ms))

                        async function MoveRoutes() { // Loop
                            for (let i = 0; i < routes.length; i++) {
                                if (routes[i].length != 0) {
                                    MoveAirplane(routes[i], routes[i].length * 500);
                                    await timer(routes[i].length * 500); // Promise can be awaited
                                }
                            }
                        }

                        // Move the airplane in different routes at different times
                        MoveRoutes();
                        
                        ShowAlert("Vea los resultados en el mapa y el panel.",'info', 4000);

                    }
                }
                

                // Unblock buttons
                const buttons = document.querySelectorAll('.tool-button');
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].disabled = false;
                    buttons[i].style.background = "var(--primary-color)";
                }

                document.onclick = null;
                

            // Try again for the user
            } else {
                ShowAlert("Solo haga clic en aeropuerto YA añadido previamente.", 'warning', 2000);
            }
        }
    }, 100);
}
////