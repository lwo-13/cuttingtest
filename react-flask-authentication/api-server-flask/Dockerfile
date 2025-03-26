# Use official Python image
FROM python:3.9-slim

# Set work directory inside the container
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your Flask API code
COPY . .

# Expose Flask port
EXPOSE 5000

# Command to run the Flask app
CMD ["python", "app.py"]

