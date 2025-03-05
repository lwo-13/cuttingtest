# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from api import create_app, db

# Initialize app using the factory function
app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {"app": app, "db": db}

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")

