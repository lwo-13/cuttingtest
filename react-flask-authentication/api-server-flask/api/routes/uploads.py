from flask import Blueprint, request, send_from_directory
from flask_restx import Namespace, Resource, Api
from werkzeug.utils import secure_filename
import os
from api.models import db, ItemImage  # Adjust imports as needed

uploads_bp = Blueprint("uploads", __name__)
rest_api = Api(uploads_bp)
uploads_api = Namespace("uploads", description="File Upload API")

@uploads_api.route("/upload-image/<item_no>")
class UploadImage(Resource):
    def post(self, item_no):
        print(f"DEBUG: Received POST request for item_no: {item_no}")
        print(f"DEBUG: Request method: {request.method}")
        print(f"DEBUG: Request URL: {request.url}")
        print("DEBUG: Request headers:", dict(request.headers))
        print("DEBUG: Request files keys:", list(request.files.keys()))
        
        if 'file' not in request.files:
            print("DEBUG: No file part in request.files")
            return {"message": "No file part"}, 400

        file = request.files['file']
        if file.filename == '':
            print("DEBUG: No selected file (empty filename)")
            return {"message": "No selected file"}, 400

        if file:
            filename = secure_filename(file.filename)
            print(f"DEBUG: Saving file with secure filename: {filename}")
            upload_folder = 'static/uploads'
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                print(f"DEBUG: Created upload folder: {upload_folder}")
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            print(f"DEBUG: File saved to {file_path}")

            image_url = f"/static/uploads/{filename}"
            print(f"DEBUG: Image URL: {image_url}")

            # Insert or update the ItemImage record in the database.
            try:
                # Look for an existing record with the given item_no
                item_image = ItemImage.query.filter_by(item_no=item_no).first()
                if item_image:
                    item_image.image_url = image_url
                    print(f"DEBUG: Updated existing ItemImage for item {item_no}")
                else:
                    # Create a new record if it doesn't exist
                    item_image = ItemImage(item_no=item_no, image_url=image_url)
                    db.session.add(item_image)
                    print(f"DEBUG: Inserted new ItemImage for item {item_no}")
                db.session.commit()
            except Exception as e:
                print("DEBUG: Error updating database:", e)
                return {"message": "Error updating database"}, 500

            return {"image_url": image_url}, 200

        print("DEBUG: File condition not met")
        return {"message": "File type not allowed"}, 400

rest_api.add_namespace(uploads_api, path="/api/image-upload")
image_bp = Blueprint("image", __name__)


