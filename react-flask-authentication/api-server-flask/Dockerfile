FROM python:3.9

# SINGLE PORT SOLUTION: Install Node.js to build React with updated axios config
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies for SQL Server
RUN apt-get update && apt-get install -y \
    unixodbc \
    unixodbc-dev \
    libsqliteodbc \
    odbcinst \
    odbcinst1debian2 \
    curl \
    gnupg2 \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy React source code first (with updated axios config)
COPY react-ui ./react-ui
WORKDIR /app/react-ui

# Install React dependencies and build with new axios configuration
RUN npm install --production=false
RUN npm run build

# Copy Flask application
WORKDIR /app
COPY api-server-flask .

# Verify React build files exist
RUN ls -la ./react-ui/build/ && echo "✅ React build completed with updated axios config"

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Expose single port for both frontend and API
EXPOSE 5005

# Start Flask server (which now serves both frontend and API)
CMD ["gunicorn", "--config", "gunicorn-cfg.py", "run:app"]
