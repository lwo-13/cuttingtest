# Step 1: Use official NGINX image
FROM nginx:stable-alpine

# Step 2: Clean default NGINX static files
RUN rm -rf /usr/share/nginx/html/*

# Step 3: Copy React build folder into NGINX
COPY build /usr/share/nginx/html

# Step 4: Expose NGINX port
EXPOSE 80

# Step 5: Run NGINX
CMD ["nginx", "-g", "daemon off;"]
