from flask import Flask 
from flask_failsafe import failsafe 

@failsafe 
def create_app() -> Flask: 
    
    app = Flask(__name__, template_folder="templates")
    
    return app 