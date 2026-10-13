FROM nginx:alpine

# Copy static frontend files
COPY . /usr/share/nginx/html

# Copy custom nginx conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
