from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource, Api
from werkzeug.utils import secure_filename
import os
from api.models import db, PadPrint  # Adjust imports as needed

uploads_bp = Blueprint("uploads", __name__)
rest_api = Api(uploads_bp)
uploads_api = Namespace("uploads", description="File Upload API")

@uploads_api.route("/upload-image/<int:id>")
class UploadImage(Resource):
    def post(self, id):
        print(f"DEBUG: Received POST request for PadPrint ID: {id}")
        print(f"DEBUG: Request method: {request.method}")
        print(f"DEBUG: Request URL: {request.url}")
        print("DEBUG: Request headers:", dict(request.headers))
        print("DEBUG: Request files keys:", list(request.files.keys()))

        # Check if 'file' is present in the request
        if 'file' not in request.files:
            print("DEBUG: No file part in request.files")
            return {"message": "No file part"}, 400

        file = request.files['file']
        if file.filename == '':
            print("DEBUG: No selected file (empty filename)")
            return {"message": "No selected file"}, 400

        # Process the file if it exists
        if file:
            filename = secure_filename(file.filename)
            print(f"DEBUG: Saving file with secure filename: {filename}")
            upload_folder = 'static/uploads'
            
            # Create the upload folder if it doesn't exist
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                print(f"DEBUG: Created upload folder: {upload_folder}")
            
            # Save the file
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            print(f"DEBUG: File saved to {file_path}")

            # Generate the URL for the uploaded image
            image_url = f"/static/uploads/{filename}"
            print(f"DEBUG: Image URL: {image_url}")

            # Find the PadPrint record by id
            padprint = PadPrint.query.filter_by(id=id).first()
            if padprint:
                padprint.image_url = image_url
                print(f"DEBUG: Updated image URL for PadPrint ID: {id}")
                db.session.commit()
                return {"image_url": image_url}, 200
            else:
                print(f"DEBUG: PadPrint with ID {id} not found")
                return {"message": "PadPrint not found"}, 404

        print("DEBUG: File condition not met")
        return {"message": "File type not allowed"}, 400

rest_api.add_namespace(uploads_api, path="/api/image-upload")
image_bp = Blueprint("image", __name__)
