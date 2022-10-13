from application import create_app 

app = create_app()

from application.routes import *

if __name__ == "__main__":
    
    app.run()