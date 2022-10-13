import itertools
import csv
from vincenty import vincenty


class AirportNode:

    def __init__(self, name: str, name_accent_mark: str, latitude: float, longitude: float) -> None:
        self.name = name
        self.name_accent_mark = name_accent_mark 
        self.latitude = latitude
        self.longitude = longitude
        self.connections = []
        self.adjacency_list = {}

    def __str__(self) -> str:
        return self.name

class airports:

    def __init__(self):
        self.graph = {}
        self.shortest_paths ={}
        self.airports_list = []

    def initialize_shortest_paths(self):
        
        # add all the vertex to the graph
        for i in range(len(self.airports_list)):
            self.add_airport_vertex(
                self.airports_list[i].latitude, self.airports_list[i].longitude)
        
        # add all the possible connections to the graph
        for airport in self.airports_list:
            for airport2 in self.airports_list:
                self.add_adjacency(
                    airport.latitude, airport.longitude, airport2.latitude, airport2.longitude)
        
        #calculate the shortest paths between all the vertex
        path = self.floyd_warshall()

        #add the shortest paths from one airport to another to the shortest_paths dictionary
        for names in self.graph:
            coordinates = self.namesToCoordinates(names)
            result = self.shortest_paths_to_airports(coordinates[0],coordinates[1], path)
            self.shortest_paths.update({names: result})

        #clear all the adjacencies dictionaries in the airports list
        for airport in self.airports_list:
            airport.adjacency_list.clear()
        
        #clear the graph for start saving the user's graph
        self.graph.clear()
    

    def initialize_airports_list(self):
        
        # open the airports csv file in read mode
        with open("server/application/static/Aeropuertos.csv") as csvfile:
            # create a csv reader object with ; as delimiter
            reader = csv.DictReader(csvfile, delimiter=';')
            # iterate through the rows of the csv file
            for row in reader:
                # uppercase the name of the airport
                name = row['nombre_sin_tilde'].upper()
                name_accent_mark = row['nombre_con_tilde']
                # cast the latitude and longitude to float
                latitude = float(row['latitude_deg'])
                longitude = float(row['longitude_deg'])
                # creates a new airport node with the data
                airport = AirportNode(name, name_accent_mark, latitude, longitude)
                # add the airport to the list of airports
                self.airports_list.append(airport)

        # open the routes csv file in read mode
        with open('server/application/static/Conexiones.csv', encoding='utf-8') as csvfile:
            # create two csv reader objects, one for the current row and the other to peek the next row
            reader, nextReader = itertools.tee(
                csv.DictReader(csvfile, delimiter=";"))
            next(nextReader)
            # iterate through the airports list
            for airport in self.airports_list:
                # iterate through the rows of the csv file with both readers
                for row, nextRow in zip(reader, nextReader):
                    # both files are sorted alphabetically by airport name, so is sure that in the current row the airport and the origin airport are the same
                    # add the destination airport name to the origin airport connections list
                    airport.connections.append(row['Aeropuerto Destino'])
                    # verify if in the next row the origin airport changes
                    if airport.name != nextRow['Aeropuerto Origen']:
                        # if that's the case, is necessary to break the loop and continue with the next airport
                        break
                # delete repeated names from the airport connections list
                airport.connections = list(dict.fromkeys(airport.connections))
                # instead of storing the connections as names, store them as airport nodes
                for i in range(len(airport.connections)):
                    for airportNode in self.airports_list:
                        if airport.connections[i] == airportNode.name:
                            airport.connections[i] = airportNode
                            break
                            
    def resetProgram(self):
        #clear the current graph
        self.graph.clear()

        #clear the adjacency lists of the airports
        for airport in self.airports_list:
            airport.adjacency_list.clear()

    def search_airport_in_list(self, latitude: float, longitude: float) -> AirportNode:
        # iterate through the list of airports
        for airport in self.airports_list:
            # verify if the requested coordinates match the current airport coordinates
            if latitude == airport.latitude and longitude == airport.longitude:
                # if true, return the airport
                return airport
        # if the airport is not found, return None
        return None

    def add_airport_vertex(self, latitude: float, longitude: float):
        # search for the airport node in the airports list
        airport = self.search_airport_in_list(latitude, longitude)
        if airport is not None:
            # check if the airport is not already in the graph
            if airport not in self.graph:
                # add the airport to the graph
                self.graph.update(
                    {airport.name: airport.adjacency_list.copy()})

    def is_vertex_in_graph(self, latitude: float, longitude: float) -> bool:
        # search for the airport in the airports list
        airport = self.search_airport_in_list(latitude, longitude)
        if airport is not None:
            # iterate through the graph keys
            for key in self.graph:
                # if the airport is found in the graph, return true
                if key == airport.name:
                    return True
        # if the airport is not found in the graph or the airport is not in the list, return false
        return False

    def add_adjacency(self, latOrigin: float, longOrigin: float, latDest: float, longDest: float):
            # check if the adjacency vertex is in the graph
            
            if self.is_vertex_in_graph(latOrigin, longOrigin) and self.is_vertex_in_graph(latDest, longDest):
                # search for the airport in the airport list
                airport = self.search_airport_in_list(latOrigin, longOrigin)
                # search for the destination airport in the airport connections list
                for connection in airport.connections:
                    # when the destination airport is found
                    if connection.latitude == latDest and connection.longitude == longDest:
                        # calculate the distance between the airports using the vincenty formula
                        distance = vincenty(
                            (latOrigin, longOrigin), (latDest, longDest))
                        # update the adjacency list of the origin airport
                        airport.adjacency_list.update(
                            {connection.name: distance})
                        # update the adjacency list of the destination airport in the graph
                        self.graph.update({airport.name: airport.adjacency_list.copy()})
                        return distance 
                
                new_path = []
                # if the connection can not be established, find the minor distance between the airports
                for key in self.shortest_paths:
                    if key == self.coordinatesToName(latOrigin, longOrigin):
                        for key2 in self.shortest_paths[key]:
                            if key2 == self.coordinatesToName(latDest, longDest):
                                new_path = self.shortest_paths[key][key2]
                if len(new_path) == 0:
                    return None
                else:
                    #add the new vertex to the graph
                    for name in new_path:
                        coordinates = self.namesToCoordinates(name)
                        self.add_airport_vertex(coordinates[0], coordinates[1])


                    #add the new adjacency to the graph
                    distance_list = []
                    for i in range(len(new_path)-1):

                        lat1 = self.namesToCoordinates(new_path[i])[0]
                        long1 = self.namesToCoordinates(new_path[i])[1]
                        lat2 = self.namesToCoordinates(new_path[i+1])[0]
                        long2 = self.namesToCoordinates(new_path[i+1])[1]

                        distance = self.add_adjacency(lat1, long1, lat2, long2)
                        distance_list.append(distance)

                    #create a coordinate list
                    coordinate_list = []
                    for name in new_path:
                        coordinate_list.append(list(self.namesToCoordinates(name)))
                    
                    #search accented mark names
                    accent_mark_list = []
                    for name in new_path:
                        for airport in self.airports_list:
                            if name == airport.name:
                                accent_mark_list.append(airport.name_accent_mark)
                                break
                            
                    #create a dictionary that contains the coordinates and the distance of the new minimum path
                    dictionary = {}
                    dictionary = {'nombres_con_tildes':accent_mark_list, 'nombres':new_path, 'vertices': coordinate_list, 'distances': distance_list}
                    return  dictionary

    def remove_airport_vertex(self, latitude: float, longitude: float):
        # search for the airport in the airports list
        airport = self.search_airport_in_list(latitude, longitude)
        if airport is not None:
            # if the airport is in the graph
            if airport.name in self.graph:
                # remove the airport from the graph
                del self.graph[airport.name]
                # iterate through the list of airports
                for airportNode in self.airports_list:
                    # if the airport is found in the connections list of another airport
                    # it means that the other airport is in the graph and has an adjacency with the airport to be removed
                    if airport.name in airportNode.adjacency_list:
                        # remove the adjacency from the adjacency list
                        del airportNode.adjacency_list[airport.name]
                        # update the adjacency list of the other airport in the graph
                        self.graph.update(
                            {airportNode.name: airportNode.adjacency_list.copy()})
                    # clear the adjacency list of the airport to be removed in the graph
                    if airportNode.name == airport.name:
                        airportNode.adjacency_list.clear()

    def remove_adjacency(self, latOrigin: float, longOrigin: float, latDest: float, longDest: float):
        # check if the adjacency vertex is in the graph
        if self.is_vertex_in_graph(latOrigin, longOrigin) and self.is_vertex_in_graph(latDest, longDest):
            # search for the airport in the airport list
            airport = self.search_airport_in_list(latOrigin, longOrigin)
            if airport is not None:
                # search for the destination airport in the airport connections list
                for connection in airport.connections:
                    # when the destination airport is found
                    if connection.latitude == latDest and connection.longitude == longDest:
                        del airport.adjacency_list[connection.name]
                        # update the adjacency list of the destination airport in the graph
                        self.graph.update(
                            {airport.name: airport.adjacency_list.copy()})
                        break

    def DFSTraversal(self, airport: str, visited=None):
        if visited == None:
            visited = []
        # if the airport is not in the visited list
        if airport not in visited:
            # add the airport to the visited list
            visited.append(airport)
            # iterate through the adjacency list of the airport
            for key in self.graph[airport]:
                # repeat the process for the adjacent airports
                self.DFSTraversal(key, visited)
        return visited

    def BFSTraversal(self, airport: str, visited=None):
        if visited == None:
            visited = []
        # create a queue
        queue = []
        # add the airport to the queue
        queue.append(airport)
        # while the queue is not empty
        while queue:
            # remove the first airport from the queue
            airport = queue.pop(0)
            # if the airport is not in the visited list
            if airport not in visited:
                # add the airport to the visited list
                visited.append(airport)
                # iterate through the adjacency list of the airport
                for key in self.graph[airport]:
                    # add the adjacent airports to the queue
                    queue.append(key)
        return visited

    def wheigthed_adjacency_matrix(self):
        # create an empty matrix
        matrix = []
        # iterate through the graph keys
        for key in self.graph:
            # create an empty row
            row = []
            # iterate through the graph keys
            for key2 in self.graph:
                # if the airport is in the adjacency list of the current airport
                if key2 in self.graph[key]:
                    # add the distance to the row
                    row.append(self.graph[key][key2])
                # The column for the same airport is 0
                elif key == key2:
                    row.append(0)
                else:
                    # if there is not an adjacency, add inf to the row
                    row.append(float('inf'))
            # add the row to the matrix
            matrix.append(row)
        return matrix

    def previous_adjacency_matrix(self):
        # create an empty matrix
        matrix = []
        # iterate through the graph keys
        for key in self.graph:
            # create an empty row
            row = []
            # iterate through the graph keys
            for key2 in self.graph:
                # if the airport is in the adjacency list of the current airport
                if key2 in self.graph[key]:
                    # add the airport name to the row
                    row.append(key)
                else:
                    # add None to the row
                    row.append(None)
            # add the row to the matrix
            matrix.append(row)
        return matrix

    def floyd_warshall(self):
        # get the weighted adjacency matrix
        distance = self.wheigthed_adjacency_matrix()
        path = self.previous_adjacency_matrix()
        keys = list(self.graph.keys())
        # iterate through the matrix
        for k in range(len(distance)):
            for i in range(len(distance)):
                for j in range(len(distance)):
                    # if the distance between the airports is greater than the distance between the airports passing through the k airport
                    if distance[i][j] > distance[i][k] + distance[k][j]:
                        # update the distance
                        distance[i][j] = distance[i][k] + distance[k][j]
                        # update the path
                        path[i][j] = keys[k]
        # return the path matrix
        return path
    
    def shortest_path_between_airports(self, latOrigin: float, longOrigin: float, latDest: float, longDest: float, pathlist: list):
        # get the path matrix
        path = pathlist
        # search for the origin and destination airports in the airports list
        origin = self.search_airport_in_list(latOrigin, longOrigin)
        destiny = self.search_airport_in_list(latDest, longDest)
        if origin is not None and destiny is not None:
            # get the vertex of the graph
            keys = list(self.graph.keys())
            # get the index of the origin and destination airports in the graph
            originIndex = keys.index(origin.name)
            destIndex = keys.index(destiny.name)
            # from the path matrix, get the row corresponding to the origin airport
            originRow = path[originIndex]
            # get the previous airport to the destination airport
            previousAirport = originRow[destIndex]
            # if there is no possible path
            if previousAirport is None:
                # return an empty list
                return []
            # create a list to store the path and add the destination airport to the list
            pathList = []
            expectedEnd = None
            inserPosition = 0
            # while the previous airport is not None
            while True:
                while previousAirport is not expectedEnd:
                    # add the previous airport to the path list
                    pathList.insert(inserPosition, previousAirport)
                    # get the index of the previous airport in the graph
                    previousAirportIndex = keys.index(previousAirport)
                    # get the previous airport of the previous airport
                    previousAirport = originRow[previousAirportIndex]
                    # append the origin airport to the path list
                # verify if the last airport in the path is connected to the destination airport directly
                lastAirport = pathList[-1]
                for airport in self.airports_list:
                    if airport.name == lastAirport:
                        lastAirport = airport
                        break
                # if it is connected, return the path list
                for connection in lastAirport.connections:
                    if connection.name == destiny.name:
                        pathList.append(destiny.name)
                        return pathList
                # if it is not connected, get the path from the last airport to the destination airport and add it to the path list
                originRow = path[keys.index(lastAirport.name)]
                previousAirport = originRow[destIndex]
                inserPosition = len(pathList)
                expectedEnd = lastAirport.name
                
        return None
    
    def shortest_paths_to_airports(self, latOrigin: float, longOrigin: float, pathlist: list):
        # get the path matrix
        path = pathlist
        # search for the origin and destination airports in the airports list
        origin = self.search_airport_in_list(latOrigin, longOrigin)
        if origin is not None:
            # get the vertex of the graph
            keys = list(self.graph.keys())
            # creates a dict to store the shortest paths to each airport
            pathDict = {key : [] for key in keys if key != origin.name}
            # iterate through the airports
            for key in pathDict:
                # get the index of the origin airport in the graph
                originIndex = keys.index(origin.name)
                # from the path matrix, get the row corresponding to the origin airport
                originRow = path[originIndex]
                # get the index of the destination airport in the graph
                destIndex = keys.index(key)
                # get the previous airport to the destination airport
                previousAirport = originRow[destIndex]
                # if there is no possible path
                if previousAirport is None:
                    # the list remains empty
                    continue
                expectedEnd = None
                inserPosition = 0
                # while the previous airport is not None
                while True:
                    while previousAirport is not expectedEnd:
                        # add the previous airport to the path list
                        pathDict[key].insert(inserPosition, previousAirport)
                        # get the index of the previous airport in the graph
                        previousAirportIndex = keys.index(previousAirport)
                        # get the previous airport of the previous airport
                        previousAirport = originRow[previousAirportIndex]
                        # append the origin airport to the path list
                    # verify if the last airport in the path is connected to the destination airport directly
                    lastAirport = pathDict[key][-1]
                    for airport in self.airports_list:
                        if airport.name == lastAirport:
                            lastAirport = airport
                            break
                    for connection in lastAirport.connections:
                        if connection.name == key:
                            pathDict[key].append(key)
                            break
                    # if it is connected, break the loop
                    if pathDict[key][-1] == key:
                        break
                    # if it is not connected, get the path from the last airport to the destination airport and add it to the path list
                    originRow = path[keys.index(lastAirport.name)]
                    previousAirport = originRow[destIndex]
                    inserPosition = len(pathDict[key])
                    expectedEnd = lastAirport.name
            return pathDict

    def namesToCoordinates(self, name: str):
        # iterate through the airports list
        for airport in self.airports_list:
            # if the airport name is the same as the name passed as parameter
            if airport.name == name:
                # return the airport coordinates
                return airport.latitude, airport.longitude
        return None
    
    def coordinatesToName(self, lat: float, long: float):
        # iterate through the airports list
        for airport in self.airports_list:
            # if the airport coordinates are the same as the coordinates passed as parameter
            if airport.latitude == lat and airport.longitude == long:
                # return the airport name
                return airport.name
        return None
   