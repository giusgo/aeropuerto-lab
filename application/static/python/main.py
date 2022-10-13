from application.static.python.Airports import airports
import json

areopuertos = airports()
areopuertos.initialize_airports_list()
areopuertos.initialize_shortest_paths()

def addVertex(latitude: float, longitude: float):
    areopuertos.add_airport_vertex(latitude, longitude)

def removeVertex(latitude: float, longitude: float):
    areopuertos.remove_airport_vertex(latitude, longitude)

def addEdge(latOrigin: float, longOrigin: float, latDest: float, longDest: float):  
    return json.dumps(areopuertos.add_adjacency(latOrigin, longOrigin, latDest, longDest))

def resetProgram():
    areopuertos.resetProgram()

def printGraph(): 
    
    print(areopuertos.graph) 

def removeEdge(latOrigin: float, longOrigin: float, latDest: float, longDest: float):
    areopuertos.remove_adjacency(latOrigin, longOrigin, latDest, longDest)

def DFS(latOrigin: float, longOrigin: float):
    #create a coordinate list
    coordinate_path = []
    #get the airport´s name
    airport_name = areopuertos.coordinatesToName(latOrigin, longOrigin)
    #return the DFS traversal
    traversal = areopuertos.DFSTraversal(airport_name)
    #iterate over the traversal
    for name in traversal:
        #append to the coordinate list the traversal´s names as coordinates
        coordinate_path.append(areopuertos.namesToCoordinates(name))
    #return a dict
    return {"route": coordinate_path, "airports": traversal}

def BFS(latOrigin: float, longOrigin: float):
    #create a coordinate list
    coordinate_path = []
    #get the airport´s name
    airport_name = areopuertos.coordinatesToName(latOrigin, longOrigin)
    #return the BFS traversal
    traversal = areopuertos.BFSTraversal(airport_name)
    #iterate over the traversal
    for name in traversal:
        #append to the coordinate list the traversal´s names as coordinates
        coordinate_path.append(areopuertos.namesToCoordinates(name))
    #return a dict
    return {"route": coordinate_path, "airports": traversal}

def shortestPathBetweenTwoDestinations(latOrigin: float, longOrigin: float, latDest: float, longDest: float):
    #calculate the shortest path
    path = areopuertos.floyd_warshall()
    #create a coordinate list
    coordinate_path = []
    #get the path
    name_paths = areopuertos.shortest_path_between_airports(latOrigin, longOrigin, latDest, longDest, path)
    #iterate over the path
    for name in name_paths:
        #append to the coordinate list the name_paths´s names as coordinates
        coordinate_path.append(areopuertos.namesToCoordinates(name))
    #return a dict 
    return {"route": coordinate_path , "airports": name_paths}

def shortestPathToAllDestinations(latOrigin: float, longOrigin: float):
    #calculate the shortest path
    path = areopuertos.floyd_warshall()
    #create a coordinate list
    coordinate_list = []
    #create a coordinate list
    names_list = []
    #get the path
    paths = areopuertos.shortest_paths_to_airports(latOrigin, longOrigin, path)
    print("esto es paths ", paths)

    #iterate over the path
    for name in paths:
        #append to a list the name paths´s names
        names_list.append(paths[name])

    #check if paths exists
    empty_list = True
    for list in names_list:
        if len(list) > 0:
            empty_list = False
            break

    if not empty_list:
        #convert the names list as a coordinate list
        for list in names_list:
            coordinates = []
            for name in list:
                coordinates.append(areopuertos.namesToCoordinates(name))
            coordinate_list.append(coordinates)  
        
        #add both list to a general list
        list = []
        list.append(coordinate_list)
        list.append(names_list)
    else:
        list = []

    return json.dumps(list)
