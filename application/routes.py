import sys 
sys.path.insert(1,"server/run.py")

from run import app
from flask import request, make_response
from flask import redirect, send_file
from flask import render_template

from application.static.python.main import *

@app.route("/")
def root():
    
    resetProgram()
    printGraph()
    return render_template("index.html")

@app.route("/api/v1/", methods = ["GET"])
def get_request():
    
    return ""

@app.route("/api/v1", methods = ["POST"])
def get_post():
    
    data = request.get_json()
    
    method = data.get("method")
    
    if method == "add":
        
        first_airport = data.get("from")
        second_airport = data.get("to")

        addVertex(first_airport[0], first_airport[1])
        addVertex(second_airport[0], second_airport[1])
    
        response = addEdge(first_airport[0], first_airport[1], second_airport[0], second_airport[1]) 
        
        printGraph()
    
        if response is None: 
        
            return "null"
        
        return response 
    
    if method == "BFS":
        
        lat = data.get("lat")
        lon = data.get("lon")
        
        response = BFS(lat, lon)
        
        print(f"esta es mi respuesta: {response}")
        
        return response
    
    if method == "DFS":
        
        lat = data.get("lat")
        lon = data.get("lon")
        
        response = DFS(lat, lon)
        
        print(f"esta es mi respuesta: {response}")
        
        return response
    
    if method == "point_to_point":
        
        first_airport = data.get("from")
        second_airport = data.get("to")
        
        response = shortestPathBetweenTwoDestinations(first_airport[0], first_airport[1], second_airport[0], second_airport[1])
        
        return response
    
    if method == "point_to_all":

        lat = data.get("lat")
        lon = data.get("lon")
        
        response = shortestPathToAllDestinations(lat, lon)
        
        print(response)
        
        return response
    
    if method == "remove_vertex":
        
        lat = data.get("lat")
        lon = data.get("lon")
        
        removeVertex(lat, lon)
    
    if method == "remove_edge":
        
        first_airport = data.get("from")
        second_airport = data.get("to")
        
        removeEdge(first_airport[0], first_airport[1], second_airport[0], second_airport[1])
    
    return "OK"
